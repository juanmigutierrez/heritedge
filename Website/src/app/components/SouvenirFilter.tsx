import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Camera, Loader2, RotateCcw, Share2, X } from "lucide-react";
import { useHuntState } from "./HuntStateProvider";

// ─────────────────────────────────────────────────────────────────────────────
// SouvenirFilter — the souvenir captured after the treasure hunt.
// The visitor takes a front-camera "portrait" and a Milan-themed filter is
// composited over it (the Madonnina's halo, the Duomo spires, a Renaissance
// frame, a Flâneur's hat). The result is drawn on a <canvas> so it can be
// captured, shared or downloaded as a keepsake.
//
// Overlays are placed at a fixed head position (with an on-screen guide)
// rather than face-tracked — reliable across mobile browsers.
// ─────────────────────────────────────────────────────────────────────────────

interface SouvenirFilterProps {
  /** Optional close handler. When omitted (mounted as the /souvenir route) it returns to the summary. */
  onClose?: () => void;
  /** Small footer line, e.g. a trip summary. */
  caption?: string;
}

type FilterId = "madonnina" | "spires" | "renaissance" | "flaneur";

interface FilterDef {
  id: FilterId;
  label: string;
  tagline: string;
  /** CSS filter applied to the photo itself. */
  photoFilter: string;
}

const FILTERS: FilterDef[] = [
  {
    id: "madonnina",
    label: "Madonnina",
    tagline: "A golden halo, like the statue that crowns the Duomo.",
    photoFilter: "brightness(1.06) saturate(1.12)",
  },
  {
    id: "spires",
    label: "Spires",
    tagline: "Wear the cathedral's marble pinnacles as a crown.",
    photoFilter: "contrast(1.08) saturate(1.05)",
  },
  {
    id: "renaissance",
    label: "Renaissance",
    tagline: "An old-master portrait in a gilded arch.",
    photoFilter: "sepia(0.5) contrast(1.06) brightness(1.02)",
  },
  {
    id: "flaneur",
    label: "Flâneur",
    tagline: "A black-and-white stroll through the Galleria.",
    photoFilter: "grayscale(0.9) contrast(1.12)",
  },
];

const CW = 768;
const CH = 1024;
const GOLD = "#E5B948";

// ── Canvas overlay art ───────────────────────────────────────────────────────

function drawHalo(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.shadowColor = "rgba(229,185,72,0.75)";
  ctx.shadowBlur = 34;
  ctx.lineWidth = 17;
  ctx.beginPath();
  ctx.ellipse(CW / 2, 252, 156, 54, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSpires(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  const baseY = 196;
  const cols = [
    { x: 150, h: 86 },
    { x: 268, h: 138 },
    { x: 384, h: 188 },
    { x: 500, h: 138 },
    { x: 618, h: 86 },
  ];
  for (const c of cols) {
    ctx.beginPath();
    ctx.moveTo(c.x - 34, baseY);
    ctx.lineTo(c.x + 34, baseY);
    ctx.lineTo(c.x, baseY - c.h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawArch(ctx: CanvasRenderingContext2D) {
  ctx.save();
  // Gilded portrait frame
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 24;
  ctx.strokeRect(30, 30, CW - 60, CH - 60);
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, CW - 120, CH - 120);
  // Arched top crowning the head
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(CW / 2, 392, 214, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

function drawHat(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const cx = CW / 2;
  // Brim
  ctx.fillStyle = "#1f1b18";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.ellipse(cx, 318, 214, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Crown
  ctx.beginPath();
  ctx.moveTo(cx - 116, 320);
  ctx.lineTo(cx - 98, 196);
  ctx.quadraticCurveTo(cx, 168, cx + 98, 196);
  ctx.lineTo(cx + 116, 320);
  ctx.closePath();
  ctx.fill();
  // Gold band
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx - 110, 300);
  ctx.lineTo(cx + 110, 300);
  ctx.lineTo(cx + 104, 268);
  ctx.lineTo(cx - 104, 268);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, label: string) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, CH - 220, 0, CH);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, CH - 220, CW, 220);

  ctx.fillStyle = GOLD;
  ctx.fillRect(56, CH - 132, 54, 5);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 46px Georgia, 'Times New Roman', serif";
  ctx.fillText(`The ${label}`, 56, CH - 78);

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("MILANO · PIAZZA DEL DUOMO · 2026", 56, CH - 44);
  ctx.restore();
}

function drawFilterArt(ctx: CanvasRenderingContext2D, id: FilterId) {
  if (id === "madonnina") drawHalo(ctx);
  else if (id === "spires") drawSpires(ctx);
  else if (id === "renaissance") drawArch(ctx);
  else if (id === "flaneur") drawHat(ctx);
}

// ── Filter chip icons ────────────────────────────────────────────────────────

function FilterIcon({ id }: { id: FilterId }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (id === "madonnina") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
        <ellipse cx="12" cy="8" rx="8" ry="3.4" {...s} />
        <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (id === "spires") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
        <path d="M3 19 L7 9 L11 19 Z M9 19 L12 4 L15 19 Z M13 19 L17 9 L21 19 Z"
          fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (id === "renaissance") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
        <path d="M5 21 V11 a7 7 0 0 1 14 0 V21" {...s} />
        <rect x="3" y="20" width="18" height="2.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <ellipse cx="12" cy="16" rx="9" ry="2.6" fill="currentColor" stroke="none" />
      <path d="M7 16 L8.5 7 a3.5 3 0 0 1 7 0 L17 16 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SouvenirFilter({ onClose, caption }: SouvenirFilterProps) {
  const navigate = useNavigate();
  const { setSouvenirImage } = useHuntState();
  const close = onClose ?? (() => navigate("/summary"));

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [status, setStatus] = useState<"loading" | "live" | "denied">("loading");
  const [filterId, setFilterId] = useState<FilterId>("madonnina");
  const [captured, setCaptured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  const active = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];

  // Start the front camera.
  useEffect(() => {
    let cancelled = false;
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md?.getUserMedia) {
      setStatus("denied");
      return;
    }
    md.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch(() => undefined);
        }
        setStatus("live");
      })
      .catch(() => setStatus("denied"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState < 2) return;

    ctx.clearRect(0, 0, CW, CH);

    // Cover-fit the video frame, mirrored like a selfie.
    const vr = video.videoWidth / video.videoHeight;
    const cr = CW / CH;
    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    if (vr > cr) {
      sw = video.videoHeight * cr;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / cr;
      sy = (video.videoHeight - sh) / 2;
    }
    ctx.save();
    ctx.translate(CW, 0);
    ctx.scale(-1, 1);
    ctx.filter = active.photoFilter;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CW, CH);
    ctx.restore();
    ctx.filter = "none";

    drawFilterArt(ctx, filterId);
    drawCaption(ctx, active.label);
  }, [active, filterId]);

  // Live preview loop — runs until a shot is captured.
  useEffect(() => {
    if (status !== "live" || captured) return;
    const loop = () => {
      renderFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, captured, renderFrame]);

  function handleShutter() {
    renderFrame();
    cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (canvas) setSouvenirImage(canvas.toDataURL("image/png"));
    setShared(false);
    setCaptured(true);
  }

  function handleRetake() {
    setCaptured(false);
    setShared(false);
  }

  function withBlob(run: (blob: Blob) => void) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    canvas.toBlob((blob) => {
      if (blob) run(blob);
      setBusy(false);
    }, "image/png");
  }

  function handleDownload() {
    withBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "milan-souvenir.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShared(true);
    });
  }

  function handleShare() {
    withBlob(async (blob) => {
      const file = new File([blob], "milan-souvenir.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data?: unknown) => boolean;
      };
      try {
        if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: "My Milan souvenir" });
          setShared(true);
          return;
        }
      } catch {
        return; // share sheet dismissed
      }
      handleDownload();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#14110F", color: "#EDE6DA" }}
    >
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-5 max-w-md mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="text-center relative">
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-0 top-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "rgba(237,230,218,0.1)" }}
          >
            <X className="w-4 h-4" />
          </button>
          <p
            className="text-xs tracking-[0.22em] uppercase font-medium"
            style={{ color: GOLD }}
          >
            Your Milan souvenir
          </p>
          <h1
            className="mt-1 text-3xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Take a portrait.
          </h1>
        </div>

        {/* Camera / souvenir preview */}
        <div className="mt-5 relative">
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className="w-full rounded-3xl border"
            style={{ borderColor: "rgba(237,230,218,0.14)", aspectRatio: `${CW} / ${CH}` }}
          />
          <video ref={videoRef} playsInline muted className="hidden" />

          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl"
              style={{ background: "#1F1B19" }}>
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: GOLD }} />
              <span className="text-xs" style={{ color: "rgba(237,230,218,0.6)" }}>
                Starting camera…
              </span>
            </div>
          )}
          {status === "denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl px-8 text-center"
              style={{ background: "#1F1B19" }}>
              <Camera className="w-8 h-8" style={{ color: "rgba(237,230,218,0.5)" }} />
              <p className="text-sm" style={{ color: "rgba(237,230,218,0.8)" }}>
                The camera isn't available. Allow camera access (and use https or
                localhost) to take your souvenir.
              </p>
            </div>
          )}
          {status === "live" && !captured && (
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-dashed pointer-events-none"
              style={{
                top: "26%",
                width: "46%",
                aspectRatio: "1 / 1.2",
                borderColor: "rgba(237,230,218,0.35)",
              }}
            />
          )}
        </div>

        {/* Filter picker */}
        <div className="mt-5">
          <p className="text-xs tracking-[0.16em] uppercase mb-2"
            style={{ color: "rgba(237,230,218,0.55)" }}>
            Choose your filter
          </p>
          <div className="grid grid-cols-4 gap-2">
            {FILTERS.map((f) => {
              const on = f.id === filterId;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterId(f.id)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 transition-all active:scale-95"
                  style={{
                    background: on ? "rgba(229,185,72,0.16)" : "rgba(237,230,218,0.06)",
                    borderColor: on ? GOLD : "rgba(237,230,218,0.12)",
                    color: on ? GOLD : "rgba(237,230,218,0.7)",
                  }}
                >
                  <FilterIcon id={f.id} />
                  <span className="text-[11px] leading-tight">{f.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs" style={{ color: "rgba(237,230,218,0.5)" }}>
            {active.tagline}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={close}
            className="px-5 py-2.5 rounded-full text-sm active:scale-95 transition-transform"
            style={{ background: "rgba(237,230,218,0.1)", color: "#EDE6DA" }}
          >
            Skip
          </button>

          <button
            onClick={captured ? handleRetake : handleShutter}
            disabled={status !== "live" || busy}
            aria-label={captured ? "Retake" : "Take photo"}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            style={{
              background: captured ? "rgba(237,230,218,0.12)" : GOLD,
              border: captured ? "2px solid rgba(237,230,218,0.3)" : "4px solid #14110F",
              boxShadow: captured ? "none" : "0 0 0 3px rgba(229,185,72,0.45)",
            }}
          >
            {captured ? (
              <RotateCcw className="w-6 h-6" style={{ color: "#EDE6DA" }} />
            ) : (
              <Camera className="w-7 h-7" style={{ color: "#14110F" }} />
            )}
          </button>

          <button
            onClick={handleShare}
            disabled={!captured || busy}
            className="px-5 py-2.5 rounded-full text-sm flex items-center gap-2 disabled:opacity-35 active:scale-95 transition-transform"
            style={{ background: captured ? GOLD : "rgba(237,230,218,0.1)", color: captured ? "#14110F" : "#EDE6DA" }}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {shared ? "Saved!" : "Share"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "rgba(237,230,218,0.45)" }}>
          {caption ?? "Heritage Treasure Hunt · Piazza del Duomo"}
        </p>
      </div>
    </motion.div>
  );
}
