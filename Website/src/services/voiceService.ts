/**
 * voiceService.ts
 * HeritEdge — Voice Service (P2, updated)
 *
 * Responsibilities:
 *   1. Owns the STT session (wraps useSpeechRecognition)
 *   2. Fires implicit confirmation via TTS when transcript is ready
 *   3. Sends transcript to the LLM via chatService.sendMessage
 *   4. Speaks the LLM answer aloud with full Pause / Resume / Cancel support
 *   5. Exposes a single clean API to the UI layer
 *
 * VUI lecture alignment (Prof. Micol Spitale, MITA 2025-26):
 *   - Implicit confirmation before LLM call           (slide 62)
 *   - Conversational markers ("Got it…")              (slide 61)
 *   - One question at a time / don't monopolise       (slide 71)
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
  /** Current STT state — drives mic button icon and disabled states */
  listeningState: ListeningState;
  /** True while the TTS engine is actively speaking (system's turn) */
  isSpeaking: boolean;
  /** True when TTS is paused mid-utterance */
  isPaused: boolean;
  /** Last recognised transcript (shown as user chat bubble) */
  transcript: string;
  /** Tap to open mic / close mic (push-to-talk / interrupt) */
  toggleListening: () => void;
  /** Pause TTS mid-sentence without losing position */
  pause: () => void;
  /** Resume a paused utterance */
  resume: () => void;
  /** Abort TTS + STT immediately and reset all state */
  cancel: () => void;
}

// ─── TTS singleton ────────────────────────────────────────────────────────────
//
// One module-level controller keeps Chrome's buggy speechSynthesis manageable.
// Chrome's `onend` fires unreliably — we always guard with a timeout fallback.

const tts = (() => {
  let utterance: SpeechSynthesisUtterance | null = null;
  let endCallbackFired = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  function clearFallback() {
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  /**
   * Speak `text`, calling `onStart` when audio begins and `onEnd` when done
   * (or on error / cancellation). Safe to call even when already speaking —
   * it cancels the previous utterance first.
   */
  function speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    // Cancel anything in flight
    window.speechSynthesis.cancel();
    clearFallback();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    endCallbackFired = false;

    const finish = () => {
      if (endCallbackFired) return;
      endCallbackFired = true;
      utterance = null;
      clearFallback();
      onEnd?.();
    };

    utterance.onstart = () => onStart?.();
    utterance.onend = finish;
    utterance.onerror = finish; // don't block pipeline on TTS error

    window.speechSynthesis.speak(utterance);

    // Chrome fallback — onend sometimes never fires
    const estimatedMs = Math.max(3000, (text.length / 10) * 1000);
    fallbackTimer = setTimeout(finish, estimatedMs);
  }

  /**
   * Pause the current utterance.
   * Returns true if the pause was applied, false if nothing was speaking.
   */
  function pause(): boolean {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      clearFallback(); // suspend the safety timer while paused
      return true;
    }
    return false;
  }

  /**
   * Resume a paused utterance.
   * Returns true if the resume was applied.
   */
  function resume(): boolean {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      return true;
    }
    return false;
  }

  /**
   * Immediately cancel any in-flight TTS.
   */
  function cancel(): void {
    window.speechSynthesis.cancel();
    clearFallback();
    utterance = null;
    endCallbackFired = true; // suppress any pending finish callback
  }

  return { speak, pause, resume, cancel };
})();

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

  // ── STT ──────────────────────────────────────────────────────────────────
  const {
    transcript,
    listeningState,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ lang, confidenceThreshold: 0.5 });

  // ── TTS state exposed to UI ───────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Guards against double-firing in React Strict Mode / stale closures
  const processingRef = useRef(false);

  // ── React to STT DONE → run round-trip ───────────────────────────────────
  useEffect(() => {
    if (listeningState !== "DONE" || !transcript || processingRef.current) return;

    processingRef.current = true;

    const run = async () => {
      // Step 1 — Implicit confirmation (slide 62)
      // Brief acknowledgement fills latency gap before LLM responds.
      tts.speak(
        "Got it — looking that up for you.",
        () => setIsSpeaking(true),
        async () => {
          // Step 2 — Fetch LLM answer
          const answer = await fetchLLMAnswer(transcript);

          // Step 3 — Speak the answer (system's turn, slide 60)
          tts.speak(
            answer,
            () => {
              setIsSpeaking(true);
              setIsPaused(false);
            },
            () => {
              setIsSpeaking(false);
              setIsPaused(false);
              processingRef.current = false;

              // Step 4 — Surface result to UI
              onAnswer?.(transcript, answer);

              // Step 5 — Reset STT, return turn to user
              resetTranscript();
            }
          );
        }
      );
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeningState, transcript]);

  // ── React to STT ERROR ────────────────────────────────────────────────────
  useEffect(() => {
    if (listeningState !== "ERROR" || !error) return;

    // error.message is already plain English (slide 69)
    tts.speak(
      error.message,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onError?.(error);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeningState, error]);

  // ── Push-to-talk / interrupt toggle ──────────────────────────────────────
  // Slide 60: tap is the explicit turn-exchange token.
  // If TTS is active the user can interrupt and immediately start speaking.
  const toggleListening = useCallback(() => {
    // Interrupt TTS if playing or paused — return turn to user
    if (isSpeaking || isPaused) {
      tts.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      processingRef.current = false;
    }

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
    // PROCESSING: no-op — let the STT engine commit the utterance
  }, [isSpeaking, isPaused, listeningState, startListening, stopListening, resetTranscript]);

  // ── Pause TTS ─────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      const applied = tts.pause();
      if (applied) {
        setIsPaused(true);
        setIsSpeaking(false);
      }
    }
  }, [isSpeaking, isPaused]);

  // ── Resume TTS ────────────────────────────────────────────────────────────
  const resume = useCallback(() => {
    if (isPaused) {
      const applied = tts.resume();
      if (applied) {
        setIsPaused(false);
        setIsSpeaking(true);
      }
    }
  }, [isPaused]);

  // ── Cancel everything ─────────────────────────────────────────────────────
  const cancel = useCallback(() => {
    tts.cancel();
    stopListening();
    setIsSpeaking(false);
    setIsPaused(false);
    processingRef.current = false;
    resetTranscript();
  }, [stopListening, resetTranscript]);

  return {
    listeningState,
    isSpeaking,
    isPaused,
    transcript,
    toggleListening,
    pause,
    resume,
    cancel,
  };
}