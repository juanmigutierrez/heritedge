# Sprint Plan — Six Parallel Tracks

Five working days, six teammates, six parallel tracks. Each track is **self-contained** (minimal cross-team blocking), owns a specific set of files, and ends in something demonstrable on Friday. A daily sync at 09:00 and a 17:00 integration check on the staging URL keep everyone aligned.

> **Goal as a team:** by Friday EOD, a reviewer can pick up an iPhone in Piazza del Duomo and complete one fully-multimodal vertical slice — Home → Quick Guide chapter with illustration → Treasure Hunt photo challenge → voice answer → Summary — with every screen visually coherent.

---

## Team at a glance

| Track | Role | Owner | Headline deliverable |
|---|---|---|---|
| **A** | Design-system completion | UI / Tailwind specialist | All remaining routes use new theme tokens |
| **B** | Content + i18n | Research / content / Italian speaker | Real images placed; Italian copy for hero screens |
| **C** | Story player + illustrations | React + animation | Before/after Cariatidi slider; image-backed chapter heroes |
| **D** | Multimodal voice + AI | Web-APIs / multimodal | Voice TTS + STT work on iPhone; Luca chat hits real OpenAI |
| **E** | AR + map | Three.js / WebXR / Leaflet | PanoramaScene mobile-ready; walking-tour map at /map |
| **F** | Demo, testing, deploy | PM / QA / integration | Staging deploy, daily device tests, 90-sec demo video |

Each track has a primary owner; pairing is welcome and encouraged on Wed/Thu when integration risk is highest.

---

## Track A — Design-system completion

**Owner: UI / Tailwind specialist**

The three routes the reviewer will click after the home screen (Treasure Hunt, Quiz Feedback, Summary) and the AR detail screen still use the old `stone-*`/`amber-*` palette. Until they're migrated, the app looks half-finished.

### Files owned
- `src/app/components/TreasureHunt.tsx` (714 lines)
- `src/app/components/QuizFeedback.tsx` (152 lines)
- `src/app/components/Summary.tsx` (204 lines)
- `src/app/components/ARArtifactDetail.tsx` (overlays only — keep the camera surface as-is)
- `src/app/components/ui/*` (shared loading skeleton + error states)

### Deliverables
- [ ] Replace every `bg-stone-*`, `text-amber-*`, `border-emerald-*` with `bg-card`, `text-foreground`, `var(--accent)` equivalents.
- [ ] Loading skeleton component in `ui/Skeleton.tsx` (gold-tinted shimmer).
- [ ] Error-state component in `ui/ErrorBoundary.tsx` for failed AI/camera calls.
- [ ] Accessibility pass: `aria-label` on every icon button, visible focus ring on all interactive elements, tap targets ≥ 44 px.

### Definition of done
Open DevTools → search the rendered HTML for `stone-` and `amber-`. Zero hits. Every screen passes a one-minute light/dark toggle test with no contrast surprises.

### Dependencies
- Track B's i18n keys arrive Wed — wrap text in `t('...')` calls when migrating (a no-op stub is fine until the keys exist).

---

## Track B — Content + i18n

**Owner: research / content / Italian speaker**

Real images, real Italian text, polished microcopy. The most "tangible" track and the only one that needs the others' code to be done before its work matters.

### Files owned
- `src/assets/history/**` (new)
- `src/content/treasure-hunt.json` (extend with `media` block)
- `src/content/knowledge-base.json` (extend with new anecdotes from the dossier)
- `src/i18n.ts` (new)
- `src/i18n/en.json`, `src/i18n/it.json` (new)

### Deliverables
- [ ] Download the eight must-have images from `Conceptual_Design/Image-Sources.md` and `Treasure-Hunt-Content.md`. Place into `src/assets/history/{duomo,galleria,palazzo}/`.
- [ ] Write `scripts/resize-history.mjs` using `sharp` to output 1200 px WebP versions.
- [ ] Extend `treasure-hunt.json` with the `media: { hint, reveal, bonus[] }` block per challenge.
- [ ] Cross-reference the Landmarks-Periods.md anecdotes into `knowledge-base.json` so AIChat (Luca) and TreasureHunt's `relatedFactIds` can pull them.
- [ ] Build a minimal `i18n.ts` — a 30-line hook that picks `en` or `it` from `localStorage`, returns string by key.
- [ ] Translate ~40 key strings: Home hero, chapter titles, treasure hunt prompts, theme toggle labels.
- [ ] Write `alt` text for every image, in both languages.

### Definition of done
Every image referenced by the codebase exists in `src/assets/history/`. The home screen has an EN/IT toggle and switching it changes hero copy.

### Dependencies
- Receives Track A's `t('...')` call sites mid-week; Track A's strings need to match Track B's keys.
- Delivers images by **Tuesday EOD** so Track C can wire them in.

---

## Track C — Story player + illustrations

**Owner: React + animation**

The story player is the cinematic heart of the demo. Adds the single most powerful set-piece (the Cariatidi before/after) and lets real images replace the dot-grid placeholders in chapter heroes.

### Files owned
- `src/app/components/quick-guide/StoryView.tsx`
- `src/app/components/quick-guide/illustrations.tsx`
- `src/app/components/quick-guide/scenes.ts`
- A new `src/app/components/quick-guide/BeforeAfter.tsx`
- `src/app/components/QuickGuide.tsx` (cinematic hero panel only — share with Track A!)

### Deliverables
- [ ] New scene type `beforeAfter` in `scenes.ts`: `{ kind: 'beforeAfter'; beforeImage: string; afterImage: string; beforeLabel: string; afterLabel: string; caption?: string }`.
- [ ] Build `BeforeAfter.tsx`: two images stacked with a draggable vertical handle that wipes between them. Touch-friendly.
- [ ] Add the Cariatidi before/after as the closing scene of the Habsburg chapter.
- [ ] Update the cinematic hero panel in `QuickGuide.tsx` to accept an optional `backgroundImage` prop and layer the gold dot grid over it.
- [ ] Wire era-specific historical images into each chapter's hero (image filenames coordinated with Track B).
- [ ] Polish: respect `prefers-reduced-motion` everywhere in the player (already partly done).

### Definition of done
Open the Habsburg chapter, tap through to the last scene, drag the slider. The Cariatidi reveals from intact (1900) to scarred (today) and back.

### Dependencies
- Receives images from Track B by **Tuesday EOD**. Until then, work with placeholder local files.
- Coordinates with Track A on shared file `QuickGuide.tsx` — agree which sections each owns. Suggestion: A handles the timeline tabs + action buttons; C handles the cinematic hero block.

---

## Track D — Multimodal voice + AI

**Owner: web-APIs / multimodal**

Voice TTS + STT and the Luca chatbot make the "multimodal" claim real. iOS Safari has known quirks; harden against them.

### Files owned
- `src/features/voice/useSpeechRecognition.ts`
- `src/services/chatService.ts`
- A new `src/services/visionService.ts` for treasure-hunt photo verification
- AIChat-related logic inside `QuickGuide.tsx` (chat view only)

### Deliverables
- [ ] Verify **Speech Synthesis** (`speak()` in `chatService.ts`) works on iPhone Safari. Add a one-time user-gesture unlock on the first nav into a chapter — without it, iOS silently blocks the first call.
- [ ] Verify **Speech Recognition** on iPhone Safari. Webkit's API is prefixed and quirky; add a graceful fallback to text input if recognition is unavailable.
- [ ] Wire the real **OpenAI SDK** call into `sendMessage()` so Luca's persona prompt actually goes to GPT-4. The `openai` package is already in `package.json`; needs `VITE_OPENAI_API_KEY` env var.
- [ ] Build `visionService.ts` — given a `File` and a `subject` string, call a vision model and return `{ matches: boolean, confidence: number, reason: string }`. The treasure-hunt scaffold expects this shape.
- [ ] Add proper error states: API down, mic blocked, vision API unsure, network offline.
- [ ] A small "mic permission" preview card on first chat-view open so users know what's about to be asked.

### Definition of done
On an iPhone: open Quick Guide → Visconti chapter → "Ask Luca" → speak a question → see Luca's answer in chat and hear it spoken back. Open Treasure Hunt → photo challenge → upload photo → vision model returns a correctness verdict.

### Dependencies
- Independent of other tracks except needing one of the Track A migrated chat-input UIs to render the new state.
- Needs an OpenAI API key configured for the demo (Track F owns env config).

---

## Track E — AR + map

**Owner: Three.js / WebXR / Leaflet**

The AR experience and a walking-tour map make the spatial side of the app feel real. This is the highest-risk track for compatibility; if AR breaks, fall back gracefully.

### Files owned
- `src/features/ar/xr/PanoramaScene.tsx`
- `src/app/components/ARArtifactDetail.tsx` (camera surface — Track A handles overlays)
- A new `src/app/components/Map.tsx`
- A new route `/map` in `src/app/routes.tsx`

### Deliverables
- [ ] Audit `PanoramaScene.tsx`. Make sure it renders on iPhone Safari (Three.js + `@react-three/xr` can be finicky).
- [ ] Pick **one landmark** (Madonnina is easiest — single static point of interest) and make the full `AR Overview → AR Artifact Detail` flow work end-to-end on a phone.
- [ ] Add `React.lazy()` wrappers around the AR module in `routes.tsx` to **code-split** the Three.js bundle — this should drop initial JS from ~522 KB to ~300 KB.
- [ ] Build `Map.tsx` using **Leaflet** + OpenStreetMap tiles. Pin the 14 tour stops from `treasure-hunt.json`. Tapping a pin opens a small bottom-sheet card with the stop's title and a "Begin chapter" button.
- [ ] Add a "View map" entry in the bottom nav (or a small map icon in the header).

### Definition of done
On an iPhone: open AR Overview, see the panorama tilt with the device. Open AR Artifact Detail for the Madonnina, see an overlay. Open `/map`, see the 14 pins on the Piazza area.

### Dependencies
- Independent of other tracks. Coordinates with Track A on the new `/map` route's chrome (uses AppShell).

---

## Track F — Demo, testing, deploy

**Owner: PM / QA / integration**

The connective tissue. Without this track, the others ship code in five directions and nothing converges. Without the others, this track has nothing to test.

### Files owned
- `vite.config.ts`, `package.json` (scripts only)
- `.env.example`
- A new `vite.config.ts` change for `vite-plugin-pwa`
- A new `manifest.webmanifest`
- A `public/icons/*` set for the PWA
- `Documentation/Demo-Script.md` (new)

### Deliverables
- [ ] Set up **Vercel or Netlify** deploy from `main`. Every push gets a preview URL.
- [ ] **Daily device test** — at 17:00 every day, walk the vertical slice on a real iPhone and Android. File issues in GitHub for each break, tag the responsible track.
- [ ] Add `vite-plugin-pwa` with a basic service worker that caches the app shell and the last-viewed chapter (offline-first for the "in front of the cathedral, bad signal" case).
- [ ] Add `manifest.webmanifest` with the HeritEdge name + gold accent + icons so "Add to Home Screen" produces a clean install.
- [ ] Build the **Summary screen** properly (Track A only themes it — F decides what data lives there): score, time, stops visited, badges earned, "share" button.
- [ ] Write the **demo script** (`Documentation/Demo-Script.md`) — a minute-by-minute reviewer walkthrough.
- [ ] Friday afternoon: **record a 90-second demo video** on a real phone. This is the safety-net deliverable; if anything breaks live, you play the video.
- [ ] Make a short **slide deck** (3 slides max): problem, multimodal solution, vertical-slice screenshots.

### Definition of done
There's a working staging URL on every branch. A 90-second video plays the full vertical slice without a glitch. The reviewer can install the app from a phone's "Add to Home Screen" prompt.

### Dependencies
- Receives work from everyone every day. Coordinates with Track D on the env-var setup (OpenAI key).

---

## Dependencies map

```
Track B (images) ──► Track C (chapter heroes, before/after)
Track B (i18n keys) ──► Track A (component migration with t() calls)
Track D (chat UI shape) ──► Track A (chat view styling)
Track E (lazy AR) ──► Track F (bundle size targets)
Track F (staging URL + bug filing) ──► everyone
```

Translated: **Track B must ship images by Tuesday EOD**; everything else can run in parallel after Monday.

---

## Daily ritual

- **09:00 — 15-min stand-up.** Each track says: yesterday's done, today's three things, any blocker. Track F notes blockers and chases mid-day.
- **17:00 — integration check.** Track F opens the staging URL on a real phone, walks the vertical slice with everyone watching. Anything broken gets a GitHub issue and a track-owner.
- **Friday 16:00 — recording.** Track F records the demo video while everyone watches and gives one round of notes. One re-take, then ship.

---

## Conflict zones to watch

| File | Owners | How to coordinate |
|---|---|---|
| `QuickGuide.tsx` | A (tabs + buttons) + C (cinematic hero) + D (chat view) | Branch off the same morning, merge by Wed; rebase often. |
| `routes.tsx` | E (new /map + lazy AR) + A (matching `AppShell` rule) | Single PR by E; A reviews. |
| `treasure-hunt.json` | B (media block) + A (rendering it) | B owns the data, A reads it; agree on the schema Monday morning. |
| `package.json` | F (scripts + plugins) + E (Leaflet add) + B (sharp build script) | F is gatekeeper for installs to avoid lockfile churn. |

---

## What to deliberately NOT do

(Same as the single-person plan, repeated here so the team agrees out loud:)

- ❌ No new treasure-hunt challenges beyond the existing five.
- ❌ No backend, no auth, no user accounts.
- ❌ No full Italian translation — titles and key CTAs only.
- ❌ No native WebXR — panorama with `getUserMedia` is enough.
- ❌ No new chapters beyond the existing four eras.

---

## The Friday review checklist

Run this Friday at 15:30 before recording. Any "no" is a blocker.

- ☐ Every route uses Twilight Piazza tokens. (Track A)
- ☐ Every chapter hero has a real image. (Track B + C)
- ☐ Before/after Cariatidi slider works on touch. (Track C)
- ☐ Luca chat round-trips through OpenAI on a phone. (Track D)
- ☐ Speech in + speech out work on iPhone Safari. (Track D)
- ☐ One AR landmark works on a phone. (Track E)
- ☐ `/map` shows all pins. (Track E)
- ☐ Initial JS bundle < 350 KB. (Track E + F)
- ☐ "Add to Home Screen" produces a clean install. (Track F)
- ☐ 90-second demo video recorded. (Track F)

Ten ticks, ship.

---

*Document created for HeritEdge · Polimi MITA · Piazza del Duomo project.*
