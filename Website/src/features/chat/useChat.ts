// useChat — the ONLY way UI components talk to the chat backend. Owner: P1.
//
// UI contract (don't break without heads-up):
//   const { messages, send, isLoading } = useChat({ period, landmark });

import { useCallback, useState } from "react";
import type { ChatRequest, ChatResponse, Landmark, Period } from "../../types/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  period?: Period;
  landmark?: Landmark;
}

const mockResponses: Record<string, string> = {
  duomo: "The Duomo di Milano's construction began in 1386 and took nearly 600 years to complete.",
  galleria: "The Galleria Vittorio Emanuele II was built between 1865 and 1877.",
  war: "During WWII, Milan was heavily bombed. The Duomo was damaged but survived.",
};

export function useChat(opts: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const send = useCallback(
    async (text: string) => {
      const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
      setMessages((m) => [...m, user]);
      setIsLoading(true);

      const req: ChatRequest = {
        message: text,
        period: opts.period,
        landmark: opts.landmark,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      };

      const res: ChatResponse = await mockSend(req);

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: res.answer },
      ]);
      setIsLoading(false);
      return res;
    },
    [messages, opts.period, opts.landmark]
  );

  return { messages, send, isLoading, setMessages };
}

async function mockSend(req: ChatRequest): Promise<ChatResponse> {
  await new Promise((r) => setTimeout(r, 600));
  const key = Object.keys(mockResponses).find((k) => req.message.toLowerCase().includes(k));
  const answer = key
    ? mockResponses[key]
    : "I can answer about Duomo, Galleria, and Palazzo Reale. Try asking about one of those.";
  return { answer, sources: [], confidence: key ? 0.9 : 0.3 };
}
