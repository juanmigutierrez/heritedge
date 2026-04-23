# HeritEdge — Ownership Map

Each area has **one owner** (primary) and **one reviewer** (pair). Only the owner pushes changes to their area without a review. Everyone else opens a PR.

## Rule of isolation

**Nobody edits files outside their zone.** If you need something changed in another zone, open an issue or ask that owner. The folder structure makes zones explicit.

## Ownership

| Zone | Path | Owner | Reviewer | What lives here |
|---|---|---|---|---|
| Backend / AI | `apps/api/` | **P1** | P6 | Express server, `/chat`, `/transcribe`, RAG pipeline |
| Chat hook | `src/features/chat/` | **P1** | P4 | `useChat.ts` — the contract between UI and backend |
| Voice hook | `src/features/voice/` | **P2** | P4 | `useSpeechRecognition.ts` — Web Speech + Whisper fallback |
| WebXR scene | `src/features/ar/xr/` | **P3** | P6 | New `ARScene.tsx`, glTF loading, Hit Test |
| App shell + UI | `src/app/`, `src/components/ui/`, `src/styles/` | **P4** | P3 | Routes, layout, design system, existing Figma components |
| Services (HTTP) | `src/services/` | **P6** | P1 | Typed API clients — do not hardcode URLs elsewhere |
| Shared types | `src/types/` | **P6** | P1 | TypeScript contracts shared FE/BE |
| Content (knowledge) | `src/content/` | **P5** | P1 | `knowledge-base.json`, sources, period copy |
| Deliverable docs | `docs/deliverable/` | **P5** | P6 | Professor rework: modalities, grounding loops, storyboards, HTAs |
| Repo / CI / deploy | root, `.github/`, `vercel.json` | **P6** | P4 | Build, deploy, env vars |

## Integration points (how owners interface)

All "cross-zone" communication happens through **three contracts**. If you change a contract, announce it in standup.

1. **`src/types/api.ts`** — shape of requests/responses between FE and BE. Owned by P6. P1 proposes changes.
2. **`src/features/chat/useChat.ts`** — hook signature. P4 consumes it in `AIChat.tsx`. P1 implements it.
3. **`src/features/voice/useSpeechRecognition.ts`** — hook signature. P4 consumes it in `VoiceCommand.tsx`. P2 implements it.

Swap pattern (Week 1): existing components in `src/app/components/` import from these hooks. The hooks today return mock data identical to the current behavior. P1/P2 replace the hook internals with real calls — UI does not change.

## Current mock-to-real swap plan

| File | Current behavior | Week 1 swap |
|---|---|---|
| `src/app/components/AIChat.tsx` | hardcoded `aiResponses` map | import `useChat()` from `src/features/chat/useChat.ts` |
| `src/app/components/VoiceCommand.tsx` | `setTimeout` simulates transcript | import `useSpeechRecognition()` from `src/features/voice/useSpeechRecognition.ts` |
| `src/app/components/AROverview.tsx` | 2D pins on image | optional `/ar-xr` route rendering `ARScene.tsx` |

## Branch naming

`p1/chat-rag`, `p2/web-speech`, `p3/webxr-scene`, `p4/shell-cleanup`, `p5/knowledge-base`, `p6/deploy-pipeline`.

One person, one active branch at a time. Merge weekly.
