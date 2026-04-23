// /transcribe route — Whisper fallback for voice. Owner: P2.
// Used when Web Speech API is unavailable (iOS) or confidence is low.

import { Router } from "express";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
export const transcribeRouter = Router();

transcribeRouter.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "audio file required" });

  // TODO (P2, Week 2):
  //   import OpenAI from "openai";
  //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_WHISPER });
  //   const result = await openai.audio.transcriptions.create({
  //     file: new File([req.file.buffer], req.file.originalname),
  //     model: "whisper-1",
  //     language: req.body.language ?? "en",
  //   });
  //   res.json({ transcript: result.text, confidence: 0.9 });

  res.json({ transcript: "(stub) transcription", confidence: 0.5 });
});
