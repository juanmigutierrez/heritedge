const HINTS: string[] = [
  "take me to the Duomo medieval",
  "show me the Galleria postwar",
  "Palazzo Reale, present day",
  "take me to Galleria",
  "switch to medieval",
  "show me the map",
];

/** Pick one approved hint. Random per call — call once on mount per screen. */
export function pickVoiceHint(): string {
  return HINTS[Math.floor(Math.random() * HINTS.length)];
}
