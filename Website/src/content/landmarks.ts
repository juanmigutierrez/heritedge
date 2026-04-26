// Landmark detail-view content registry. Owner: P3 (detailed view).
//
// This file is the single plug-point the AR views read from.
// Today it returns static TS objects so the layout works without a backend.
// To make the view dynamic, swap the body of the resolver functions
// (getLandmark / getEraContent / getHotspots / listLandmarks) to call an
// async data source. The view already calls them through hooks, so it will
// re-render when data arrives — see DATA_FLOW notes in ARArtifactDetail.tsx.
//
// Schema rationale:
//   - "Era" metadata (color, label, year) is presentational — stays here.
//   - "Landmark meta" (name, kicker) and didYouKnow / quiz are content the
//     view always needs upfront. Today seeded statically; long-term comes
//     from /api/landmarks (P5/P6 owns that endpoint).
//   - "Hotspot" data is per-era because the visual elements you point at
//     differ by period (e.g. the Galleria's glass dome doesn't exist
//     medievally). Each hotspot REQUIRES a source — the professor cares
//     about grounding, and we don't want to ship fact-cards without one.
//   - "EraContent" (headline + blurb per landmark+period) is the only piece
//     that overlaps with knowledge-base.json. getEraContent() falls back to
//     the curated KB entry when no landmark-specific override exists, so
//     P5's edits to knowledge-base.json show up in this view automatically.

import type { Landmark, Period } from "../types/api";
import knowledgeBase from "./knowledge-base.json";
import type { KnowledgeBase } from "./types";

export type LandmarkId = Landmark;
export type EraId = Period;

export interface Era {
  id: EraId;
  label: string;
  year: string;
  /** Accent color — drives badges, scrubber thumb, hotspots, focus rings. */
  accent: string;
  /** Page background tint for this era. */
  tintBg: string;
  /** Card / panel tint for this era. */
  tintPanel: string;
  /** Decorative gradient used as a fallback "AR model" backdrop. */
  grad: string;
}

export interface Source {
  label: string;
  url?: string;
}

/**
 * A clickable point on a landmark image. Always tied to one era — see
 * `LandmarkMeta.hotspots` (Record<EraId, Hotspot[]>).
 *
 * `id` must be globally stable: it's the key used to track which hotspots
 * the user has already explored (see useVisitedHotspots). Convention:
 *   "<landmark>-<feature>-<era>"  e.g. "duomo-spires-medieval"
 */
export interface Hotspot {
  id: string;
  /** Percentage from left (0–100). */
  x: number;
  /** Percentage from top (0–100). */
  y: number;
  /** Short label shown in tooltips and matched against voice transcripts. */
  label: string;
  /** Headline shown in the hotspot bottom sheet. */
  title: string;
  /** 1–2 sentence body. Also fed to TTS when the user taps "Listen". */
  body: string;
  /** REQUIRED. We do not ship fact-cards without grounding. */
  source: Source;
}

export interface DidYouKnow {
  q: string;
  a: string;
}

export interface Quiz {
  q: string;
  options: string[];
  /** Index into options[]. */
  answer: number;
}

export interface LandmarkMeta {
  id: LandmarkId;
  name: string;
  /** Short overline above the title — context-setting one-liner. */
  kicker: string;
  /** Period-keyed image URLs. */
  images: Record<EraId, string>;
  /** Per-era hotspot lists. Up to ~4 per era. */
  hotspots: Record<EraId, Hotspot[]>;
  didYouKnow: DidYouKnow[];
  /** Kept for future use — quiz UI is currently disabled. */
  quiz: Quiz;
}

export interface EraContent {
  headline: string;
  blurb: string;
  source?: Source;
}

// ─── Era metadata (presentational) ────────────────────────────────────────────

export const ERAS: Era[] = [
  {
    id: "medieval",
    label: "Medieval",
    year: "1386",
    accent: "#D9A77A",
    tintBg: "#1A1612",
    tintPanel: "#221C16",
    grad: "linear-gradient(160deg, #6b6e5e 0%, #3d4036 55%, #1f211c 100%)",
  },
  {
    id: "postwar",
    label: "Post-war",
    year: "1945",
    accent: "#9CB3BE",
    tintBg: "#0F1316",
    tintPanel: "#171C20",
    grad: "linear-gradient(150deg, #7d7b76 0%, #4a4844 55%, #1c1b18 100%)",
  },
  {
    id: "present",
    label: "Present",
    year: "2026",
    accent: "#E8C77A",
    tintBg: "#0B0B0E",
    tintPanel: "#16161B",
    grad: "linear-gradient(160deg, #6c8aa6 0%, #2f4860 55%, #0f1a26 100%)",
  },
];

// ─── Sources (re-used so the labels stay consistent) ──────────────────────────

const FABBRICA: Source = { label: "Veneranda Fabbrica del Duomo", url: "https://www.duomomilano.it" };
const COMUNE:   Source = { label: "Comune di Milano", url: "https://www.comune.milano.it" };
const ARCHIVIO: Source = { label: "Archivio Storico Civico di Milano" };

// ─── Landmark metadata (seed content) ─────────────────────────────────────────
// TODO(P5+P6): move this into /api/landmarks once the endpoint exists. The
// view only reads it through getLandmark() / listLandmarks() / getHotspots(),
// so swapping the source is local.

const LANDMARK_META: Record<LandmarkId, LandmarkMeta> = {
  duomo: {
    id: "duomo",
    name: "Duomo di Milano",
    kicker: "Milan's gothic heart",
    images: {
      medieval:
        "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      postwar:
        "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      present:
        "https://images.unsplash.com/photo-1688674966559-fe9f9d661c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW9tbyUyMG1pbGFubyUyMGNhdGhlZHJhbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDcyMjkzNnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    hotspots: {
      medieval: [
        { id: "duomo-foundation-medieval", x: 50, y: 78, label: "Foundation",
          title: "First stone laid, 1386",
          body: "Archbishop Antonio da Saluzzo blesses the foundation. Construction will continue for nearly six centuries.",
          source: FABBRICA },
        { id: "duomo-marble-medieval", x: 30, y: 60, label: "Candoglia marble",
          title: "Pink-veined marble",
          body: "Quarried at Lake Maggiore and floated in by canal, the Candoglia marble gives the cathedral its distinctive blush tone.",
          source: FABBRICA },
        { id: "duomo-spires-medieval", x: 40, y: 28, label: "Early spires",
          title: "Spires take shape",
          body: "The first gothic spires rise. The full set of 135 won't be completed until the 19th century.",
          source: FABBRICA },
        { id: "duomo-portal-medieval", x: 60, y: 65, label: "Central portal",
          title: "The bronze doors",
          body: "Massive bronze doors carved with biblical scenes mark the cathedral's main entrance, even in the unfinished medieval phase.",
          source: FABBRICA },
      ],
      postwar: [
        { id: "duomo-roof-postwar", x: 50, y: 22, label: "Bombed roof",
          title: "August 1943",
          body: "Allied raids strike the cathedral roof. The main structure survives but tiles, lead sheathing, and statues need years of repair.",
          source: ARCHIVIO },
        { id: "duomo-windows-postwar", x: 35, y: 50, label: "Shattered glass",
          title: "Stained glass lost",
          body: "Centuries-old stained glass windows shatter in the bombings. Restoration teams recover and re-lead what they can.",
          source: ARCHIVIO },
        { id: "duomo-scaffold-postwar", x: 65, y: 55, label: "Restoration scaffolds",
          title: "Postwar scaffolds",
          body: "Scaffolding climbs the facade through the late 1940s and 1950s as the Veneranda Fabbrica re-cuts marble blocks by hand.",
          source: FABBRICA },
        { id: "duomo-liberation-postwar", x: 50, y: 80, label: "1945 liberation",
          title: "A symbolic stage",
          body: "Piazza Duomo becomes a public stage for Milan's 1945 liberation. The cathedral, scarred but standing, frames the moment.",
          source: ARCHIVIO },
      ],
      present: [
        { id: "duomo-madonnina-present", x: 50, y: 12, label: "Madonnina",
          title: "The gilded Madonnina",
          body: "Placed at the spire's tip in 1774, the gilded statue is Milan's spiritual high point — long held by tradition that no building should rise above it.",
          source: FABBRICA },
        { id: "duomo-laser-present", x: 30, y: 50, label: "Laser cleaning",
          title: "Laser-cleaned marble",
          body: "Conservators use laser pulses to lift centuries of grime without abrading the stone underneath.",
          source: FABBRICA },
        { id: "duomo-3d-scan-present", x: 70, y: 60, label: "3D scanning",
          title: "Digital twin",
          body: "Every spire and statue is being 3D-scanned to support restoration and preserve the geometry digitally.",
          source: FABBRICA },
        { id: "duomo-statues-present", x: 50, y: 30, label: "3,400 statues",
          title: "More statues than any building",
          body: "Over 3,400 statues populate the spires, parapets, and niches — more than any other building in the world.",
          source: FABBRICA },
      ],
    },
    didYouKnow: [
      { q: "How many statues sit on the Duomo?", a: "Over 3,400 — more than any other building in the world." },
      { q: "What marble was used?", a: "Pink-veined Candoglia marble, floated in by canal from Lake Maggiore." },
      { q: "When was the central spire raised?", a: "The Madonnina was placed at the top in 1774." },
    ],
    quiz: {
      q: "What year did construction of the Duomo begin?",
      options: ["1286", "1386", "1486", "1586"],
      answer: 1,
    },
  },

  galleria: {
    id: "galleria",
    name: "Galleria Vittorio Emanuele II",
    kicker: "Milan's living room",
    images: {
      medieval:
        "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      postwar:
        "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      present:
        "https://images.unsplash.com/photo-1671232847170-b31a815afcf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYWxsZXJpYSUyMHZpdHRvcmlvJTIwZW1hbnVlbGUlMjBtaWxhbm98ZW58MXx8fHwxNzc0NzIyOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    hotspots: {
      medieval: [
        { id: "galleria-lanes-medieval", x: 40, y: 50, label: "Medieval lanes",
          title: "Tangle of lanes",
          body: "Where the arcade now stands ran a warren of medieval houses, small chapels, and alleys.",
          source: ARCHIVIO },
        { id: "galleria-market-medieval", x: 60, y: 60, label: "Market square",
          title: "A small market square",
          body: "A modest market square sat near the cathedral, a noisy foothold for merchants and pilgrims.",
          source: ARCHIVIO },
        { id: "galleria-chapel-medieval", x: 30, y: 35, label: "Lost chapels",
          title: "Chapels swept away",
          body: "Several medieval chapels — including parts of San Tecla — once stood on this footprint before being cleared for the 19th-century arcade.",
          source: ARCHIVIO },
      ],
      postwar: [
        { id: "galleria-glass-postwar", x: 50, y: 22, label: "Rebuilt glass",
          title: "Glass roof, restored",
          body: "1943 raids shatter the original glass dome. Restorers rebuild it bolt-for-bolt from Mengoni's 1877 plans.",
          source: COMUNE },
        { id: "galleria-mosaic-postwar", x: 60, y: 70, label: "Mosaic floor",
          title: "Mosaic floor repairs",
          body: "Damaged sections of the marble-mosaic floor are pieced back together using tesserae salvaged from the rubble.",
          source: COMUNE },
        { id: "galleria-cafes-postwar", x: 30, y: 60, label: "Cafés return",
          title: "Cafés reopen",
          body: "Through the 1950s the arcade quickly becomes a symbol of Italian style — couture, cafés, and the postwar economic boom.",
          source: COMUNE },
      ],
      present: [
        { id: "galleria-bull-present", x: 55, y: 75, label: "Turin's bull",
          title: "The lucky heel-spin",
          body: "Tradition says spinning your heel on the testicles of Turin's bull mosaic brings good luck.",
          source: COMUNE },
        { id: "galleria-dome-present", x: 50, y: 22, label: "Iron dome",
          title: "Iron and glass dome",
          body: "Mengoni's wrought-iron dome was a marvel of 19th-century engineering — one of the tallest of its kind when it was built.",
          source: COMUNE },
        { id: "galleria-couture-present", x: 30, y: 55, label: "Couture houses",
          title: "Milan's living room",
          body: "Prada, Versace, and Louis Vuitton line the arcade today, alongside the historic Camparino bar.",
          source: COMUNE },
        { id: "galleria-mengoni-present", x: 70, y: 50, label: "Mengoni's plaque",
          title: "Architect's tragedy",
          body: "Giuseppe Mengoni fell to his death from the arcade days before its 1877 inauguration — a small plaque marks the spot.",
          source: COMUNE },
      ],
    },
    didYouKnow: [
      { q: "Why do people spin on the bull mosaic?", a: "Spinning a heel on Turin's bull is said to bring luck." },
      { q: "Who designed it?", a: "Giuseppe Mengoni — he died falling from the arcade days before its 1877 inauguration." },
    ],
    quiz: {
      q: "When was the Galleria completed?",
      options: ["1865", "1877", "1901", "1923"],
      answer: 1,
    },
  },

  palazzo: {
    id: "palazzo",
    name: "Palazzo Reale",
    kicker: "Seat of power, now of art",
    images: {
      medieval:
        "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      postwar:
        "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      present:
        "https://images.unsplash.com/photo-1620030537215-9ef4d9c0d3ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWxhenpvJTIwcmVhbGUlMjBtaWxhbm8lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0NzIyOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    hotspots: {
      medieval: [
        { id: "palazzo-broletto-medieval", x: 50, y: 55, label: "Broletto Vecchio",
          title: "The old town hall",
          body: "Milan's medieval council met here as the Broletto Vecchio — argument and decree under a fortified roof.",
          source: ARCHIVIO },
        { id: "palazzo-tower-medieval", x: 30, y: 35, label: "Defensive tower",
          title: "A fortified seat",
          body: "Defensive walls and a square tower marked it out as a seat of power in the unsettled 12th-century city.",
          source: ARCHIVIO },
        { id: "palazzo-visconti-medieval", x: 70, y: 60, label: "Visconti rule",
          title: "Visconti expansion",
          body: "Under the Visconti family the building expanded into a palace fit for the Duchy of Milan.",
          source: ARCHIVIO },
      ],
      postwar: [
        { id: "palazzo-cariatidi-postwar", x: 45, y: 55, label: "Sala delle Cariatidi",
          title: "Caryatids in ruin",
          body: "The grand Hall of Caryatids was gutted by the 1943 raids. After debate, planners chose to leave its scars unrestored as a memorial.",
          source: ARCHIVIO },
        { id: "palazzo-facade-postwar", x: 60, y: 35, label: "Damaged facade",
          title: "Cracked neoclassical front",
          body: "Bombs split the neoclassical facade. Reconstruction stabilized it without smoothing over every wound.",
          source: ARCHIVIO },
        { id: "palazzo-rebuild-postwar", x: 30, y: 70, label: "Cultural rebirth",
          title: "Repurposed for the public",
          body: "1950s rebuilding turned much of the palace into exhibition space — a peace-time mission for a building once used for war planning.",
          source: COMUNE },
      ],
      present: [
        { id: "palazzo-exhibitions-present", x: 50, y: 50, label: "Exhibitions",
          title: "World-touring shows",
          body: "Today Palazzo Reale hosts world-class art exhibitions year-round in the restored ducal halls.",
          source: COMUNE },
        { id: "palazzo-cariatidi-present", x: 35, y: 60, label: "Memorial hall",
          title: "Hall of Caryatids — preserved",
          body: "The unrestored Hall of Caryatids remains as a public memorial to the cost of the war.",
          source: COMUNE },
        { id: "palazzo-facade-present", x: 70, y: 30, label: "Neoclassical facade",
          title: "Piermarini's design",
          body: "The Piermarini-designed neoclassical facade adjacent to the Duomo defines the palace's modern look.",
          source: COMUNE },
        { id: "palazzo-museum-present", x: 50, y: 78, label: "Cultural hub",
          title: "Premier art venue",
          body: "Now one of Milan's premier art venues, integrated into the cultural life of Piazza del Duomo.",
          source: COMUNE },
      ],
    },
    didYouKnow: [
      { q: "What does its medieval name mean?", a: "It was the Broletto Vecchio — the old town hall, where Milan's councils met." },
      { q: "What's left of the war damage?", a: "The Hall of Caryatids was kept unrestored as a memorial to 1943." },
    ],
    quiz: {
      q: "What is Palazzo Reale used for today?",
      options: ["Royal residence", "Art exhibitions", "Government offices", "University"],
      answer: 1,
    },
  },
};

// ─── Curated era blurbs (overrides knowledge-base fallback) ───────────────────
// These are short, layout-tuned headlines + 1-sentence blurbs designed for the
// detail card. They take precedence over generic KB entries when present.

const ERA_BLURBS: Partial<Record<LandmarkId, Partial<Record<EraId, EraContent>>>> = {
  duomo: {
    medieval: { headline: "First stone laid", blurb: "1386 — the Archbishop blesses the foundation. Pink Candoglia marble starts arriving by canal." },
    postwar:  { headline: "Wounded by bombs", blurb: "Allied raids in 1943 cracked the roof and shattered windows. Restoration would take decades." },
    present:  { headline: "Laser-cleaned marble", blurb: "Today's restoration uses laser cleaning and 3D scanning to preserve every gothic detail." },
  },
  galleria: {
    medieval: { headline: "Tangle of lanes", blurb: "A warren of medieval houses, small chapels, and a tiny market square stood here." },
    postwar:  { headline: "Glass roof rebuilt", blurb: "1943 shattered the original glass. Restored true to Mengoni's 1877 design — bolt for bolt." },
    present:  { headline: "Milan's living room", blurb: "Couture houses, mosaics, and the famous heel-spin on the Turin bull for luck." },
  },
  palazzo: {
    medieval: { headline: "The Broletto Vecchio", blurb: "Milan's noisy medieval town hall — democratic argument with a marble floor." },
    postwar:  { headline: "Caryatids in ruin", blurb: "1943 left scars in the great hall. Kept unrestored as a memorial to the war." },
    present:  { headline: "Museum & exhibitions", blurb: "Hosts world-touring art shows year-round in the restored ducal halls." },
  },
};

const FALLBACK_CONTENT: EraContent = {
  headline: "Content coming soon",
  blurb: "We're still gathering material for this period. Try another era or ask the assistant.",
};

// ─── Resolvers (the ONLY API the views should call) ───────────────────────────
//
// Keep these synchronous for now. When you wire a real backend, change the
// signatures to async and use the loader pattern shown in ARArtifactDetail.tsx.

export const listLandmarks = (): LandmarkMeta[] => Object.values(LANDMARK_META);

export const getLandmark = (id: LandmarkId): LandmarkMeta | undefined =>
  LANDMARK_META[id];

export const getEra = (id: EraId): Era | undefined =>
  ERAS.find((e) => e.id === id);

export const getHotspots = (
  landmarkId: LandmarkId,
  eraId: EraId
): Hotspot[] => LANDMARK_META[landmarkId]?.hotspots[eraId] ?? [];

export const getEraContent = (
  landmarkId: LandmarkId,
  eraId: EraId
): EraContent => {
  const curated = ERA_BLURBS[landmarkId]?.[eraId];
  if (curated) return curated;

  // Fallback: pull the first matching curated fact from knowledge-base.json
  // so P5's content edits show up here automatically.
  const kb = knowledgeBase as KnowledgeBase;
  const fact = kb.facts.find(
    (f) => f.landmark === landmarkId && (f.period === eraId || f.period === "all")
  );
  if (fact) {
    return {
      headline: fact.title,
      blurb: fact.body,
      source: fact.source,
    };
  }

  return FALLBACK_CONTENT;
};
