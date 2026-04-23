// HeritEdge backend entry point. Owner: P6 maintains this file.
// Route files are owned by whoever owns the feature.

import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { transcribeRouter } from "./routes/transcribe.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/chat", chatRouter);         // P1
app.use("/transcribe", transcribeRouter); // P2

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
