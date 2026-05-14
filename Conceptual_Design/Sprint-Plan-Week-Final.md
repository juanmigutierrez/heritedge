# Sprint Plan — Week to Final Prototype

A focused five-day sprint to take HeritEdge from "redesigned but uneven" to **demoable prototype** for the Polimi MITA review. The plan prioritises **visible coherence**, **one fully-multimodal vertical slice**, and **real-device readiness**.

---

## Sprint goal

**A reviewer can pick up an iPhone in Piazza del Duomo, open the app, and complete one end-to-end journey:**

> Home → Open Quick Guide → enter Visconti chapter → tap through the story with the SVG illustration → exit to Treasure Hunt → take a photo of the Madonnina → speak the answer to the date question → see a Summary screen with score.

Every screen in that journey looks like it was designed by the same team, in the same week, with the same gold-and-cream palette.

---

## Current state — what's done vs what's rough

| | Status |
|---|---|
| Theme tokens + dark/light toggle | ✅ Done |
| Typography (Fraunces + Inter) | ✅ Done |
| Floating bottom nav + AppShell | ✅ Done |
| Home — image-first hero | ✅ Done |
| Quick Guide — cinematic timeline + story player | ✅ Done |
| Four SVG interactive illustrations | ✅ Done |
| Treasure Hunt component | ⚠ Still using old `stone/amber` palette |
| AR Overview (`PanoramaScene`) | ⚠ Not yet themed; unclear what state it's in |
| AR Artifact Detail (671 lines) | ⚠ Still using old palette |
| Quiz Feedback (152 lines) | ⚠ Not touched |
| Summary screen (204 lines) | ⚠ Not touched |
| Real historical images | ❌ Guides written, no images dropped yet |
| Voice TTS / STT on real device | ⚠ Scaffolded; needs verification |
| Italian copy | ❌ All English |
| Mobile-device testing | ❌ Not done |
| Bundle size | ⚠ 522 KB (over Vite's 500 KB warning) |
| Loading + error states | ⚠ Spotty |
| PWA / offline | ❌ Not done |

---

## Day-by-day plan

### Day 1 (Mon) — *Visual coherence everywhere*

The single biggest "looks unfinished" risk is that 3 of 7 routes still use the old stone/amber palette. Fix this first.

- [ ] Migrate **`TreasureHunt.tsx`** to theme tokens — replace `bg-stone-*`, `text-amber-*`, `border-emerald-*` with `bg-card`, `text-foreground`, `var(--accent)` etc.
- [ ] Migrate **`QuizFeedback.tsx`** and **`Summary.tsx`** the same way.
- [ ] Migrate **`ARArtifactDetail.tsx`** — keep the camera-feed surface as-is, but theme the overlays.
- [ ] Sanity-click every bottom-nav route to confirm theming and the toggle work across the app.

**Acceptance:** open the dev tools color picker and verify no on-screen text or surface is using a hardcoded stone-XXX or amber-XXX value.

### Day 2 (Tue) — *Real historical images*

The Image-Sourcing guide is written — now actually place 8–10 images.

- [ ] Download and place into `Website/src/assets/history/`:
  - `duomo/madonnina-closeup.jpg`
  - `duomo/cesariano-1521.jpg`
  - `duomo/leonardo-tiburio.jpg`
  - `galleria/bull-mosaic.jpg`
  - `galleria/mengoni-portrait.jpg`
  - `galleria/dome-interior.jpg`
  - `palazzo/cariatidi-brogi-1900.jpg`
  - `palazzo/cariatidi-today.jpg`
- [ ] Write a tiny `sharp`-based resize script under `Website/scripts/resize-history.mjs` that produces 1200 px WebP versions.
- [ ] Wire image backgrounds into the cinematic hero of each Quick Guide chapter.
- [ ] Add a `media` block to `treasure-hunt.json` and surface the **hint** + **reveal** images in the success panel.

**Acceptance:** every Quick Guide chapter hero has a real Milan image behind the gold dot grid; every treasure hunt success state shows a reveal image.

### Day 3 (Wed) — *The hero moment + multimodal completion*

Build the single best demo set-piece and verify the multimodal features.

- [ ] **Sala delle Cariatidi before/after scene** — a new `beforeAfter` scene type in the story player: two images, a vertical slider you drag left/right to wipe between them. Add as a closing scene to the Habsburg chapter.
- [ ] Verify **Voice TTS** ("Listen to summary" button) works on **iOS Safari**. This often needs a user-gesture unlock for the first call.
- [ ] Verify **Voice STT** ("Speak your answer" button in Treasure Hunt) works on iOS Safari. Webkit speech recognition has known quirks.
- [ ] Test one full **AR Overview → AR Artifact Detail** flow with the device camera; if `PanoramaScene` is broken on mobile, fall back to a still image AR cue for the demo.

**Acceptance:** before/after slider works smoothly; voice round-trip (speak → STT → check answer → TTS feedback) works on an iPhone.

### Day 4 (Thu) — *Mobile reality check + performance*

The number-one risk for the demo is that something subtle breaks on the actual phone the reviewer uses.

- [ ] Open the deployed dev server on **iPhone Safari** and **Android Chrome**. Walk every screen.
- [ ] Fix any layout/touch/viewport issues — common culprits: 100vh on iOS (use `100dvh`, already done), tap targets under 44 px, fonts not loading because of font-display, viewport meta tag.
- [ ] **Code-split the AR module** — wrap `PanoramaScene` and `ARArtifactDetail` in `React.lazy()` so they're not in the initial bundle. Should drop initial JS from 522 KB to ~300 KB.
- [ ] Add loading **skeletons** on routes that fetch (AIChat, PanoramaScene).
- [ ] Add **error states** for failed AI calls (Treasure Hunt photo verification, AIChat).
- [ ] Service worker for **basic offline caching** of the shell + last-visited chapter. Use Vite's `vite-plugin-pwa`.

**Acceptance:** every screen renders within 2 s on a 4G connection; no console errors on the demo flow; the app works in airplane mode after a first visit.

### Day 5 (Fri) — *Demo polish + i18n*

- [ ] Build a real **Summary screen** that pulls score, time, stops visited, achievements. Currently it just exists as a route — fill it in.
- [ ] Add a small **walking-tour map view** — the JSON has `location` strings; use Leaflet (lightweight) with a static Mapbox or OSM tile layer and pin each stop. New route `/map`.
- [ ] **Italian copy** for at least Home + Quick Guide chapter titles + Treasure Hunt prompts. Use a tiny in-house `i18n.ts` that picks from `{ en: '...', it: '...' }` based on `localStorage` and a small EN/IT toggle next to the theme toggle.
- [ ] **Accessibility pass** — `aria-label` on every icon button, focus ring visible on all interactive elements (already done via theme.css ring), `prefers-reduced-motion` honoured in the StoryView (mostly done).
- [ ] **Record a 90-second demo video** walking through the vertical slice. This is the deliverable for the MITA review and the safety net if something breaks live.

**Acceptance:** the recorded demo video plays from start to finish without a glitch; the Italian toggle works on the home screen.

---

## What to deliberately NOT do this sprint

Cut, defer, or note as "future work":

- Full Italian translation of every screen (titles + buttons only is fine; body copy can stay English).
- Native AR with WebXR feature detection — the panorama fallback is enough for the demo.
- A real backend / database. Keep using `treasure-hunt.json` + `knowledge-base.json` as static content.
- Multi-user / accounts / login.
- More than five treasure hunt challenges. Five is plenty for a demo.
- Brera / Galleria interior tours. Stay focused on Piazza del Duomo.

---

## Daily ritual

- **9:00** — stand-up with yourself: yesterday done, today's three things, any blocker.
- **End of day** — commit, push, deploy to a staging URL (Vercel/Netlify free tier), test on phone.
- **Demo flow check every day at 17:00** — walk the vertical slice on a real device. If it broke, fix tomorrow before anything new.

---

## Stretch goals (if Day 4 finishes early)

- **Real OpenAI integration** for the AIChat's Luca persona — `openai` is already in `package.json`, just need an env var.
- **Photo verification** via vision model for the Treasure Hunt photo challenges (the scaffold exists in `TreasureHunt.tsx` line 280–290).
- **Animated hero illustration** — give the cinematic hero a subtle parallax on scroll.
- **Tour completion badges** — small SVG badges saved in `localStorage` and displayed on the Summary screen.

---

## The one-line presentation pitch

> "HeritEdge is a multimodal heritage companion for Piazza del Duomo. It tells the cathedral's six-century story as a tap-through illustrated journey, lets visitors ask questions by voice, and turns the square into a treasure hunt — all on a phone, all in the visitor's pocket, all in the warm dark Twilight Piazza palette."

Five screens, one journey, one demo video, ready in five days.

---

*Document created for HeritEdge · Polimi MITA · Piazza del Duomo project.*
