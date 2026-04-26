// ARArtifactDetail — Direction 3 v3 layout (dark, era-tinted focus card).
// Owner: P3 (detailed view).
//
// DATA_FLOW
// ─────────
// All content this view renders flows through @/content/landmarks:
//   - listLandmarks()                → bottom-sheet landmark switcher
//   - getLandmark(id)                → name, kicker, image per era,
//                                       didYouKnow, quiz
//   - getEra(eraId)                  → presentational era metadata
//   - getEraContent(id, era)         → headline + blurb (KB fallback)
//   - getHotspots(id, era)           → numbered markers on the image
//
// Visited state is owned by useVisitedHotspots (localStorage-backed). To
// migrate to a backend, swap that hook's internals; the view's API doesn't
// change.
//
// MULTIMODAL
// ──────────
//   - Touch:   drag the era scrubber, tap markers, tap landmarks sheet
//   - Voice:   STT → matches landmark / era / hotspot label, opens sheet,
//              speaks body via TTS
//   - Hearing: "Listen" on every hotspot reads the body via TTS
//   - Haptic:  short vibration on hotspot tap

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft, HelpCircle } from "lucide-react";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";
import { useVisitedHotspots } from "@/features/progress/useVisitedHotspots";
import {
  ERAS,
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
  EraBadge,
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

type TabId = "story" | "history" | "meaning";
const TABS: TabId[] = ["story", "history", "meaning"];
const PERIODS: EraId[] = ["medieval", "postwar", "present"];

const isPeriod = (v: string | null): v is EraId =>
  !!v && (PERIODS as string[]).includes(v);

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

  const urlPeriod = searchParams.get("period");
  const eraId: EraId = isPeriod(urlPeriod) ? urlPeriod : "present";
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
  const [shakeFact, setShakeFact] = useState<{ a: string } | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [openHotspotId, setOpenHotspotId] = useState<string | null>(null);

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
      navigate(`/ar-artifact/${nextLandmark}?period=${nextEra ?? eraId}`);
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

  const triggerShake = () => {
    if (!landmark) return;
    const facts = landmark.didYouKnow;
    if (facts.length === 0) return;
    const f = facts[Math.floor(Math.random() * facts.length)];
    haptic([10, 40, 10]);
    setShakeFact({ a: f.a });
    window.setTimeout(() => setShakeFact(null), 4500);
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

      {/* Top bar */}
      <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <button
          onClick={() => navigate("/ar-overview")}
          aria-label="Back to overview"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: FG, width: 34, height: 34, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={16} />
        </button>
        <EraBadge era={era} />
        <button
          onClick={() => setHintsOpen((o) => !o)}
          aria-label="Help"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: FG, width: 34, height: 34, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <HelpCircle size={14} />
        </button>
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
            { icon: "🎤", t: "Voice", d: 'Say a feature ("the spires", "Madonnina") or a place ("Galleria postwar") to jump there.' },
            { icon: "🔀", t: "Shake", d: 'Shake the device for a random "did you know" fact.' },
          ].map((r) => (
            <div key={r.t} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, width: 22, textAlign: "center" }}>{r.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.t}</div>
                <div style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.4 }}>{r.d}</div>
              </div>
            </div>
          ))}
          <button onClick={triggerShake} style={{ marginTop: 8, width: "100%", padding: "8px", background: era.accent, color: "#0a0a0a", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
            Simulate shake →
          </button>
        </div>
      )}

      {/* Image card */}
      <div style={{ padding: "0 16px", flexShrink: 0, position: "relative", zIndex: 1 }}>
        <div style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          border: `1px solid ${era.accent}33`,
          boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${era.accent}11 inset`,
          transition: "border-color 0.4s, box-shadow 0.4s",
          height: 220,
        }}>
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

          {/* Landmark + era label */}
          <div style={{
            position: "absolute", left: 12, bottom: 10,
            fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
            padding: "4px 8px", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 4,
            backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)",
          }}>
            AR model · {landmark.id} · {era.label}
          </div>

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

          <button
            onClick={() => setShowCompare((c) => !c)}
            style={{
              position: "absolute", top: 10, right: 12, zIndex: 4,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)",
              border: "none", color: "#fff", cursor: "pointer",
              padding: "5px 10px", borderRadius: 8,
              fontSize: 10, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >
            ⇄ compare
          </button>
        </div>

        {/* Compare row */}
        {showCompare && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
            marginTop: 10,
          }}>
            {ERAS.map((e) => (
              <button
                key={e.id}
                onClick={() => setEra(e.id)}
                style={{
                  position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer",
                  border: e.id === eraId ? `2px solid ${era.accent}` : "1px solid rgba(255,255,255,0.1)",
                  padding: 0, height: 70, background: "transparent",
                }}
              >
                <ImageWithFallback
                  src={landmark.images[e.id]}
                  alt={e.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)",
                  display: "flex", alignItems: "flex-end", justifyContent: "center",
                  fontSize: 10, fontFamily: MONO, color: "#fff", padding: 4,
                }}>
                  {e.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Era scrubber */}
        <div style={{
          marginTop: 14, padding: "12px 14px",
          background: era.tintPanel, borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <EraScrub value={eraId} onChange={setEra} accent={era.accent} />
        </div>
      </div>

      {/* Title + content */}
      <div style={{
        margin: "12px 16px 0", flex: 1, minHeight: 0, overflowY: "auto",
        background: era.tintPanel, borderRadius: 14, padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ fontSize: 9, fontFamily: MONO, letterSpacing: "0.14em", color: SUBTLE, textTransform: "uppercase" }}>
          {landmark.kicker}
        </div>
        <h1 style={{ margin: "2px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: 24, lineHeight: 1.05, letterSpacing: "-0.01em", fontStyle: "italic" }}>
          {landmark.name}
        </h1>

        <div style={{ display: "flex", gap: 14, marginTop: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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

      {/* Shake toast */}
      {shakeFact && (
        <div style={{
          position: "absolute", left: 16, right: 16, top: 64, zIndex: 25,
          background: era.accent, color: "#0a0a0a",
          padding: "10px 14px", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: `0 10px 28px ${era.accent}66`,
          animation: "toastIn 0.35s cubic-bezier(0.4,0.1,0.2,1)",
        }}>
          <span style={{ fontSize: 18 }}>📳</span>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>Shake · did you know</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{shakeFact.a}</div>
          </div>
          <style>{`@keyframes toastIn { from { transform: translateY(-8px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
        </div>
      )}

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
                      navigate(`/ar-artifact/${l.id}?period=${eraId}`);
                      setLandmarksOpen(false);
                    }}
                    style={{
                      padding: 8, border: "none", cursor: "pointer", textAlign: "left",
                      background: active ? `${era.accent}22` : "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      display: "flex", alignItems: "center", gap: 12,
                      fontFamily: SANS,
                    }}
                  >
                    <span style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <ImageWithFallback
                        src={l.images[eraId]}
                        alt={l.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? era.accent : FG, marginBottom: 2 }}>
                        {l.name}
                      </span>
                      <span style={{ display: "block", fontSize: 10, color: SUBTLE, fontFamily: MONO, letterSpacing: "0.06em" }}>
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

      {/* Bottom row: landmarks · voice · shake */}
      <div style={{ padding: "12px 14px 14px", flexShrink: 0, display: "flex", gap: 8, alignItems: "center", position: "relative", zIndex: 2 }}>
        <button
          onClick={() => setLandmarksOpen(true)}
          title="Landmarks"
          aria-label="Open landmarks"
          style={{
            width: 46, height: 46, borderRadius: 23,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: FG, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            position: "relative", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L13.5 4.5V11.5L8 14.5L2.5 11.5V4.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 16, height: 16, borderRadius: "50%",
            background: era.accent, color: "#0a0a0a",
            fontSize: 9, fontWeight: 700, fontFamily: MONO,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${era.tintBg}`,
          }}>{allLandmarks.length}</span>
        </button>

        <VoicePill
          era={era}
          onCommand={handleVoiceCommand}
          hint={
            <>
              Try{" "}
              <span style={{ color: era.accent, fontWeight: 600 }}>
                "tell me about the {hotspots[0]?.label?.toLowerCase() ?? "spires"}"
              </span>
            </>
          }
        />

        <button
          onClick={triggerShake}
          title="Shake for fact"
          aria-label="Shake for a random fact"
          style={{
            width: 46, height: 46, borderRadius: 23,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: era.accent, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
          }}
        >
          📳
        </button>
      </div>
    </div>
  );
}
