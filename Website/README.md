# Duomo Heritage Mobile Website

HeritEdge — a multimodal AR + chat + voice heritage experience for Piazza del Duomo, Milan.
Polimi MITA course project.

Original Figma design: https://www.figma.com/design/TY0IjSRgLUGwilabm3olrD/Duomo-Heritage-Mobile-Website

See [`OWNERS.md`](./OWNERS.md) for who owns which zone of the codebase.

---

## Prerequisites

- **Node.js 20+** — install the LTS from https://nodejs.org. After installing, close and reopen your terminal, then verify:
  ```bash
  node --version
  npm --version
  ```
- **Git** — https://git-scm.com/download/win
- A modern browser. For AR on a phone, use **Chrome on Android** (Safari doesn't support WebXR).

---

## Install and run — web app

From the repo root (this folder):

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). You should see the Home screen.

To test on your phone over the same Wi-Fi:

```bash
npm run dev -- --host
```

Vite will also print a `http://192.168.x.x:5173` URL — open that on your phone.

---

## Install and run — backend API

The backend lives in `apps/api/`. Open a **second terminal**:

```bash
cd apps/api
copy .env.example .env       # on macOS/Linux: cp .env.example .env
npm install
npm run dev
```

It should print `[api] listening on http://localhost:3001`.

Quick sanity check in a third terminal:

```bash
curl http://localhost:3001/health
```

Should return `{"ok":true}`.

### API environment variables

Edit the `.env` you just copied. Keys live in the shared team vault — ask P6 if you don't have them.

| Variable | Needed for | Owner |
|---|---|---|
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | `/chat` real LLM responses (Week 2+) | P1 |
| `OPENAI_API_KEY_WHISPER` | `/transcribe` Whisper fallback | P2 |
| `CHROMA_URL` | RAG vector DB (Week 2+) | P1 |
| `WEB_ORIGIN` | CORS — set to your Vite URL | P6 |

Stubs work without any keys, so you can develop the UI without them.

---

## Connecting the web app to the backend

By default the web app calls `http://localhost:3001`. If your backend runs elsewhere, create a `.env.local` in this folder:

```
VITE_API_URL=http://localhost:3001
```

---

## Project layout (short version)

```
Website/
├── apps/api/          # backend (P1)
├── src/
│   ├── app/           # existing Figma shell, routes (P4)
│   ├── features/
│   │   ├── chat/      # useChat hook (P1)
│   │   ├── voice/     # useSpeechRecognition hook (P2)
│   │   └── ar/xr/     # new WebXR scene (P3)
│   ├── services/      # HTTP clients (P6)
│   ├── content/       # knowledge base (P5)
│   └── types/         # shared FE/BE types
└── docs/deliverable/  # professor rework (P5)
```

---

## Common issues

**`npm` not recognized.** Node isn't installed, or you need to close and reopen the terminal after installing.

**`EACCES` or permission errors.** Don't run `npm install` with `sudo`. If needed, fix npm's default prefix or use `nvm`.

**Port already in use.** Something else is on 5173 or 3001. Kill it, or change the port: `npm run dev -- --port 5174`.

**CORS error in browser console.** Your web URL doesn't match `WEB_ORIGIN` in `apps/api/.env`. Update it and restart the backend.

**WebXR doesn't enter AR on phone.** Use Chrome on Android. Safari and Firefox don't support WebXR yet. The `<model-viewer>` fallback is the Week 3 plan for iOS.

---

## Git workflow

- Branch per person per feature: `p1/chat-rag`, `p3/webxr-scene`, etc.
- Open a PR to `main`. One teammate (from a different zone) reviews and approves.
- Don't push directly to `main` — branch protection is on.
- See `OWNERS.md` for zones.
