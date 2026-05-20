import type { EraId } from "@/content/landmarks";

// ─── Canvas colour-matrix helpers ────────────────────────────────────────────

function applySepia(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const d = ctx.getImageData(0, 0, w, h);
  const data = d.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i]     = Math.min(255, r * (1 - amount) + (r * 0.393 + g * 0.769 + b * 0.189) * amount);
    data[i + 1] = Math.min(255, g * (1 - amount) + (r * 0.349 + g * 0.686 + b * 0.168) * amount);
    data[i + 2] = Math.min(255, b * (1 - amount) + (r * 0.272 + g * 0.534 + b * 0.131) * amount);
  }
  ctx.putImageData(d, 0, 0);
}

function applyGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const d = ctx.getImageData(0, 0, w, h);
  const data = d.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const grey = r * 0.2126 + g * 0.7152 + b * 0.0722;
    data[i]     = r * (1 - amount) + grey * amount;
    data[i + 1] = g * (1 - amount) + grey * amount;
    data[i + 2] = b * (1 - amount) + grey * amount;
  }
  ctx.putImageData(d, 0, 0);
}

function applyBrightnessContrast(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  brightness: number, contrast: number, saturation: number,
) {
  const d = ctx.getImageData(0, 0, w, h);
  const data = d.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    r *= brightness; g *= brightness; b *= brightness;
    r = (r - 0.5) * contrast + 0.5;
    g = (g - 0.5) * contrast + 0.5;
    b = (b - 0.5) * contrast + 0.5;
    const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;
    data[i]     = Math.max(0, Math.min(255, r * 255));
    data[i + 1] = Math.max(0, Math.min(255, g * 255));
    data[i + 2] = Math.max(0, Math.min(255, b * 255));
  }
  ctx.putImageData(d, 0, 0);
}

const ERA_FILTER_PARAMS: Record<EraId, {
  sepia: number; grayscale: number;
  brightness: number; contrast: number; saturation: number;
}> = {
  medieval: { sepia: 0.55, grayscale: 0,    brightness: 0.92, contrast: 1.05, saturation: 0.85 },
  postwar:  { sepia: 0.15, grayscale: 0.70, brightness: 0.95, contrast: 1.08, saturation: 1    },
  present:  { sepia: 0,    grayscale: 0,    brightness: 1.02, contrast: 1,    saturation: 1.05 },
};

// ─── Decorative frame ─────────────────────────────────────────────────────────

export interface SnapshotLandmark {
  emoji: string;
  shortName: string;
  /** Normalised screen position 0–1 from top-left. null = off-screen. */
  screenX: number;
  screenY: number;
}

export interface SnapshotMeta {
  eraLabel: string;
  eraYear: string;
  eraAccent: string;
  eraDescription: string;
  landmarks: SnapshotLandmark[];
}

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, meta: SnapshotMeta) {
  const { eraLabel, eraYear, eraAccent, eraDescription, landmarks } = meta;

  // ── Gradients (mirrors PanoramaScene's from-black/70 and from-black/80) ──
  const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.26);
  topGrad.addColorStop(0, "rgba(0,0,0,0.70)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, h * 0.26);

  const botGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
  botGrad.addColorStop(0, "rgba(0,0,0,0)");
  botGrad.addColorStop(1, "rgba(0,0,0,0.80)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);

  // ── Vignette ──────────────────────────────────────────────────────────────
  const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.78);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // ── Row 2: era chip + description (mirrors PanoramaScene top HUD row 2) ──
  // Era chip — same pill style: black/55 bg, accent border, dot + MONO label
  const MONO = '"JetBrains Mono", monospace';
  const SERIF = '"Fraunces", "Cormorant Garamond", Georgia, serif';
  const chipText = `${eraLabel.toUpperCase()}  ·  ${eraYear}`;
  ctx.font = `600 11px ${MONO}`;
  const chipTextW = ctx.measureText(chipText).width;
  const dotR = 3, dotGap = 8, padH = 14, padV = 5;
  const chipW = dotR * 2 + dotGap + chipTextW + padH * 2;
  const chipH = 22;
  const chipTop = 52; // pt-12 safe-area offset (~48px) + a little breathing room
  const chipX = (w - chipW) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.roundRect(chipX, chipTop, chipW, chipH, chipH / 2);
  ctx.fill();

  ctx.strokeStyle = eraAccent + "55";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(chipX, chipTop, chipW, chipH, chipH / 2);
  ctx.stroke();

  // dot
  ctx.fillStyle = eraAccent;
  ctx.shadowColor = eraAccent;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(chipX + padH + dotR, chipTop + chipH / 2, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // chip text
  ctx.fillStyle = eraAccent;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(chipText, chipX + padH + dotR * 2 + dotGap, chipTop + chipH / 2);

  // Description — italic SERIF, centered, below chip (mirrors the <motion.p>)
  ctx.font = `italic 13px ${SERIF}`;
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.fillText(eraDescription, w / 2, chipTop + chipH + 8);
  ctx.shadowBlur = 0;

  // ── Landmark chips (mirrors the <Html> overlays on the 3D spheres) ───────
  for (const lm of landmarks) {
    const cx = lm.screenX * w;
    const cy = lm.screenY * h;

    // Emoji
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillText(lm.emoji, cx, cy - 4);

    // Name pill — black/55 bg, white text, rounded
    ctx.font = `500 11px ${MONO}`;
    const nameW = ctx.measureText(lm.shortName).width + 16;
    const nameH = 18;
    const nameX = cx - nameW / 2;
    const nameY = cy;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(nameX, nameY, nameW, nameH, nameH / 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textBaseline = "middle";
    ctx.fillText(lm.shortName, cx, nameY + nameH / 2);
  }

  // ── Era accent border ─────────────────────────────────────────────────────
  const borderInset = 10;
  const borderRadius = 18;
  ctx.strokeStyle = eraAccent + "55";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(borderInset, borderInset, w - borderInset * 2, h - borderInset * 2, borderRadius);
  ctx.stroke();

  // ── HeritEdge wordmark ────────────────────────────────────────────────────
  ctx.font = `400 10px ${MONO}`;
  ctx.fillStyle = "rgba(244,242,236,0.40)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("HeritEdge · Piazza del Duomo", w - 18, h - 16);
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Composite the live camera feed and the R3F WebGL canvas, apply the era tint,
 * draw a decorative memory frame, and return a blob URL.
 *
 * Requires `preserveDrawingBuffer: true` on the R3F Canvas gl prop.
 * Returns null on SecurityError (cross-origin video taint).
 */
export async function captureARSnapshot(
  video: HTMLVideoElement,
  glCanvas: HTMLCanvasElement,
  era: EraId,
  meta: SnapshotMeta,
): Promise<string | null> {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const offscreen = document.createElement("canvas");
  offscreen.width  = w;
  offscreen.height = h;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return null;

  try {
    // Layer 1 — camera feed with era tint
    ctx.drawImage(video, 0, 0, w, h);
    const p = ERA_FILTER_PARAMS[era];
    if (p.grayscale > 0) applyGrayscale(ctx, w, h, p.grayscale);
    if (p.sepia > 0)     applySepia(ctx, w, h, p.sepia);
    if (p.brightness !== 1 || p.contrast !== 1 || p.saturation !== 1) {
      applyBrightnessContrast(ctx, w, h, p.brightness, p.contrast, p.saturation);
    }

    // Layer 2 — Three.js canvas (landmark spheres, sky, ground)
    ctx.drawImage(glCanvas, 0, 0, w, h);
  } catch {
    return null;
  }

  // Layer 3 — decorative memory frame drawn directly on canvas
  drawFrame(ctx, w, h, meta);

  return new Promise((resolve) => {
    offscreen.toBlob(
      (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
      "image/jpeg",
      0.92,
    );
  });
}

/**
 * Trigger the native share sheet (mobile) or a download (desktop).
 * Cleans up the blob URL afterward.
 */
export async function shareOrDownloadSnapshot(blobUrl: string, era: EraId): Promise<void> {
  const filename = `heritedge-${era}-${Date.now()}.jpg`;

  if (navigator.canShare) {
    try {
      const res  = await fetch(blobUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "HeritEdge memory" });
        URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch { /* share cancelled or unsupported — fall through */ }
  }

  const a = document.createElement("a");
  a.href     = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
