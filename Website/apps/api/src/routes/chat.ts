// /chat route. Owner: P1.
// Week 1: return a plausible-shaped stub. Week 2: wire real RAG (Chroma + LLM).

import { Router } from "express";
import { z } from "zod";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  period: z.enum(["medieval", "postwar", "present"]).optional(),
  landmark: z.enum(["duomo", "galleria", "palazzo"]).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { message } = parsed.data;

  // TODO (P1, Week 2):
  //   1. embed(message)
  //   2. chroma.query(collection="duomo", topK=5)
  //   3. build prompt with retrieved chunks + period + landmark context
  //   4. call Anthropic/OpenAI
  //   5. return { answer, sources, confidence }

  res.json({
    answer: `Stub response to: "${message}". P1 replaces this with real RAG in Week 2.`,
    sources: [],
    confidence: 0.5,
  });
});
