export const VOICE_HINTS: string[] = [
  "show me the Duomo",
  "show me the Galleria",
  "show me the Palazzo",
  "take me to Duomo in the Crown era",
  "take me to Galleria at birth",
  "take me to Palazzo in modern",
  "switch to crown",
  "switch to modern",
  "switch to birth",
];

/** Pick one hint at random. */
export function pickVoiceHint(): string {
  return VOICE_HINTS[Math.floor(Math.random() * VOICE_HINTS.length)];
}
