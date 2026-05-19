import { useMemo, useState } from "react";

export interface TimelineFrame {
  year: string;
  yearShort?: string;
  image: string;
  caption: string;
}

interface TimelineSliderProps {
  frames: TimelineFrame[];
  startIndex?: number;
  className?: string;
  onChangeIndex?: (index: number) => void;
}

export function TimelineSlider({
  frames,
  startIndex = 0,
  className,
  onChangeIndex,
}: TimelineSliderProps) {
  const maxIndex = Math.max(frames.length - 1, 0);
  const [position, setPosition] = useState(Math.min(Math.max(startIndex, 0), maxIndex));

  const { lowerIndex, upperIndex, blend } = useMemo(() => {
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    const clampedLower = Math.max(0, Math.min(lower, maxIndex));
    const clampedUpper = Math.max(0, Math.min(upper, maxIndex));
    return {
      lowerIndex: clampedLower,
      upperIndex: clampedUpper,
      blend: clampedUpper === clampedLower ? 0 : position - clampedLower,
    };
  }, [position, maxIndex]);

  const activeIndex = Math.abs(position - lowerIndex) < 0.5 ? lowerIndex : upperIndex;
  const activeFrame = frames[activeIndex];

  const updatePosition = (next: number) => {
    const clamped = Math.max(0, Math.min(next, maxIndex));
    setPosition(clamped);
    const maybeIndex = Math.round(clamped);
    if (Math.abs(clamped - maybeIndex) < 0.05) {
      onChangeIndex?.(maybeIndex);
    }
  };

  const snapIfClose = () => {
    const nearest = Math.round(position);
    if (Math.abs(position - nearest) <= 0.1) {
      setPosition(nearest);
      onChangeIndex?.(nearest);
    }
  };

  if (frames.length === 0) return null;

  return (
    <div className={`w-full ${className ?? ""}`}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <img
            src={frames[lowerIndex].image}
            alt={frames[lowerIndex].year}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ opacity: 1 - blend }}
          />
          {upperIndex !== lowerIndex && (
            <img
              src={frames[upperIndex].image}
              alt={frames[upperIndex].year}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: blend }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.35) 100%)",
            }}
            aria-hidden
          />
        </div>

        <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Year</span>
            <span>{activeFrame.year}</span>
          </div>
          <div className="mt-2">
            <input
              type="range"
              min={0}
              max={maxIndex}
              step={0.01}
              value={position}
              onChange={(e) => updatePosition(Number(e.target.value))}
              onMouseUp={snapIfClose}
              onTouchEnd={snapIfClose}
              className="w-full"
              aria-label="Timeline slider"
              style={{ accentColor: "var(--accent)" }}
            />
            <div className="mt-2 flex items-center justify-between">
              {frames.map((frame, i) => (
                <button
                  key={`${frame.year}-${i}`}
                  onClick={() => updatePosition(i)}
                  className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  aria-label={`Jump to ${frame.year}`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background:
                        i === activeIndex
                          ? "var(--accent)"
                          : "color-mix(in srgb, var(--accent) 25%, transparent)",
                    }}
                  />
                  <span>{frame.yearShort ?? frame.year}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeFrame?.caption && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {activeFrame.caption}
        </p>
      )}
    </div>
  );
}
