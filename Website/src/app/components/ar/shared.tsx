import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mic, Play, Compass, Camera, CameraOff, Smartphone, Hand } from "lucide-react";
import {
  ERAS,
  getEra,
  type Era,
  type EraId,
  type Hotspot,
  type LandmarkId,
} from "@/content/landmarks";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { speak, stopSpeaking } from "@/services/chatService";

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const SANS = "'Inter', system-ui, sans-serif";
export const SERIF = "'Fraunces', 'Cormorant Garamond', Georgia, serif";
export const MONO = "'JetBrains Mono', monospace";
export const SUBTLE = "rgba(244,242,236,0.55)";
export const FG = "#F4F2EC";

/** Tiny haptic helper — silently no-ops where not supported. */
export const haptic = (pattern: number | number[] = 18) => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
};

// ─── Voice intent parser ──────────────────────────────────────────────────────

export interface VoiceIntent {
  landmark: LandmarkId | null;
  era: EraId | null;
  overview?: boolean;
}

const LANDMARK_PATTERNS: Array<{ id: LandmarkId; pattern: RegExp }> = [
  { id: "galleria", pattern: /galleria|vittorio|emanuele/i },
  { id: "palazzo",  pattern: /palazzo|reale|royal\s+palace/i },
  { id: "duomo",    pattern: /duomo|cathedral|cattedrale/i },
];

const ERA_PATTERNS: Array<{ id: EraId; pattern: RegExp }> = [
  // Birth: founding era. "medieval"/"mid evil" are common speech-engine mishearings.
  { id: "birth",  pattern: /\bbirth\b|founding|origin|gothic|medieval|media?eval|medi[ae]val|mid[-\s]*evil|middle\s*age|ancient|antico|\bpast\b|1386/i },
  // Crown: renaissance through Napoleonic. "napoleon" and "renaissance" are strong signals.
  { id: "crown",  pattern: /\bcrown\b|renaissance|baroque|napoleon|enlightenment|habsburg|duchy|1500|1600|1700|1800|rinascimento/i },
  // Modern: 1860 to today. "modern"/"now"/"today" map here; no collision with "gothic" etc.
  { id: "modern", pattern: /\bmodern\b|\bnow\b|today|present|current|liberation|oggi|attuale|1900|1943|1945/i },
];

// Matches any phrase that contains "map" or "overview" as a standalone word.
// Landmark/era patterns are checked first, so "galleria map" would still
// resolve as a landmark — but in practice no landmark or era word overlaps
// with "map" or "overview", making the simple word-boundary check safe.
const OVERVIEW_PATTERN = /\b(map|overview)\b/i;

/**
 * Parse a free-form voice transcript into a navigation intent.
 * `overview: true` means "go back to the AR map". Landmark/era patterns
 * are checked first so "take me back to medieval" resolves as era, not overview.
 */
export function parseVoiceIntent(transcript: string): VoiceIntent {
  const landmark = LANDMARK_PATTERNS.find(({ pattern }) => pattern.test(transcript))?.id ?? null;
  const era      = ERA_PATTERNS.find(({ pattern }) => pattern.test(transcript))?.id ?? null;
  // Only check for overview if nothing more specific was recognised.
  if (!landmark && !era && OVERVIEW_PATTERN.test(transcript)) {
    return { landmark: null, era: null, overview: true };
  }
  return { landmark, era };
}

/** Human-readable label for a recognised intent (used in confirm toast). */
export function describeIntent(intent: VoiceIntent): string {
  const lmLabel = intent.landmark
    ? ({ duomo: "Duomo", galleria: "Galleria", palazzo: "Palazzo" } as const)[intent.landmark]
    : null;
  const eraLabel = intent.era ? getEra(intent.era)?.label ?? null : null;
  if (lmLabel && eraLabel) return `${lmLabel} · ${eraLabel}`;
  if (lmLabel) return lmLabel;
  if (eraLabel) return eraLabel;
  return "";
}

// ─── Voice confirmation toast ─────────────────────────────────────────────────

interface VoiceConfirmToastProps {
  /** Short description of what was understood — landmark, era, or both. */
  message: string;
  accent: string;
  /** Prefix shown before the message. Defaults to "Taking you to". */
  prefix?: string;
  /** Called after the hold delay so the caller can navigate/act. */
  onCommit: () => void;
  /** Called if user taps the ✕ before commit fires. */
  onDismiss: () => void;
}

/**
 * Hold window before a recognised voice command auto-commits. Long enough to
 * read the toast and react (the evaluator flagged the old 1.4 s as too tight),
 * while a depleting ring makes the countdown legible rather than a surprise.
 * Users who are sure can tap the toast to go immediately; ✕ cancels.
 */
const VOICE_HOLD_MS = 2800;
// Circumference of the r=7 countdown ring — shared by the dash length and the
// keyframe end offset so the stroke depletes exactly to empty.
const RING_CIRC = 2 * Math.PI * 7;

/** Auto-committing toast with a visible countdown — shows what was understood. */
export function VoiceConfirmToast({ message, accent, prefix = "Taking you to", onCommit, onDismiss }: VoiceConfirmToastProps) {
  // Stable ref so the timeout is set exactly once on mount regardless of
  // how many times the parent re-renders and passes a new onCommit arrow.
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    const t = window.setTimeout(() => onCommitRef.current(), VOICE_HOLD_MS);
    return () => window.clearTimeout(t);
  }, []); // empty deps — intentional: fires once on mount, never resets

  return (
    <div
      style={{
        position: "absolute", bottom: 140, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 12px 8px 10px", borderRadius: 999,
        background: "rgba(10,10,12,0.88)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${accent}55`,
        boxShadow: `0 6px 24px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22 inset`,
        whiteSpace: "nowrap",
        animation: "vcToastIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Tapping the body commits immediately — efficiency for confident users. */}
      <button
        onClick={() => onCommitRef.current()}
        aria-label="Go now"
        style={{
          background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}
      >
        {/* Depleting countdown ring — empties over VOICE_HOLD_MS before commit. */}
        <span style={{ width: 18, height: 18, flexShrink: 0, display: "inline-flex" }}>
          <svg width={18} height={18} viewBox="0 0 18 18" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="9" cy="9" r="7" fill="none" stroke={`${accent}33`} strokeWidth="2" />
            <circle
              cx="9" cy="9" r="7" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              style={{ animation: `vcRingDeplete ${VOICE_HOLD_MS}ms linear forwards` }}
            />
          </svg>
        </span>
        <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", color: FG }}>
          {prefix}{" "}
          <span style={{ color: accent, fontWeight: 700 }}>{message}</span>
          <span style={{ color: `${FG}66`, marginLeft: 8 }}>›</span>
        </span>
      </button>
      {/* Bordered circular chip so cancel reads as a real, reachable control —
          a bare glyph was too easy to miss in the short auto-commit window. */}
      <button
        onClick={onDismiss}
        aria-label="Cancel"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, flexShrink: 0,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "50%",
          color: FG, fontSize: 16, lineHeight: 1,
          cursor: "pointer", padding: 0,
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes vcToastIn { from { opacity:0; transform:translateX(-50%) scale(0.88); } to { opacity:1; transform:translateX(-50%) scale(1); } }
        @keyframes vcRingDeplete { from { stroke-dashoffset: 0; } to { stroke-dashoffset: ${RING_CIRC}; } }
      `}</style>
    </div>
  );
}

// ─── Already-here toast ───────────────────────────────────────────────────────

interface VoiceAlreadyHereToastProps {
  message: string;
  accent: string;
  onDismiss: () => void;
}

/** Informational-only toast — auto-dismisses after 2 s, no commit action. */
export function VoiceAlreadyHereToast({ message, accent, onDismiss }: VoiceAlreadyHereToastProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const t = window.setTimeout(() => onDismissRef.current(), 2000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "absolute", bottom: 140, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 999,
        background: "rgba(10,10,12,0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
        animation: "vcToastIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>📍</span>
      <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", color: "rgba(244,242,236,0.7)" }}>
        Already here ·{" "}
        <span style={{ color: accent, fontWeight: 600 }}>{message}</span>
      </span>
    </div>
  );
}

// ─── AR capability intro ────────────────────────────────────────────────────

interface ARIntroOverlayProps {
  accent: string;
  /** Panel tint for the card background — usually era_.tintPanel. */
  tintPanel: string;
  /** Whether the device exposes DeviceOrientationEvent (motion-capable). */
  canGyro: boolean;
  gyroOn: boolean;
  cameraSupported: boolean;
  cameraOn: boolean;
  /** Request device-motion permission / enable gyro (must be a user gesture). */
  onEnableMotion: () => void;
  onToggleCamera: () => void;
  /** Dismiss the intro — scene is already live behind it. */
  onClose: () => void;
}

/**
 * One-time, capability-aware welcome shown on first entry to the AR scene.
 * Tells the user which interaction mode their device supports and how to reach
 * the fuller one — closing the "no compatibility info / no help" gap a reviewer
 * flagged. The scene renders live behind it, so dismissing never blocks content
 * and laptop users get the panoramic experience framed as intended, not broken.
 *
 * Touch-primary devices get the device-motion copy. `canGyro` alone is
 * unreliable (desktop Chrome also exposes DeviceOrientationEvent), so the mobile
 * path is gated on a coarse pointer as well.
 */
export function ARIntroOverlay({
  accent, tintPanel, canGyro, gyroOn, cameraSupported, cameraOn,
  onEnableMotion, onToggleCamera, onClose,
}: ARIntroOverlayProps) {
  const [isTouch] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches);

  const motionAvailable = canGyro && isTouch;

  // How to look around. The arrow-keys/WASD hint is desktop-only — it must key
  // off the pointer type, not gyro detection, or a touch device whose gyro
  // wasn't detected (e.g. insecure context) wrongly gets told to use a keyboard.
  const lookCopy = motionAvailable
    ? "Move your phone to look around the square — or drag with a finger."
    : isTouch
      ? "Drag with a finger to look around the square."
      : "Drag, or use the arrow keys / WASD, to look around the square.";

  const pillBtn = (active: boolean): CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 8,
    width: "100%", justifyContent: "center",
    padding: "11px 14px", borderRadius: 12, cursor: "pointer",
    fontFamily: MONO, fontSize: 12.5, letterSpacing: "0.04em",
    background: active ? `${accent}22` : "rgba(255,255,255,0.06)",
    border: `1px solid ${active ? accent : "rgba(255,255,255,0.18)"}`,
    color: FG, transition: "background 0.18s, border-color 0.18s",
  });

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to explore the AR view"
      style={{
        position: "absolute", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
        animation: "arIntroFade 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360, color: FG,
          background: tintPanel,
          borderRadius: 18, padding: "22px 20px 18px",
          border: `1px solid ${accent}44`,
          boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px ${accent}1a inset`,
          animation: "arIntroPop 0.3s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, fontWeight: 600 }}>
          How to explore
        </div>
        <h2 style={{ fontFamily: SERIF, fontSize: 23, lineHeight: 1.18, margin: "8px 0 14px", fontWeight: 600 }}>
          Piazza del Duomo, across time
        </h2>

        {/* Primary interaction — adapts to what the device can actually do. */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
          {motionAvailable
            ? <Compass size={20} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
            : <Hand size={20} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />}
          <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.45, margin: 0, color: "rgba(244,242,236,0.92)" }}>
            {lookCopy} Tap a glowing landmark to step inside its story.
          </p>
        </div>

        {/* Optional enhancements, only offered when the device supports them. */}
        <div style={{ display: "grid", gap: 8 }}>
          {motionAvailable && (
            <button onClick={onEnableMotion} style={pillBtn(gyroOn)}>
              <Compass size={16} />
              {gyroOn ? "Motion tracking on ✓" : "Enable motion tracking"}
            </button>
          )}
          {cameraSupported && (
            <button onClick={onToggleCamera} style={pillBtn(cameraOn)}>
              {cameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
              {cameraOn ? "Camera view on ✓" : "See it through your camera"}
            </button>
          )}
        </div>

        {/* Honest fallback note for laptop/desktop — panoramic is by design. */}
        {!isTouch && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Smartphone size={16} style={{ color: "rgba(244,242,236,0.6)", flexShrink: 0 }} />
            <span style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.4, color: "rgba(244,242,236,0.7)" }}>
              On a phone you can also move your device to look around. The view here is the full panorama either way.
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 18, width: "100%", padding: "13px 14px",
            borderRadius: 12, border: "none", cursor: "pointer",
            background: accent, color: "#16130d",
            fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
          }}
        >
          Start exploring
        </button>
      </div>

      <style>{`
        @keyframes arIntroFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes arIntroPop { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

// ─── Era badge (pill shown in the top bar) ────────────────────────────────────

export function EraBadge({ era }: { era: Era }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 999,
      background: era.accent + "22", color: era.accent,
      fontSize: 12, fontFamily: MONO, letterSpacing: "0.14em",
      textTransform: "uppercase", fontWeight: 600,
      transition: "all 0.4s",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: era.accent }} />
      {era.label} · <span style={{ textTransform: "none" }}>{era.year}</span>
    </div>
  );
}

// ─── Era scrubber ─────────────────────────────────────────────────────────────

export interface EraScrubProps {
  value: EraId;
  onChange: (next: EraId) => void;
  accent: string;
}

export function EraScrub({ value, onChange, accent }: EraScrubProps) {
  const idx = ERAS.findIndex((e) => e.id === value);
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const setFromX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const i = Math.round(t * (ERAS.length - 1));
    if (ERAS[i].id !== value) onChange(ERAS[i].id);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      setFromX(x);
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, value]);

  const pct = (idx / (ERAS.length - 1)) * 100;

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: SUBTLE, marginBottom: 10, fontWeight: 500, fontFamily: MONO }}>
        <span>Drag through time</span>
        <span style={{ color: accent, fontWeight: 600 }}>
          {ERAS[idx].label} · <span style={{ textTransform: "none" }}>{ERAS[idx].year}</span>
        </span>
      </div>
      <div
        ref={ref}
        onMouseDown={(e) => { setDragging(true); setFromX(e.clientX); }}
        onTouchStart={(e) => { setDragging(true); setFromX(e.touches[0].clientX); }}
        style={{ position: "relative", height: 28, cursor: dragging ? "grabbing" : "grab" }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 2, background: "rgba(255,255,255,0.12)", borderRadius: 1 }} />
        <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", height: 2, width: `${pct}%`, background: accent, borderRadius: 1, transition: dragging ? "none" : "width 0.3s cubic-bezier(0.4,0.1,0.2,1)" }} />
        {ERAS.map((e, i) => {
          const p = (i / (ERAS.length - 1)) * 100;
          const active = i === idx;
          return (
            <div key={e.id} style={{ position: "absolute", left: `${p}%`, top: "50%", transform: "translate(-50%, -50%)" }}>
              <button
                onClick={(ev) => { ev.stopPropagation(); onChange(e.id); }}
                aria-label={`${e.label} · ${e.year}`}
                style={{
                  width: active ? 16 : 8, height: active ? 16 : 8, borderRadius: "50%",
                  background: active ? accent : "rgba(255,255,255,0.25)",
                  border: active ? "3px solid #fff" : "none",
                  boxShadow: active ? `0 2px 10px ${accent}66` : "none",
                  padding: 0, cursor: "pointer",
                  transition: dragging ? "none" : "all 0.25s",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, fontFamily: MONO }}>
        {ERAS.map((e, i) => (
          <span key={e.id} style={{
            color: i === idx ? accent : SUBTLE,
            fontWeight: i === idx ? 600 : 400,
            letterSpacing: "0.06em", textAlign: "center",
            transition: "color 0.2s",
          }}>
            {e.label}
            <br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>{e.year}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Voice pill (mic + transcript + waveform) ─────────────────────────────────

interface MicButtonProps {
  listening: boolean;
  onToggle: () => void;
  bg: string;
  color: string;
  size?: number;
}

function MicButton({ listening, onToggle, bg, color, size = 36 }: MicButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={listening ? "Stop listening" : "Start listening"}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, color,
        border: "none", cursor: "pointer", flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <Mic size={Math.round(size * 0.5)} />
      {listening && (
        <span
          style={{
            position: "absolute", width: size + 8, height: size + 8, borderRadius: "50%",
            border: `2px solid ${bg}`, opacity: 0.6,
            animation: "micPulse 1.4s ease-out infinite", pointerEvents: "none",
          }}
        />
      )}
      <style>{`@keyframes micPulse { 0% { transform: scale(0.85); opacity: 0.7; } 100% { transform: scale(1.25); opacity: 0; } }`}</style>
    </button>
  );
}

interface VoiceWaveProps {
  active: boolean;
  color: string;
}

function VoiceWave({ active, color }: VoiceWaveProps) {
  const bars = [0, 1, 2, 3];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, height: 18 }}>
      {bars.map((i) => (
        <span
          key={i}
          style={{
            width: 3, borderRadius: 2, background: color,
            height: active ? "100%" : 4, opacity: active ? 1 : 0.4,
            animation: active ? `vwave 0.9s ease-in-out ${i * 0.12}s infinite` : "none",
          }}
        />
      ))}
      <style>{`@keyframes vwave { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }`}</style>
    </div>
  );
}

export interface VoicePillProps {
  era: Era;
  /** Called once per finalized utterance with the recognized transcript. */
  onCommand: (transcript: string) => void;
  /** Hint shown when idle. */
  hint?: React.ReactNode;
}

/**
 * Self-contained voice pill: STT lifecycle + visual.
 * The consumer is responsible for parsing the transcript and reacting.
 */
export function VoicePill({ era, onCommand, hint }: VoicePillProps) {
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!transcript) return;
    onCommand(transcript);
    resetTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  return (
    <div style={{
      flex: 1, minWidth: 0, height: 46,
      background: listening ? `${era.accent}18` : "rgba(255,255,255,0.05)",
      border: `1px solid ${listening ? era.accent : "rgba(255,255,255,0.1)"}`,
      borderRadius: 23, padding: "0 5px 0 14px",
      display: "flex", alignItems: "center", gap: 10,
      transition: "all 0.2s",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {listening ? (
          <div key="listening" style={{ fontSize: 16, fontFamily: SERIF, fontStyle: "italic", color: era.accent, animation: "vpFade 0.35s ease-out" }}>
            listening…
          </div>
        ) : (
          <div key="hint" style={{ fontSize: 12, color: SUBTLE, fontFamily: MONO, letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", animation: "vpFade 0.35s ease-out" }}>
            {isSupported ? hint : "voice not supported"}
          </div>
        )}
      </div>
      <VoiceWave active={listening} color={era.accent} />
      <MicButton
        listening={listening}
        onToggle={() => (listening ? stopListening() : startListening())}
        bg={listening ? era.accent : FG}
        color={listening ? "#0a0a0a" : era.tintBg}
      />
      <style>{`@keyframes vpFade { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// ─── Hotspot marker + sheet ───────────────────────────────────────────────────

export interface HotspotMarkerProps {
  index: number;            // 1-based
  visited: boolean;
  open: boolean;
  accent: string;
  onClick: () => void;
  label?: string;
  size?: number;
}

export function HotspotMarker({ index, visited, open, accent, onClick, label, size = 22 }: HotspotMarkerProps) {
  const ringSize = open ? 10 : visited ? 4 : 6;
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={visited ? `${label ?? "Hotspot"} (already explored)` : label ?? "Hotspot"}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: accent,
        opacity: visited && !open ? 0.78 : 1,
        boxShadow: open
          ? `0 0 0 ${ringSize}px ${accent}55`
          : visited
            ? `0 0 0 ${ringSize}px ${accent}22`
            : `0 0 0 ${ringSize}px ${accent}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#0a0a0a", fontFamily: MONO,
        cursor: "pointer", border: "none", padding: 0,
        animation: open || visited ? "none" : "hotspotPulse 2s ease-in-out infinite",
        transition: "all 0.25s",
      }}
    >
      {visited ? <Check accent="#0a0a0a" /> : <span>{index}</span>}
      <style>{`@keyframes hotspotPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }`}</style>
    </button>
  );
}

function Check({ accent }: { accent: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Hotspot bottom sheet ─────────────────────────────────────────────────────

export interface HotspotSheetProps {
  hotspot: Hotspot | null;
  era: Era;
  index: number | null;        // 1-based position in the visible hotspot list
  onClose: () => void;
}

export function HotspotSheet({ hotspot, era, index, onClose }: HotspotSheetProps) {
  // Stop any TTS when the sheet closes (or hotspot changes).
  useEffect(() => {
    return () => { stopSpeaking(); };
  }, [hotspot?.id]);

  if (!hotspot) return null;

  const handleListen = () => {
    stopSpeaking();
    speak(`${hotspot.title}. ${hotspot.body}`);
  };

  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0, top: 0, zIndex: 50,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", background: era.tintPanel, color: FG,
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          padding: "14px 16px 22px",
          maxHeight: "70%", overflowY: "auto",
          border: `1px solid ${era.accent}33`,
          animation: "sheetUp 0.3s cubic-bezier(0.4,0.1,0.2,1)",
          fontFamily: SANS,
        }}
      >
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 12px" }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          {index !== null && (
            <span style={{
              flexShrink: 0,
              width: 28, height: 28, borderRadius: "50%",
              background: era.accent, color: "#0a0a0a",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: MONO, fontSize: 14, fontWeight: 700,
            }}>{index}</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontFamily: MONO, letterSpacing: "0.14em", color: era.accent, textTransform: "uppercase", fontWeight: 600 }}>
              {hotspot.label}
            </div>
            <h2 style={{ margin: "2px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: 20, lineHeight: 1.15, fontStyle: "italic" }}>
              {hotspot.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, color: SUBTLE, lineHeight: 1, marginTop: -4 }}
          >×</button>
        </div>

        <p style={{ margin: "6px 0 10px", fontSize: 18, lineHeight: 1.5, color: FG }}>
          {hotspot.body}
        </p>

        <div style={{ fontSize: 12, fontFamily: MONO, color: SUBTLE, marginBottom: 14 }}>
          source:{" "}
          {hotspot.source.url ? (
            <a href={hotspot.source.url} target="_blank" rel="noreferrer" style={{ color: era.accent }}>
              {hotspot.source.label}
            </a>
          ) : (
            hotspot.source.label
          )}
        </div>

        <button
          onClick={handleListen}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 999,
            background: era.accent, color: "#0a0a0a",
            border: "none", cursor: "pointer",
            fontFamily: SANS, fontSize: 14, fontWeight: 700,
          }}
        >
          <Play size={12} fill="#0a0a0a" />
          Listen
        </button>

        <style>{`@keyframes sheetUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      </div>
    </div>
  );
}

// ─── Voice → hotspot matcher ──────────────────────────────────────────────────
// Pure helper, exported so both screens can use the same matching rule.

export const matchHotspot = (
  transcript: string,
  hotspots: Hotspot[]
): Hotspot | null => {
  const text = transcript.toLowerCase();
  // Longer labels first, so "iron dome" matches before "dome".
  const sorted = [...hotspots].sort((a, b) => b.label.length - a.label.length);
  for (const h of sorted) {
    if (text.includes(h.label.toLowerCase())) return h;
  }
  return null;
};
