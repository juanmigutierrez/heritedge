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

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/", (_req, res) => res.json({
  message: "HeritEdge API",
  endpoints: ["/health", "/chat", "/transcribe", "/verify-photo", "/hunt-grade", "/hunt-hint"]
}));

app.use("/chat", chatRouter);                // P1
app.use("/transcribe", transcribeRouter);    // P2
app.use("/verify-photo", verifyPhotoRouter); // P5
app.use("/hunt-grade", huntGradeRouter);     // P5
app.use("/hunt-hint", huntHintRouter);       // P5

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
