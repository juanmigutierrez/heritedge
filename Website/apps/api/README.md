# HeritEdge API

Backend for the HeritEdge web app. Owner: **P1** (with P2 on `/transcribe`, P6 on plumbing).

## Run locally

```bash
cd apps/api
cp .env.example .env      # fill in API keys from the shared vault
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

2. **Ingest the knowledge base** (in the api terminal):
   ```bash
   npm run ingest-kb
   ```
   
   This reads `src/content/knowledge-base.json`, creates embeddings using OpenAI, and stores them in Chroma.
   
   **Requirements:**
   - `CHROMA_URL` set in `.env` (default: `http://localhost:8000`)
   - `OPENAI_API_KEY` or `GITHUB_TOKEN` for embeddings

3. **Verify**:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```
   Should return `{"ok": true}`.

Done! The `/chat` endpoint now retrieves facts from your knowledge base.

## Routes

| Route | Method | Owner | Purpose |
|---|---|---|---|
| `/health` | GET | P6 | Liveness for Vercel / Render |
| `/chat` | POST | P1 | RAG-grounded answer on Piazza Duomo |
| `/transcribe` | POST | P2 | Whisper fallback for voice |

See `src/types/api.ts` in the web app for the shared request/response shapes.

## Week-by-week

- **Week 1:** run the stub, deploy to Render/Railway, connect FE via `VITE_API_URL`.
- **Week 2 (P1):** ingest `src/content/knowledge-base.json` into Chroma, implement real RAG in `routes/chat.ts`.
- **Week 2 (P2):** wire Whisper in `routes/transcribe.ts`.
- **Week 3 (P1):** add citation rendering, low-confidence clarification paths, evals.
