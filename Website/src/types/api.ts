// Shared FE/BE contracts. Owner: P6. Proposers: P1 (chat), P2 (voice).
// ⚠️ Change these only via PR with a heads-up in standup — everyone depends on them.

export type Period = "birth" | "crown" | "modern";

export type Landmark = "duomo" | "galleria" | "palazzo";

export interface ChatSource {
  id: string;
  title: string;
  url?: string;
}

export interface ChatRequest {
  message: string;
  period?: Period;           // from the timeline slider
  landmark?: Landmark;       // set when chatting in AR context
  history?: {
    role: "user" | "assistant";
    content: string;
  }[];
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];     // for citation UI (week 3)
  confidence: number;        // 0..1, used by grounding loop
  needsClarification?: {     // populated when confidence is low
    reason: "referential" | "temporal" | "scope";
    options: string[];       // chips shown to user
  };
}

export interface TranscribeRequest {
  audio: Blob;               // multipart upload
  language?: string;         // "en", "it"
}

export interface TranscribeResponse {
  transcript: string;
  confidence: number;
}
