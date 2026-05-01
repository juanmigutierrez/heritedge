export interface ChatResponse {
  answer: string;
  reply?: string; // alias used by VoiceAssistant and VoiceCommand
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

export const speak = (text: string, onEnd?: () => void): void => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  // Guard against Chrome's unreliable onend
  let fired = false;
  const finish = () => {
    if (!fired) { fired = true; onEnd?.(); }
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  // Chrome fallback — onend sometimes never fires
  setTimeout(finish, Math.max(3000, (text.length / 10) * 1000));

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};