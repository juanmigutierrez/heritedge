// Thin HTTP client. Owner: P6.
// Every FE → BE call goes through here. Do NOT hardcode fetch URLs in components.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function apiPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<TRes>;
}

export async function apiUpload<TRes>(path: string, form: FormData): Promise<TRes> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<TRes>;
}
