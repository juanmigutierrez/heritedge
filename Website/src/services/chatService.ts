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

// Kept for VoiceAssistant.tsx and VoiceCommand.tsx compatibility
export const speak = (text: string): void => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

export const stopSpeaking = (): void => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};