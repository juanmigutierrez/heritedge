// Chat service — the single way to talk to /chat. Owner: P1.
import { apiPost } from "./apiClient";
import type { ChatRequest, ChatResponse } from "../types/api";

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  return apiPost<ChatRequest, ChatResponse>("/chat", req);
}
