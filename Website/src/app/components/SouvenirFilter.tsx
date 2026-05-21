import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Camera, Download, Share2, X, ImageIcon, Home } from "lucide-react";
import { useHuntState } from "./HuntStateProvider";

type Overlay = "madonnina" | "spires" | "renaissance" | "flaneur";

const overlayMeta: Record<Overlay, { label: string; emoji: string }> = {
  madonnina: { label: "Madonnina", emoji: "⛪" },
  spires: { label: "Spire Lights", emoji: "✨" },
  renaissance: { label: "Renaissance Glow", emoji: "🎨" },
  flaneur: { label: "Flâneur", emoji: "🕊️" },
};

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

function FramedPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center ${className}`}>
      {children}
    </div>
  );
}

function EmptySouvenirState() {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 p-6 text-stone-500">
      <div className="flex flex-col items-center gap-3">
        <ImageIcon className="h-10 w-10" />
        <p className="text-sm">Your souvenir will appear here after capture.</p>
      </div>
    </div>
  );
}

function PermissionWarning() {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
      <div className="flex items-start gap-3">
        <X className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Enable Camera to Capture Souvenir</p>
          <p className="mt-1 text-sm text-rose-700/80">
            Allow camera access from your browser settings, then refresh this page.
          </p>
        </div>
      </div>
    </div>
  );
}

function drawOverlayGraphic(
  ctx: CanvasRenderingContext2D,
  overlay: Overlay,
  box: { x: number; y: number; width: number; height: number } | null
) {
  if (!box) return;

  const centerX = box.x + box.width / 2;
  const topY = box.y - box.height * 0.35;

  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255, 215, 0, 0.85)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.shadowColor = "rgba(255, 225, 120, 0.65)";
  ctx.shadowBlur = 24;

  if (overlay === "madonnina") {
    ctx.beginPath();
    ctx.arc(centerX, topY, box.width * 0.45, 0, Math.PI, true);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 236, 179, 0.25)";
    ctx.fill();
  }

  if (overlay === "spires") {
    const sparkleCount = 5;
    for (let i = 0; i < sparkleCount; i += 1) {
      const angle = (Math.PI * 2 * i) / sparkleCount;
      const x = centerX + Math.cos(angle) * box.width * 0.65;
      const y = topY + Math.sin(angle) * box.height * 0.25;
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x, y + 16);
      ctx.moveTo(x - 16, y);
      ctx.lineTo(x + 16, y);
      ctx.stroke();
    }
  }

  if (overlay === "renaissance") {
    ctx.beginPath();
    ctx.ellipse(centerX, box.y + box.height * 0.18, box.width * 0.75, box.height * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 192, 203, 0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(248, 181, 0, 0.8)";
    ctx.stroke();
  }

  if (overlay === "flaneur") {
    ctx.beginPath();
    ctx.moveTo(centerX - box.width * 0.28, topY + 8);
    ctx.quadraticCurveTo(centerX, topY - box.height * 0.16, centerX + box.width * 0.28, topY + 8);
    ctx.lineTo(centerX + box.width * 0.26, topY + box.height * 0.24);
    ctx.lineTo(centerX - box.width * 0.26, topY + box.height * 0.24);
    ctx.closePath();
    ctx.fillStyle = "rgba(45, 55, 72, 0.75)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.stroke();
  }

  ctx.restore();
}

const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";

export function SouvenirFilter() {
  const navigate = useNavigate();
  const { state, setSouvenirImage } = useHuntState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceApi, setFaceApi] = useState<any>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overlay, setOverlay] = useState<Overlay>("madonnina");
  const [captured, setCaptured] = useState<string | undefined>(state.souvenirImage);
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing">("idle");
  const faceBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    let active = true;
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (!active) return;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setCameraReady(true);
        }

        const faceapi = await import("face-api.js");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        if (!active) return;
        setFaceApi(faceapi);
        setModelsLoaded(true);
      } catch (error: unknown) {
        const err = error as { name?: string };
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionDenied(true);
        }
        console.error("SouvenirFilter error:", error);
      } finally {
        setLoading(false);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!faceApi || !videoRef.current || !overlayCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawLoop = async () => {
      if (!video || video.readyState < 2) return;
      // Use the displayed video size (clientWidth/clientHeight) so
      // canvas drawing aligns with the visible preview (object-cover)
      const rect = video.getBoundingClientRect();
      const displayW = Math.max(1, Math.floor(rect.width));
      const displayH = Math.max(1, Math.floor(rect.height));
      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width = displayW;
        canvas.height = displayH;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      try {
        const detection = await faceApi
          .detectSingleFace(video, new faceApi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);
        if (!detection) {
          faceBoxRef.current = null;
          return;
        }
        // Map the detection results into the canvas display size
        const dims = faceApi.matchDimensions(canvas, {
          width: displayW,
          height: displayH,
        });
        const resized = faceApi.resizeResults(detection, dims);
        const { x, y, width, height } = resized.detection.box;
        faceBoxRef.current = { x, y, width, height };
        ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
        ctx.fillRect(x, y, width, height);
        drawOverlayGraphic(ctx, overlay, faceBoxRef.current);
      } catch (error) {
        console.error("Face detection failed:", error);
      }
    };

    const interval = window.setInterval(drawLoop, 250);
    return () => window.clearInterval(interval);
  }, [faceApi, overlay]);

  const ready = Boolean(stream && cameraReady && modelsLoaded && !permissionDenied);

  const captureSouvenir = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = 900;
    const height = 1100;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const frameWidth = width - 120;
    const frameHeight = Math.round((video.videoHeight / video.videoWidth) * frameWidth);
    const frameY = 120;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(60, frameY, frameWidth, frameHeight);
    ctx.drawImage(video, 60, frameY, frameWidth, frameHeight);

    const faceBox = faceBoxRef.current;
    if (faceBox) {
      const relative = {
        x: 60 + (faceBox.x / video.videoWidth) * frameWidth,
        y: frameY + (faceBox.y / video.videoHeight) * frameHeight,
        width: (faceBox.width / video.videoWidth) * frameWidth,
        height: (faceBox.height / video.videoHeight) * frameHeight,
      };
      drawOverlayGraphic(ctx, overlay, relative);
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 8;
    ctx.strokeRect(60, frameY, frameWidth, frameHeight);

    ctx.fillStyle = "#111827";
    ctx.font = "700 32px Inter, sans-serif";
    ctx.fillText("Milan Heritage", 80, 62);

    ctx.font = "600 24px Inter, sans-serif";
    ctx.fillText(overlayMeta[overlay].label, 80, height - 80);

    ctx.fillStyle = "#10b981";
    ctx.font = "700 24px Inter, sans-serif";
    ctx.fillText(`Score ${state.score}`, width - 260, height - 80);

    ctx.font = "700 40px Inter, sans-serif";
    ctx.fillText(overlayMeta[overlay].emoji, width - 110, 60);

    const image = canvas.toDataURL("image/png");
    setCaptured(image);
    setSouvenirImage(image);
    navigate("/summary");
  };

  const handleShare = async () => {
    if (!captured) return;
    if (!navigator.share) return;
    setShareStatus("sharing");
    try {
      await navigator.share({
        title: "Milan Heritage Souvenir",
        text: `I scored ${state.score} points on my Milan Heritage journey!`,
        url: window.location.href,
      });
    } catch {
      // ignore share cancellation
    } finally {
      setShareStatus("idle");
    }
  };

  const downloadLink = useMemo(() => {
    return captured ? captured : undefined;
  }, [captured]);

  return (
    <div className="min-h-screen bg-stone-50 pb-10">
      <div className="bg-gradient-to-r from-slate-900 to-emerald-700 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Souvenir Filter</h1>
            <p className="mt-2 text-stone-200">
              Capture your final Milan memory with a themed overlay and keep it as a polaroid.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Back Home
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_0.7fr] lg:items-stretch">
            <div className="order-1 rounded-[32px] bg-white p-6 shadow-sm h-full">
              <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-black/5">
                <video
                  ref={videoRef}
                  className="h-[340px] w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 h-full w-full"
                />
                <div className="absolute bottom-4 left-4 rounded-3xl bg-white/90 px-3 py-2 text-sm font-semibold text-stone-900 backdrop-blur-sm max-w-[calc(100%-1.5rem)]">
                  {permissionDenied
                    ? "Camera access denied"
                    : !stream
                    ? "Requesting camera permission..."
                    : !cameraReady
                    ? "Starting camera..."
                    : !modelsLoaded
                    ? "Loading face filter models..."
                    : "Face detection active"}
                </div>
              </div>
            </div>

            <div className="order-2 rounded-[32px] bg-white p-6 shadow-sm h-full lg:order-3">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 h-full flex flex-col">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-stone-500">
                    Overlay choice
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Object.entries(overlayMeta).map(([key, meta]) => {
                      const overlayKey = key as Overlay;
                      const selected = overlayKey === overlay;
                      return (
                        <button
                          key={overlayKey}
                          type="button"
                          onClick={() => setOverlay(overlayKey)}
                          className={`rounded-3xl border px-3 py-4 text-center transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <div className="text-2xl">{meta.emoji}</div>
                          <p className="mt-2 text-xs font-semibold">{meta.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex-1 flex flex-col justify-end">
                  {permissionDenied ? (
                    <PermissionWarning />
                  ) : (
                    <button
                      type="button"
                      onClick={captureSouvenir}
                      disabled={!ready}
                      className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      <Camera className="h-5 w-5" />
                      Capture Souvenir
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Card className="order-3 flex h-full flex-col lg:order-2">
              <h2 className="text-lg font-semibold">Preview</h2>
              <p className="mt-2 text-sm text-stone-500">
                Your souvenir will become a framed polaroid with a Milan Heritage label and score stamp.
              </p>
              <FramedPanel className="mt-6 flex flex-1 flex-col justify-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  {overlayMeta[overlay].emoji}
                </div>
                <p className="font-semibold">{overlayMeta[overlay].label}</p>
                <p className="mt-2 text-sm text-stone-500">Face filter overlay is rendered on top of your selfie.</p>
              </FramedPanel>
            </Card>

            <Card className="order-4 h-full">
              <h2 className="text-lg font-semibold">Saved Souvenir</h2>
              {captured ? (
                <div className="space-y-4">
                  <img src={captured} alt="Souvenir Polaroid" className="w-full rounded-3xl border border-stone-200 object-cover" />
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={shareStatus === "sharing"}
                      className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      <Share2 className="h-4 w-4" />
                      {shareStatus === "sharing" ? "Sharing..." : "Share Souvenir"}
                    </button>
                    <a
                      href={downloadLink}
                      download="milan-heritage-souvenir.png"
                      className="inline-flex items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                    >
                      <Download className="h-4 w-4" />
                      Download Image
                    </a>
                  </div>
                </div>
              ) : (
                <EmptySouvenirState />
              )}
            </Card>
          </div>
        </div>
    </div>
  );
}
