// Scene data for the tap-through story player.
// Three locked periods: Birth · Crown · Modern (from Experience-Spec.md).
// Chapter 1 (Birth) and Chapter 2 (Crown) owned by Task 1.
// Chapter 3 (Modern) owned by Task 2.

export type TimePeriod = "birth" | "crown" | "modern";

// Kept for the Illustration component used in older scenes.
export type IllustrationId =
  | "foundation-dig"
  | "duomo-spires"
  | "leonardo-tiburio"
  | "madonnina-heights";

export type Scene =
  | { kind: "hero";            subtitle: string; cta?: string }
  | { kind: "quote";           text: string; chatQuestion?: string }
  | { kind: "narrative";       eyebrow?: string; heading: string; body: string; image?: string; imageAlt?: string; imageCaption?: string; chatQuestion?: string }
  | { kind: "reveal";          question: string; answer: string; image?: string; imageAlt?: string; eyebrow?: string; answerEyebrow?: string; chatQuestion?: string }
  | { kind: "quiz";            question: string; options: string[]; correctIndex: number; explanation?: string; points?: number }
  | { kind: "illustration";    id: IllustrationId; eyebrow?: string; heading?: string; caption?: string }
  | { kind: "closing";         heading: string; body?: string; ctaLabel?: string }
  | { kind: "cultural";        eyebrow: string; heading: string; body: string }
  | { kind: "matchGame";       instruction: string; pairs: Array<{ left: string; right: string }>; twist?: string; reveal: string }
  | { kind: "timelineSlider";  eyebrow?: string; heading: string; frames: Array<{ year: string; image: string; caption: string }> };

// ─── Chapter 1 — Birth (1386 – 1500s) ────────────────────────────────────────

const BIRTH: Scene[] = [
  {
    kind: "hero",
    subtitle: "Birth · 1386 – 1500s · Chapter 1 of 3",
    cta: "Begin chapter →",
  },
  {
    kind: "quote",
    text: "A city dared to begin a cathedral that would outlive every hand that touched it.",
    chatQuestion: "Tell me about the founding of the Duomo in 1386.",
  },
  {
    kind: "narrative",
    eyebrow: "5 August 1386",
    heading: "The first stone.",
    body: "Archbishop Antonio da Saluzzo lays the first stone. Duke Gian Galeazzo Visconti adopts the cathedral as a state enterprise — Milan will have a Gothic answer to Cologne and Reims.",
    chatQuestion: "What was the political context behind the Duomo's construction in 1386?",
  },
  {
    kind: "reveal",
    question: "Where does the cathedral's marble come from?",
    answer: "Candoglia, Piedmont — granted to the Fabbrica by Visconti in 1387, in perpetuity. Six centuries later, marble still travels down the Naviglio canals to the building site. The boats are stamped AUF — Ad Usum Fabricae, 'for the use of the Fabbrica'. The abbreviation passed into Milanese slang: doing something a ufo means doing it for free.",
    chatQuestion: "Tell me about the Candoglia marble and the AUF tradition.",
  },
  {
    kind: "quiz",
    question: "How many years did the foundation excavations take?",
    options: ["2 years", "7 years", "14 years"],
    correctIndex: 2,
    explanation: "Fourteen years of digging before the first stone could rise above ground. A measure of how seriously the city took the project.",
    points: 80,
  },
  {
    kind: "timelineSlider",
    eyebrow: "Drag through the years",
    heading: "The square across four lifetimes.",
    frames: [
      {
        year: "Late 1700s",
        image: "/images/Milano-duomo-18th-Century.avif",
        caption: "End of the 18th century — the cathedral stands inside a crowded city, medieval shops still pressed against its south flank.",
      },
      {
        year: "1850",
        image: "/images/piazza-del-duomo-1850.avif",
        caption: "1850 — Italy is not yet unified. The square is still cluttered with small buildings; the Galleria does not exist.",
      },
      {
        year: "1950",
        image: "/images/duomo-1950.webp",
        caption: "1950 — Postwar Milan. The piazza has been cleared and the city is rebuilding around it, five years after Liberation.",
      },
      {
        year: "Today",
        image: "/images/piazza-duomo-today.avif",
        caption: "Today — pedestrian and cleared. Six million visitors pass through every year.",
      },
    ],
  },
  {
    kind: "closing",
    heading: "But this was only the beginning.",
    body: "The Visconti gave the cathedral marble. The Sforza would give it Leonardo. The Habsburg crowns and Napoleonic France were still centuries away.",
    ctaLabel: "Begin Chapter 2 — Crown →",
  },
  {
    kind: "cultural",
    eyebrow: "A day in 1450",
    heading: "How Milanese lived.",
    body: "Imagine being a stonemason on the Fabbrica payroll in 1450. You woke before dawn to the matins bell. Bought your bread at Piazza dei Mercanti — the medieval market that stood where the Galleria now stands. You worked twelve hours under the rising apse, paid in soldi imperiali. By the cathedral's vesper bell you were home, eating polenta with onions. Plague was a season away, like winter.",
  },
];

// ─── Chapter 2 — Crown (1500s – 1860) ────────────────────────────────────────

const CROWN: Scene[] = [
  {
    kind: "hero",
    subtitle: "Crown · 1500s – 1860 · Chapter 2 of 3",
    cta: "Begin chapter →",
  },
  {
    kind: "quote",
    text: "Leonardo sketched the dome's heart. The Gothic listened, and answered in marble.",
    chatQuestion: "Tell me about Leonardo da Vinci's involvement with the Duomo.",
  },
  {
    kind: "reveal",
    eyebrow: "Did he really?",
    question: "Did Leonardo really work on the Duomo?",
    answerEyebrow: "YES · 1487–88",
    answer: "He submitted designs and a wooden model for the tiburio. His sketches survive at the Biblioteca Ambrosiana, right here in Milan.",
    image: "/images/Leonardo_da_Vinci_-_Ambrosiana-Codice-Atlantico-Codex-Atlanticus-f-719-recto.jpg",
    imageAlt: "Leonardo da Vinci, Codex Atlanticus folio 719 recto — sketch related to the Duomo's tiburio",
    chatQuestion: "What did Leonardo da Vinci design for the Duomo and where are his sketches today?",
  },
  {
    kind: "matchGame",
    instruction: "Match each building to its architect.",
    pairs: [
      { left: "Duomo di Milano",  right: "Simone da Orsenigo" },
      { left: "Palazzo Reale",    right: "Giuseppe Piermarini" },
      { left: "La Scala",         right: "Giuseppe Piermarini" },
    ],
    twist: "Piermarini designed both Palazzo Reale and La Scala — and they share a wall.",
    reveal: "Piermarini designed both buildings. La Scala opens in 1778, the same year he finishes the Palazzo's grand hall. The two share a wall. The Galleria doesn't exist yet — that's the next chapter.",
  },
  {
    kind: "narrative",
    eyebrow: "30 December 1774",
    heading: "Milan's golden guardian rises.",
    body: "A 4.16-metre gilded copper statue of the Virgin Mary is placed atop the central spire at 108.5 metres above the ground. Sculptor Giuseppe Perego, goldsmith Giuseppe Bini. An unwritten rule begins: no Milanese building should rise above her.",
    image: "/images/madonnina_rise.jpg",
    imageAlt: "The Madonnina atop the central spire of the Duomo",
    chatQuestion: "Tell me the full story of the Madonnina — who made her and what is the height tradition?",
  },
  {
    kind: "timelineSlider",
    eyebrow: "Drag to compare",
    heading: "The façade.",
    frames: [
      {
        year: "1790s",
        image: "/images/Milano-duomo-18th-Century.avif",
        caption: "Napoleon ordered the façade finished before his 1805 coronation as King of Italy. His name is carved on it.",
      },
      {
        year: "Today",
        image: "/images/Duomo-Di-Milano-scene-2.5.jpg",
        caption: "Napoleon ordered the façade finished before his 1805 coronation as King of Italy. His name is carved on it.",
      },
    ],
  },
  {
    kind: "closing",
    heading: "Then the modern world arrived.",
    body: "Italy unified. A glass arcade rose. And one summer night in 1943, the bombs of war wrote one more chapter.",
    ctaLabel: "Begin Chapter 3 — Modern →",
  },
  {
    kind: "cultural",
    eyebrow: "The saffron wedding",
    heading: "How Milanese lived.",
    body: "1574. Inside the Duomo workshop, a Belgian glass-painter named Maestro Valerio is finishing a window. He's been using powdered saffron to colour the glass. At his daughter's wedding, he tells the cook to add a pinch to the rice — for luck, for colour. The Milanese have been eating it that way ever since. The most famous dish of this city was probably invented, by accident, inside this building.",
  },
];

// ─── Chapter 3 — Modern (1860 – today) ───────────────────────────────────────
// Owned by Task 2 — empty until those scenes are written.

const MODERN: Scene[] = [];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const chapterScenes: Record<TimePeriod, Scene[]> = {
  birth:  BIRTH,
  crown:  CROWN,
  modern: MODERN,
};

// Legacy alias — keeps any code that still imports eraScenes working.
export const eraScenes = chapterScenes;
