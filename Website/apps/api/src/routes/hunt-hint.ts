// /hunt-hint — gives an LLM nudge when the user is stuck on a challenge.
// Owner: P5.
//
// Hint laddering by attempt count (1-indexed):
//   1 → location-only ("look up at the tallest spire")
//   2 → category hint ("a religious figure, gold-coloured")
//   3+ → near-spoiler ("it is called La Madon...") — last resort
//
// Request body:
//   { title, prompt, factBody?, attemptCount?, type? }
//     - title:        challenge title (e.g. "The Golden Lady on Top")
//     - prompt:       the user-facing question or photo prompt
//     - factBody:     ground-truth context from knowledge-base.json
//     - attemptCount: 1, 2, 3 — controls hint specificity
//     - type:         "photo" | "question"  (changes hint phrasing)
// Response: { hint }

import { Router, Request, Response } from "express";
import OpenAI from "openai";

export const huntHintRouter = Router();

function buildClient(): { client: OpenAI; model: string } | null {
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

function ladderInstruction(attempt: number, type: string): string {
  if (attempt <= 1) {
    return type === "photo"
      ? "Give a LOCATION nudge — tell them where to stand or look. Do not name the subject."
      : "Give a CATEGORY nudge — tell them what kind of thing to think about. Do not say the answer.";
  }
  if (attempt === 2) {
    return type === "photo"
      ? "Give a CATEGORY nudge — describe the subject without naming it (colour, shape, size)."
      : "Give a NARROWING nudge — mention the time period or person involved without naming them.";
  }
  return "This is the LAST hint. Get very close to revealing the answer but stop one word short. Truncate the final word like 'It is called La Madon…'.";
}

huntHintRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title = "",
      prompt = "",
      factBody = "",
      attemptCount = 1,
      type = "photo",
    } = (req.body ?? {}) as {
      title?: string;
      prompt?: string;
      factBody?: string;
      attemptCount?: number;
      type?: string;
    };

    if (!title || !prompt) {
      return res.status(400).json({ error: "title and prompt are required" });
    }

    const wired = buildClient();
    if (!wired) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY or GITHUB_TOKEN." });
    }
    const { client, model } = wired;

    const systemPrompt = [
      "You give hints in a heritage treasure hunt — never the answer.",
      "Maximum 2 short sentences. Friendly, curious tone.",
      "Never reveal the final answer unless explicitly told to in the instruction.",
      ladderInstruction(Number(attemptCount) || 1, String(type)),
    ].join(" ");

    const userPrompt = [
      `Challenge: ${title}`,
      `What we asked the user: ${prompt}`,
      factBody ? `Ground-truth fact (do NOT quote verbatim): ${factBody}` : null,
      `Attempt number: ${attemptCount}`,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await client.chat.completions.create({
      model,
      max_tokens: 120,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const hint = completion.choices[0]?.message?.content?.trim() || "Look around — it's closer than you think.";

    return res.status(200).json({ hint });
  } catch (err) {
    console.error("[hunt-hint] error:", err);
    return res.status(500).json({ error: "Hint generation failed." });
  }
});
