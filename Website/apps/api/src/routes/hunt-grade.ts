// /hunt-grade — judges a free-form answer to a QUESTION-type challenge.
// Owner: P5.
//
// Two-stage grading:
//   1. Normalise the user's answer (lowercase, strip diacritics + punctuation)
//      and compare against `expectedAnswer` and any `acceptedAnswers`. A hit
//      returns `correct: true` instantly with confidence 1.0. No LLM call.
//   2. On miss, ask an LLM judge whether the answer is semantically right,
//      grounded in the related knowledge-base fact body. The judge returns
//      strict JSON {correct, confidence, reason}.
//
// Request body:
//   { challengeId, answer, question, expectedAnswer, acceptedAnswers?, factBody? }
// Response:
//   { correct, confidence, reason, method: "keyword" | "llm" }

import { Router, Request, Response } from "express";
import OpenAI from "openai";

export const huntGradeRouter = Router();

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordMatch(answer: string, accepted: string[]): boolean {
  const a = normalise(answer);
  if (!a) return false;
  for (const candidate of accepted) {
    const c = normalise(candidate);
    if (!c) continue;
    if (a === c) return true;
    if (a.includes(c) || c.includes(a)) return true;
  }
  return false;
}

function buildLLMClient(): { client: OpenAI; model: string } | null {
  if (process.env.OPENAI_API_KEY) {
    return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), model: "gpt-4o-mini" };
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

huntGradeRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {
      answer,
      question,
      expectedAnswer,
      acceptedAnswers = [],
      factBody = "",
    } = (req.body ?? {}) as {
      answer?: string;
      question?: string;
      expectedAnswer?: string;
      acceptedAnswers?: string[];
      factBody?: string;
    };

    if (!answer || !expectedAnswer || !question) {
      return res.status(400).json({
        error: "answer, question, and expectedAnswer are required",
      });
    }

    const candidates = [expectedAnswer, ...acceptedAnswers];

    if (keywordMatch(answer, candidates)) {
      return res.status(200).json({
        correct: true,
        confidence: 1.0,
        reason: "keyword match",
        method: "keyword" as const,
      });
    }

    const wired = buildLLMClient();
    if (!wired) {
      // No LLM available — keyword was the only signal and it missed.
      return res.status(200).json({
        correct: false,
        confidence: 0.0,
        reason: "no keyword match and no LLM judge available",
        method: "keyword" as const,
      });
    }

    const { client, model } = wired;

    const systemPrompt = [
      "You judge whether a user's free-form answer to a quiz question is correct.",
      "Reply ONLY with strict JSON: {\"correct\": <bool>, \"confidence\": <0..1>, \"reason\": \"<one short sentence>\"}.",
      "Be lenient on phrasing, spelling, and partial answers as long as the meaning is right.",
      "If the user's answer is a paraphrase, alternate spelling, or a near-synonym of the expected answer, mark it correct.",
      "If the answer is missing the key fact, mark it incorrect.",
    ].join(" ");

    const userPrompt = [
      `Question: ${question}`,
      `Expected answer: ${expectedAnswer}`,
      factBody ? `Source fact (for context): ${factBody}` : null,
      `User's answer: ${answer}`,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await client.chat.completions.create({
      model,
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let correct = false;
    let confidence = 0;
    let reason = "";
    try {
      const parsed = JSON.parse(raw) as {
        correct?: unknown;
        confidence?: unknown;
        reason?: unknown;
      };
      correct = Boolean(parsed.correct);
      confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      reason = typeof parsed.reason === "string" ? parsed.reason : "";
    } catch {
      reason = "LLM returned non-JSON; defaulting to incorrect.";
    }

    return res.status(200).json({
      correct,
      confidence,
      reason,
      method: "llm" as const,
    });
  } catch (err) {
    console.error("[hunt-grade] error:", err);
    return res.status(500).json({ error: "Grading failed." });
  }
});
