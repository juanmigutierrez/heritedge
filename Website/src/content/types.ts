// Schema for the heritage knowledge base. Owner: P5 (content), P1 (schema).
import type { Landmark, Period } from "../types/api";

export interface Source {
  label: string;
  url?: string;
}

export interface Entity {
  id: string;                  // e.g. "duomo", "galleria", "palazzo-reale", "piazza-del-duomo"
  name: string;                // e.g. "Duomo di Milano"
  type: "cathedral" | "arcade" | "palace" | "square" | "museum" | "landmark";
  shortDescription: string;    // 1–2 sentences
  location?: string;           // e.g. "Piazza del Duomo, Milan"
  aliases?: string[];          // e.g. ["Milan Cathedral", "Cattedrale di Santa Maria Nascente"]
  source: Source;
}

export interface HeritageFact {
  id: string;                  // stable slug, e.g. "duomo-1386-foundation"
  entityId: string;            // which entity this fact is about (e.g. "duomo")
  period: Period | "all";
  title: string;
  body: string;                // 1–3 sentences, self-contained
  tags: string[];              // e.g. ["architecture", "gothic", "marble", "restoration"]
  relatedEntityIds?: string[]; // e.g. ["piazza-del-duomo", "galleria"] if this fact connects multiple entities
  relationType?: string;       // e.g. "located_in", "adjacent_to", "part_of_complex"
  source: Source;              // required — the professor cares about grounding
}

export interface KnowledgeBase {
  version: string;             // bump when updated; re-run ingest-kb to sync Chroma
  updatedAt: string;           // ISO
  domain: {
    id: string;                // "piazza-del-duomo"
    name: string;              // "Piazza del Duomo, Milan"
    description: string;
    source: Source;
  };
  entities: Entity[];
  facts: HeritageFact[];
}
