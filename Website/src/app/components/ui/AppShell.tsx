import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Pause, Play, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BottomNav } from "./BottomNav";
import { stopSpeaking, pauseSpeaking, resumeSpeaking } from "@/services/chatService";

// ─── Play/Pause Pill ──────────────────────────────────────────────────────────
// Floats bottom-right whenever Luca is speaking. Listens to the luca-speech
// custom events dispatched by chatService so it works across all routes.

type SpeechState = "hidden" | "speaking" | "paused";

function PlayPausePill() {
  const [state, setState] = useState<SpeechState>("hidden");

  useEffect(() => {
    const handle = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "start" || detail === "resume") setState("speaking");
      else if (detail === "pause") setState("paused");
      else if (detail === "end") setState("hidden");
    };
    window.addEventListener("luca-speech", handle);
    return () => window.removeEventListener("luca-speech", handle);
  }, []);

  if (state === "hidden") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(64px + 12px)",
        right: 16,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--accent)",
        color: "var(--accent-foreground)",
        borderRadius: 999,
        padding: "8px 10px 8px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        animation: "pillIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes pillIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(0,0,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, flexShrink: 0,
      }}>
        L
      </div>

      <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
        {state === "speaking" ? "Luca is speaking" : "Paused"}
      </span>

      <button
        onClick={state === "paused" ? resumeSpeaking : pauseSpeaking}
        aria-label={state === "paused" ? "Resume" : "Pause"}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(0,0,0,0.15)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "inherit",
        }}
      >
        {state === "paused" ? <Play size={13} /> : <Pause size={13} />}
      </button>

      <button
        onClick={stopSpeaking}
        aria-label="Stop"
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(0,0,0,0.15)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "inherit",
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell() {
  const { pathname } = useLocation();

  // Stop Luca speaking on every route change
  useEffect(() => {
    stopSpeaking();
  }, [pathname]);

  const isImmersive =
    pathname.startsWith("/ar-artifact") || pathname === "/ar-overview";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {!isImmersive && (
        <div className="fixed top-3 right-3 z-50 sm:top-4 sm:right-4">
          <ThemeToggle />
        </div>
      )}

      <main className={isImmersive ? "" : "pb-nav"}>
        <Outlet />
      </main>

      {!isImmersive && <BottomNav />}

      {/* Global play/pause pill — visible on all routes when Luca speaks */}
      <PlayPausePill />
    </div>
  );
}
