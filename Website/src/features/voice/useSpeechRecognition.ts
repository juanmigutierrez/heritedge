// useSpeechRecognition — voice input hook. Owner: P2.
//
// Today this is a mock matching the current simulated-voice UX.
// Week 1 (P2): replace with real Web Speech API (webkitSpeechRecognition) +
//              fall back to the /transcribe endpoint (Whisper) on iOS / low confidence.
//
// UI contract:
//   const { start, stop, transcript, isListening, confidence } = useSpeechRecognition();

import { useCallback, useRef, useState } from "react";
// import { transcribe } from "../../services/voiceService"; // P2 uncomments in Week 1

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setIsListening(true);
    setTranscript("");
    // MOCK — P2 replaces this with real recognition.
    timeoutRef.current = setTimeout(() => {
      setTranscript("Take me to Duomo in medieval times");
      setConfidence(0.82);
      setIsListening(false);
    }, 1800);
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsListening(false);
  }, []);

  return { transcript, isListening, confidence, start, stop };
}
