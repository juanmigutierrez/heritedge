// Schema for the heritage knowledge base. Owner: P5 (content), P1 (schema).
import type { Landmark, Period } from "../types/api";

export interface HeritageFact {
  id: string;                  // stable slug, e.g. "duomo-1386-foundation"
  landmark: Landmark;
  period: Period | "all";
  title: string;
  body: string;                // 1–3 sentences, self-contained
  tags: string[];              // e.g. ["architecture", "gothic", "marble"]
  source: {                    // required — the professor cares about grounding
    label: string;
    url?: string;
  };
}

export interface KnowledgeBase {
  version: string;             // bump when P5 updates; P1 re-ingests to Chroma
  updatedAt: string;           // ISO
  facts: HeritageFact[];
}
