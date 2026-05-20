// Scene data for the tap-through story player.
// Each chapter uses the unified period vocabulary: Birth, Crown, Modern.

export type TimePeriod = "birth" | "crown" | "modern";

export type IllustrationId =
  | "foundation-dig"
  | "duomo-spires"
  | "leonardo-tiburio"
  | "madonnina-heights";

export interface TimelineFrame {
  year: string;
  yearShort?: string;
  image: string;
  caption: string;
}

export type Scene =
  | { kind: "hero"; title: string; subtitle: string; image?: string; askLucaPrompt?: string }
  | { kind: "quote"; text: string; askLucaPrompt?: string }
  | { kind: "narrative"; eyebrow?: string; heading: string; body: string; image?: string; askLucaPrompt?: string }
  | { kind: "reveal"; question: string; answer: string; askLucaPrompt?: string }
  | { kind: "quiz"; question: string; options: string[]; correctIndex: number; explanation?: string; askLucaPrompt?: string }
  | { kind: "illustration"; id: IllustrationId; eyebrow?: string; heading?: string; caption?: string; askLucaPrompt?: string }
  | { kind: "videoEmbed"; title: string; src?: string; poster?: string; caption?: string; autoAdvance?: boolean; askLucaPrompt?: string }
  | { kind: "timelineSlider"; title: string; frames: TimelineFrame[]; askLucaPrompt?: string }
  | { kind: "cultural"; eyebrow?: string; heading: string; body: string; image?: string; askLucaPrompt?: string }
  | { kind: "closing"; heading: string; body?: string; cta?: string; askLucaPrompt?: string };

export const eraScenes: Record<TimePeriod, Scene[]> = {
  birth: [
    {
      kind: "hero",
      title: "Birth",
      subtitle: "1386 - 1500s · Chapter 1 of 3",
      image: "/assets/placeholder.jpg",
    },
    {
      kind: "quote",
      text: "A city dared to begin a cathedral that would outlive every hand that touched it.",
    },
    {
      kind: "narrative",
      eyebrow: "5 August 1386",
      heading: "The first stone.",
      body: "Archbishop Antonio da Saluzzo lays the first stone. Duke Gian Galeazzo Visconti adopts the cathedral as a state enterprise.",
      askLucaPrompt: "Tell me more about the first stone in 1386.",
    },
    {
      kind: "reveal",
      question: "Where does the cathedral's marble come from?",
      answer: "Candoglia, Piedmont. The Fabbrica still receives marble from the same quarries granted in 1387.",
      askLucaPrompt: "Tell me more about Candoglia marble and AUF.",
    },
    {
      kind: "timelineSlider",
      title: "Piazza del Duomo across 280 years",
      frames: [
        {
          year: "1744",
          image: "/assets/placeholder.jpg",
          caption: "Bellotto paints the piazza still crowded with medieval shops.",
        },
        {
          year: "1840",
          image: "/assets/placeholder.jpg",
          caption: "Romantic-era painters arrive. The shops are still there.",
        },
        {
          year: "1880",
          image: "/assets/placeholder.jpg",
          caption: "The first photographs. The clearing has begun.",
        },
        {
          year: "1945",
          image: "/assets/placeholder.jpg",
          caption: "Liberation Day. The square fills with the first free crowd in years.",
        },
        {
          year: "Today",
          image: "/assets/placeholder.jpg",
          caption: "Pedestrian. Cleared. Six million visitors a year.",
        },
      ],
      askLucaPrompt: "Tell me more about how the piazza changed over time.",
    },
    {
      kind: "closing",
      heading: "But this was only the beginning.",
      body: "The Visconti gave the cathedral marble. The Sforza would give it Leonardo.",
      cta: "Begin Chapter 2 - Crown →",
    },
    {
      kind: "cultural",
      eyebrow: "Cultural beat",
      heading: "A day in 1450.",
      body: "Imagine being a stonemason on the Fabbrica payroll. You wake before dawn to the matins bell and work the rising apse until vesper.",
      image: "/assets/placeholder.jpg",
      askLucaPrompt: "Tell me more about daily life in Milan in 1450.",
    },
  ],

  crown: [
    {
      kind: "hero",
      title: "Crown",
      subtitle: "1500s - 1860 · Chapter 2 of 3",
      image: "/assets/placeholder.jpg",
    },
    {
      kind: "quote",
      text: "Leonardo sketched the dome's heart. The Gothic listened, and answered in marble.",
    },
    {
      kind: "reveal",
      question: "Did Leonardo da Vinci really work on the Duomo?",
      answer: "Yes. In 1487-88 he submitted designs for the tiburio and a wooden model for the crossing.",
      askLucaPrompt: "Tell me more about Leonardo's tiburio designs.",
    },
    {
      kind: "narrative",
      eyebrow: "30 December 1774",
      heading: "Milan's golden guardian.",
      body: "A gilded copper statue of the Virgin Mary is placed atop the central spire at 108.5 m above the ground.",
      askLucaPrompt: "Tell me more about the Madonnina and its height rule.",
    },
    {
      kind: "timelineSlider",
      title: "The Duomo facade across four phases",
      frames: [
        {
          year: "1521",
          image: "/assets/placeholder.jpg",
          caption: "Cesariano's elevation drawing sets the dream.",
        },
        {
          year: "1790",
          image: "/assets/placeholder.jpg",
          caption: "Brick still shows. The facade is unfinished.",
        },
        {
          year: "1813",
          image: "/assets/placeholder.jpg",
          caption: "Napoleon orders completion for his coronation.",
        },
        {
          year: "Today",
          image: "/assets/placeholder.jpg",
          caption: "The marble face is complete and restored.",
        },
      ],
      askLucaPrompt: "Tell me more about the Duomo facade and Napoleon's role.",
    },
    {
      kind: "closing",
      heading: "Then the modern world arrived.",
      body: "Italy unified. A glass arcade rose. And one summer night in 1943, the bombs of war wrote one more chapter.",
      cta: "Begin Chapter 3 - Modern →",
    },
    {
      kind: "cultural",
      eyebrow: "Cultural beat",
      heading: "The saffron wedding.",
      body: "1574. A glass-painter adds saffron to rice at his daughter's wedding. The dish becomes Milan's signature.",
      image: "/assets/placeholder.jpg",
      askLucaPrompt: "Tell me more about the origin of risotto alla milanese.",
    },
  ],

  modern: [
    {
      kind: "hero",
      title: "Modern",
      subtitle: "1860 - today · Chapter 3 of 3",
      image: "/assets/placeholder.jpg",
    },
    {
      kind: "quote",
      text: "Italy found a stage. The Galleria opened. The square became a city's living room.",
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
      title: "Sala delle Cariatidi - three states",
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
      kind: "closing",
      heading: "And here we are.",
      body: "Six centuries condensed into one square. The Madonnina is still watching. Now look around.",
      cta: "Continue to AR Experience →",
    },
    {
      kind: "cultural",
      eyebrow: "Cultural beat",
      heading: "A 1960s aperitivo.",
      body: "1960. The economic miracle peaks. You step into Bar Campari, order a Negroni sbagliato, and talk about the new Pirelli Tower.",
      image: "/src/assets/History/golden-eagle-1960s.jpg",
      askLucaPrompt: "Tell me more about aperitivo culture in the Galleria.",
    },
  ],
};
