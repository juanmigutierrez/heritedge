// Multi-photo timeline slider. Drags through 2–6 frames of the same view across
// different years, cross-fading between the two adjacent photos. Snaps to a notch
// on release within 10% of it. Tap a notch to jump.
//
// Used by Chapter 1 scene 1.5 (piazza across time). Task 2 will eventually own
// this component for Chapter 2 and 3 too; the API is intentionally minimal.

import { useEffect, useRef, useState, useCallback } from "react";

export interface TimelineFrame {
  year: string;
  image: string;
  caption: string;
}

interface TimelineSliderProps {
  frames: TimelineFrame[];
}

export function TimelineSlider({ frames }: TimelineSliderProps) {
  const [pos, setPos] = useState(0);            // continuous index in [0, frames.length-1]
  const [hasInteracted, setHasInteracted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Defensive clamps so the math below stays valid even with 0 or 1 frame.
  // The early returns at the bottom of this function handle the actual UI.
  const maxPos  = Math.max(1, frames.length - 1);
  const idx     = Math.max(0, Math.min(Math.floor(pos), Math.max(0, frames.length - 2)));
  const blend   = Math.max(0, Math.min(1, pos - idx));
  const nextIdx = Math.min(idx + 1, Math.max(0, frames.length - 1));
  const activeFrame = frames.length > 0
    ? (blend < 0.5 ? frames[idx] : frames[nextIdx])
    : undefined;

  const setFromClientX = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (clientX - rect.left) / rect.width;
    setPos(Math.max(0, Math.min(maxPos, ratio * maxPos)));
  }, [maxPos]);

  const snap = useCallback(() => {
    const nearest = Math.round(pos);
    if (Math.abs(pos - nearest) < 0.1) setPos(nearest);
  }, [pos]);

  // Preload every frame so cross-fade isn't janky on the first sweep.
  useEffect(() => {
    frames.forEach((f) => { const img = new Image(); img.src = f.image; });
  }, [frames]);

  // First-time hint: auto-sweep forward to the last notch, hold, return to start.
  // Spec: 0.5 s per step, end-to-end, then return.
  useEffect(() => {
    if (hasInteracted) return;
    const stepMs = 500;
    const forwardMs = stepMs * maxPos;
    const holdMs    = 500;
    const backMs    = stepMs * maxPos;
    const totalMs   = forwardMs + holdMs + backMs;
    const start = performance.now();
    let raf = 0;
    let canceled = false;

    const tick = (now: number) => {
      if (canceled) return;
      const elapsed = now - start;
      if (elapsed < forwardMs) {
        setPos((elapsed / forwardMs) * maxPos);
      } else if (elapsed < forwardMs + holdMs) {
        setPos(maxPos);
      } else if (elapsed < totalMs) {
        const t = (elapsed - forwardMs - holdMs) / backMs;
        setPos(maxPos * (1 - t));
      } else {
        setPos(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { canceled = true; cancelAnimationFrame(raf); };
  }, [hasInteracted, maxPos]);

  const onPointerDown = (clientX: number) => {
    dragging.current = true;
    setHasInteracted(true);
    setFromClientX(clientX);
  };
  const onPointerMove = (clientX: number) => {
    if (!dragging.current) return;
    setFromClientX(clientX);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    snap();
  };

  const handlePct = (pos / maxPos) * 100;

  // Empty frames — nothing to render.
  if (frames.length === 0 || !activeFrame) return null;

  // Single frame — render it statically, no slider needed.
  if (frames.length === 1) {
    return (
      <div>
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            aspectRatio: "16 / 10",
            background: "#0a0a0a",
          }}
        >
          <img
            src={activeFrame.image}
            alt={activeFrame.year}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div
          className="mt-5 rounded-2xl p-5"
          style={{
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <p className="text-base text-foreground leading-relaxed italic">
            {activeFrame.caption}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Image stack — two adjacent frames cross-faded by opacity */}
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "16 / 10",
          background: "#0a0a0a",
        }}
      >
        <img
          src={frames[idx].image}
          alt={frames[idx].year}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 1 - blend,
          }}
        />
        <img
          src={frames[nextIdx].image}
          alt={frames[nextIdx].year}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: blend,
          }}
        />
        {/* Year badge in the corner */}
        <div
          style={{
            position: "absolute", top: 10, left: 10,
            padding: "4px 10px", borderRadius: 999,
            background: "rgba(0,0,0,0.65)",
            color: "#fff", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          {activeFrame.year}
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => { e.preventDefault(); onPointerMove(e.touches[0].clientX); }}
        onTouchEnd={onPointerUp}
        style={{
          position: "relative",
          marginTop: 16,
          padding: "16px 0 4px",
          cursor: "ew-resize",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {/* Track rail */}
        <div
          style={{
            position: "relative",
            height: 3,
            borderRadius: 999,
            background: "color-mix(in srgb, var(--accent) 22%, transparent)",
          }}
        >
          {/* Filled segment */}
          <div
            style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: `${handlePct}%`,
              borderRadius: 999,
              background: "var(--accent)",
              transition: dragging.current ? "none" : "width 0.2s ease",
            }}
          />
        </div>

        {/* Notches */}
        {frames.map((f, i) => {
          const pct = (i / maxPos) * 100;
          const reached = pos >= i - 0.5;
          return (
            <button
              key={f.year}
              onClick={(e) => {
                e.stopPropagation();
                setHasInteracted(true);
                setPos(i);
              }}
              aria-label={`Jump to ${f.year}`}
              style={{
                position: "absolute",
                top: 10,
                left: `${pct}%`,
                transform: "translate(-50%, 0)",
                width: 18, height: 18,
                borderRadius: "50%",
                border: "2px solid var(--accent)",
                background: reached ? "var(--accent)" : "var(--background)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          );
        })}

        {/* Drag handle */}
        <div
          style={{
            position: "absolute",
            top: 5,
            left: `${handlePct}%`,
            transform: "translate(-50%, 0)",
            width: 28, height: 28,
            borderRadius: "50%",
            background: "#fff",
            border: "3px solid var(--accent)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            transition: dragging.current ? "none" : "left 0.2s ease",
          }}
        />

        {/* Year labels */}
        <div style={{ position: "relative", marginTop: 22, height: 16 }}>
          {frames.map((f, i) => {
            const pct = (i / maxPos) * 100;
            const isActive = Math.round(pos) === i;
            return (
              <span
                key={f.year}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  transform: "translate(-50%, 0)",
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--accent-strong)" : "var(--muted-foreground)",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s ease, font-weight 0.2s ease",
                }}
              >
                {f.year}
              </span>
            );
          })}
        </div>
      </div>

      {/* Caption box */}
      <div
        className="mt-5 rounded-2xl p-5"
        style={{
          background: "color-mix(in srgb, var(--accent) 8%, transparent)",
          borderLeft: "3px solid var(--accent)",
          minHeight: "4.5em",
        }}
      >
        <p className="text-base text-foreground leading-relaxed italic">
          {activeFrame.caption}
        </p>
      </div>
    </div>
  );
}
