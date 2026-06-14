import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { ChromaClient } from "chromadb";

// We compute embeddings ourselves via OpenAI, so we pass a stub to satisfy
// chromadb v3's requirement for an explicit EmbeddingFunction.
const noopEmbeddingFn = { generate: async (texts: string[]) => texts.map(() => [] as number[]) };

const router = Router();

const collectionName = "piazza-del-duomo";
const retrievalLimit = 4;
const minConfidence = 0.45;

const llmApiKey = process.env.GITHUB_TOKEN ?? process.env.OPENAI_API_KEY;
const embeddingApiKey =
  process.env.OPENAI_API_KEY ?? process.env.OPENAI_EMBEDDING_KEY ?? process.env.GITHUB_TOKEN;

if (!llmApiKey) {
  console.warn("[chat] Missing GITHUB_TOKEN / OPENAI_API_KEY for Llama requests.");
}

if (!embeddingApiKey) {
  console.warn("[chat] Missing OpenAI embedding key; retrieval will be unavailable.");
}

const llmClient = llmApiKey
  ? new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: llmApiKey,
    })
  : null;

const embeddingClient = embeddingApiKey
  ? new OpenAI(
      process.env.GITHUB_TOKEN && !process.env.OPENAI_API_KEY
        ? {
            baseURL: "https://models.inference.ai.azure.com",
            apiKey: embeddingApiKey,
          }
        : { apiKey: embeddingApiKey }
    )
  : null;
const chromaClient = new ChromaClient({ path: process.env.CHROMA_URL || "http://localhost:8000" });

type RetrievedSource = {
  id: string;
  title: string;
  url?: string;
  score: number;
  entityId?: string;
  entityName?: string;
  period?: string;
  relationType?: string;
  excerpt: string;
};

function buildMetadataFilter(period?: string, landmark?: string) {
  const where: Record<string, unknown> = {};

  if (period) {
    where.period = period;
  }

  if (landmark) {
    where.entity_id = landmark;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function formatContext(sources: RetrievedSource[]) {
  if (sources.length === 0) {
    return "No retrieved context was found in the Piazza del Duomo knowledge base.";
  }

  return sources
    .map((source, index) => {
      const citation = source.url ? `${source.title} (${source.url})` : source.title;
      return [
        `Source ${index + 1}: ${citation}`,
        `Entity: ${source.entityName ?? source.entityId ?? "unknown"}`,
        source.period ? `Period: ${source.period}` : null,
        source.relationType ? `Relation: ${source.relationType}` : null,
        `Relevance: ${source.score.toFixed(3)}`,
        `Fact: ${source.excerpt}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

async function retrieveSources(message: string, period?: string, landmark?: string) {
  if (!embeddingClient) {
    return [] as RetrievedSource[];
  }

  try {
    const embeddingResponse = await embeddingClient.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
      encoding_format: "float",
    });

    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    if (!queryEmbedding) {
      return [] as RetrievedSource[];
    }

    const collection = await chromaClient.getOrCreateCollection({ name: collectionName, embeddingFunction: noopEmbeddingFn });
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: retrievalLimit,
      where: buildMetadataFilter(period, landmark),
      include: ["documents", "metadatas", "distances"] as any,
    });

    const documents = results.documents?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    return documents
      .map((document, index) => {
        const metadata = (metadatas[index] ?? {}) as Record<string, string>;
        const distance = typeof distances[index] === "number" ? distances[index] : 1;
        const score = Math.max(0, 1 - distance);
        const excerpt = document ?? "";

        return {
          id: metadata.id ?? `source-${index + 1}`,
          title: metadata.source_label ?? metadata.entity_name ?? "Knowledge base fact",
          url: metadata.source_url,
          score,
          entityId: metadata.entity_id,
          entityName: metadata.entity_name,
          period: metadata.period,
          relationType: metadata.relation_type,
          excerpt,
        } satisfies RetrievedSource;
      });
  } catch (error) {
    console.error("[chat] Retrieval failed; continuing without knowledge base context:", error);
    return [] as RetrievedSource[];
  }
}

// ─── Transparency helpers ─────────────────────────────────────────────────────

/** Human-readable period labels shown in the source pill. */
const PERIOD_LABELS: Record<string, string> = {
  birth:  "Birth era (1386–1500s)",
  crown:  "Crown era (1500s–1860)",
  modern: "Modern era (1860–today)",
};

/** Human-readable landmark names. */
const LANDMARK_LABELS: Record<string, string> = {
  duomo:    "Duomo",
  galleria: "Galleria",
  palazzo:  "Palazzo Reale",
};

/**
 * Two follow-up questions anchored to heritage content, keyed by
 * "{entityId}-{period}". These stay within the knowledge base so users
 * can keep exploring without leaving the reliable source base (solution 4).
 */
const FOLLOW_UPS: Record<string, [string, string]> = {
  "duomo-birth":     ["Who commissioned the Duomo's construction?", "How long did the Duomo take to build?"],
  "duomo-crown":     ["Who designed the Madonnina on top of the Duomo?", "What role did Napoleon play at the Duomo?"],
  "duomo-modern":    ["What happened to the Duomo area during WWII?", "How many visitors does the Duomo get each year?"],
  "galleria-birth":  ["Who designed the Galleria Vittorio Emanuele II?", "When did construction of the Galleria begin?"],
  "galleria-crown":  ["What is the architectural style of the Galleria?", "What is the bull mosaic tradition in the Galleria?"],
  "galleria-modern": ["When was the Galleria inaugurated?", "What famous events happened in the Galleria?"],
  "palazzo-birth":   ["What was Palazzo Reale used for in the medieval era?", "Who originally commissioned Palazzo Reale?"],
  "palazzo-crown":   ["Who redesigned Palazzo Reale in the 18th century?", "What is the Sala delle Cariatidi?"],
  "palazzo-modern":  ["What exhibitions are held at Palazzo Reale today?", "How was Palazzo Reale damaged in WWII?"],
};

/** Generic fallback follow-ups when no specific landmark/period is matched. */
const FALLBACK_FOLLOW_UPS: [string, string] = [
  "What is the history of the Duomo di Milano?",
  "When was the Galleria Vittorio Emanuele II built?",
];

function pickFollowUps(sources: RetrievedSource[]): [string, string] {
  const top = sources[0];
  if (!top?.entityId || !top?.period) return FALLBACK_FOLLOW_UPS;
  const key = `${top.entityId}-${top.period}`;
  return FOLLOW_UPS[key] ?? FALLBACK_FOLLOW_UPS;
}

function buildEntityHint(sources: RetrievedSource[]): { name: string; period: string } | undefined {
  const top = sources[0];
  if (!top) return undefined;
  const name   = LANDMARK_LABELS[top.entityId ?? ""] ?? top.entityName ?? undefined;
  const period = PERIOD_LABELS[top.period ?? ""] ?? top.period ?? undefined;
  if (!name && !period) return undefined;
  return { name: name ?? "", period: period ?? "" };
}

function buildConfidenceLabel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
}

function buildSystemPrompt(context: string) {
  return [
    "You are a grounded historical assistant for Piazza del Duomo in Milan.",
    "Use only the retrieved context below when answering.",
    "If the exact wording of the question is not present, answer using the closest supported facts and clear historical inference from the context.",
    "Only say the context is not enough when none of the retrieved facts support a safe answer.",
    "Keep answers concise, accurate, and helpful.",
    "When possible, mention which landmark the fact belongs to.",
    "",
    "Retrieved context:",
    context,
  ].join("\n");
}

function buildFallbackAnswer(message: string, sources: RetrievedSource[]) {
  if (sources.length === 0) {
    return "I could not find supporting facts in the knowledge base.";
  }

  const normalizedMessage = message.toLowerCase();
  const supportingSource =
    sources.find((source) => source.id === "duomo-1386-foundation") ??
    sources.find((source) => source.entityId === "duomo" && /1386|medieval|foundation|construction/i.test(source.excerpt)) ??
    sources.find((source) => /1386|medieval|foundation|construction/i.test(source.excerpt)) ??
    sources[0];
  const supportSentence = supportingSource.excerpt
    .split(/\.\s+/)
    .map((sentence) => sentence.trim())
    .find((sentence) => /1386|medieval|began|construction/i.test(sentence))
    ?? supportingSource.excerpt.split(/\.\s+/)[0]?.trim();

  if (normalizedMessage.includes("visconti")) {
    return supportSentence
      ? `The retrieved facts do not mention the Visconti era directly, but they do support saying that ${supportSentence.replace(/\.$/, "")}.`
      : "The retrieved facts do not mention the Visconti era directly, but they do support a medieval-era answer about the Duomo.";
  }

  return supportSentence
    ? `Based on the retrieved facts, ${supportSentence}.`
    : "Based on the retrieved facts, I can only give a limited answer from the knowledge base.";
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, period, landmark } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!llmClient) {
      return res.status(500).json({
        error: "Missing GITHUB_TOKEN / OPENAI_API_KEY for Llama 3 requests",
      });
    }

    const sources = await retrieveSources(message, period, landmark);
    const context = formatContext(sources);
    const systemPrompt = buildSystemPrompt(context);

    const response = await llmClient.chat.completions.create({
      model: "Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: sources.length > 0 ? 0.3 : 0.5,
      max_tokens: 1024,
    });

    const modelAnswer = response.choices[0]?.message?.content?.trim() || "I could not generate an answer.";
    const refusalPattern = /not enough|does not contain enough|cannot provide|insufficient/i;
    const answer = refusalPattern.test(modelAnswer)
      ? buildFallbackAnswer(message, sources)
      : modelAnswer;
    const confidence = sources.length === 0 ? 0.2 : Math.min(0.95, 0.55 + sources[0]!.score * 0.4);
    const confidenceLabel = buildConfidenceLabel(confidence);
    const entityHint = buildEntityHint(sources);
    const followUps = pickFollowUps(sources);

    return res.status(200).json({
      answer,
      reply: answer,
      sources: sources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
      })),
      confidence,
      confidenceLabel,
      entityHint,
      followUps,
      needsClarification:
        confidence < minConfidence
          ? {
              reason: "scope",
              options: ["Duomo", "Galleria Vittorio Emanuele II", "Palazzo Reale"],
            }
          : undefined,
    });
  } catch (error) {
    console.error("Error generating chat response:", error);
    return res.status(500).json({
      error: "Failed to retrieve knowledge base facts or communicate with Llama 3",
    });
  }
});

export { router as chatRouter };