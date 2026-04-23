# HeritEdge API

Backend for the HeritEdge web app. Owner: **P1** (with P2 on `/transcribe`, P6 on plumbing).

## Run locally

```bash
cd apps/api
cp .env.example .env      # fill in API keys from the shared vault
pnpm install
pnpm dev                  # http://localhost:3001
```

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
