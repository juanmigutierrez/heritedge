// AROverview — the AR map of Piazza Duomo. Owner: P3.
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { HelpCircle, X } from "lucide-react";

import {
  getEra,
  listLandmarks,
  type EraId,
  type LandmarkId,
} from "@/content/landmarks";
import {
  EraBadge,
  EraScrub,
  FG,
  MONO,
  SANS,
  SERIF,
  SUBTLE,
  VoicePill,
  haptic,
} from "./ar/shared";
import { pickVoiceHint } from "./ar/voiceHints";
import { landmarkVT, startViewTransition } from "./ar/viewTransition";

// Layout coordinates for the AR map. Tied to landmark id.
const LANDMARK_POS: Record<LandmarkId, { x: number; y: number }> = {
  duomo:    { x: 50, y: 45 },
  galleria: { x: 30, y: 55 },
  palazzo:  { x: 70, y: 50 },
};

const LANDMARK_GLYPH: Record<LandmarkId, string> = {
  duomo: "⛪",
  galleria: "🏛️",
  palazzo: "🏰",
};

export function AROverview() {
  const navigate = useNavigate();
  const [eraId, setEraId] = useState<EraId>("present");
  // The currently "focused" landmark — the implicit zoom-in target for
  // pinch-out. Default to the centerpiece; later this will be driven by AR
  // proximity. User taps update it.
  const [focusedLandmark, setFocusedLandmark] = useState<LandmarkId>("duomo");
  const [showHelp, setShowHelp] = useState(false);
  const [shakeFact, setShakeFact] = useState<string | null>(null);
  const [pinchHint, setPinchHint] = useState<string | null>(null);
  const voiceHint = useMemo(() => pickVoiceHint(), []);

  const era = getEra(eraId)!;
  const landmarks = useMemo(() => listLandmarks(), []);

  const navigateToLandmark = (id: LandmarkId) => {
    startViewTransition(() => {
      navigate(`/ar-artifact/${id}?period=${eraId}`);
    });
  };

  const handleLandmarkClick = (id: LandmarkId) => {
    haptic(18);
    setFocusedLandmark(id);
    // Brief pause so the focus highlight is visible before the transition
    // takes over. The View Transition itself handles the zoom.
    window.setTimeout(() => navigateToLandmark(id), 120);
  };

  const mapRef = useRef<HTMLDivElement | null>(null);

  const handleVoiceCommand = (transcript: string) => {
    const cmd = transcript.toLowerCase();

    let nextEra: EraId | null = null;
    if (/medieval/.test(cmd)) nextEra = "medieval";
    else if (/post[-\s]?war|war/.test(cmd)) nextEra = "postwar";
    else if (/present|now|today/.test(cmd)) nextEra = "present";
    if (nextEra) setEraId(nextEra);

    let nextLandmark: LandmarkId | null = null;
    if (/galleria/.test(cmd)) nextLandmark = "galleria";
    else if (/palazzo/.test(cmd)) nextLandmark = "palazzo";
    else if (/duomo/.test(cmd)) nextLandmark = "duomo";

    if (nextLandmark) {
      // Use the era we just parsed so navigation is consistent within one utterance.
      const targetEra = nextEra ?? eraId;
      setFocusedLandmark(nextLandmark);
      startViewTransition(() => {
        navigate(`/ar-artifact/${nextLandmark}?period=${targetEra}`);
      });
    }
  };

  const triggerShake = () => {
    // Random landmark, random fact — the overview's "shake" is broader in scope.
    const target = landmarks[Math.floor(Math.random() * landmarks.length)];
    if (!target || target.didYouKnow.length === 0) return;
    const f = target.didYouKnow[Math.floor(Math.random() * target.didYouKnow.length)];
    haptic([10, 40, 10]);
    setShakeFact(`${target.name}: ${f.a}`);
    window.setTimeout(() => setShakeFact(null), 4500);
  };

  return (
    <div style={{
      width: "100%", height: "100dvh", color: FG,
      fontFamily: SANS, position: "relative", overflow: "hidden",
      background: era.tintBg, transition: "background 0.5s cubic-bezier(0.4,0.1,0.2,1)",
      display: "flex", flexDirection: "column",
    }}>
      {/* faint grain — same as detail view */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)" }} />

      {/* Top bar: AR Active dot · era badge · close */}
      <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 11px 5px 9px", borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: FG, fontSize: 10, fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#E4574B",
            animation: "arDot 1.6s ease-in-out infinite",
          }} />
          AR active
          <style>{`@keyframes arDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
        </div>
        <EraBadge era={era} />
        <button
          onClick={() => navigate("/")}
          aria-label="Exit AR — return home"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: FG, width: 34, height: 34, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Map area — fills available space between header and scrubber */}
      <div style={{
        flex: 1, minHeight: 0, position: "relative", zIndex: 1,
        padding: "0 16px",
        display: "flex", flexDirection: "column",
      }}>
        <div ref={mapRef} style={{
          flex: 1, position: "relative",
          borderRadius: 16, overflow: "hidden",
          border: `1px solid ${era.accent}33`,
          boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${era.accent}11 inset`,
          background: era.tintPanel,
          transition: "border-color 0.4s, box-shadow 0.4s",
          touchAction: "none",
        }}>
          {/* AR grid — themed with era accent */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none" }}>
            <div style={{
              width: "100%", height: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gridTemplateRows: "repeat(12, 1fr)",
            }}>
              {Array.from({ length: 96 }).map((_, i) => (
                <div key={i} style={{ border: `1px solid ${era.accent}` }} />
              ))}
            </div>
          </div>

          {/* AR-style corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((pos) => (
            <span key={pos} style={{
              position: "absolute", width: 14, height: 14, zIndex: 3,
              borderColor: era.accent, borderStyle: "solid", borderWidth: 0,
              ...(pos.includes("t") ? { top: 10, borderTopWidth: 1.5 } : { bottom: 10, borderBottomWidth: 1.5 }),
              ...(pos.includes("l") ? { left: 10, borderLeftWidth: 1.5 } : { right: 10, borderRightWidth: 1.5 }),
            }} />
          ))}

          {/* Connecting lines */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <line x1="30%" y1="55%" x2="50%" y2="45%" stroke={era.accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
            <line x1="50%" y1="45%" x2="70%" y2="50%" stroke={era.accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
          </svg>

          {/* Landmarks */}
          {landmarks.map((l) => {
            const pos = LANDMARK_POS[l.id];
            const focused = focusedLandmark === l.id;
            return (
              <button
                key={l.id}
                onClick={() => handleLandmarkClick(l.id)}
                data-vt-name={landmarkVT(l.id)}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${focused ? 1.08 : 1})`,
                  width: 84, height: 84, borderRadius: "50%",
                  background: focused ? `${era.accent}33` : "rgba(255,255,255,0.06)",
                  border: `1.5px solid ${focused ? era.accent : era.accent + "88"}`,
                  boxShadow: focused
                    ? `0 8px 28px ${era.accent}66, 0 0 0 6px ${era.accent}22`
                    : `0 4px 16px rgba(0,0,0,0.3), 0 0 0 4px ${era.accent}11`,
                  color: FG, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.25s, box-shadow 0.25s, background 0.25s, border-color 0.25s",
                }}
              >
                <span style={{ fontSize: 26, lineHeight: 1, marginBottom: 2 }}>{LANDMARK_GLYPH[l.id]}</span>
                <span style={{
                  fontSize: 10, fontFamily: MONO, letterSpacing: "0.08em",
                  color: focused ? era.accent : FG,
                  textTransform: "uppercase", fontWeight: 600,
                }}>
                  {l.id}
                </span>
              </button>
            );
          })}

          {/* "You are here" caption */}
          <div style={{
            position: "absolute", left: 14, bottom: 14, zIndex: 3,
            fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em",
            color: SUBTLE, textTransform: "uppercase",
          }}>
            Piazza del Duomo · {era.label}
          </div>
        </div>

        {/* Era scrubber — same component as detail view */}
        <div style={{
          marginTop: 12, padding: "12px 14px",
          background: era.tintPanel, borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <EraScrub value={eraId} onChange={setEraId} accent={era.accent} />
        </div>
      </div>

      {/* Help panel — same pattern as detail view's hints */}
      {showHelp && (
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
            <button onClick={() => setShowHelp(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: SUBTLE, lineHeight: 1 }}>×</button>
          </div>
          {[
            { icon: "👆", t: "Tap a landmark", d: "Highlights it and opens the detailed view." },
            { icon: "🤏", t: "Pinch out", d: "On the highlighted landmark, pinch outward to zoom into the detailed view." },
            { icon: "📅", t: "Drag the timeline", d: "Each era recolors the whole scene. Try jumping straight to medieval." },
            { icon: "🎤", t: "Voice", d: 'Say "Show me the Duomo in medieval times" — the system jumps you there.' },
            { icon: "🔀", t: "Shake", d: "Surface a random fact about one of the landmarks." },
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

      {/* Pinch-hint toast — shown when user pinches without a focused landmark */}
      {pinchHint && (
        <div style={{
          position: "absolute", left: 16, right: 16, top: 64, zIndex: 26,
          background: "rgba(0,0,0,0.7)", color: FG,
          padding: "10px 14px", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 10,
          border: `1px solid ${era.accent}55`,
          backdropFilter: "blur(8px)",
          animation: "toastIn 0.3s cubic-bezier(0.4,0.1,0.2,1)",
        }}>
          <span style={{ fontSize: 16 }}>🤏</span>
          <div style={{ fontSize: 12, fontFamily: SANS }}>{pinchHint}</div>
        </div>
      )}

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
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: SERIF, fontStyle: "italic" }}>{shakeFact}</div>
          </div>
          <style>{`@keyframes toastIn { from { transform: translateY(-8px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
        </div>
      )}

      {/* Bottom action bar — same shape as detail view: [round] · [voice pill] · [round] */}
      <div style={{ padding: "12px 16px 14px", flexShrink: 0, display: "flex", gap: 8, alignItems: "center", position: "relative", zIndex: 2, width: "100%", boxSizing: "border-box" }}>
        <button
          onClick={() => setShowHelp((h) => !h)}
          title="Help"
          aria-label="How to explore"
          style={{
            width: 46, height: 46, borderRadius: 23,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: FG, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <HelpCircle size={18} />
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
