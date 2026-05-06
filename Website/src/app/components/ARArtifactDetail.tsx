// ARArtifactDetail — Direction 3 v3 layout (dark, era-tinted focus card).
// Owner: P3 (detailed view).
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft, HelpCircle } from "lucide-react";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";
import { useVisitedHotspots } from "@/features/progress/useVisitedHotspots";
import {
  getEra,
  getEraContent,
  getHotspots,
  getLandmark,
  listLandmarks,
  type EraId,
  type Hotspot,
  type LandmarkId,
} from "@/content/landmarks";
import {
  EraScrub,
  FG,
  HotspotMarker,
  HotspotSheet,
  MONO,
  SANS,
  SERIF,
  SUBTLE,
  VoicePill,
  haptic,
  matchHotspot,
} from "./ar/shared";
import { pickVoiceHint } from "./ar/voiceHints";
import { landmarkVT } from "./ar/viewTransition";

type TabId = "story" | "history" | "meaning";
const TABS: TabId[] = ["story", "history", "meaning"];
const PERIODS: EraId[] = ["medieval", "postwar", "present"];

const isPeriod = (v: string | null): v is EraId =>
  !!v && (PERIODS as string[]).includes(v);

// Mirrors the key used in features/ar/xr/PanoramaScene.tsx so both screens
// share the same selected-era memory across navigation within a tab session.
const ERA_STORAGE_KEY = "heritedge:era";

// ─── FlipFact (3D flip) ───────────────────────────────────────────────────────

interface FlipFactProps {
  q: string;
  a: string;
  accent: string;
}

function FlipFact({ q, a, accent }: FlipFactProps) {
  const [flipped, setFlipped] = useState(false);

  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${accent}22`,
    color: FG,
    fontFamily: SANS,
    display: "flex",
    alignItems: "center",
    textAlign: "left",
  };

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={flipped ? `Answer: ${a}` : `Question: ${q}. Tap to reveal answer.`}
      style={{
        position: "relative",
        width: "100%",
        minHeight: 76,
        perspective: 800,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 76,
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.55s cubic-bezier(0.4, 0.1, 0.2, 1)",
        }}
      >
        <div style={face}>
          <div style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: "0.04em" }}>
            {q}
          </div>
        </div>
        <div style={{ ...face, transform: "rotateY(180deg)" }}>
          <div style={{ fontSize: 12, color: FG, lineHeight: 1.4 }}>
            {a}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Density = "lean" | "rich";

interface ARArtifactDetailProps {
  /** Lean hides the flip-facts section. Default: rich. */
  density?: Density;
}

export function ARArtifactDetail({ density = "rich" }: ARArtifactDetailProps) {
  const navigate = useNavigate();
  const params = useParams<{ landmarkId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Era resolution priority: URL param → sessionStorage (last one used this
  // session) → "present". The URL param wins so direct links and explicit
  // navigations like /ar-artifact/duomo?period=medieval still pin the era.
  const urlPeriod = searchParams.get("period");
  const storedPeriod = typeof window !== "undefined"
    ? window.sessionStorage?.getItem(ERA_STORAGE_KEY)
    : null;
  const eraId: EraId = isPeriod(urlPeriod)
    ? urlPeriod
    : isPeriod(storedPeriod) ? storedPeriod : "present";
  const landmarkId = params.landmarkId as LandmarkId;

  const landmark = useMemo(() => getLandmark(landmarkId), [landmarkId]);
  const era = getEra(eraId)!;
  const eraContent = useMemo(
    () => (landmark ? getEraContent(landmark.id, eraId) : null),
    [landmark, eraId]
  );
  const allLandmarks = useMemo(() => listLandmarks(), []);
  const hotspots = useMemo(
    () => (landmark ? getHotspots(landmark.id, eraId) : []),
    [landmark, eraId]
  );

  const { isVisited, markVisited } = useVisitedHotspots();
  const visitedCount = useMemo(
    () => hotspots.filter((h) => isVisited(h.id)).length,
    [hotspots, isVisited]
  );

  const [tab, setTab] = useState<TabId>("story");
  const [pulse, setPulse] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [landmarksOpen, setLandmarksOpen] = useState(false);
  const [openHotspotId, setOpenHotspotId] = useState<string | null>(null);
  const voiceHint = useMemo(() => pickVoiceHint(), []);
  const imageCardRef = useRef<HTMLDivElement | null>(null);

  const goBackToOverview = () => {
    // Router-native viewTransition option, same pattern as the panorama's
    // sphere-tap path. The manual startViewTransition() + flushSync() wrapper
    // races with the WebGL canvas init on remount and triggers
    // "THREE.WebGLRenderer: Context Lost", which also breaks gyro persistence
    // (the canvas crash prevents the GyroTracker effect from re-running).
    navigate("/ar-overview", { viewTransition: true });
  };

  const openHotspot: Hotspot | null = useMemo(
    () => hotspots.find((h) => h.id === openHotspotId) ?? null,
    [hotspots, openHotspotId]
  );
  const openHotspotIndex = openHotspot
    ? hotspots.findIndex((h) => h.id === openHotspot.id) + 1
    : null;

  // Close any open hotspot on landmark/era change — different image, different markers.
  useEffect(() => {
    setOpenHotspotId(null);
  }, [landmarkId, eraId]);

  // Mirror the resolved era to sessionStorage so the panorama (and any other
  // detail page navigated to without an explicit ?period=) starts here.
  useEffect(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(ERA_STORAGE_KEY, eraId);
  }, [eraId]);

  // If we resolved era from storage rather than the URL, write it back into
  // the URL so the address bar matches the rendered era — keeps copied links
  // semantic (the URL alone tells you what's on screen).
  useEffect(() => {
    if (!isPeriod(urlPeriod)) {
      setSearchParams({ period: eraId }, { replace: true });
    }
    // Run only when the URL period is missing/invalid; ignore eraId churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPeriod]);

  const setEra = (next: EraId) =>
    setSearchParams({ period: next }, { replace: true });

  const handleHotspotTap = (hotspot: Hotspot) => {
    haptic(18);
    markVisited(hotspot.id);
    setOpenHotspotId(hotspot.id);
  };

  // Voice command parser: landmark / era / hotspot, then forwards transcript to RAG.
  const handleVoiceCommand = (transcript: string) => {
    const cmd = transcript.toLowerCase();

    let nextLandmark: LandmarkId | null = null;
    if (/galleria/.test(cmd)) nextLandmark = "galleria";
    else if (/palazzo/.test(cmd)) nextLandmark = "palazzo";
    else if (/duomo/.test(cmd)) nextLandmark = "duomo";

    let nextEra: EraId | null = null;
    if (/medieval/.test(cmd)) nextEra = "medieval";
    else if (/post[-\s]?war|war/.test(cmd)) nextEra = "postwar";
    else if (/present|now|today/.test(cmd)) nextEra = "present";

    if (nextLandmark && nextLandmark !== landmarkId) {
      const targetEra = nextEra ?? eraId;
      navigate(`/ar-artifact/${nextLandmark}?period=${targetEra}`, { viewTransition: true });
    } else if (nextEra && nextEra !== eraId) {
      setEra(nextEra);
    } else {
      // No navigation change — try to match a hotspot label.
      const hit = matchHotspot(cmd, hotspots);
      if (hit) {
        handleHotspotTap(hit);
        speak(`${hit.title}. ${hit.body}`);
      } else {
        // Fall through to RAG so the user always gets an answer.
        stopSpeaking();
        sendMessage(transcript, landmarkId)
          .then((res) => {
            const reply = res.answer || res.reply;
            if (reply) speak(reply);
          })
          .catch(() => {/* silent — voice nav alone is acceptable */});
      }
    }

    setPulse(true);
    window.setTimeout(() => setPulse(false), 600);
  };

  if (!landmark || !eraContent) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B0E", color: FG, padding: 24, fontFamily: SANS }}>
        <p>Unknown landmark.</p>
        <button onClick={() => navigate("/ar-overview")} style={{ marginTop: 12 }}>
          Back to overview
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", height: "100dvh", color: FG,
      fontFamily: SANS, position: "relative", overflow: "hidden",
      background: era.tintBg, transition: "background 0.5s cubic-bezier(0.4,0.1,0.2,1)",
      display: "flex", flexDirection: "column",
    }}>
      {/* faint grain */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)" }} />

      {/* Top HUD — same two-row pattern and spacing as PanoramaScene so the
            back/help buttons land in the same screen position as the X /
            camera / gyro buttons there.
            Row 1 (controls): back · help
            Row 2 (scene header, centered): era chip · landmark name · kicker. */}
      <div
        style={{
          padding: "48px 20px 20px",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0))",
        }}
      >
        {/* Row 1 — controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Buttons match the PanoramaScene HUD recipe exactly: 40px round,
               bg-black/50 + backdrop-blur-sm, no border, active:scale-95
               press feedback. Tailwind classes used directly so the spec is
               literally the same string in both files. */}
          <button
            onClick={goBackToOverview}
            aria-label="Back to overview"
            title="Back to overview"
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setHintsOpen((o) => !o)}
            aria-label="Help"
            title="Help"
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Row 2 — centered scene header (era chip + landmark + kicker) */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: `1px solid ${era.accent}55`,
              color: era.accent,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              textShadow: "0 1px 4px rgba(0,0,0,0.85)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: era.accent, boxShadow: `0 0 6px ${era.accent}` }}
            />
            {era.label} · {era.year}
          </div>

          <h1
            style={{
              margin: "10px 0 0",
              fontFamily: SERIF, fontWeight: 400, fontStyle: "italic",
              fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.01em",
              color: FG,
              textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.55)",
            }}
          >
            {landmark.name}
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              fontFamily: MONO, fontSize: 10,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: SUBTLE,
            }}
          >
            {landmark.kicker}
          </p>
        </div>
      </div>

      {/* Multimodal hints */}
      {hintsOpen && (
        <div style={{
          position: "absolute", top: 60, left: 16, right: 16, zIndex: 30,
          background: era.tintPanel, color: FG,
          borderRadius: 14, padding: 14,
          boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
          border: `1px solid ${era.accent}44`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.14em", color: era.accent, textTransform: "uppercase", fontWeight: 600 }}>
              Ways to explore
            </div>
            <button onClick={() => setHintsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: SUBTLE, lineHeight: 1 }}>×</button>
          </div>
          {[
            { icon: "📍", t: "Tap markers", d: "Each numbered marker reveals a fact about a feature in the image. Tapped ones turn into checkmarks." },
            { icon: "🤏", t: "Pinch in", d: "Pinch the image inward to zoom back out to the overview." },
            { icon: "🎤", t: "Voice", d: 'Say a feature ("the spires", "Madonnina") or a place ("Galleria postwar") to jump there.' },
          ].map((r) => (
            <div key={r.t} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, width: 22, textAlign: "center" }}>{r.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.t}</div>
                <div style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.4 }}>{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image card */}
      <div style={{ padding: "0 16px", flexShrink: 0, position: "relative", zIndex: 1 }}>
        <div ref={imageCardRef} data-vt-name={landmarkVT(landmark.id)} style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          border: `1px solid ${era.accent}33`,
          boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${era.accent}11 inset`,
          transition: "border-color 0.4s, box-shadow 0.4s",
          height: 220,
          touchAction: "none",
          // Shared-element source for the panorama → detail morph. Browsers
          // that don't support View Transitions just ignore this property.
          viewTransitionName: landmarkVT(landmark.id),
        } as React.CSSProperties}>
          <ImageWithFallback
            src={landmark.images[eraId]}
            alt={`${landmark.name} — ${era.label}`}
            className="w-full h-full"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 40%, ${era.tintBg}cc 100%)` }} />

          {hotspots.map((h, i) => (
            <div key={h.id} style={{ position: "absolute", left: `${h.x}%`, top: `${h.y}%`, transform: "translate(-50%, -50%)" }}>
              <HotspotMarker
                index={i + 1}
                visited={isVisited(h.id)}
                open={openHotspotId === h.id}
                accent={era.accent}
                onClick={() => handleHotspotTap(h)}
                label={h.label}
              />
            </div>
          ))}

          {pulse && (
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(circle, ${era.accent}55, transparent 70%)`,
              animation: "pulseFlash 0.6s ease-out", pointerEvents: "none",
            }} />
          )}
          <style>{`@keyframes pulseFlash { from { opacity: 1; } to { opacity: 0; } }`}</style>

          {/* AR-style corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((pos) => (
            <span key={pos} style={{
              position: "absolute", width: 10, height: 10, zIndex: 3,
              borderColor: era.accent, borderStyle: "solid", borderWidth: 0,
              ...(pos.includes("t") ? { top: 8, borderTopWidth: 1.5 } : { bottom: 8, borderBottomWidth: 1.5 }),
              ...(pos.includes("l") ? { left: 8, borderLeftWidth: 1.5 } : { right: 8, borderRightWidth: 1.5 }),
            }} />
          ))}

          {/* Progress chip — top-left of image */}
          {hotspots.length > 0 && (
            <div style={{
              position: "absolute", top: 10, left: 12, zIndex: 4,
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 9px", borderRadius: 999,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
              border: `1px solid ${era.accent}55`,
              color: FG, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: era.accent }} />
              {visitedCount} / {hotspots.length} explored
            </div>
          )}
        </div>

        {/* Era scrubber */}
        <div style={{
          marginTop: 14, padding: "12px 14px",
          background: era.tintPanel, borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <EraScrub value={eraId} onChange={setEra} accent={era.accent} />
        </div>
      </div>

      {/* Content (title now lives in the top header above) */}
      <div style={{
        margin: "12px 16px 0", flex: 1, minHeight: 0, overflowY: "auto",
        background: era.tintPanel, borderRadius: 14, padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "6px 0", marginBottom: -1,
                fontSize: 11, fontFamily: SANS, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? era.accent : SUBTLE,
                borderBottom: tab === t ? `2px solid ${era.accent}` : "2px solid transparent",
                textTransform: "capitalize", transition: "all 0.3s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.12em", color: era.accent, textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>
            {eraContent.headline}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: FG }}>
            {eraContent.blurb}
          </p>
          {eraContent.source && (
            <div style={{ marginTop: 6, fontSize: 10, fontFamily: MONO, color: SUBTLE }}>
              source:{" "}
              {eraContent.source.url ? (
                <a href={eraContent.source.url} target="_blank" rel="noreferrer" style={{ color: era.accent }}>
                  {eraContent.source.label}
                </a>
              ) : (
                eraContent.source.label
              )}
            </div>
          )}

          {density === "rich" && landmark.didYouKnow.length > 0 && (
            <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
              <div style={{ fontSize: 9, fontFamily: MONO, letterSpacing: "0.14em", color: SUBTLE, textTransform: "uppercase", marginBottom: 2 }}>
                Tap to flip
              </div>
              {landmark.didYouKnow.slice(0, 2).map((f) => (
                <FlipFact key={f.q} q={f.q} a={f.a} accent={era.accent} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hotspot bottom sheet */}
      <HotspotSheet
        hotspot={openHotspot}
        era={era}
        index={openHotspotIndex}
        onClose={() => setOpenHotspotId(null)}
      />

      {/* Landmarks sheet */}
      {landmarksOpen && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, top: 0, zIndex: 40,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end",
          }}
          onClick={() => setLandmarksOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", background: era.tintPanel, color: FG,
            borderTopLeftRadius: 18, borderTopRightRadius: 18,
            padding: "14px 16px 22px", maxHeight: "60%", overflowY: "auto",
            border: `1px solid ${era.accent}33`,
            animation: "sheetUp 0.3s cubic-bezier(0.4,0.1,0.2,1)",
          }}>
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 12px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.14em", color: era.accent, textTransform: "uppercase", fontWeight: 600 }}>
                Landmarks · {allLandmarks.length}
              </div>
              <div style={{ fontSize: 10, fontFamily: MONO, color: SUBTLE }}>{era.label}</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {allLandmarks.map((l) => {
                const active = l.id === landmarkId;
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      setLandmarksOpen(false);
                      navigate(`/ar-artifact/${l.id}?period=${eraId}`, { viewTransition: true });
                    }}
                    style={{
                      padding: 10, border: "none", cursor: "pointer", textAlign: "left",
                      background: active ? `${era.accent}22` : "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      display: "flex", alignItems: "center", gap: 12,
                      fontFamily: SERIF,
                    }}
                  >
                    <span
                      data-vt-name={!active ? landmarkVT(l.id) : undefined}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: `${era.accent}22`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, flexShrink: 0,
                        // Shared-element source: this thumbnail morphs into the
                        // big image card on the next page. Only the inactive
                        // rows get a name; the active landmark's name belongs
                        // to the big card already on this page.
                        ...(active ? {} : { viewTransitionName: landmarkVT(l.id) }),
                      } as React.CSSProperties}
                    >
                      {l.emoji}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: "block",
                        fontFamily: SERIF, fontStyle: "italic",
                        fontSize: 16, fontWeight: 400,
                        color: active ? era.accent : FG,
                        marginBottom: 2,
                      }}>
                        {l.shortName}
                      </span>
                      <span style={{ display: "block", fontSize: 10, color: SUBTLE, fontFamily: MONO, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {l.kicker}
                      </span>
                    </span>
                    {active && (
                      <span style={{ fontSize: 10, fontFamily: MONO, color: era.accent, letterSpacing: "0.1em" }}>VIEWING</span>
                    )}
                  </button>
                );
              })}
            </div>
            <style>{`@keyframes sheetUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
          </div>
        </div>
      )}

      {/* Bottom row: landmarks · voice — uses the same px-5 / pt-6 / pb-8
           outer spacing as PanoramaScene's bottom-controls container so the
           row sits at the same screen-edge offset and the same vertical
           breathing room on both screens. */}
      <div className="px-5 pb-8 pt-6" style={{ flexShrink: 0, position: "relative", zIndex: 2 }}>
        <div className="mx-auto w-full max-w-md mt-3 flex items-center gap-2">
        <button
          onClick={() => setLandmarksOpen(true)}
          title="Landmarks"
          aria-label="Open landmarks"
          style={{
            width: 46, height: 46, borderRadius: 23,
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            color: FG, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            position: "relative", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L13.5 4.5V11.5L8 14.5L2.5 11.5V4.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </button>

          <VoicePill
            era={era}
            onCommand={handleVoiceCommand}
            hint={
              <>
                Try{" "}
                <span style={{ color: era.accent, fontWeight: 600 }}>
                  "{voiceHint}"
                </span>
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
