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

> ⚠️ Plain LAN (`http://...`) won't unlock the **gyroscope** on iOS, and Android sometimes blocks `DeviceOrientationEvent` over HTTP too. To test the 360° viewer's tilt-to-look feature, use the **ngrok HTTPS tunnel** in the next section.

---

## Test on your phone over the internet (ngrok HTTPS) — step by step

This is the path for testing the `/ar-xr` 360° viewer with full **gyroscope** support, sharing a demo URL with teammates or the professor, or testing from cellular data when not on the same Wi-Fi.

### 1. Install ngrok (one-time)

**Windows (winget):**
```cmd
winget install --id ngrok.ngrok -e
```

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Other / manual fallback:** download from <https://ngrok.com/download>, extract `ngrok.exe`, and place it on your PATH (or in this `Website/` folder).

After install, **close every terminal and open a new one** so PATH refreshes. Then verify:

```cmd
ngrok version
```

Should print `ngrok version 3.20.0` or higher. If it says you need to update, run `ngrok update` (or reinstall).

### 2. Get a free ngrok auth token (one-time)

1. Sign up at <https://dashboard.ngrok.com/signup> — free plan, no credit card.
2. Copy your token from <https://dashboard.ngrok.com/get-started/your-authtoken>.
3. Save it locally:
   ```cmd
   ngrok config add-authtoken 2abc...your-token-here
   ```
   Should reply `Authtoken saved to configuration file: ...`.

### 3. Run the dev server (Terminal 1)

```bash
cd Website
npm install        # only needed the first time
npm run dev
```

You should see:
```
Local:   http://localhost:5173/
```

Leave this running.

### 4. Open the tunnel (Terminal 2)

In a **second** terminal:

```cmd
ngrok http 5173
```

ngrok will print a panel like this:

```
Session Status                online
Forwarding                    https://a204-131-175-147-2.ngrok-free.app -> http://localhost:5173
```

Copy that `https://...ngrok-free.app` URL.

### 5. Open it on your phone

- **Phone** (any network — Wi-Fi or cellular): paste the URL into Chrome/Safari and add `/ar-xr` at the end:
  ```
  https://a204-131-175-147-2.ngrok-free.app/ar-xr
  ```
- The first visit shows an ngrok warning page → tap **"Visit Site"** (one-time per session).
- On **iOS**: tap the compass icon in the top-right of the AR scene → tap **"Allow"** when iOS asks for motion-sensor permission. Now tilting the phone moves the view.
- On **Android Chrome**: gyroscope auto-enables.

### 6. (Optional) Share with teammates

Send them the same `https://...ngrok-free.app` URL. As long as your dev server + ngrok tunnel are running, anyone with the URL can hit your laptop. The free tier supports 1 tunnel and shows that warning page on first visit per device — both fine for demos.

### 7. Stopping

- `Ctrl+C` in the ngrok terminal closes the tunnel.
- `Ctrl+C` then `Y` in the Vite terminal stops the dev server.
- The ngrok URL changes every session on the free tier — that's normal. Just rerun `ngrok http 5173` to get a new one.

### Common ngrok issues

| Symptom | Fix |
|---|---|
| `'ngrok' is not recognized` | Open a fresh terminal so PATH refreshes; if still broken, manually move `ngrok.exe` next to your project. |
| `agent version "3.x.x" is too old` (ERR_NGROK_121) | Run `ngrok update` or reinstall — the agent must be ≥ 3.20.0. |
| `Blocked request. This host (...) is not allowed.` | Vite is blocking the ngrok hostname. The `vite.config.ts` in this repo already allows `*.ngrok-free.app` — just **restart the dev server** (Vite doesn't HMR its own config). |
| iOS doesn't show the motion permission prompt | The page must be HTTPS. ngrok provides HTTPS automatically — make sure you opened `https://...` not `http://...`. |
| Tunnel disconnects after a while | Free tier has a session limit. Rerun `ngrok http 5173`; the URL will change. |

### Alternative if ngrok is blocked on your network

Some uni / corporate Wi-Fi blocks ngrok. Cloudflare's free tunnel works the same way and uses different endpoints:

```cmd
winget install --id Cloudflare.cloudflared -e
cloudflared tunnel --url http://localhost:5173
```

Prints an `https://*.trycloudflare.com` URL. No signup, no token. The `vite.config.ts` already allows `*.trycloudflare.com` too.

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

## Testing the 360° AR viewer (`/ar-xr`)

The P3a deliverable: a panoramic Piazza Duomo viewer with 3 historical eras (Medieval, 1950s post-war, Present day).

**Route:** `/ar-xr`

**On desktop:**
- **Click + drag** the 3D scene → look around
- **Arrow keys** or **W / A / S / D** → rotate the view without a mouse
- **Bottom pills** → switch eras (Medieval / 1950s / Present)
- **"Switch to Medieval / Present"** button → quick toggle (deliverable spec)
- **Click a floating sphere** (Duomo, Galleria, Palazzo) → navigates to artifact detail

**On phone (via ngrok HTTPS — see section above):**
- One-finger drag → look around
- **Compass icon top-right** → enable gyroscope. Tilt the phone to look around naturally.
  - iOS: tap compass → Allow motion permission
  - Android Chrome: auto-enables on HTTPS
- Era pills + landmark hotspots work the same as desktop

**Sanity checklist if something looks wrong:**
- Black screen → open browser console (F12). Most likely cause: dependencies not installed; run `npm install` again.
- "Drag to explore" hint never disappears → that's intentional, it fades after 3s on first load.
- Phone view flips upside-down at extreme tilts → make sure you're on the latest commit; the gyro tracker uses quaternion math now.
- Gyro icon doesn't appear → device exposes no `DeviceOrientationEvent`, or you're on plain HTTP (use ngrok for HTTPS).

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
