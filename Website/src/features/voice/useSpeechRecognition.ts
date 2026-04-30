/**
 * useSpeechRecognition.ts
 * HeritEdge — Voice Feature (P2)
 *
 * Design rationale (aligned with VUI Lecture — Prof. Micol Spitale, MITA 2025-26):
 *
 *  Taxonomy:
 *    - Input:       Spoken Dialogue System (STT via Web Speech API)
 *    - Control:     Mixed-initiative (system asks, user answers freely)
 *    - Purpose:     Goal-oriented (heritage site Q&A)
 *    - Domain:      Closed (heritage content)
 *    - Context:     Long-conversation (episodic memory via transcript history)
 *    - Embodiment:  Non-embodied (web app)
 *    - Model:       Generative (LLM backend) + Retrieval (heritage KB)
 *
 *  Guidelines applied:
 *    - Turn-taking:        Push-to-talk enforces "one speaker at a time"
 *    - Confirmation:       Implicit — caller receives transcript to echo back ("Got it...")
 *    - Error handling:     Four error states from lecture (no speech / no match / wrong / aborted)
 *    - Conv. markers:      Status exposed so UI can say "Listening…" / "Got it" / "Sorry…"
 *    - Don't monopolize:   Hook does ONE thing; TTS/LLM wiring is in voiceService.ts
 *    - Gricean quantity:   Errors are specific, not generic ("invalid")
 *    - Accessibility:      lang prop, interim results optional
 */

import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * VUI error taxonomy (from lecture slide "Error Handling"):
 *   NONE            — no error
 *   NO_SPEECH       — mic open, nothing detected (RMS silence)
 *   NO_MATCH        — speech detected, nothing recognized
 *   RECOGNITION     — something recognized but low confidence
 *   ABORTED         — user or system cancelled mid-utterance
 *   NOT_SUPPORTED   — browser has no SpeechRecognition API
 */
export type VoiceErrorType =
  | "NONE"
  | "NO_SPEECH"
  | "NO_MATCH"
  | "RECOGNITION"
  | "ABORTED"
  | "NOT_SUPPORTED";

/**
 * Turn-taking states (lecture slide "Turn-taking"):
 *   IDLE       — system is not listening; user may speak
 *   LISTENING  — mic is open, capturing utterance
 *   PROCESSING — utterance captured, waiting for transcript
 *   DONE       — transcript ready; system may now respond (implicit confirmation phase)
 *   ERROR      — something went wrong; system re-prompts
 */
export type ListeningState =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "DONE"
  | "ERROR";

export interface VoiceError {
  type: VoiceErrorType;
  /** Plain-English message the UI can display ("Couldn't catch that…") */
  message: string;
}

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag. Default: "en-US" */
  lang?: string;
  /**
   * Surface interim (partial) transcripts for live captions.
   * Lecture guideline "Show information only when necessary" — keep false
   * unless you're building a live caption panel.
   */
  showInterim?: boolean;
  /**
   * Minimum confidence threshold (0–1).
   * Below this we emit a RECOGNITION error and ask user to repeat.
   */
  confidenceThreshold?: number;
}

export interface UseSpeechRecognitionReturn {
  /** Final transcript of last recognised utterance */
  transcript: string;
  /** Partial transcript (only populated when showInterim=true) */
  interimTranscript: string;
  /** Current turn state — drives UI affordances (mic button, spinner, etc.) */
  listeningState: ListeningState;
  /** Deprecated alias kept for backwards compatibility with existing callers */
  listening: boolean;
  /** Current error, or null */
  error: VoiceError | null;
  /** Confidence score of last recognition (0–1) */
  confidence: number;
  /** Start listening. Safe to call when already listening (no-op). */
  startListening: () => void;
  /** Stop listening and commit the utterance. */
  stopListening: () => void;
  /** Clear transcript and reset to IDLE without starting a new session. */
  resetTranscript: () => void;
  /** True when the browser supports the Web Speech API */
  isSupported: boolean;
}

// ─── Error messages (Gricean maxim of manner — plain, specific) ───────────────

const ERROR_MESSAGES: Record<VoiceErrorType, string> = {
  NONE: "",
  NO_SPEECH: "I didn't hear anything. Tap the mic and speak clearly.",
  NO_MATCH: "Sorry, I couldn't catch that. Could you try again?",
  RECOGNITION: "I'm not sure I got that right. Could you repeat?",
  ABORTED: "Listening stopped. Tap the mic when you're ready.",
  NOT_SUPPORTED:
    "Your browser doesn't support voice input. Try Chrome on Android.",
};

function makeError(type: VoiceErrorType): VoiceError {
  return { type, message: ERROR_MESSAGES[type] };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSpeechRecognition = (
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const {
    lang = "en-US",
    showInterim = false,
    confidenceThreshold = 0.5,
  } = options;

  // ── State ──────────────────────────────────────────────────────────────────
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [listeningState, setListeningState] = useState<ListeningState>("IDLE");
  const [error, setError] = useState<VoiceError | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  // ── Refs (survive re-renders without triggering them) ─────────────────────
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = useRef<boolean>(
    typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  // ── Factory ────────────────────────────────────────────────────────────────
  /**
   * Build a fresh SpeechRecognition instance and wire all handlers.
   * Called lazily on first startListening() so we don't break SSR.
   *
   * Turn-taking contract (lecture slide 60):
   *   onstart  → LISTENING  (mic open, user's turn)
   *   onresult → PROCESSING (utterance committed, system's turn begins)
   *   onend    → DONE / ERROR (recognition session closed)
   */
  const buildRecognition = useCallback((): SpeechRecognition | null => {
    if (!isSupported.current) return null;

    const SR =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (
        window as Window & {
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    const rec = new SR();

    // Push-to-talk: continuous=false enforces one utterance per tap
    // Lecture: "one speaker at a time" — we never let the mic run open
    rec.continuous = false;
    rec.interimResults = showInterim;
    rec.lang = lang;
    rec.maxAlternatives = 3; // gives us confidence fallback options

    // ── Turn: system hands mic to user ─────────────────────────────────────
    rec.onstart = () => {
      setListeningState("LISTENING");
      setError(null);
      setInterimTranscript("");
    };

    // ── User speaks ────────────────────────────────────────────────────────
    rec.onresult = (event: SpeechRecognitionEvent) => {
      setListeningState("PROCESSING");

      let finalText = "";
      let interimText = "";
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];

        if (result.isFinal) {
          finalText += alt.transcript;
          bestConfidence = Math.max(bestConfidence, alt.confidence ?? 1);
        } else {
          interimText += alt.transcript;
        }
      }

      if (showInterim && interimText) {
        setInterimTranscript(interimText);
      }

      if (finalText) {
        setConfidence(bestConfidence);

        // Lecture: recognition error type = "something recognized incorrectly"
        // We apply confidence threshold and re-prompt (rapid reprompt, not verbose)
        if (bestConfidence > 0 && bestConfidence < confidenceThreshold) {
          setError(makeError("RECOGNITION"));
          setListeningState("ERROR");
        } else {
          setTranscript(finalText.trim());
          setListeningState("DONE");
          // ← Caller (voiceService / ChatPage) handles implicit confirmation:
          //   e.g. "Got it — [transcript]…" before sending to LLM
        }
      }
    };

    // ── Error handling (lecture slide 63: four error types) ────────────────
    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorType: VoiceErrorType;

      switch (event.error) {
        case "no-speech":
          errorType = "NO_SPEECH";
          break;
        case "no-match":
          errorType = "NO_MATCH";
          break;
        case "aborted":
          errorType = "ABORTED";
          break;
        case "not-allowed":
        case "service-not-allowed":
          errorType = "NOT_SUPPORTED";
          break;
        default:
          errorType = "NO_MATCH";
      }

      setError(makeError(errorType));
      setListeningState("ERROR");
    };

    // ── Turn ends: mic returns to system ───────────────────────────────────
    rec.onend = () => {
      setInterimTranscript("");
      // Only move to IDLE if we're not already in DONE or ERROR
      // (onresult fires before onend, so state is already set)
      setListeningState((prev) =>
        prev === "LISTENING" || prev === "PROCESSING" ? "IDLE" : prev
      );
    };

    return rec;
  }, [lang, showInterim, confidenceThreshold]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * startListening — hands the mic to the user.
   * Lecture: push-to-talk is the explicit turn-exchange token (slide 60).
   */
  const startListening = useCallback(() => {
    if (listeningState === "LISTENING") return; // already user's turn

    if (!isSupported.current) {
      setError(makeError("NOT_SUPPORTED"));
      setListeningState("ERROR");
      return;
    }

    // Rebuild each time so lang/options changes take effect
    recognitionRef.current = buildRecognition();
    recognitionRef.current?.start();
  }, [listeningState, buildRecognition]);

  /**
   * stopListening — system reclaims the turn.
   * Triggers onend → IDLE transition.
   */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  /**
   * resetTranscript — clears state without starting a new session.
   * Use before each new conversational turn.
   */
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setConfidence(0);
    setError(null);
    setListeningState("IDLE");
  }, []);

  return {
    transcript,
    interimTranscript,
    listeningState,
    listening: listeningState === "LISTENING", // backwards-compat alias
    error,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isSupported.current,
  };
};