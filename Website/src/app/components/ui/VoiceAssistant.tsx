"use client";

import { useEffect, useMemo, useState } from "react";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";

export function VoiceAssistant() {
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transcript) return;

    const fetchResponse = async () => {
      try {
        const res = await sendMessage(transcript);
        const reply = res.answer || res.reply || "No response available.";

        setResponse(reply);
        setError(null);
        speak(reply);
      } catch {
        setResponse("");
        setError("Unable to connect to the AI service.");
      }
    };

    fetchResponse();
  }, [transcript]);

  const statusLabel = useMemo(
    () => (listening ? "Listening..." : "Hold and speak to start the assistant"),
    [listening],
  );

  const handleHoldStart = () => {
    stopSpeaking();
    startListening();
  };

  const handleHoldEnd = () => {
    stopListening();
  };

  return (
    <section className="space-y-4" aria-live="polite">
      <button
        type="button"
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-pressed={listening}
      >
        {listening ? "Listening..." : "🎤 Hold to Talk"}
      </button>

      <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-900 shadow-sm">
        <div>
          <p className="font-semibold">You</p>
          <p>{transcript || "No speech detected yet."}</p>
        </div>

        <div>
          <p className="font-semibold">AI</p>
          <p>{response || "Waiting for the voice assistant response..."}</p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <button
        type="button"
        onClick={resetTranscript}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Reset transcript
      </button>

      <p className="text-xs text-muted-foreground">{statusLabel}</p>
    </section>
  );
}