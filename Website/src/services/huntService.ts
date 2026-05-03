// huntService.ts — frontend wrapper for the treasure-hunt backend routes.
// Owner: P5.
//
// Three calls:
//   verifyPhoto(file, subject)        → POST /verify-photo
//   gradeAnswer(challenge, answer)    → POST /hunt-grade
//   getHint(challenge, attemptCount)  → POST /hunt-hint
//
// All requests go through apiClient's BASE_URL (VITE_API_URL or :3001).

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type Verdict = "match" | "low-confidence" | "no-match";

export interface VerifyPhotoResult {
  verdict: Verdict;
  confidence: number;
  reason: string;
  model?: string;
}

export interface GradeResult {
  correct: boolean;
  confidence: number;
  reason: string;
  method: "keyword" | "llm";
}

export interface HintResult {
  hint: string;
}

export interface QuestionChallengeContext {
  question: string;
  expectedAnswer: string;
  acceptedAnswers?: string[];
  factBody?: string;
}

export interface HintContext {
  title: string;
  prompt: string;
  factBody?: string;
  attemptCount: number;
  type: "photo" | "question";
}

export async function verifyPhoto(
  file: File | Blob,
  subject: string,
  filename = "photo.jpg"
): Promise<VerifyPhotoResult> {
  const form = new FormData();
  form.append("photo", file, filename);
  form.append("subject", subject);

  const res = await fetch(`${BASE_URL}/verify-photo`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`verify-photo ${res.status}`);
  return res.json();
}

export async function gradeAnswer(
  ctx: QuestionChallengeContext,
  answer: string
): Promise<GradeResult> {
  const res = await fetch(`${BASE_URL}/hunt-grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answer,
      question: ctx.question,
      expectedAnswer: ctx.expectedAnswer,
      acceptedAnswers: ctx.acceptedAnswers ?? [],
      factBody: ctx.factBody ?? "",
    }),
  });
  if (!res.ok) throw new Error(`hunt-grade ${res.status}`);
  return res.json();
}

export async function getHint(ctx: HintContext): Promise<HintResult> {
  const res = await fetch(`${BASE_URL}/hunt-hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ctx),
  });
  if (!res.ok) throw new Error(`hunt-hint ${res.status}`);
  return res.json();
}
