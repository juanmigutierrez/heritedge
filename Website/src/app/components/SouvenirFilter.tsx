import { useEffect, useRef, useState } from "react";
import { useHunt } from "./HuntContext";
import { Camera, Download, Share2, Smile, Star, Frame } from "lucide-react";
import * as faceapi from "face-api.js";

const overlays = [
  { id: "gold", label: "Golden Frame", emoji: "✨" },
  { id: "vintage", label: "Vintage Stamp", emoji: "📮" },
  { id: "memory", label: "Memory Badge", emoji: "🎖️" },
  { id: "city", label: "City Mark", emoji: "🏛️" },
];

const FACE_API_MODELS = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";

export function SouvenirFilter() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState(overlays[0].id);
  const [souvenirImage, setSouvenirImage] = useState<string | undefined>();
  const [sharing, setSharing] = useState(false);
  const { setSouvenirImage: saveSouvenir } = useHunt();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: number;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODELS),
          faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODELS),
        ]);
      } catch (err) {
        setError("Unable to load face detection models.");
      }
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 720, height: 1280 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError("Camera access is required to capture your souvenir.");
      }
    };

    const detectFace = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })
        );
        setFaceDetected(detections.length > 0);
      } catch {
        setFaceDetected(false);
      }
    };

    const init = async () => {
      await loadModels();
      await startCamera();
      setLoading(false);
      intervalId = window.setInterval(detectFace, 500);
    };

    init();

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const createImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 24;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, height - 110, width, 110);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 42px Inter, sans-serif";
    ctx.fillText("Heritage Hunt", 32, height - 50);
    ctx.font = "400 24px Inter, sans-serif";
    ctx.fillText("Piazza del Duomo", 32, height - 20);

    const overlay = overlays.find((item) => item.id === selectedOverlay);
    if (overlay) {
      ctx.font = "96px Inter, sans-serif";
      ctx.fillText(overlay.emoji, width - 140, 120);
      ctx.font = "600 28px Inter, sans-serif";
      ctx.fillText(overlay.label, width - 140, 170);
    }

    const dataUrl = canvas.toDataURL("image/png");
    setSouvenirImage(dataUrl);
    saveSouvenir(dataUrl);
  };

  const onShare = async () => {
    if (!souvenirImage) return;
    setSharing(true);
    try {
      const response = await fetch(souvenirImage);
      const blob = await response.blob();
      const file = new File([blob], "heritage-souvenir.png", { type: blob.type });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Heritage Souvenir", text: "My Milan souvenir from Heritage Edge." });
      } else {
        const link = document.createElement("a");
        link.href = souvenirImage;
        link.download = "heritage-souvenir.png";
        link.click();
      }
    } catch {
      // no-op
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28">
      <div className="max-w-4xl mx-auto px-5 py-10 sm:px-8">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Souvenir camera</p>
              <h1 className="mt-3 text-3xl font-semibold">Capture your final keepsake</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-200">
                Use your front camera, choose a mask, and frame a souvenir from your hunt.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-emerald-500/10 px-4 py-3 text-emerald-100">
              <Frame className="h-5 w-5" /> Face filter ready
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black">
              <video
                ref={videoRef}
                className="h-[420px] w-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_48%)]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="rounded-3xl bg-black/60 px-4 py-3 text-sm text-slate-100 backdrop-blur-sm">
                  {loading
                    ? "Preparing your camera..."
                    : error
                    ? error
                    : faceDetected
                    ? "Face detected — choose a filter and capture your souvenir."
                    : "Position your face in view and allow camera access."}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {overlays.map((overlay) => (
                <button
                  key={overlay.id}
                  type="button"
                  onClick={() => setSelectedOverlay(overlay.id)}
                  className={`rounded-3xl border px-4 py-3 text-left transition ${
                    selectedOverlay === overlay.id
                      ? "border-emerald-400 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-slate-950 text-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-xl">
                      {overlay.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{overlay.label}</p>
                      <p className="text-xs text-slate-400">Instant frame effect</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={createImage}
                disabled={loading || Boolean(error)}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="h-4 w-4" /> Capture souvenir
              </button>
              <button
                type="button"
                onClick={onShare}
                disabled={!souvenirImage || sharing}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" /> {sharing ? "Sharing…" : "Share / Save"}
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-200">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Star className="h-4 w-4" />
                </span>
                Souvenir details
              </div>
              <p className="mt-4 text-sm text-slate-200 leading-relaxed">
                Capture a high-resolution front-camera moment, then download it as a stylized souvenir with your chosen overlay.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Preview</p>
              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                {souvenirImage ? (
                  <img
                    src={souvenirImage}
                    alt="Souvenir preview"
                    className="h-72 w-full rounded-[1.5rem] object-cover"
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-[1.5rem] border-2 border-dashed border-white/10 text-sm text-slate-500">
                    Capture a photo to preview your souvenir here.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">Tips</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>Allow camera access to use the live portrait view.</li>
                <li>Frame your face near the centre for the best overlay effect.</li>
                <li>Use the download fallback if sharing is unavailable.</li>
              </ul>
            </div>
          </aside>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
