// /verify-photo — vision check for treasure-hunt PHOTO challenges. Owner: P5.
//
// Request: multipart/form-data with
//   - photo    (file, required) — the user's submission
//   - subject  (string, required) — what the photo should show
// Response: { verdict, confidence, reason }
//   verdict ∈ "match" | "low-confidence" | "no-match"
//
// The vision model is asked to score 0..1 how confidently the image shows
// the subject. We bucket the score into the three verdicts.

import { Router } from "express";
import multer from "multer";
import OpenAI from "openai";
import sharp from "sharp";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const verifyPhotoRouter = Router();

const MATCH_THRESHOLD = 0.7;
const LOW_CONF_THRESHOLD = 0.4;

// Prefer direct OpenAI when OPENAI_API_KEY is set; otherwise fall back to the
// same GitHub Models / Azure inference endpoint /chat already uses.
function buildClient(): { client: OpenAI; model: string } | null {
  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: "gpt-4o-mini",
    };
  }
  if (process.env.GITHUB_TOKEN) {
    return {
      client: new OpenAI({
        baseURL: "https://models.inference.ai.azure.com",
        apiKey: process.env.GITHUB_TOKEN,
      }),
      model: "gpt-4o-mini",
    };
  }
  return null;
}

function bucket(score: number): "match" | "low-confidence" | "no-match" {
  if (score >= MATCH_THRESHOLD) return "match";
  if (score >= LOW_CONF_THRESHOLD) return "low-confidence";
  return "no-match";
}

verifyPhotoRouter.post("/", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "photo file required" });
    const subject = (req.body?.subject ?? "").toString().trim();
    if (!subject) return res.status(400).json({ error: "subject required" });

    const wired = buildClient();
    if (!wired) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY or GITHUB_TOKEN — cannot reach a vision model.",
      });
    }
    const { client, model } = wired;

    // Downscale before sending to the vision model. Long edge ≤ 1024 px is
    // plenty for "what's in this photo" — and cuts upload bytes by 10–50×.
    const resized = await sharp(req.file.buffer)
      .rotate() // honour EXIF orientation from phone cameras
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${resized.toString("base64")}`;

    const systemPrompt = [
      "You verify photos submitted in a heritage treasure hunt.",
      "Decide how confidently the photo shows the SUBJECT described by the caller.",
      "Reply ONLY with strict JSON: {\"score\": <0..1>, \"reason\": \"<one short sentence>\"}.",
      "0.0 = clearly not the subject. 1.0 = clearly is the subject.",
      "Be lenient on framing, lighting, and angle. Reward partial visibility of the subject.",
    ].join(" ");

    const userText = `Subject: ${subject}\nDoes the attached photo show this subject?`;

    const completion = await client.chat.completions.create({
      model,
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ] as any,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let score = 0;
    let reason = "";
    try {
      const parsed = JSON.parse(raw) as { score?: unknown; reason?: unknown };
      score = Math.max(0, Math.min(1, Number(parsed.score) || 0));
      reason = typeof parsed.reason === "string" ? parsed.reason : "";
    } catch {
      reason = "Vision model returned non-JSON; defaulting to no-match.";
    }

    return res.status(200).json({
      verdict: bucket(score),
      confidence: score,
      reason,
      model,
    });
  } catch (err) {
    console.error("[verify-photo] error:", err);
    return res.status(500).json({ error: "Vision verification failed." });
  }
});
