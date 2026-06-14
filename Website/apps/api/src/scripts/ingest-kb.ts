/**
 * Ingest knowledge base into Chroma vector database.
 * 
 * Usage:
 *   npx tsx src/scripts/ingest-kb.ts
 * 
 * Requirements:
 *   - CHROMA_URL environment variable (default: http://localhost:8000)
 *   - OPENAI_API_KEY or OPENAI_EMBEDDING_KEY for embeddings
 * 
 * This script:
 *   - Reads src/content/knowledge-base.json
 *   - Creates embeddings for each fact using OpenAI
 *   - Stores facts in Chroma with metadata (entity, period, tags, sources)
 *   - Is idempotent — safe to run multiple times
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { ChromaClient } from "chromadb";

const noopEmbeddingFn = { generate: async (texts: string[]) => texts.map(() => [] as number[]) };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KnowledgeBase {
  version: string;
  updatedAt: string;
  domain?: {
    id: string;
    name: string;
    description: string;
    source: { label: string; url?: string };
  };
  entities?: Array<{
    id: string;
    name: string;
    type: string;
    shortDescription: string;
    location?: string;
    aliases?: string[];
    source: { label: string; url?: string };
  }>;
  facts: Array<{
    id: string;
    entityId?: string;
    landmark?: string;
    period: string;
    title: string;
    body: string;
    tags?: string[];
    relatedEntityIds?: string[];
    relationType?: string;
    source?: { label?: string; url?: string };
  }>;
}

async function ingestKnowledgeBase() {
  console.log("🚀 Starting knowledge base ingestion...\n");

  // ─── Load environment ──────────────────────────────────────────────────────
  const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
  const openaiKey = process.env.OPENAI_API_KEY || process.env.GITHUB_TOKEN;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!openaiKey) {
    throw new Error(
      "❌ Missing OPENAI_API_KEY or GITHUB_TOKEN for embeddings"
    );
  }

  console.log(`✓ Chroma URL: ${chromaUrl}`);
  console.log(`✓ Embedding model: OpenAI text-embedding-3-small\n`);

  // ─── Initialize clients ───────────────────────────────────────────────────
  const openai = githubToken
    ? new OpenAI({
        baseURL: "https://models.inference.ai.azure.com",
        apiKey: githubToken,
      })
    : new OpenAI({ apiKey: openaiKey });
  const chromaClient = new ChromaClient({ path: chromaUrl });

  // ─── Load knowledge base ──────────────────────────────────────────────────
  const kbPath = path.join(__dirname, "../../../../src/content/knowledge-base.json");
  if (!fs.existsSync(kbPath)) {
    throw new Error(`❌ Knowledge base file not found: ${kbPath}`);
  }

  const kbRaw = fs.readFileSync(kbPath, "utf-8");
  const kb: KnowledgeBase = JSON.parse(kbRaw);

  console.log(`📖 Loaded knowledge base v${kb.version}`);
  console.log(`   Domain: ${kb.domain?.name ?? "Unknown"}`);
  console.log(`   Entities: ${kb.entities?.length ?? 0}`);
  console.log(`   Facts: ${kb.facts.length}\n`);

  // ─── Prepare documents for Chroma ─────────────────────────────────────────
  const documents: string[] = [];
  const metadatas: Array<Record<string, string>> = [];
  const ids: string[] = [];

  const entitiesById = new Map(
    (kb.entities ?? []).map((entity) => [entity.id, entity.name])
  );

  for (const fact of kb.facts) {
    const entityId = fact.entityId ?? fact.landmark ?? "unknown";
    const entityName = entitiesById.get(entityId) ?? entityId;

    // Document text: fact title + body (this is what gets embedded)
    const documentText = `${fact.title}. ${fact.body}`;

    // Metadata: for filtering and source attribution
    const metadata: Record<string, string> = {
      id: fact.id,
      entity_id: entityId,
      entity_name: entityName,
      period: fact.period,
      tags: (fact.tags ?? []).join(","),
      source_label: fact.source?.label ?? "Unknown source",
      ...(fact.source?.url && { source_url: fact.source.url }),
      ...(fact.relatedEntityIds && {
        related_entity_ids: fact.relatedEntityIds.join(","),
      }),
      ...(fact.relationType && { relation_type: fact.relationType }),
    };

    documents.push(documentText);
    metadatas.push(metadata);
    ids.push(fact.id);
  }

  console.log(`📝 Prepared ${documents.length} documents for embedding...\n`);

  // ─── Create embeddings ────────────────────────────────────────────────────
  console.log("⏳ Creating embeddings (this may take a moment)...");
  const embeddingsResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: documents,
    encoding_format: "float",
  });

  const embeddings = embeddingsResponse.data.map((d) => d.embedding);
  console.log(`✓ Created ${embeddings.length} embeddings\n`);

  // ─── Get or create Chroma collection ──────────────────────────────────────
  const collectionName = "piazza-del-duomo";
  console.log(`🗂️  Getting or creating Chroma collection: "${collectionName}"`);

  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: noopEmbeddingFn,
    metadata: {
      description: kb.domain?.description ?? "Heritage knowledge base",
      version: kb.version,
      updatedAt: kb.updatedAt,
    },
  });

  console.log(`✓ Collection ready\n`);

  // ─── Upsert documents into Chroma ─────────────────────────────────────────
  console.log(`🔄 Upserting ${documents.length} documents into Chroma...`);

  await collection.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  console.log(`✓ Upsert complete\n`);

  // ─── Verify ingestion ─────────────────────────────────────────────────────
  console.log("✅ Verification:\n");

  const count = await collection.count();
  console.log(`   Total documents in collection: ${count}`);

  // Test query
  const testQuery = "Tell me about the Duomo cathedral";
  console.log(`\n   Test query: "${testQuery}"`);

  const testEmbeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: testQuery,
    encoding_format: "float",
  });

  const testEmbedding = testEmbeddingResponse.data[0]?.embedding;
  if (!testEmbedding) {
    throw new Error("❌ Failed to create verification embedding");
  }

  const results = await collection.query({
    queryEmbeddings: [testEmbedding],
    nResults: 3,
  });

  if (results && results.documents && results.documents[0]) {
    console.log("   Top 3 results:");
    results.documents[0].forEach((doc, i) => {
      if (doc) {
        console.log(`     ${i + 1}. ${doc.substring(0, 80)}...`);
      }
    });
  }

  console.log("\n🎉 Knowledge base successfully ingested into Chroma!");
  console.log(`   Collection: ${collectionName}`);
  console.log(`   Documents: ${count}`);
  console.log(`   Ready for RAG queries!\n`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

ingestKnowledgeBase().catch((err) => {
  console.error("❌ Ingestion failed:", err.message);
  process.exit(1);
});

