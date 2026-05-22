// HeritEdge backend entry point. Owner: P6 maintains this file.
// Route files are owned by whoever owns the feature.

import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { transcribeRouter } from "./routes/transcribe.js";
import { verifyPhotoRouter } from "./routes/verify-photo.js";
import { huntGradeRouter } from "./routes/hunt-grade.js";
import { huntHintRouter } from "./routes/hunt-hint.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

// Allow the deployed origin (WEB_ORIGIN) plus any localhost port in dev,
// so the API keeps working when Vite picks a different port (5173 / 5174 / ...).
app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhost =
        !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const allowed = !origin || isLocalhost || origin === process.env.WEB_ORIGIN;
      callback(null, allowed);
    },
  })
);
app.use(express.json({ limit: "1mb" }));

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/chat", chatRouter);
router.use("/transcribe", transcribeRouter);
router.use("/verify-photo", verifyPhotoRouter);
router.use("/hunt-grade", huntGradeRouter);
router.use("/hunt-hint", huntHintRouter);

app.use("/", router);
app.use("/api", router);

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
