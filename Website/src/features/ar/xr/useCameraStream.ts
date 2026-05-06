// useCameraStream — manages a rear-facing camera MediaStream for AR overlays.
//
// Lifecycle rules that earn this hook its existence:
//   - getUserMedia must be triggered by a user gesture on iOS, so the caller
//     flips `active` true from inside a click/tap handler — never on mount.
//   - Tracks must be explicitly stopped on cleanup; otherwise the camera LED
//     stays lit even after the user navigates away.
//   - If permission is revoked or the OS reclaims the camera mid-session,
//     the active track fires "ended" — we surface that as status="denied"
//     so the page can fall back gracefully.
//   - Hidden tabs lose the stream; we stop on `visibilitychange` so the
//     browser doesn't re-prompt for permission when the user returns.

import { useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle"          // not requested yet
  | "requesting"    // getUserMedia in flight
  | "live"          // stream is active
  | "denied"        // user said no, or track ended unexpectedly
  | "unsupported"   // mediaDevices unavailable (insecure context, old browser)
  | "error";        // anything else (hardware, OS-level)

export interface CameraStreamState {
  stream: MediaStream | null;
  status: CameraStatus;
  /** Last raw error, for debugging; not user-facing. */
  error: unknown;
}

// Modest resolution — enough for a passthrough backdrop, gentle on battery.
// The browser will pick the closest stream the device offers.
const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width:  { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  },
};

export function useCameraStream(active: boolean): CameraStreamState {
  const [state, setState] = useState<CameraStreamState>({
    stream: null,
    status: "idle",
    error: null,
  });

  // Holds the live stream so cleanup always sees the latest reference,
  // even if React re-renders between effect runs.
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      stop();
      setState({ stream: null, status: "idle", error: null });
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState({ stream: null, status: "unsupported", error: null });
      return;
    }

    let cancelled = false;
    setState(s => ({ ...s, status: "requesting", error: null }));

    navigator.mediaDevices
      .getUserMedia(CONSTRAINTS)
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        setState({ stream, status: "live", error: null });

        // If the user revokes permission or the OS reclaims the camera,
        // the track ends — flip back to denied so the page can fall back.
        stream.getVideoTracks().forEach(track => {
          track.addEventListener("ended", () => {
            if (streamRef.current === stream) {
              stop();
              setState({ stream: null, status: "denied", error: null });
            }
          });
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // NotAllowedError = user denied, NotFoundError = no camera, etc.
        const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
        setState({
          stream: null,
          status: denied ? "denied" : "error",
          error: err,
        });
      });

    // Pause when the page is hidden so the browser doesn't keep the camera
    // hot in the background (and so it doesn't re-prompt on return).
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
        setState({ stream: null, status: "idle", error: null });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [active]);

  function stop() {
    const s = streamRef.current;
    if (!s) return;
    s.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  return state;
}
