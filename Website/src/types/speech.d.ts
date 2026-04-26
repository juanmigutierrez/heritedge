// src/types/speech.d.ts
// Augments the global Window interface so TypeScript knows about
// the Web Speech API, which lib.dom.d.ts only partially covers.

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}