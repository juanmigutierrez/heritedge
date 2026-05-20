// ARArtifactDetail — Direction 3 v3 layout (dark, era-tinted focus card).
// Owner: P3 (detailed view).
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft, HelpCircle, Check, Play, Image, Headphones } from "lucide-react";

import { sendMessage, speak, stopSpeaking } from "@/services/chatService";
import { useVisitedHotspots } from "@/features/progress/useVisitedHotspots";
import {
  getEra,
  getLandmark,
  listLandmarks,
  type EraId,
  type LandmarkId,
} from "@/content/landmarks";
import {
  getARHotspotsForLandmark,
  type ARHotspot,
  type ARLandmarkId,
} from "@/app/components/ar/hotspots";
import { HotspotSheet } from "@/app/components/ar/HotspotSheet";
import {
  EraScrub,
  FG,
  MONO,
  SANS,
  SERIF,
  SUBTLE,
  VoicePill,
  VoiceConfirmToast,
  VoiceAlreadyHereToast,
  haptic,
  parseVoiceIntent,
  describeIntent,
  type VoiceIntent,
} from "./ar/shared";
import { pickVoiceHint } from "./ar/voiceHints";
import { landmarkVT } from "./ar/viewTransition";

const PERIODS: EraId[] = ["birth", "crown", "modern"];

const isPeriod = (v: string | null): v is EraId =>
  !!v && (PERIODS as string[]).includes(v);

const ERA_STORAGE_KEY = "heritedge:era";

// ─── Media-type icon ──────────────────────────────────────────────────────────
// Small indicator shown on checklist rows that have rich media.

function MediaIcon({ type, accent }: { type: "youtube" | "audio" | "image" | "beforeAfter"; accent: string }) {
  const icon = type === "youtube"     ? <Play size={9} />
             : type === "audio"       ? <Headphones size={9} />
             : <Image size={9} />;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, borderRadius: "50%",
      background: accent + "22", color: accent, flexShrink: 0,
    }}>
      {icon}
    </span>
  );
}

// ─── Checklist row ────────────────────────────────────────────────────────────

function HotspotRow({
  hotspot,
  visited,
  accent,
  onTap,
}: {
  hotspot: ARHotspot;
  visited: boolean;
  accent: string;
  onTap: () => void;
}) {
  const mediaType = hotspot.beforeAfter ? "beforeAfter"
    : hotspot.media?.type ?? null;

  return (
    <button
      onClick={() => { haptic(12); onTap(); }}
      style={{
        width: "100%", textAlign: "left", background: "none", border: "none",
        cursor: "pointer", padding: "11px 14px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Check/dot indicator */}
      <div style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
        border: `1.5px solid ${visited ? accent : "rgba(255,255,255,0.2)"}`,
        background: visited ? accent + "22" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {visited && <Check size={11} strokeWidth={2.5} color={accent} />}
      </div>

      {/* Year badge */}
      <span style={{
        flexShrink: 0, padding: "2px 7px", borderRadius: 999,
        background: accent + "18", color: accent,
        fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", fontWeight: 700,
      }}>
        {hotspot.year}
      </span>

      {/* Title */}
      <span style={{
        flex: 1, minWidth: 0,
        fontFamily: SERIF, fontStyle: "italic",
        fontSize: 14, color: visited ? SUBTLE : FG,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        transition: "color 0.2s",
      }}>
        {hotspot.title}
      </span>

      {/* Media icon */}
      {mediaType && <MediaIcon type={mediaType} accent={accent} />}

      {/* Chevron */}
      <span style={{ color: SUBTLE, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>›</span>
    </button>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ARArtifactDetail() {
  const navigate = useNavigate();
  const params = useParams<{ landmarkId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPeriod = searchParams.get("period");
  const storedPeriod = typeof window !== "undefined"
    ? window.sessionStorage?.getItem(ERA_STORAGE_KEY)
    : null;
  const eraId: EraId = isPeriod(urlPeriod)
    ? urlPeriod
    : isPeriod(storedPeriod) ? storedPeriod : "modern";
  const landmarkId = params.landmarkId as LandmarkId;

  const landmark     = useMemo(() => getLandmark(landmarkId), [landmarkId]);
  const era          = getEra(eraId)!;
  const allLandmarks = useMemo(() => listLandmarks(), []);

  const hotspots: ARHotspot[] = useMemo(
    () => getARHotspotsForLandmark(eraId, landmarkId as ARLandmarkId),
    [eraId, landmarkId]
  );

  const { isVisited, markVisited } = useVisitedHotspots();
  const visitedCount = useMemo(
    () => hotspots.filter(h => isVisited(h.id)).length,
    [hotspots, isVisited]
  );

  const [openHotspotId, setOpenHotspotId]   = useState<string | null>(null);
  const [pendingIntent, setPendingIntent]   = useState<(VoiceIntent & { label: string }) | null>(null);
  const [alreadyHereLabel, setAlreadyHereLabel] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen]           = useState(false);
  const [landmarksOpen, setLandmarksOpen]   = useState(false);
  const voiceHint = useMemo(() => pickVoiceHint(), []);

  const openHotspot = useMemo(
    () => hotspots.find(h => h.id === openHotspotId) ?? null,
    [hotspots, openHotspotId]
  );

  const handleOpenHotspot = (h: ARHotspot) => {
    markVisited(h.id);
    setOpenHotspotId(h.id);
  };

  // Close sheet on era/landmark change.
  useEffect(() => { setOpenHotspotId(null); }, [landmarkId, eraId]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(ERA_STORAGE_KEY, eraId);
  }, [eraId]);

  useEffect(() => {
    if (!isPeriod(urlPeriod)) setSearchParams({ period: eraId }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPeriod]);

  const setEra = (next: EraId) =>
    setSearchParams({ period: next }, { replace: true });

  const handleVoiceCommand = (transcript: string) => {
    const intent = parseVoiceIntent(transcript);

    if (intent.overview) {
      navigate("/ar-overview", { viewTransition: true });
      return;
    }

    if (intent.landmark || intent.era) {
      const targetLandmark = intent.landmark ?? landmarkId;
      const targetEra      = intent.era      ?? eraId;
      const isNavigation   = intent.landmark && intent.landmark !== landmarkId;
      const alreadyHere    = !isNavigation && targetEra === eraId;

      if (alreadyHere) {
        setAlreadyHereLabel(describeIntent({ landmark: targetLandmark, era: targetEra }));
      } else if (isNavigation) {
        setPendingIntent({ ...intent, label: describeIntent({ landmark: targetLandmark, era: targetEra }) });
      } else if (intent.era && intent.era !== eraId) {
        setPendingIntent({ ...intent, label: describeIntent({ landmark: null, era: intent.era }) });
      }
      return;
    }

    stopSpeaking();
    sendMessage(transcript, landmarkId)
      .then(res => { const r = res.answer || res.reply; if (r) speak(r); })
      .catch(() => {});
  };

  if (!landmark) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B0E", color: FG, padding: 24, fontFamily: SANS }}>
        <p>Unknown landmark.</p>
        <button onClick={() => navigate("/ar-overview")} style={{ marginTop: 12 }}>Back to overview</button>
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
      {/* Grain */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)" }} />

      {/* Top HUD */}
      <div style={{
        padding: "48px 20px 20px", flexShrink: 0, position: "relative", zIndex: 2,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/ar-overview", { viewTransition: true })}
            aria-label="Back to overview"
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setHintsOpen(o => !o)}
            aria-label="Help"
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm"
            style={{
              background: "rgba(0,0,0,0.55)", border: `1px solid ${era.accent}55`,
              color: era.accent, fontFamily: MONO, fontSize: 10,
              letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600,
              textShadow: "0 1px 4px rgba(0,0,0,0.85)", boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: era.accent, boxShadow: `0 0 6px ${era.accent}` }} />
            {era.label} · {era.year}
          </div>
          <h1 style={{
            margin: "10px 0 0", fontFamily: SERIF, fontWeight: 400, fontStyle: "italic",
            fontSize: 22, lineHeight: 1.1, color: FG,
            textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.55)",
          }}>
            {landmark.name}
          </h1>
          <p style={{ margin: "4px 0 0", fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: SUBTLE }}>
            {landmark.kicker}
          </p>
        </div>
      </div>

      {/* Hints panel */}
      {hintsOpen && (
        <div style={{
          position: "absolute", top: 60, left: 16, right: 16, zIndex: 30,
          background: era.tintPanel, color: FG, borderRadius: 14, padding: 14,
          boxShadow: "0 12px 32px rgba(0,0,0,0.4)", border: `1px solid ${era.accent}44`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.14em", color: era.accent, textTransform: "uppercase", fontWeight: 600 }}>Ways to explore</div>
            <button onClick={() => setHintsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: SUBTLE, lineHeight: 1 }}>×</button>
          </div>
          {[
            { icon: "📖", t: "Tap a story", d: "Tap any row to open the full story with media, sources, and audio." },
            { icon: "✓",  t: "Track progress", d: "Rows turn checkmarked once you've opened them. Come back any time." },
            { icon: "🎤", t: "Voice", d: 'Say "take me to Galleria" or "switch to crown" to navigate hands-free.' },
          ].map(r => (
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

      {/* Era scrubber + progress */}
      <div style={{ padding: "0 16px", flexShrink: 0, position: "relative", zIndex: 1 }}>
        <div
          style={{
            padding: "12px 14px", background: era.tintPanel, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            viewTransitionName: landmarkVT(landmark.id),
          } as React.CSSProperties}
        >
          <EraScrub value={eraId} onChange={setEra} accent={era.accent} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{
        margin: "12px 16px 0", flex: 1, minHeight: 0, overflowY: "auto",
        background: era.tintPanel, borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
      }}>
        {/* Header row */}
        <div style={{
          padding: "10px 14px 9px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: era.accent, textTransform: "uppercase", fontWeight: 600 }}>
            Stories
          </span>
          {hotspots.length > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: SUBTLE }}>
              {visitedCount} / {hotspots.length} explored
            </span>
          )}
        </div>

        {hotspots.length === 0 ? (
          <div style={{
            padding: 32, textAlign: "center",
            color: SUBTLE, fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em",
          }}>
            No stories for this period yet.
          </div>
        ) : (
          hotspots.map(h => (
            <HotspotRow
              key={h.id}
              hotspot={h}
              visited={isVisited(h.id)}
              accent={era.accent}
              onTap={() => handleOpenHotspot(h)}
            />
          ))
        )}
      </div>

      {/* HotspotSheet — full rich view, slides up on row tap */}
      <HotspotSheet
        hotspot={openHotspot}
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
          <div onClick={e => e.stopPropagation()} style={{
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
              {allLandmarks.map(l => {
                const active = l.id === landmarkId;
                return (
                  <button
                    key={l.id}
                    onClick={() => { setLandmarksOpen(false); navigate(`/ar-artifact/${l.id}?period=${eraId}`, { viewTransition: true }); }}
                    style={{
                      padding: 10, border: "none", cursor: "pointer", textAlign: "left",
                      background: active ? `${era.accent}22` : "rgba(255,255,255,0.04)",
                      borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontFamily: SERIF,
                    }}
                  >
                    <span style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `${era.accent}22`,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                      ...(active ? {} : { viewTransitionName: landmarkVT(l.id) }),
                    } as React.CSSProperties}>
                      {l.emoji}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: SERIF, fontStyle: "italic", fontSize: 16, fontWeight: 400, color: active ? era.accent : FG, marginBottom: 2 }}>
                        {l.shortName}
                      </span>
                      <span style={{ display: "block", fontSize: 10, color: SUBTLE, fontFamily: MONO, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {l.kicker}
                      </span>
                    </span>
                    {active && <span style={{ fontSize: 10, fontFamily: MONO, color: era.accent, letterSpacing: "0.1em" }}>VIEWING</span>}
                  </button>
                );
              })}
            </div>
            <style>{`@keyframes sheetUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
          </div>
        </div>
      )}

      {/* Toasts */}
      {alreadyHereLabel && (
        <VoiceAlreadyHereToast message={alreadyHereLabel} accent={era.accent} onDismiss={() => setAlreadyHereLabel(null)} />
      )}
      {pendingIntent && (
        <VoiceConfirmToast
          message={pendingIntent.label}
          accent={era.accent}
          prefix={pendingIntent.landmark ? "Taking you to" : "Switching to"}
          onCommit={() => {
            const intent = pendingIntent;
            setPendingIntent(null);
            if (intent.landmark) {
              navigate(`/ar-artifact/${intent.landmark}?period=${intent.era ?? eraId}`, { viewTransition: true });
            } else if (intent.era) {
              setEra(intent.era);
            }
          }}
          onDismiss={() => setPendingIntent(null)}
        />
      )}

      {/* Bottom row */}
      <div className="px-5 pb-8 pt-4" style={{ flexShrink: 0, position: "relative", zIndex: 2 }}>
        <div className="mx-auto w-full max-w-md flex items-center gap-2">
          <button
            onClick={() => setLandmarksOpen(true)}
            title="Landmarks" aria-label="Open landmarks"
            style={{
              width: 46, height: 46, borderRadius: 23,
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              color: FG, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
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
            hint={<>Try <span style={{ color: era.accent, fontWeight: 600 }}>"{voiceHint}"</span></>}
          />
        </div>
      </div>
    </div>
  );
}
