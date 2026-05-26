// /transcribe route — Whisper fallback for voice. Owner: P2.
// Used when Web Speech API is unavailable (iOS) or confidence is low.

import { Router } from "express";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
export const transcribeRouter = Router();

transcribeRouter.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "audio file required" });

  res.json({ transcript: "(stub) transcription", confidence: 0.5 });
});
