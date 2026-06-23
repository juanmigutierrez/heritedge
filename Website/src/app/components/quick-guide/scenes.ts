// Scene data for the tap-through story player.
// Three locked periods: Birth · Crown · Modern (from Experience-Spec.md).
// Each chapter is a sequence of scenes ending on a "Cultural beat".
// Chapters 1 & 2 (Birth, Crown) owned by Task 1; Chapter 3 (Modern) by Task 2.

export type TimePeriod = "birth" | "crown" | "modern";

// Kept for the Illustration component used in older scenes.
export type IllustrationId =
  | "foundation-dig"
  | "duomo-spires"
  | "leonardo-tiburio"
  | "madonnina-heights";

// Shared frame shape for the timeline slider (Experience-Spec Addendum 2).
export interface TimelineFrame {
  year: string;
  yearShort?: string;
  image: string;
  caption: string;
}

// Unified scene vocabulary. "askLucaPrompt" pre-fills the contextual chat
// question; tapping "Ask Luca more →" returns the user to the same scene.
export type Scene =
  | { kind: "hero";           subtitle: string; cta?: string }
  | { kind: "quote";          text: string; askLucaPrompt?: string }
  | { kind: "narrative";      eyebrow?: string; heading: string; body: string; image?: string; imageAlt?: string; imageCaption?: string; askLucaPrompt?: string }
  | { kind: "reveal";         eyebrow?: string; question: string; answerEyebrow?: string; answer: string; image?: string; imageAlt?: string; askLucaPrompt?: string }
  | { kind: "quiz";           question: string; options: string[]; correctIndex: number; explanation?: string; points?: number; askLucaPrompt?: string }
  | { kind: "illustration";   id: IllustrationId; eyebrow?: string; heading?: string; caption?: string; askLucaPrompt?: string }
  | { kind: "matchGame";      instruction: string; pairs: Array<{ left: string; right: string }>; twist?: string; reveal: string; askLucaPrompt?: string }
  | { kind: "videoEmbed";     title: string; src?: string; poster?: string; caption?: string; autoAdvance?: boolean; askLucaPrompt?: string }
  | { kind: "timelineSlider"; eyebrow?: string; heading: string; frames: TimelineFrame[]; askLucaPrompt?: string }
  | { kind: "cultural";       eyebrow?: string; heading: string; body: string; image?: string; askLucaPrompt?: string }
  | { kind: "closing";        heading: string; body?: string; cta?: string; askLucaPrompt?: string };

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
    askLucaPrompt: "Tell me about the founding of the Duomo in 1386.",
  },
  {
    kind: "narrative",
    eyebrow: "5 August 1386",
    heading: "The first stone.",
    body: "Archbishop Antonio da Saluzzo lays the first stone. Duke Gian Galeazzo Visconti adopts the cathedral as a state enterprise — Milan will have a Gothic answer to Cologne and Reims.",
    askLucaPrompt: "What was the political context behind the Duomo's construction in 1386?",
  },
  {
    kind: "reveal",
    question: "Where does the cathedral's marble come from?",
    answer: "Candoglia, Piedmont — granted to the Fabbrica by Visconti in 1387, in perpetuity. Six centuries later, marble still travels down the Naviglio canals to the building site. The boats are stamped AUF — Ad Usum Fabricae, 'for the use of the Fabbrica'. The abbreviation passed into Milanese slang: doing something a ufo means doing it for free.",
    askLucaPrompt: "Tell me about the Candoglia marble and the AUF tradition.",
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
    kind: "cultural",
    eyebrow: "A day in 1450",
    heading: "How Milanese lived.",
    body: "Imagine being a stonemason on the Fabbrica payroll in 1450. You woke before dawn to the matins bell. Bought your bread at Piazza dei Mercanti — the medieval market that stood where the Galleria now stands. You worked twelve hours under the rising apse, paid in soldi imperiali. By the cathedral's vesper bell you were home, eating polenta with onions. Plague was a season away, like winter.",
    askLucaPrompt: "Tell me more about daily life in Milan in 1450.",
  },
  {
    kind: "closing",
    heading: "But this was only the beginning.",
    body: "The Visconti gave the cathedral marble. The Sforza would give it Leonardo. The Habsburg crowns and Napoleonic France were still centuries away.",
    cta: "Begin Chapter 2 — Crown →",
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
    askLucaPrompt: "Tell me about Leonardo da Vinci's involvement with the Duomo.",
  },
  {
    kind: "reveal",
    eyebrow: "Did he really?",
    question: "Did Leonardo really work on the Duomo?",
    answerEyebrow: "YES · 1487–88",
    answer: "He submitted designs and a wooden model for the tiburio. His sketches survive at the Biblioteca Ambrosiana, right here in Milan.",
    image: "/images/Leonardo_da_Vinci_-_Ambrosiana-Codice-Atlantico-Codex-Atlanticus-f-719-recto.jpg",
    imageAlt: "Leonardo da Vinci, Codex Atlanticus folio 719 recto — sketch related to the Duomo's tiburio",
    askLucaPrompt: "What did Leonardo da Vinci design for the Duomo and where are his sketches today?",
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
    askLucaPrompt: "Tell me the full story of the Madonnina — who made her and what is the height tradition?",
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
    kind: "cultural",
    eyebrow: "The saffron wedding",
    heading: "How Milanese lived.",
    body: "1574. Inside the Duomo workshop, a Belgian glass-painter named Maestro Valerio is finishing a window. He's been using powdered saffron to colour the glass. At his daughter's wedding, he tells the cook to add a pinch to the rice — for luck, for colour. The Milanese have been eating it that way ever since. The most famous dish of this city was probably invented, by accident, inside this building.",
    askLucaPrompt: "Tell me more about the origin of risotto alla milanese.",
  },
  {
    kind: "closing",
    heading: "Then the modern world arrived.",
    body: "Italy unified. A glass arcade rose. And one summer night in 1943, the bombs of war wrote one more chapter.",
    cta: "Begin Chapter 3 — Modern →",
  },
];

// ─── Chapter 3 — Modern (1860 – today) ───────────────────────────────────────

const MODERN: Scene[] = [
  {
    kind: "hero",
    subtitle: "Modern · 1860 – today · Chapter 3 of 3",
    cta: "Begin chapter →",
  },
  {
    kind: "quote",
    text: "Italy found a stage. The Galleria opened. The square became a city's living room.",
    askLucaPrompt: "Tell me about how Milan changed after Italian unification.",
  },
  {
    kind: "narrative",
    eyebrow: "7 March 1865",
    heading: "Mengoni wins.",
    body: "King Vittorio Emanuele II lays the first stone of an iron-and-glass arcade between the Duomo and La Scala. Giuseppe Mengoni wins the national competition.",
    image: "/src/assets/History/mengoni-plans.jpg",
    askLucaPrompt: "Tell me more about Giuseppe Mengoni and the Galleria's design.",
  },
  {
    kind: "reveal",
    question: "Did the architect see his arcade open?",
    answer: "Two days before the inauguration, on 30 December 1877, Mengoni fell from the scaffolding of the triumphal arch and died on the spot. The cause was never resolved.",
    askLucaPrompt: "Tell me more about Mengoni's fall in 1877.",
  },
  {
    kind: "videoEmbed",
    title: "25 April 1945 · Milan liberated",
    src: "/src/assets/History/liberation.mp4",
    poster: "/assets/placeholder.jpg",
    caption: "Three years earlier the square was empty under air-raid sirens. Today, this is the first crowd to fill it freely.",
    autoAdvance: true,
    askLucaPrompt: "Tell me more about Liberation Day in Milan.",
  },
  {
    kind: "timelineSlider",
    eyebrow: "Drag to compare",
    heading: "Sala delle Cariatidi — three states.",
    frames: [
      {
        year: "1900",
        image: "/src/assets/History/brogi-cariatidi-1900.jpg",
        caption: "Brogi's photograph shows the intact hall.",
      },
      {
        year: "1944",
        image: "/src/assets/History/cariatidi-1944.jpg",
        caption: "After the 1943 bombing, the hall is blackened.",
      },
      {
        year: "Today",
        image: "/src/assets/History/cariatidi-today.jpg",
        caption: "Deliberately scarred and never fully restored.",
      },
    ],
    askLucaPrompt: "Tell me more about the Sala delle Cariatidi and the 1943 bombing.",
  },
  {
    kind: "cultural",
    eyebrow: "A 1960s aperitivo",
    heading: "How Milanese lived.",
    body: "1960. The economic miracle peaks. You step into Bar Campari, order a Negroni sbagliato, and talk about the new Pirelli Tower.",
    image: "/src/assets/History/golden-eagle-1960s.jpg",
    askLucaPrompt: "Tell me more about aperitivo culture in the Galleria.",
  },
  {
    kind: "closing",
    heading: "And here we are.",
    body: "Six centuries condensed into one square. The Madonnina is still watching. Now look around.",
    cta: "Continue to AR Experience →",
  },
];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const eraScenes: Record<TimePeriod, Scene[]> = {
  birth:  BIRTH,
  crown:  CROWN,
  modern: MODERN,
};

// Legacy alias — keeps any code that still imports chapterScenes working.
export const chapterScenes = eraScenes;
