import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Camera, Download, Share2, X, ImageIcon, Home, Loader2, Sparkles } from "lucide-react";
import { useHuntState } from "./HuntStateProvider";

type Overlay = "madonnina" | "spires" | "renaissance" | "flaneur";

const overlayMeta: Record<Overlay, { label: string; emoji: string }> = {
  madonnina: { label: "Madonnina", emoji: "⛪" },
  spires: { label: "Spire Lights", emoji: "✨" },
  renaissance: { label: "Renaissance Glow", emoji: "🎨" },
  flaneur: { label: "Flâneur", emoji: "🕊️" },
};

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-card p-6 border border-border shadow-md ${className}`}>{children}</div>;
}

function FramedPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-muted p-6 text-center ${className}`}>
      {children}
    </div>
  );
}

function EmptySouvenirState() {
  return (
    <div className="rounded-3xl border border-dashed border-border p-8 text-muted-foreground my-auto">
      <div className="flex flex-col items-center gap-3">
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Your souvenir will appear here after capture.</p>
      </div>
    </div>
  );
}

function PermissionWarning() {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
      <div className="flex items-start gap-3">
        <X className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-base">Enable Camera Access</p>
          <p className="mt-1 text-sm text-destructive/80 leading-relaxed">
            Please allow camera permission in your browser or system settings, then refresh this page to snap your souvenir selfie.
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
  ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.shadowColor = "rgba(255, 225, 120, 0.7)";
  ctx.shadowBlur = 24;

  if (overlay === "madonnina") {
    ctx.beginPath();
    ctx.arc(centerX, topY, box.width * 0.45, 0, Math.PI, true);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 236, 179, 0.2)";
    ctx.fill();
  }

  if (overlay === "spires") {
    const sparkleCount = 5;
    for (let i = 0; i < sparkleCount; i += 1) {
      const angle = (Math.PI * 2 * i) / sparkleCount;
      const x = centerX + Math.cos(angle) * box.width * 0.65;
      const y = topY + Math.sin(angle) * box.height * 0.25;
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y + 14);
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
    }
  }

  if (overlay === "renaissance") {
    ctx.beginPath();
    ctx.ellipse(centerX, box.y + box.height * 0.18, box.width * 0.75, box.height * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 192, 203, 0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(248, 181, 0, 0.85)";
    ctx.stroke();
  }

  if (overlay === "flaneur") {
    ctx.beginPath();
    ctx.moveTo(centerX - box.width * 0.28, topY + 8);
    ctx.quadraticCurveTo(centerX, topY - box.height * 0.16, centerX + box.width * 0.28, topY + 8);
    ctx.lineTo(centerX + box.width * 0.26, topY + box.height * 0.24);
    ctx.lineTo(centerX - box.width * 0.26, topY + box.height * 0.24);
    ctx.closePath();
    ctx.fillStyle = "rgba(45, 55, 72, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
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

  // Initialize camera and face-api on mount immediately to trigger browser modal
  useEffect(() => {
    let active = true;
    async function initCameraAndModels() {
      try {
        setLoading(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });
        
        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Lazy load face-api assets safely
        const faceapi = await import("face-api.js");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        if (!active) return;
        setFaceApi(faceapi);
        setModelsLoaded(true);
      } catch (error: unknown) {
        console.error("Camera prompt or face-api loading failed:", error);
        const err = error as { name?: string };
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionDenied(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initCameraAndModels();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle video meta loading for precise playback sizing triggers
  const handleVideoLoad = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setCameraReady(true);
      } catch (e) {
        console.warn("Autoplay interrupted or paused:", e);
      }
    }
  };

  // Live Processing loop matching face-api vectors over display layout space
  useEffect(() => {
    if (!faceApi || !videoRef.current || !overlayCanvasRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const drawLoop = async () => {
      if (video.paused || video.ended || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(drawLoop);
        return;
      }

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
          .detectSingleFace(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        if (!detection) {
          faceBoxRef.current = null;
        } else {
          const dims = faceApi.matchDimensions(canvas, { width: displayW, height: displayH });
          const resized = faceApi.resizeResults(detection, dims);
          const { x, y, width, height } = resized.detection.box;
          
          faceBoxRef.current = { x, y, width, height };

          // Visual Feedback Matrix Box Indicator
          ctx.strokeStyle = "rgba(16, 185, 129, 0.75)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
          ctx.fillRect(x, y, width, height);

          drawOverlayGraphic(ctx, overlay, faceBoxRef.current);
        }
      } catch (error) {
        console.error("Detection loop error:", error);
      }

      // Short timeout to minimize performance footprint during active execution loops
      setTimeout(() => {
        animationFrameId = requestAnimationFrame(drawLoop);
      }, 120);
    };

    animationFrameId = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [faceApi, overlay, cameraReady]);

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
    if (faceBox && overlayCanvasRef.current) {
      const canvasEl = overlayCanvasRef.current;
      const relative = {
        x: 60 + (faceBox.x / canvasEl.width) * frameWidth,
        y: frameY + (faceBox.y / canvasEl.height) * frameHeight,
        width: (faceBox.width / canvasEl.width) * frameWidth,
        height: (faceBox.height / canvasEl.height) * frameHeight,
      };
      drawOverlayGraphic(ctx, overlay, relative);
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 8;
    ctx.strokeRect(60, frameY, frameWidth, frameHeight);

    ctx.fillStyle = "#111827";
    ctx.font = "700 32px Inter, sans-serif";
    ctx.fillText("Milan Heritage Journey", 80, 68);

    ctx.font = "600 24px Inter, sans-serif";
    ctx.fillText(overlayMeta[overlay].label, 80, height - 80);

    ctx.fillStyle = "#10b981";
    ctx.font = "700 24px Inter, sans-serif";
    ctx.fillText(`Score: ${state.score} pts`, width - 280, height - 80);

    ctx.font = "700 40px Inter, sans-serif";
    ctx.fillText(overlayMeta[overlay].emoji, width - 110, 65);

    const image = canvas.toDataURL("image/png");
    setCaptured(image);
    setSouvenirImage(image);
  };

  const handleShare = async () => {
    if (!captured || !navigator.share) return;
    setShareStatus("sharing");
    try {
      await navigator.share({
        title: "Milan Heritage Souvenir",
        text: `I finished my scavenger quest and scored ${state.score} points!`,
        url: window.location.href,
      });
    } catch {
      // User cancelled share panel sheet
    } finally {
      setShareStatus("idle");
    }
  };

  const downloadLink = useMemo(() => captured || undefined, [captured]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-12">
      {/* Header Band occupying max-w-5xl (75% view layout area) */}
      <div className="bg-accent border-b border-border px-6 py-12 text-accent-foreground">
        <div className="mx-auto flex max-w-5xl w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent-foreground/80 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Quest Completed Souvenir</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1">Souvenir Filter Studio</h1>
            <p className="mt-2 text-accent-foreground/80 text-base leading-relaxed max-w-2xl">
              Capture your final Milan memory with a custom historical overlay filter and preserve it inside an archival digital Polaroid frame.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black/10 px-6 py-3.5 text-sm font-bold text-accent-foreground backdrop-blur-md border border-black/10 transition hover:bg-black/20 active:scale-95 sm:w-auto shrink-0"
          >
            <Home className="h-4 w-4" />
            Back to Homepage
          </button>
        </div>
      </div>

      {/* Main Container Area matching 75% width constraint footprint */}
      <div className="mx-auto max-w-5xl w-full px-6 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* Column Left: Live Camera Viewfinder Panel */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <h2 className="text-xl font-black tracking-tight text-foreground mb-4">Live Viewfinder</h2>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-black aspect-[4/3] w-full shadow-inner flex items-center justify-center">
                
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-white/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-sm font-semibold text-white/70">Setting up processing stream...</p>
                  </div>
                )}

                <video
                  ref={videoRef}
                  onLoadedMetadata={handleVideoLoad}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 h-full w-full pointer-events-none"
                />
                
                <div className="absolute bottom-4 left-4 rounded-xl bg-black/80 border border-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md max-w-[calc(100%-2rem)] flex items-center gap-2 shadow-md">
                  {permissionDenied ? (
                    <span className="text-destructive">Camera access permission blocked</span>
                  ) : !stream ? (
                    <span className="animate-pulse text-accent">Requesting device hardware...</span>
                  ) : !cameraReady ? (
                    <span className="text-accent">Starting video track loop...</span>
                  ) : !modelsLoaded ? (
                    <span className="text-accent animate-pulse">Parsing face-api feature meshes...</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-white/80">Face Vector Mesh Matrix Active</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Overlay Selector Controls */}
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground mb-3">
                Select Your Custom Filter Theme
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(overlayMeta).map(([key, meta]) => {
                  const overlayKey = key as Overlay;
                  const selected = overlayKey === overlay;
                  return (
                    <button
                      key={overlayKey}
                      type="button"
                      onClick={() => setOverlay(overlayKey)}
                      className={`rounded-2xl border p-4 text-center transition focus:outline-none active:scale-95 ${
                        selected
                          ? "border-accent bg-accent/15 text-accent-strong font-bold shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="text-3xl filter drop-shadow-sm">{meta.emoji}</div>
                      <p className="mt-2 text-xs font-bold tracking-tight whitespace-nowrap">{meta.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-border pt-5">
                {permissionDenied ? (
                  <PermissionWarning />
                ) : (
                  <button
                    type="button"
                    onClick={captureSouvenir}
                    disabled={!ready}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground active:scale-[0.99]"
                  >
                    <Camera className="h-5 w-5" />
                    Snap Polaroid Souvenir
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Column Right: Live Blueprint Filter Preview & Saved Results */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <Card className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight text-foreground">Souvenir Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Your captured image automatically gets dynamic vector assets baked into a traditional high-gloss polaroid border print.
              </p>
              
              <FramedPanel className="mt-5 flex flex-1 flex-col justify-center py-8">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 text-4xl shadow-sm border border-accent/20">
                  {overlayMeta[overlay].emoji}
                </div>
                <p className="font-bold text-base text-foreground">{overlayMeta[overlay].label} Overlay</p>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-normal">
                  The graphics dynamically auto-render relative to your posture, orientation and face vector tracking frame values.
                </p>
              </FramedPanel>
            </Card>

            {/* Polaroid Saved Stack */}
            <Card className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight text-foreground">Saved Souvenir Print</h2>
              <div className="mt-4 flex-1 flex flex-col justify-center">
                {captured ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-2xl border border-border shadow-inner">
                      <img src={captured} alt="Souvenir Polaroid Printout" className="w-full rounded-xl border border-border object-cover bg-card" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleShare}
                        disabled={shareStatus === "sharing" || !navigator.share}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground shadow-sm"
                      >
                        <Share2 className="h-4 w-4" />
                        {shareStatus === "sharing" ? "Sharing..." : "Share Print"}
                      </button>
                      <a
                        href={downloadLink}
                        download="milan-heritage-souvenir.png"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-bold text-foreground transition hover:bg-muted shadow-sm"
                      >
                        <Download className="h-4 w-4" />
                        Download Image
                      </a>
                    </div>
                  </div>
                ) : (
                  <EmptySouvenirState />
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
