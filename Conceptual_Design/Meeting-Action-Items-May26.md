# Meeting Action Items — Delivery 26 May 2026

Today is 14 May. Delivery is Thursday 26 May. **12 calendar days · ~8 working days · 2 days integration buffer.**

The ten recommendations from the last meeting, mapped onto the six teammates already assigned.

---

## Mapping ten items to six people

| # | Recommendation | Owner | Notes |
|---|---|---|---|
| 1 | Centering button / arrow to guide user in AR | **T1 · AR Place Selector** | Floating "↑ recenter" pill on the AR view that pans the camera to the next point of interest. |
| 2 | Play/stop widget that resets when changing pages | **T4 · Story player & voice** | Hook into the React Router `useLocation` — call `stopSpeaking()` on every route change. Surface a small persistent play/pause pill so the user always knows audio is on. |
| 3 | Memory photo — improve scene or add a filter | **T2 · AR Structural Hotspots** | When the user takes a treasure-hunt photo, run it through a sepia/period CSS filter or canvas filter before showing the success state. Gives the photo a "memory" feel. |
| 4 | AWS / Render / Heroku deploy | **T5 · Deploy + PWA** | Vercel or Netlify is fastest for a Vite SPA. Render is the closest open-tier "Heroku replacement". AWS is overkill for a 12-day demo — recommend Vercel for the demo, document AWS path as future work. |
| 5 | Go to location and record live | **T6 · User testing + demo video** | Block out an afternoon (suggest Saturday 24 May) for the team to walk Piazza del Duomo together with one phone running the app. |
| 6 | Tutorial uses real use-case images | **T3 · Chapter hero images** | Build a 3-screen onboarding (first launch only) that mirrors the actual app screens — Home → AR with a real photo of the Duomo → Treasure Hunt with a real bull-mosaic photo. |
| 7 | Integrate everything to make it fit | **T5 · Deploy + PWA** | This is the "Monday 23 May integration day". Everyone pauses new work; T5 leads the merge + smoke test on staging. |
| 8 | Deliver 26 May (Thursday review) | **All** | Fixed milestone. Internal cut-off is Tuesday 25 May EOD; Wednesday is buffer for one round of fixes. |
| 9 | Improve voice — make it more friendly | **T4 · Story player & voice** | Pick a warmer browser voice (default iOS is robotic). Slow rate slightly (0.95×), lower pitch by a notch, add small natural pauses with commas. Try the `Alice` or `Karen` voices on iOS, `Eddy (Italian)` for Italian lines. |
| 10 | "Learn more" link in chat | **T3 · Chapter hero images** | At the end of every scene reveal and every treasure-hunt success panel, add a small button "Ask Luca more →" that deep-links to the chat view with a pre-filled question about that topic. |

Net: every teammate gets one or two new items on top of their original task, and item 8 is the shared deadline. No one is overloaded.

---

## Owner re-cap

**T1 — AR Place Selector**
- Three landmark chips floating over the live camera (existing task).
- *+ Recentering arrow* — a small pill at the bottom-centre of the AR view that pans the camera or simply shows an arrow toward the recommended viewpoint when the user has wandered off.

**T2 — AR Structural Hotspots**
- Tappable gold dots on each landmark with story sheets (existing task).
- *+ Memory-photo filter* — when the treasure-hunt photo is captured, apply a sepia/vintage filter via `<canvas>` or CSS `filter: sepia(0.45) contrast(0.95)`. Show in the reveal panel as a polaroid-style framed shot.

**T3 — Chapter hero images + tutorial**
- Drop real historical images into the chapter heroes (existing task).
- *+ Onboarding tutorial* — three swipeable screens on first launch, using real photos of the app in use at the piazza.
- *+ "Ask Luca more →" links* on every scene reveal + treasure-hunt success.

**T4 — Story player & voice**
- Cariatidi before/after slider + the 7 other pairs we identified (existing task).
- *+ Global stop-on-navigation* — small `useNavigationStop()` hook in the app shell that cancels TTS on every route change.
- *+ Friendly voice* — TTS settings tuned in `chatService.ts`: `rate: 0.95`, `pitch: 1.05`, `voice: 'Karen'` (or `Alice`, fallback `default`). Italian lines use `Alice (Italian)`.
- *+ Persistent play/pause pill* — a small floating widget in the bottom-right while audio is playing, so it's always one tap to stop.

**T5 — Deploy + PWA + integration**
- PWA manifest + service worker + staging URL (existing task).
- *+ Vercel/Netlify deploy* — pick Vercel; auto-deploy from `main`. Document the AWS / Render alternatives in `README.md` for the report.
- *+ Integration day (Mon 23 May)* — owns the merge of all branches into `main`, the staging smoke test, and the bug-triage round.

**T6 — User testing + on-location recording**
- Recruit 5–8 classmates for testing + record demo video (existing task).
- *+ On-location recording session* — Saturday 24 May, 2pm, Piazza del Duomo. One person operates phone (T6), one person follows the script (any teammate), one person films the room with a second phone. Three takes, pick best.
- *+ Edit + caption* the 90-second demo video before Wednesday 25 May.

---

## Day-by-day timeline

| Date | Day | Milestone |
|---|---|---|
| Wed 14 May | 0 | Plan locked, branches created |
| Thu 15 May | 1 | Each owner has a first commit on their branch |
| Fri 16 May | 2 | T3 ships real images (unblocks T1 + T6) |
| Sat 17 May | 3 | Personal time — no group sync expected |
| Sun 18 May | 4 | T4 ships friendly-voice + stop-on-nav |
| Mon 19 May | 5 | T1 ships recentering arrow; T2 ships memory filter |
| Tue 20 May | 6 | T3 ships tutorial + learn-more links |
| Wed 21 May | 7 | T5 ships staging URL on Vercel; T4 ships before/after pairs |
| Thu 22 May | 8 | T6 runs first user-test round (3 people) — log issues |
| Fri 23 May | 9 | **Integration day** — T5 leads, everyone merges + smoke test |
| Sat 24 May | 10 | **On-location recording at Piazza del Duomo (2pm)** |
| Sun 25 May | 11 | Polish from issues found Sat; T6 edits video |
| Mon 26 May | 12 | **DELIVER + Thursday review session (am)** |

Internal hard cut-off: **Tuesday 25 May, 18:00.** Wednesday 26th morning is buffer for the *one* breaking issue you'll inevitably find.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| iOS Safari blocks first TTS call | High | T4 adds a one-time "Tap to enable audio" splash on first chapter open |
| AR camera permission denied | Medium | T1 + T2 design a graceful "permission needed" screen with retry |
| Vercel free tier limits | Low | Demo traffic is single-digit; if anything, upgrade for the review week (~€20) |
| On-location filming rained out (Sat 24 May) | Medium | Reserve Sunday 25 May as backup; have an indoor screen-recorded fallback ready |
| Image licences questioned | Low | T3 keeps an `attribution.json` next to images; the dossier already lists each source |

---

## Demo-day script (Thursday 26 May)

A 90-second walkthrough, in this order:

1. *(10 s)* Home screen: "Six centuries, twelve stops." Tap **Start the tour**.
2. *(15 s)* Quick Guide opens on the Foundations chapter. Cinematic hero with the Cesariano elevation behind the gold grid. Tap **Begin chapter**.
3. *(20 s)* Story player: a quote, a narrative beat, a tap-to-reveal, a quiz. Voice says the final scene.
4. *(15 s)* Closing scene: Cariatidi before/after slider. Drag once across the room from 1900 to today. **This is the emotional peak.**
5. *(15 s)* Bottom nav → AR. Three landmark chips appear over the live camera (filmed on-location). Tap Duomo, gold hotspot appears, tap it for the Madonnina memory sheet.
6. *(15 s)* Bottom nav → Hunt. The bull-mosaic challenge. Photo capture with the memory filter applied → success card with reveal photo + "Ask Luca more →" link.

Six scenes, ninety seconds, one app, all the multimodal claims demonstrated visually.

---

## What we deliberately won't add (saying it out loud)

- ❌ Italian translation of every screen (titles only — T3's "use-case images" cover the tutorial labels).
- ❌ Real OpenAI integration — keep Luca on the existing local fallback; the stretch goal slides if time runs out.
- ❌ More than five treasure-hunt challenges.
- ❌ Native WebXR or ARKit integration — panorama + getUserMedia is enough.

Twelve days, six people, one demo. We're on track.

---

*Document created for HeritEdge · Polimi MITA · Piazza del Duomo project.*
