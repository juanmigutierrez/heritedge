export interface ChatResponse {
  answer: string;
  reply?: string; // alias used by VoiceAssistant and VoiceCommand
  sources?: Array<{ id: string; title: string; url?: string }>;
}

export const sendMessage = async (
  message: string,
  artifactContext?: string | null
): Promise<ChatResponse> => {
  const res = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      artifact: artifactContext ?? null,
    }),
  });

  if (!res.ok) throw new Error("Chat request failed");

  return res.json();
};

// ─── Luca voice ───────────────────────────────────────────────────────────────

const LUCA_VOICE_PREFS = [
  "Google UK English Female",
  "Microsoft Zira",
  "Google US English",
  "Karen", "Alice", "Moira", "Tessa",
  "Samantha", "Victoria",
];

function pickLucaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  for (const pref of LUCA_VOICE_PREFS) {
    const v = voices.find((v) => v.name.includes(pref));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

// ─── Global speech event bus ──────────────────────────────────────────────────

type SpeechEventDetail = "start" | "pause" | "resume" | "end";

function dispatchSpeech(state: SpeechEventDetail): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("luca-speech", { detail: state }));
  }
}

// ─── Module-level state ───────────────────────────────────────────────────────
// All phrases are queued upfront. A 200 ms poll watches speechSynthesis.speaking
// so "end" only fires when the browser is truly done — no timers that can
// misfire. On pause we cancel the queue and store which phrase was playing;
// resume re-queues from that phrase.

let _generation  = 0;
let _isPaused    = false;
let _phrases: string[]       = [];
let _phraseIdx   = 0;
let _lastOnEnd: (() => void) | undefined;
let _pollId: ReturnType<typeof setInterval> | null = null;

function splitPhrases(text: string): string[] {
  return text
    .split(/(?<=[.!?,;:—–])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function makeUtterance(phrase: string): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(phrase);
  const voice = pickLucaVoice();
  if (voice) u.voice = voice;
  u.lang  = "en-US";
  u.rate  = 0.95;
  u.pitch = 1.05;
  return u;
}

function startPoll(gen: number, onEnd?: () => void): void {
  if (_pollId !== null) clearInterval(_pollId);
  _pollId = setInterval(() => {
    if (gen !== _generation) { clearInterval(_pollId!); _pollId = null; return; }
    if (_isPaused) return;
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      clearInterval(_pollId!); _pollId = null;
      dispatchSpeech("end"); onEnd?.();
    }
  }, 200);
}

function queuePhrases(phrases: string[], gen: number): void {
  phrases.forEach((phrase, i) => {
    const u = makeUtterance(phrase);
    u.onstart = () => { if (gen === _generation) _phraseIdx = i; };
    window.speechSynthesis.speak(u);
  });
}

export const speak = (text: string, onEnd?: () => void): void => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  _isPaused = false; _phrases = splitPhrases(text); _phraseIdx = 0; _lastOnEnd = onEnd;
  if (_phrases.length === 0) { onEnd?.(); return; }
  const gen = ++_generation;
  window.speechSynthesis.cancel();
  queuePhrases(_phrases, gen);
  dispatchSpeech("start");
  startPoll(gen, onEnd);
};

export const stopSpeaking = (): void => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  _generation++; _isPaused = false; _phrases = [];
  if (_pollId !== null) { clearInterval(_pollId); _pollId = null; }
  window.speechSynthesis.cancel();
  dispatchSpeech("end");
};

export const pauseSpeaking = (): void => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  _isPaused = true;
  if (_pollId !== null) { clearInterval(_pollId); _pollId = null; }
  window.speechSynthesis.cancel();
  dispatchSpeech("pause");
};

export const resumeSpeaking = (): void => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!_isPaused || !_phrases.length) return;
  _isPaused = false;
  const gen = ++_generation;
  const remaining = _phrases.slice(_phraseIdx);
  const baseIdx   = _phraseIdx;
  window.speechSynthesis.cancel();
  remaining.forEach((phrase, i) => {
    const u = makeUtterance(phrase);
    u.onstart = () => { if (gen === _generation) _phraseIdx = baseIdx + i; };
    window.speechSynthesis.speak(u);
  });
  dispatchSpeech("resume");
  startPoll(gen, _lastOnEnd);
};
