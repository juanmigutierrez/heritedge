import OpenAI from "openai";

export interface ChatResponse {
  answer: string;
  reply?: string; // alias used by VoiceAssistant and VoiceCommand
  sources?: Array<{ id: string; title: string; url?: string }>;
}

export const sendMessage = async (
  message: string,
  artifactContext?: string | null
): Promise<ChatResponse> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_OPENAI_API_KEY");

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const systemPrompt = artifactContext ? `Context: ${artifactContext}` : "";

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user", content: message },
    ],
  });

  const answer = completion.choices?.[0]?.message?.content?.trim() ?? "";
  return { answer, reply: answer };
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