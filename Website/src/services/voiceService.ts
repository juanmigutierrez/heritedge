/**
 * voiceService.ts
 * HeritEdge — Voice Service (P2)
 *
 * Responsibilities:
 *   1. Owns the STT session (wraps useSpeechRecognition)
 *   2. Fires implicit confirmation via TTS when transcript is ready
 *   3. Sends transcript to the LLM via chatService.sendMessage
 *   4. Speaks the LLM answer aloud
 *   5. Exposes a single clean API to the UI layer
 *
 * VUI lecture alignment (Prof. Micol Spitale, MITA 2025-26):
 *   - Implicit confirmation before LLM call           (slide 62)
 *   - Conversational markers ("Got it…")              (slide 61)
 *   - One question at a time / don't monopolize       (slide 71)
 *   - Plain English error re-prompts                  (slide 69)
 *   - Turn-taking: system speaks only after DONE/ERROR (slide 60)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  useSpeechRecognition,
  type VoiceError,
  type ListeningState,
} from "@/features/voice/useSpeechRecognition";
import { sendMessage } from "./chatService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceServiceOptions {
  /** BCP-47 language tag passed to STT. Default: "en-US" */
  lang?: string;
  /**
   * Called when the full voice → LLM → TTS round-trip is done.
   * Gives the UI the LLM answer text so it can render chat bubbles.
   */
  onAnswer?: (question: string, answer: string) => void;
  /**
   * Called when any error occurs so the UI can show a visual indicator
   * in addition to the TTS re-prompt.
   */
  onError?: (error: VoiceError) => void;
}

export interface UseVoiceServiceReturn {
  /** Current turn state — drives mic button icon and disabled states */
  listeningState: ListeningState;
  /** True while the TTS engine is speaking (system's turn) */
  isSpeaking: boolean;
  /** Last recognised transcript (shown as user chat bubble) */
  transcript: string;
  /** Tap to open mic / close mic (push-to-talk) */
  toggleListening: () => void;
  /** Abort both STT and TTS immediately */
  cancel: () => void;
}

// ─── TTS helper (with Chrome onend bug fix) ───────────────────────────────────
function speakText(text: string, onStart?: () => void, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) {
    onEnd?.(); // still unblock the pipeline even if TTS unavailable
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onEnd?.();
  };

  if (onStart) utterance.onstart = onStart;
  utterance.onend = finish;
  utterance.onerror = finish; // don't get stuck if TTS errors

  window.speechSynthesis.speak(utterance);

  // Fallback timeout — Chrome sometimes never fires onend
  const estimatedMs = Math.max(2500, (text.length / 12) * 1000);
  setTimeout(finish, estimatedMs);
}

// ─── LLM call ────────────────────────────────────────────────────────────────
async function fetchLLMAnswer(question: string): Promise<string> {
  try {
    const data = await sendMessage(question);
    return data.answer || data.reply || "Sorry, I couldn't reach the knowledge base.";
  } catch {
    return "Sorry, I couldn't reach the knowledge base right now. Please try again.";
  }
}
// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceService(
  options: VoiceServiceOptions = {}
): UseVoiceServiceReturn {
  const { lang = "en-US", onAnswer, onError } = options;

  // ── STT ────────────────────────────────────────────────────────────────────
  const {
    transcript,
    listeningState,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ lang, confidenceThreshold: 0.5 });

  // ── Local state ────────────────────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Prevent double-firing in React Strict Mode / fast re-renders
  const processingRef = useRef(false);

  // ── React to transcript ready (listeningState === "DONE") ─────────────────
  useEffect(() => {
    if (listeningState !== "DONE" || !transcript || processingRef.current) {
      return;
    }

    processingRef.current = true;

    const run = async () => {
      // Step 1 — Implicit confirmation (lecture slide 62)
      // Speak brief acknowledgement BEFORE the LLM responds.
      // Fills the latency gap and signals the system understood.
      // "Got it" = Acknowledgement conversational marker (slide 61)
      speakText(
        "Got it — looking that up for you.",
        () => setIsSpeaking(true),
        async () => {
          // Step 2 — Call LLM after confirmation finishes speaking
          const answer = await fetchLLMAnswer(transcript);

          // Step 3 — Speak the answer (system's turn)
          speakText(
            answer,
            () => setIsSpeaking(true),
            () => {
              setIsSpeaking(false);
              processingRef.current = false;
              // Step 4 — Notify UI so it can render the chat bubbles
              onAnswer?.(transcript, answer);
              // Step 5 — Reset STT state, return turn to user
              resetTranscript();
            }
          );
        }
      );
    };

    run();
  }, [listeningState, transcript, onAnswer, resetTranscript]);

  // ── React to errors ────────────────────────────────────────────────────────
  useEffect(() => {
    if (listeningState !== "ERROR" || !error) return;

    // error.message is already plain English from useSpeechRecognition
    // (lecture slide 69 — avoid "invalid", "error", technical jargon)
    speakText(
      error.message,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        onError?.(error);
      }
    );
  }, [listeningState, error, onError]);

  // ── Push-to-talk toggle ────────────────────────────────────────────────────
  // Lecture slide 60 — turn-taking: one speaker at a time.
  // The button tap is the explicit turn-exchange token.
  const toggleListening = useCallback(() => {
    if (isSpeaking) return; // system is speaking — user must wait

    if (listeningState === "LISTENING") {
      stopListening();
    } else if (
      listeningState === "IDLE" ||
      listeningState === "ERROR" ||
      listeningState === "DONE"
    ) {
      resetTranscript();
      startListening();
    }
    // PROCESSING: no-op, STT is committing the utterance
  }, [
    isSpeaking,
    listeningState,
    startListening,
    stopListening,
    resetTranscript,
  ]);

  // ── Cancel everything ──────────────────────────────────────────────────────
  const cancel = useCallback(() => {
    stopListening();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    processingRef.current = false;
    resetTranscript();
  }, [stopListening, resetTranscript]);

  return {
    listeningState,
    isSpeaking,
    transcript,
    toggleListening,
    cancel,
  };
}