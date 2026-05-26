# HeritEdge API

Node.js + Express backend for the HeritEdge web app.

## Run locally

```bash
cd apps/api
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev               # http://localhost:3001
```

## Ingest knowledge base (RAG setup)

To enable real answers grounded in Piazza Duomo facts:

1. **Start Chroma** (in a separate terminal):
   ```bash
   docker run -p 8000:8000 chromadb/chroma
   ```
   If Docker is not installed, see [Chroma installation docs](https://docs.trychroma.com/guides).

2. **Ingest the knowledge base**:
   ```bash
   npm run ingest-kb
   ```
   This reads `src/content/knowledge-base.json`, creates embeddings via OpenAI, and stores them in Chroma.

   **Requirements:**
   - `CHROMA_URL` set in `.env` (default: `http://localhost:8000`)
   - `OPENAI_API_KEY` or `GITHUB_TOKEN` for embeddings

3. **Verify**:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```
   Should return `{"nanosecond heartbeat": ...}`.

The ingestion script is idempotent — safe to re-run whenever `knowledge-base.json` changes.

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/health` | GET | Liveness check |
| `/chat` | POST | RAG-grounded answer about Piazza Duomo |
| `/transcribe` | POST | Whisper fallback for voice input |
| `/hunt-grade` | POST | Grade a free-form treasure hunt answer |
| `/hunt-hint` | POST | Return a laddered hint for a stuck challenge |
| `/verify-photo` | POST | Vision-model check for treasure hunt photo challenges |
