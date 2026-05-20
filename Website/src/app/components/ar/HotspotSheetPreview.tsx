// Temporary preview page — simulates the AR sheet inside a phone frame.
// Delete this file after Stage 5 integration with PanoramaScene is done.

import { useState } from "react";
import { useNavigate } from "react-router";
import { HotspotSheet } from "./HotspotSheet";
import { ALL_AR_HOTSPOTS, type ARHotspot } from "./hotspots";
import { SANS, MONO } from "./shared";

const SAMPLE_IDS = [
  "ar-birth-first-stone",    // birth, text-only
  "ar-crown-madonnina",      // crown, audio
  "ar-modern-liberation",    // modern, youtube
  "ar-modern-guernica",      // modern, image
  "ar-modern-bombs",         // modern, youtube + before/after
  "ar-modern-bull-mosaic",   // modern, photo challenge
  "ar-modern-height-rule",   // modern, no photo challenge
];
const SAMPLES = SAMPLE_IDS
  .map((id) => ALL_AR_HOTSPOTS.find((h) => h.id === id))
  .filter((h): h is ARHotspot => h !== undefined);

export function HotspotSheetPreview() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<ARHotspot | null>(null);

  return (
    // Outer shell — dark studio background
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Phone frame */}
      <div style={{
        width: 390,
        height: 844,
        background: "#111827",
        borderRadius: 44,
        border: "2px solid rgba(255,255,255,0.10)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
        flexShrink: 0,
      }}>
        {/* Simulated AR background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 60% 40%, #1a2744 0%, #0d1117 70%)",
        }} />

        {/* Simulated hotspot dot */}
        <div style={{
          position: "absolute", top: "38%", left: "52%",
          width: 14, height: 14, borderRadius: "50%",
          background: "#E8A84A",
          boxShadow: "0 0 0 4px rgba(232,168,74,0.25), 0 0 16px rgba(232,168,74,0.4)",
        }} />

        {/* Hotspot list — shown when no sheet is open */}
        {!open && (
          <div style={{
            position: "absolute",
            bottom: 120, left: 0, right: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 7, padding: "0 20px",
          }}>
            <p style={{
              color: "rgba(255,255,255,0.35)", fontSize: 10,
              fontFamily: MONO, letterSpacing: "0.1em",
              textTransform: "uppercase", margin: "0 0 6px",
            }}>
              Tap a hotspot to preview
            </p>
            {SAMPLES.map((h) => (
              <button
                key={h.id}
                onClick={() => setOpen(h)}
                style={{
                  width: "100%", padding: "9px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#F4F2EC",
                  fontFamily: SANS, fontSize: 12,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{
                  fontSize: 9, fontFamily: MONO,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  minWidth: 90,
                }}>
                  {h.period} · {h.year}
                </span>
                {h.title}
              </button>
            ))}
          </div>
        )}

        {/* Sheet overlay */}
        {open && (
          <div style={{ position: "absolute", inset: 0 }}>
            <HotspotSheet
              hotspot={open}
              onClose={() => setOpen(null)}
              onPhotoChallenge={() => { setOpen(null); navigate("/treasure-hunt"); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
