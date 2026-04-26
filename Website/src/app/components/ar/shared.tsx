// Shared AR primitives used by both AROverview and ARArtifactDetail.
// Owner: P3.
//
// The intent is "organic equality": both views render the same atoms with
// the same props, so a tweak to (say) the era scrubber instantly applies
// to both screens. Don't fork these — extend the props instead.

import { useEffect, useRef, useState } from "react";
import { Mic, Play } from "lucide-react";
import {
  ERAS,
  type Era,
  type EraId,
  type Hotspot,
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

// ─── Era badge (pill shown in the top bar) ────────────────────────────────────

export function EraBadge({ era }: { era: Era }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 999,
      background: era.accent + "22", color: era.accent,
      fontSize: 10, fontFamily: MONO, letterSpacing: "0.14em",
      textTransform: "uppercase", fontWeight: 600,
      transition: "all 0.4s",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: era.accent }} />
      {era.label} · {era.year}
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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: SUBTLE, marginBottom: 10, fontWeight: 500, fontFamily: MONO }}>
        <span>Drag through time</span>
        <span style={{ color: accent, fontWeight: 600 }}>
          {ERAS[idx].label} · {ERAS[idx].year}
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
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, fontFamily: MONO }}>
        {ERAS.map((e, i) => (
          <span key={e.id} style={{
            color: i === idx ? accent : SUBTLE,
            fontWeight: i === idx ? 600 : 400,
            letterSpacing: "0.06em", textAlign: "center",
            transition: "color 0.2s",
          }}>
            {e.label}
            <br />
            <span style={{ fontSize: 9, opacity: 0.7 }}>{e.year}</span>
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
      flex: 1, height: 46,
      background: listening ? `${era.accent}18` : "rgba(255,255,255,0.05)",
      border: `1px solid ${listening ? era.accent : "rgba(255,255,255,0.1)"}`,
      borderRadius: 23, padding: "0 14px 0 5px",
      display: "flex", alignItems: "center", gap: 10,
      transition: "all 0.2s",
    }}>
      <MicButton
        listening={listening}
        onToggle={() => (listening ? stopListening() : startListening())}
        bg={listening ? era.accent : FG}
        color={listening ? "#0a0a0a" : era.tintBg}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {listening ? (
          <div style={{ fontSize: 13, fontFamily: SERIF, fontStyle: "italic", color: era.accent }}>
            listening…
          </div>
        ) : (
          <div style={{ fontSize: 11, color: SUBTLE, fontFamily: MONO, letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isSupported ? hint : "voice not supported"}
          </div>
        )}
      </div>
      <VoiceWave active={listening} color={era.accent} />
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
        fontSize: 10, fontWeight: 700, color: "#0a0a0a", fontFamily: MONO,
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
              fontFamily: MONO, fontSize: 12, fontWeight: 700,
            }}>{index}</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontFamily: MONO, letterSpacing: "0.14em", color: era.accent, textTransform: "uppercase", fontWeight: 600 }}>
              {hotspot.label}
            </div>
            <h2 style={{ margin: "2px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: 20, lineHeight: 1.15, fontStyle: "italic" }}>
              {hotspot.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: SUBTLE, lineHeight: 1, marginTop: -4 }}
          >×</button>
        </div>

        <p style={{ margin: "6px 0 10px", fontSize: 14, lineHeight: 1.5, color: FG }}>
          {hotspot.body}
        </p>

        <div style={{ fontSize: 10, fontFamily: MONO, color: SUBTLE, marginBottom: 14 }}>
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
            fontFamily: SANS, fontSize: 12, fontWeight: 700,
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
