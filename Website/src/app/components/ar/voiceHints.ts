const HINTS: string[] = [
  "show me the Duomo medieval",
  "take me to the Galleria",
  "Palazzo Reale postwar",
  "Duomo present day",
  "show me medieval Milan",
  "jump to Galleria postwar",
];

/** Pick one approved hint. Random per call — call once on mount per screen. */
export function pickVoiceHint(): string {
  return HINTS[Math.floor(Math.random() * HINTS.length)];
}
