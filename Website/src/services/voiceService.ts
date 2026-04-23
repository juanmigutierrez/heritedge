// Voice transcription service (Whisper fallback). Owner: P2.
import { apiUpload } from "./apiClient";
import type { TranscribeResponse } from "../types/api";

export async function transcribe(audio: Blob, language = "en"): Promise<TranscribeResponse> {
  const form = new FormData();
  form.append("audio", audio);
  form.append("language", language);
  return apiUpload<TranscribeResponse>("/transcribe", form);
}
