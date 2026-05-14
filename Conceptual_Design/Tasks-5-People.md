# Task Split — 5 Specific Tasks + Miguel

Two people on Tour Guide, two on AR Experience, one on Souvenir (+ optional Hunt rewire). Miguel handles deploy + final merge + verification.

Deadline: **Thursday 26 May 2026**. Internal cut-off: **Tuesday 25 May 18:00** → Miguel merges Wednesday → demo recorded Sunday → review Thursday.

---

## Task 1 · Tour Guide — Chapters 1 & 2 (+ voice)

**Owns the first 14 scenes of the linear narrative and Luca's voice character.**

### Scope
- Implement the **unified period vocabulary** (Birth / Crown / Modern) in `scenes.ts` — replace the old period names everywhere.
- Ship the **cinematic hero (Scene 0)** for Chapter 1 *and* Chapter 2 — period dot-grid, headline, "Begin chapter →" CTA.
- Build the scenes of **Chapter 1 (Birth) — 7 scenes**: pull quote → narrative → tap-to-reveal Candoglia → year-guess quiz → multi-photo slider (Piazza across 280 years) → closing → cultural beat ("A day in 1450").
- Build the scenes of **Chapter 2 (Crown) — 7 scenes**: pull quote → tap-to-reveal Leonardo → match-the-architect mini-game → Madonnina narrative → façade multi-photo slider → closing → cultural beat ("The saffron wedding").
- Build the new scene-type components needed: `cultural`, `matchGame`.
- Wire **friendly Luca voice settings** in `chatService.ts` — pick warmest voice via `speechSynthesis.getVoices()`, rate `0.95×`, pitch `1.05×`, comma pauses in narration.
- Add the **first-tap audio unlock** splash on first chapter open.
- Add the **persistent play/pause pill** in the bottom-right whenever Luca speaks; auto-stop on every route change (`AppShell` hook).

### Files
`src/app/components/quick-guide/scenes.ts` · `StoryView.tsx` · new `CulturalBeat.tsx` · new `MatchGame.tsx` · `src/services/chatService.ts` · `src/app/components/ui/AppShell.tsx`.

### Done when
Chapter 1 and Chapter 2 play end-to-end with voice. Luca sounds warm. Voice stops on every route change.

---

## Task 2 · Tour Guide — Chapter 3 + shared timeline slider (+ AI chat)

**Owns the heaviest 7 scenes (Modern era) plus the reusable multi-photo slider used in all three chapters.**

### Scope
- Ship the **cinematic hero (Scene 0)** for Chapter 3 — period dot-grid, headline, "Begin chapter →" CTA.
- Build the scenes of **Chapter 3 (Modern) — 7 scenes**: pull quote → Mengoni narrative → tap-to-reveal "did the architect see it open?" → **embedded video** (1945 Liberation 30 s clip) → **Cariatidi before/after slider** (the emotional centrepiece) → closing → cultural beat ("A 1960s aperitivo"). *Note: the Scene 3.7 cultural beat reuses Task 1's `cultural` component — coordinate with Task 1 on its API.*
- Build the new scene-type components needed: `videoEmbed`, **the multi-photo `timelineSlider`** (2–6 notches, cross-fade between adjacent photos, snap on release). The slider component is used by Task 1 too (Scenes 1.5 and 2.5) — ship it early on Monday so Task 1 isn't blocked.
- Wire the **real OpenAI SDK** call in `sendMessage()` (`openai` already in `package.json`). Use `VITE_OPENAI_API_KEY` from `.env` — Miguel will set it in Vercel.
- Add **"Ask Luca more →" deep links** on every scene reveal — opens chat pre-filled with a contextual question, remembers the scene so user can return.
- Verify STT (`useSpeechRecognition`) works in major browsers; fall back to text input where Web Speech API isn't available.

### Files
`src/app/components/quick-guide/scenes.ts` (chapter-3 content) · new `TimelineSlider.tsx` · new `VideoScene.tsx` · `src/services/chatService.ts` (OpenAI call) · `src/app/components/QuickGuide.tsx` (chat view) · new `src/app/components/ui/AskLucaChip.tsx`.

### Done when
Chapter 3 plays end-to-end; the Cariatidi slider drags smoothly between 1900 and today; the multi-photo slider works in Scenes 1.5 and 2.5 too; "Ask Luca more →" opens the chat pre-filled and routes back.

---

## Task 3 · AR Experience — content & hotspots

**Owns every story that surfaces in AR.**

### Scope
- Define the **hotspot dataset** — for each period (Birth / Crown / Modern), specify ~6–8 hotspots (year, title, image OR audio OR video, two-sentence body, optional photo challenge link). Use the moments listed in `Experience-Spec.md`.
- Build the **hotspot bottom sheet** UI — period eyebrow + year + title + media + body + action row (Hear it · Tell me more · Take a photo).
- Wire the **audio + video media** moments specified in the spec: 1774 Madonnina (audio + bells), 1943 bombs (20 s video + air-raid intro), 1945 Liberation (20 s video + original audio).
- Connect each hotspot's "Tell me more →" button to either the corresponding Tour scene (Tour Tasks own those) or the chat with a pre-filled question.

### Files
new `src/app/components/ar/HotspotSheet.tsx` · new `src/app/components/ar/hotspots.ts` (data file — period → array of moments).

### Done when
Every hotspot has its story written, its media wired, and its bottom sheet renders the right content. The data file is the single source of truth for AR content.

---

## Task 4 · AR Experience — camera, plumbing, interaction

**Owns the spatial mechanics — what the user actually sees and touches in AR.**

### Scope
- Audit `PanoramaScene.tsx`, confirm it renders cleanly in mobile and desktop browsers. No native WebXR.
- **AR overview screen**: live camera feed (or panorama fallback), **period selector chip** at the top (Birth/Crown/Modern), gold hotspot dots positioned on the camera at compass headings, **recentering arrow pill** at the bottom-centre.
- **Remote-mode fallback** — geolocation check on entry; if not within ~200 m of Piazza del Duomo OR camera permission denied OR user prefers, render a 360° equirectangular panorama with Three.js. Same hotspots, same period tinting.
- **Memory photo filter** (sepia + light vignette) via canvas when a treasure-hunt photo is captured from an AR hotspot.
- Wire each hotspot data record from Task 3 to its on-screen dot position; tap → open Task 3's bottom sheet.

### Files
`src/features/ar/xr/PanoramaScene.tsx` · `src/app/components/ARArtifactDetail.tsx` · new `src/app/components/ar/PeriodSelector.tsx` · new `src/app/components/ar/CenteringArrow.tsx` · `src/services/visionService.ts` (memory filter pipeline before vision call).

### Done when
In a mobile browser at the piazza: camera permission → hotspots over the live feed → tap → Task 3's bottom sheet opens. On desktop or remote mode: same hotspots overlaid on a swipeable panorama. Treasure-hunt photo capture produces a sepia-tinted result.

---

## Task 5 · Souvenir face filter + Hunt rewire + tutorial onboarding

**Owns the ending of the journey AND the entry into it.**

### Scope
- Build the **Souvenir face filter** end-cap. Use `face-api.js` (~1 MB, no server). Four overlay options: Madonnina halo · Saint of the Spires · Renaissance portrait · 1880s flâneur. Front-camera viewport, snap-to-capture, polaroid frame, share button.
- Build the **Summary screen** — score, time, stops visited, badges, the souvenir polaroid embedded, share CTA. Replaces the current bare `Summary.tsx`.
- **Restructure the Treasure Hunt** from a standalone route into a **tracker**. Bottom-nav "Hunt" tab shows progress (points, completed challenges, percentage). Challenges appear contextually in the Tour and AR — Task 1 and Task 2 surface the chapter-ending question via Task 5's reusable `<HuntQuestion>` component.
- Update `treasure-hunt.json` with the new 8-challenge set from `Experience-Spec.md`, including the two audio/video clue challenges (saffron audio + Liberation video).
- Build a **3-screen tutorial onboarding** shown only on first launch, using real app-in-use illustrations from the `mockups/` folder. Skip button visible. localStorage flag so it appears once and never again.

### Files
new `src/app/components/SouvenirFilter.tsx` · `src/app/components/Summary.tsx` · `src/app/components/TreasureHunt.tsx` (delete standalone UI, keep challenge flow as reusable component) · new `src/app/components/Hunt.tsx` (tracker) · new `src/app/components/HuntQuestion.tsx` (used by Tasks 1+2 at chapter endings) · `src/content/treasure-hunt.json` · new `src/app/components/Tutorial.tsx` · `src/app/routes.tsx` (first-launch tutorial gating).

### Done when
First launch → 3-screen tutorial appears once. End of Tour Chapter → inline `<HuntQuestion>` appears → answer logs to Hunt tracker. AR hotspot photo → vision verifies → tracker updates. End of journey → "Take your Milan souvenir" CTA → face filter → polaroid + score + share. Summary screen replaces the bare route.

---

## Miguel · planning, content, mockups, deploy & final merge

**You own:**
- All spec / dossier work (done).
- All 24 per-scene mockups in `Conceptual_Design/mockups/` (done).
- **Vercel deploy** from `main`, env vars (`VITE_OPENAI_API_KEY`), `README.md` deploy docs.
- **PWA manifest + service worker + app icons** so "Add to Home Screen" works on mobile browsers.
- **Final merge** Friday 23 May into `main`, in dependency order: Task 1 first (cultural component, Chapter 1+2 scenes), then Task 2 (TimelineSlider, Chapter 3, uses Task 1's cultural), then Task 5 (HuntQuestion + tutorial — Tasks 1+2 import the question component), then Task 3 (AR content), then Task 4 (AR plumbing uses Task 3's data and Task 5's photo-challenge logger).
- **Smoke test** the demo flow on a desktop browser and a mobile browser.
- File bugs as small, scoped issues for the responsible task owner.
- **Record the 90-second demo video** Sunday 25 May, hand the staging URL + video to the reviewer Thursday morning.

### Files
`vite.config.ts` (PWA plugin) · new `public/manifest.webmanifest` · `public/icons/*` · `.env.example` · `README.md`.

---

## Timeline

| Date | Day | Milestone |
|---|---|---|
| Thu 15 May | 1 | Branches created. Tasks 1–5 each have a first commit. Miguel ships Vercel skeleton URL. |
| Fri 16 May | 2 | Task 1 ships unified period vocab + Chapter 1. Task 2 ships `TimelineSlider` early so Task 1 isn't blocked. Task 3 ships hotspot data file. |
| Sat 17 / Sun 18 | — | Personal time |
| Mon 19 May | 3 | Task 1 ships voice settings + audio unlock. Task 2 ships Chapter 3 video scene + OpenAI wiring. Task 4 ships hotspot positioning + camera. |
| Tue 20 May | 4 | Task 1 ships Chapter 2 + cultural component. Task 2 ships Ask-Luca deep links. Task 3 ships bottom sheet UI. Task 4 ships memory filter. Task 5 ships `<HuntQuestion>` component + face filter. |
| Wed 21 May | 5 | Task 4 ships remote-mode panorama. Task 5 ships Summary screen + tutorial. Miguel ships PWA manifest + icons. |
| Thu 22 May | 6 | All five tasks cut their final PRs. |
| Fri 23 May | 7 | **Miguel merges in dependency order; smoke-tests staging URL on phone + desktop.** |
| Sat 24 May | 8 | Optional on-location filming. Otherwise bug-fix day. |
| Sun 25 May | 9 | Miguel records demo video, polishes. |
| Mon 26 May | 10 | **DELIVER.** |

---

## Dependency map

```
Task 2 (TimelineSlider) ─► Task 1 (uses it in Scenes 1.5 + 2.5)
Task 1 (cultural component)  ─► Task 2 (uses it in Scene 3.7)
Task 2 (chat view shape) ─► Task 1 (light coupling — Task 1 owns Luca voice, Task 2 owns OpenAI wiring inside the same QuickGuide.tsx)
Task 3 (hotspot data file) ─► Task 4 (reads it to place dots and open the sheet)
Task 3 (bottom sheet UI) ─► Task 4 (calls it on hotspot tap)
Task 4 (photo capture flow) ─► Task 5 (optional Hunt rewire uses it for photo challenges)
All five tasks ─► Miguel (merge + verify + demo)
```

Three critical hand-offs to track:

1. **Task 2 ships `TimelineSlider` by Friday 16 May** so Task 1 can use it for the Chapter 1 + 2 closings the following Monday.
2. **Task 1 ships `cultural` component by Monday 19 May** so Task 2 can use it for Scene 3.7 mid-week.
3. **Task 5 ships `<HuntQuestion>` component by Tuesday 20 May** so Tasks 1 and 2 can drop it at chapter endings before they cut their final PRs Thursday.

---

## Shared files — coordination

- **`scenes.ts`** — Tasks 1 and 2 both write to it. Agree Monday: Task 1 owns Chapter 1 + Chapter 2 entries, Task 2 owns Chapter 3 and the type definitions.
- **`QuickGuide.tsx`** — Task 1 (voice + play-pause pill at AppShell level) and Task 2 (chat view) both touch this. Task 1 owns global wrapper logic, Task 2 owns the chat view block.
- **`chatService.ts`** — Task 1 (voice settings) and Task 2 (OpenAI wiring). Task 1 takes the top half (voice config), Task 2 the bottom half (network call).
- **`routes.tsx`** — Tasks 3, 4, 5 add routes. Miguel gatekeeps the final commit.
- **`package.json`** — Task 5 adds `face-api.js`. Miguel adds `vite-plugin-pwa`. Coordinate on order to avoid lockfile churn.

---

## What everyone deliberately skips

- ❌ Native WebXR / device-orientation tracking — we are a webapp.
- ❌ Full Italian translation of every screen — titles + main CTAs only.
- ❌ A backend or user accounts.
- ❌ Browser-specific code paths — `mobile vs desktop` is the only fork.
- ❌ More than 8 treasure-hunt challenges.

---

## Friday review checklist *(Miguel runs this Friday 15:30 before final merge)*

- ☐ Chapters 1 + 2 play end-to-end with voice. *(Task 1)*
- ☐ Luca's voice sounds warm after the first-tap unlock. *(Task 1)*
- ☐ Voice resets to stopped on every route change. *(Task 1)*
- ☐ Chapter 3 plays end-to-end; Liberation video + Cariatidi slider work. *(Task 2)*
- ☐ Multi-photo `TimelineSlider` works in Scenes 1.5, 2.5, 3.5. *(Task 2)*
- ☐ "Ask Luca more →" deep link opens chat pre-filled with a contextual question. *(Task 2)*
- ☐ Every AR hotspot has its story + media; bottom sheet renders correctly. *(Task 3)*
- ☐ AR camera + period selector + recentering arrow work in mobile browser. *(Task 4)*
- ☐ Remote mode shows panorama when geolocation says we're not in Milan. *(Task 4)*
- ☐ Memory-photo filter applied on capture. *(Task 4)*
- ☐ Souvenir face filter produces a sharable polaroid. *(Task 5)*
- ☐ Summary screen renders score, time, badges. *(Task 5)*
- ☐ Hunt tracker shows live progress; inline question appears at every chapter ending. *(Task 5)*
- ☐ First-launch tutorial appears once and never again. *(Task 5)*
- ☐ Vercel staging URL works in mobile + desktop browsers; installs via "Add to Home Screen". *(Miguel)*
- ☐ 90-second demo video recorded. *(Miguel)*

Sixteen ticks. Ship.

---

*Document for HeritEdge · Polimi MITA · Piazza del Duomo · 14 May 2026.*
