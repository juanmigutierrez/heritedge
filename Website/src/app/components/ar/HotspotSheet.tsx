// AR hotspot bottom sheet — slides up when the user taps a gold dot.
// Owner: Task 3 (content + UI). Task 4 positions the dots and calls this sheet.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { X, Volume2, VolumeOff, ArrowRight, Camera, Play, Pause } from "lucide-react";
import { type ARHotspot, type ARMedia, type ARBeforeAfter, AR_PERIODS, type ARPeriodId } from "./hotspots";
import { speak, stopSpeaking } from "@/services/chatService";
import { SANS, SERIF, MONO, FG, SUBTLE } from "./shared";

// ─── Period badge ─────────────────────────────────────────────────────────────

function PeriodBadge({ periodId }: { periodId: ARPeriodId }) {
  const period = AR_PERIODS[periodId];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      background: period.accent + "22", color: period.accent,
      fontSize: 12, fontFamily: MONO, letterSpacing: "0.12em", fontWeight: 600,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: period.accent, flexShrink: 0 }} />
      {period.label} · {period.years}
    </span>
  );
}

// ─── YouTube block ────────────────────────────────────────────────────────────

function YouTubeBlock({ media }: { media: ARMedia }) {
  const [muted, setMuted] = useState(true);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 10, overflow: "hidden", background: "#000" }}>
        <iframe
          key={muted ? "m" : "u"}
          src={`https://www.youtube.com/embed/${media.src}?autoplay=0&mute=${muted ? 1 : 0}&rel=0&modestbranding=1`}
          title={media.caption ?? "Video"}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {muted && (
          <button
            onClick={() => setMuted(false)}
            style={{
              position: "absolute", bottom: 8, right: 8,
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(0,0,0,0.75)", border: "none",
              color: "#fff", fontSize: 12, fontFamily: SANS,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            🔊 Tap to unmute
          </button>
        )}
      </div>
      {(media.caption || media.source) && <MediaCredit media={media} />}
    </div>
  );
}

// ─── Image block ──────────────────────────────────────────────────────────────
// Full-width image shown above the body text. Used for image-type hotspots so
// the picture is large enough to read clearly; the small left source card
// stays for attribution.

function ImageBlock({ media }: { media: ARMedia }) {
  const [slide, setSlide] = useState(0);

  // Slideshow mode: array of images with prev/next navigation.
  if (media.srcs && media.srcs.length > 1) {
    const srcs = media.srcs;
    const total = srcs.length;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#0a0a0a" }}>
          <img
            src={srcs[slide]}
            alt={media.altText ?? ""}
            style={{ width: "100%", maxHeight: 260, display: "block", objectFit: media.objectFit ?? "cover", objectPosition: media.objectPosition ?? "center 15%" }}
          />
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => setSlide(i => (i - 1 + total) % total)}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >‹</button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => setSlide(i => (i + 1) % total)}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >›</button>
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
            {srcs.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === slide ? "true" : undefined}
                onClick={() => setSlide(i)}
                style={{ width: 6, height: 6, borderRadius: "50%", background: i === slide ? "#fff" : "rgba(255,255,255,0.35)", cursor: "pointer", border: "none", padding: 0 }}
              />
            ))}
          </div>
        </div>
        {(media.caption || media.source) && <MediaCredit media={media} />}
      </div>
    );
  }

  // Diptych mode: when a second image is provided, show both side-by-side
  // so the viewer can compare two angles of the same moment.
  if (media.src2) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {([media.src, media.src2] as string[]).map((src, i) => {
            const caption = i === 0 ? media.caption : media.caption2;
            return (
              <div key={i}>
                <div style={{ borderRadius: 10, overflow: "hidden", background: "#0a0a0a", aspectRatio: "4/3" }}>
                  <img
                    src={src}
                    alt={(i === 0 ? media.altText : media.altText2) ?? ""}
                    style={{
                      width: "100%", height: "100%", display: "block",
                      objectFit: "cover", objectPosition: i === 0 ? (media.objectPosition ?? "center 30%") : (media.objectPosition2 ?? "center 30%"),
                    }}
                  />
                </div>
                {caption && (
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: MONO, marginTop: 4, lineHeight: 1.3 }}>
                    {caption}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {media.source && <MediaCredit media={{ ...media, caption: undefined }} />}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#0a0a0a" }}>
        <img
          src={media.src}
          alt={media.altText ?? ""}
          style={{
            width: "100%", height: "auto", display: "block",
            // Cap at 260 to keep the sheet from getting too tall.
            // Anchor the crop to the top so portraits keep the subject's head
            // visible (e.g. Mengoni). No effect on landscape-ratio images.
            maxHeight: 260, objectFit: media.objectFit ?? "cover", objectPosition: media.objectPosition ?? "center 15%",
          }}
        />
      </div>
      {(media.caption || media.source) && <MediaCredit media={media} />}
    </div>
  );
}

// Caption + optional image-source credit. Kept in one component so YouTube,
// Audio, and Image blocks render attribution the same way.
function MediaCredit({ media }: { media: ARMedia }) {
  const label = media.type === "audio" ? "Audio" : media.type === "youtube" ? "Video" : "Image";
  return (
    <div style={{ margin: "5px 0 0" }}>
      {media.caption && (
        <p style={{ margin: 0, fontSize: 12, fontFamily: MONO, color: SUBTLE }}>{media.caption}</p>
      )}
      {media.source && (
        media.sourceUrl ? (
          <a
            href={media.sourceUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 10, fontFamily: MONO, color: SUBTLE, opacity: 0.75,
              marginTop: 3, display: "inline-block", textDecoration: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            ↗ {label}: {media.source}
          </a>
        ) : (
          <span style={{
            fontSize: 10, fontFamily: MONO, color: SUBTLE, opacity: 0.75,
            marginTop: 3, display: "block",
          }}>
            {label}: {media.source}
          </span>
        )
      )}
    </div>
  );
}

// ─── Audio block ──────────────────────────────────────────────────────────────

function AudioBlock({ media, accent }: { media: ARMedia; accent: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    el.addEventListener("ended", onEnd);
    return () => { el.pause(); el.removeEventListener("ended", onEnd); };
  }, []);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", height: 140, background: "#111" }}>
        {media.staticImage && (
          <img
            src={media.staticImage}
            alt={media.altText ?? ""}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: media.objectFit ?? "cover", objectPosition: media.objectPosition ?? "center center", opacity: 0.45 }}
          />
        )}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {playing && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 24 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  width: 3, borderRadius: 2, background: accent,
                  animation: `audioWave 0.${5 + i}s ease-in-out ${i * 0.08}s infinite alternate`,
                }} />
              ))}
            </div>
          )}
          <button
            onClick={toggle}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: accent, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1a1612",
            }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
        <audio ref={audioRef} src={media.src} loop={media.looped ?? false} />
      </div>
      {(media.caption || media.source) && <MediaCredit media={media} />}
      <style>{`
        @keyframes audioWave {
          from { height: 4px; }
          to   { height: 20px; }
        }
      `}</style>
    </div>
  );
}

// ─── Before/After slider ──────────────────────────────────────────────────────

function BeforeAfterSlider({ data }: { data: ARBeforeAfter }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getPos = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        ref={containerRef}
        style={{
          position: "relative", borderRadius: 10, overflow: "hidden",
          height: 160, cursor: "ew-resize", userSelect: "none", touchAction: "none",
        }}
        onMouseDown={(e) => { dragging.current = true; setPos(getPos(e.clientX)); }}
        onMouseMove={(e) => { if (dragging.current) setPos(getPos(e.clientX)); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchStart={(e) => setPos(getPos(e.touches[0].clientX))}
        onTouchMove={(e) => { e.preventDefault(); setPos(getPos(e.touches[0].clientX)); }}
      >
        <img src={data.after} alt={data.afterLabel} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
        }} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={data.before} alt={data.beforeLabel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${pos}%`, transform: "translateX(-50%)",
          width: 2, background: "rgba(255,255,255,0.85)", pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 26, height: 26, borderRadius: "50%",
            background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#444",
          }}>⇔</div>
        </div>
        <div style={{
          position: "absolute", bottom: 6, left: 6, fontSize: 12, fontFamily: MONO, color: "#fff",
          background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 4,
        }}>{data.beforeLabel}</div>
        <div style={{
          position: "absolute", bottom: 6, right: 6, fontSize: 12, fontFamily: MONO, color: "#fff",
          background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 4,
        }}>{data.afterLabel}</div>
      </div>
      {data.caption && (
        <p style={{ margin: "5px 0 0", fontSize: 12, fontFamily: MONO, color: SUBTLE }}>{data.caption}</p>
      )}
      {data.source && (
        <p style={{ margin: "3px 0 0", fontSize: 11, fontFamily: MONO, color: SUBTLE }}>
          {data.sourceUrl
            ? <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: SUBTLE }}>↗ Image: {data.source}</a>
            : <>↗ Image: {data.source}</>}
        </p>
      )}
    </div>
  );
}

// ─── Left card ────────────────────────────────────────────────────────────────
// Image thumbnail for image-type hotspots; source reference card for all others.

function LeftCard({ hotspot, accent }: { hotspot: ARHotspot; accent: string }) {
  // Image-type hotspots now render the picture full-width above the body
  // (see ImageBlock). The small left card always shows the source attribution.
  const base: React.CSSProperties = {
    flexShrink: 0, width: 118, height: 112,
    borderRadius: 10, overflow: "hidden",
  };

  return (
    <div style={{
      ...base,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column",
      justifyContent: "flex-end", padding: "8px 9px",
    }}>
      <div style={{ fontSize: 10, fontFamily: MONO, color: accent, letterSpacing: "0.1em", marginBottom: 3 }}>
        SOURCE
      </div>
      <div style={{ fontSize: 12, fontFamily: MONO, color: SUBTLE, lineHeight: 1.45 }}>
        {hotspot.source}
      </div>
      {hotspot.sourceUrl && (
        <a
          href={hotspot.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 10, color: accent, fontFamily: MONO, marginTop: 5, display: "block" }}
          onClick={(e) => e.stopPropagation()}
        >
          ↗ view
        </a>
      )}
    </div>
  );
}

// ─── HotspotSheet ─────────────────────────────────────────────────────────────

export interface HotspotSheetProps {
  hotspot: ARHotspot | null;
  onClose: () => void;
  /** Task 4 wires this to the camera photo-challenge flow. */
  onPhotoChallenge?: () => void;
}

export function HotspotSheet({ hotspot, onClose, onPhotoChallenge }: HotspotSheetProps) {
  const navigate = useNavigate();
  const period = hotspot ? AR_PERIODS[hotspot.period] : null;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { stopSpeaking(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setShowDetail(false);
    return () => { stopSpeaking(); setIsSpeaking(false); };
  }, [hotspot?.id]);

  // Sync with global luca-speech bus so the pill Stop also updates this button.
  useEffect(() => {
    const handle = (e: Event) => {
      const { type } = (e as CustomEvent<{ type: string }>).detail;
      if (type === "end") setIsSpeaking(false);
    };
    window.addEventListener("luca-speech", handle);
    return () => window.removeEventListener("luca-speech", handle);
  }, []);

  const handleHearIt = () => {
    if (isSpeaking) {
      stopSpeaking(); setIsSpeaking(false);
    } else if (hotspot) {
      setIsSpeaking(true);
      speak(`${hotspot.title}. ${hotspot.body}`, () => setIsSpeaking(false));
    }
  };

  const handleTellMeMore = () => {
    if (!hotspot) return;
    if (hotspot.detail && !showDetail) {
      setShowDetail(true);
    } else {
      stopSpeaking();
      navigate(`/quick-guide?ask=${encodeURIComponent(hotspot.chatQuestion)}`);
    }
  };

  if (!hotspot || !period) return null;

  const isFullWidthMedia =
    hotspot.media?.type === "youtube" ||
    hotspot.media?.type === "audio" ||
    hotspot.media?.type === "image";
  const pts = hotspot.photoChallenge?.points;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.40)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: period.tintPanel,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: "12px 16px 28px",
          maxHeight: "72vh", overflowY: "auto",
          borderTop: `1px solid ${period.accent}33`,
          animation: "sheetUp 0.3s cubic-bezier(0.4,0.1,0.2,1)",
          fontFamily: SANS,
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 2, margin: "0 auto 14px",
        }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PeriodBadge periodId={hotspot.period} />
            {hotspot.eyebrow && (
              <div style={{ fontSize: 12, fontFamily: MONO, color: SUBTLE, marginTop: 6, letterSpacing: "0.08em" }}>
                {hotspot.eyebrow}
              </div>
            )}
            <h2 style={{
              margin: "3px 0 0",
              fontFamily: SERIF, fontWeight: 400,
              fontSize: 28, lineHeight: 1.2,
              fontStyle: "italic", color: FG,
            }}>
              {hotspot.title}.
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: SUBTLE, marginTop: 2,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Full-width media: YouTube, Audio, or Image (remounts on hotspot change) */}
        {isFullWidthMedia && (
          <div key={hotspot.id}>
            {hotspot.media!.type === "youtube" && <YouTubeBlock media={hotspot.media!} />}
            {hotspot.media!.type === "audio"   && <AudioBlock  media={hotspot.media!} accent={period.accent} />}
            {hotspot.media!.type === "image"   && <ImageBlock  media={hotspot.media!} />}
          </div>
        )}

        {/* Before/After slider */}
        {hotspot.beforeAfter && <BeforeAfterSlider data={hotspot.beforeAfter} />}

        {/* Two-column: [image thumbnail / source card] + [body text] */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <LeftCard hotspot={hotspot} accent={period.accent} />
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: FG, flex: 1 }}>
            {hotspot.body}
          </p>
        </div>

        {/* Detail expansion */}
        {showDetail && hotspot.detail && (
          <p style={{
            margin: "0 0 12px",
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            borderLeft: `2px solid ${period.accent}55`,
            fontSize: 14, lineHeight: 1.7,
            color: "rgba(244,242,236,0.80)",
            animation: "detailFade 0.25s ease",
          }}>
            {hotspot.detail}
          </p>
        )}

        {/* ── Action buttons — horizontal row ── */}
        <div style={{ display: "flex", gap: 8 }}>

          {/* Hear it */}
          <button
            onClick={handleHearIt}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 0", borderRadius: 12,
              background: isSpeaking ? period.accent + "22" : "rgba(255,255,255,0.07)",
              border: `1px solid ${isSpeaking ? period.accent + "66" : "rgba(255,255,255,0.10)"}`,
              color: isSpeaking ? period.accent : FG,
              fontFamily: SANS, fontSize: 14, fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {isSpeaking ? <VolumeOff size={13} /> : <Volume2 size={13} />}
            {isSpeaking ? "Stop" : "Hear it"}
          </button>

          {/* Tell me more / Open chat */}
          <button
            onClick={handleTellMeMore}
            style={{
              flex: 1.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 0", borderRadius: 12,
              background: period.accent, border: "none",
              color: "#1a1612",
              fontFamily: SANS, fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showDetail ? "Open chat" : "Tell me more"}
            <ArrowRight size={12} />
          </button>

          {/* Photo challenge */}
          {hotspot.photoChallenge && onPhotoChallenge && (
            <button
              onClick={onPhotoChallenge}
              aria-label={`Photo challenge${pts ? `, +${pts} points` : ""}`}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "10px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: FG,
                fontFamily: SANS, fontSize: 14, fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Camera size={13} />
              {pts && <span style={{ fontSize: 12, color: period.accent, fontWeight: 600 }}>+{pts}</span>}
            </button>
          )}
        </div>

        <style>{`
          @keyframes sheetUp {
            from { transform: translateY(24px); opacity: 0; }
            to   { transform: none; opacity: 1; }
          }
          @keyframes detailFade {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: none; }
          }
        `}</style>
      </div>
    </div>
  );
}
