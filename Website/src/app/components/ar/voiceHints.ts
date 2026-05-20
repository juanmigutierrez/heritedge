const HINTS: string[] = [
  "take me to the Duomo at birth",
  "show me the Galleria modern",
  "Palazzo Reale, crown period",
  "take me to Galleria",
  "switch to birth",
  "show me the map",
];

/** Pick one approved hint. Random per call — call once on mount per screen. */
export function pickVoiceHint(): string {
  return HINTS[Math.floor(Math.random() * HINTS.length)];
}
