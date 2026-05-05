// Scene data for the tap-through story player.
// Each era has 6–7 scenes that move the user through the chapter at their own pace.

export type TimePeriod = "foundations" | "visconti" | "sforza" | "habsburg";

export type IllustrationId =
  | "foundation-dig"
  | "duomo-spires"
  | "leonardo-tiburio"
  | "madonnina-heights";

export type Scene =
  | { kind: "quote"; text: string }
  | { kind: "narrative"; eyebrow?: string; heading: string; body: string }
  | { kind: "reveal"; question: string; answer: string }
  | { kind: "quiz"; question: string; options: string[]; correctIndex: number; explanation?: string }
  | { kind: "illustration"; id: IllustrationId; eyebrow?: string; heading?: string; caption?: string }
  | { kind: "closing"; heading: string; body?: string };

export const eraScenes: Record<TimePeriod, Scene[]> = {
  foundations: [
    {
      kind: "quote",
      text: "A city dared to begin a cathedral that would outlive every hand that touched it.",
    },
    {
      kind: "narrative",
      eyebrow: "1386",
      heading: "A bold beginning.",
      body: "Milan was a city of ambition. Archbishop Antonio da Saluzzo wanted a cathedral to rival Cologne and Reims — and the political timing was perfect.",
    },
    {
      kind: "narrative",
      eyebrow: "The choice",
      heading: "Gothic — a foreign style.",
      body: "Lombards normally built in Romanesque. Choosing Gothic was a statement to the rest of Europe: Milan belongs at the table.",
    },
    {
      kind: "illustration",
      id: "foundation-dig",
      eyebrow: "Tap to dig",
      heading: "Below the cathedral.",
      caption: "Tap each layer to see what the foundation crews uncovered. The deeper they went, the older the city's memory got.",
    },
    {
      kind: "quiz",
      question: "How many years did the foundation excavations take?",
      options: ["2 years", "7 years", "14 years"],
      correctIndex: 2,
      explanation:
        "Fourteen years of digging before the first stone could rise above ground. A measure of how seriously the city took the project.",
    },
    {
      kind: "narrative",
      eyebrow: "The architect",
      heading: "Simone da Orsenigo.",
      body: "He sketched the floor plan that all six centuries of construction would follow. Almost nothing about it would change.",
    },
    {
      kind: "closing",
      heading: "But this was only the beginning.",
      body: "The Visconti dynasty was about to step in — and turn ambition into spectacle.",
    },
  ],

  visconti: [
    {
      kind: "quote",
      text: "Every spire became a statement. Every statue, a question answered in stone.",
    },
    {
      kind: "narrative",
      eyebrow: "The patron",
      heading: "Gian Galeazzo Visconti.",
      body: "Duke of Milan. He saw the Duomo as the city's calling card to Europe — and was willing to pay for it.",
    },
    {
      kind: "illustration",
      id: "duomo-spires",
      eyebrow: "Tap a spire",
      heading: "A skyline of saints.",
      caption: "Each spire holds a different story. Tap one to discover its secret. Find all five hidden histories.",
    },
    {
      kind: "reveal",
      question: "How many statues line the cathedral?",
      answer:
        "More than 3,400 — saints, biblical figures, animals, gargoyles, even Visconti family members. The largest sculptural ensemble of any Gothic cathedral in Italy.",
    },
    {
      kind: "narrative",
      eyebrow: "The team",
      heading: "An international project.",
      body: "Visconti invited architects from France, Germany, and beyond. The Duomo became a place where European Gothic met Lombard pride.",
    },
    {
      kind: "closing",
      heading: "Then the Sforza arrived.",
      body: "And with them, Renaissance ideas — including a curious sketch from a man named Leonardo.",
    },
  ],

  sforza: [
    {
      kind: "quote",
      text: "Leonardo sketched the dome's heart. The Gothic listened, and answered in marble.",
    },
    {
      kind: "narrative",
      eyebrow: "1450",
      heading: "A new dynasty.",
      body: "The Sforza family took control of Milan. The Renaissance was sweeping through Europe, and the Duomo was about to feel its breath.",
    },
    {
      kind: "illustration",
      id: "leonardo-tiburio",
      eyebrow: "Leonardo's design",
      heading: "Anatomy of a dome.",
      caption: "Leonardo's tiburio sketch from 1487. Tap each part to see what it does — and how Renaissance proportions were sneaking into a Gothic cathedral.",
    },
    {
      kind: "reveal",
      question: "Did Leonardo da Vinci really work on the Duomo?",
      answer:
        "Yes. He submitted designs for the tiburio — the central dome over the crossing — in 1487. His sketches still exist in the Codex Atlanticus.",
    },
    {
      kind: "narrative",
      eyebrow: "The blend",
      heading: "Gothic bones, Renaissance proportions.",
      body: "Spires kept rising in the medieval style, while interior chapels and details borrowed Renaissance harmony. The result: a building unlike any other in Italy.",
    },
    {
      kind: "closing",
      heading: "And then the Habsburgs.",
      body: "Empire would crown what the Renaissance had perfected.",
    },
  ],

  habsburg: [
    {
      kind: "quote",
      text: "On the highest spire, the Madonnina has been watching Milan for two and a half centuries.",
    },
    {
      kind: "narrative",
      eyebrow: "1535–1700s",
      heading: "Imperial Milan.",
      body: "Spanish then Austrian rule. Emperors held coronations inside the Duomo. The cathedral became Europe's stage as much as Milan's church.",
    },
    {
      kind: "narrative",
      eyebrow: "1774",
      heading: "The Madonnina rises.",
      body: "A four-meter gilded statue of the Virgin Mary was placed atop the central spire. Milan's golden guardian.",
    },
    {
      kind: "illustration",
      id: "madonnina-heights",
      eyebrow: "Tap a tower",
      heading: "How tall is she, really?",
      caption: "For two centuries, no Milanese building was allowed to rise above her. Even modern towers honor her with a small replica on top.",
    },
    {
      kind: "quiz",
      question: "How high above the ground does the Madonnina stand?",
      options: ["87 metres", "108 metres", "142 metres"],
      correctIndex: 1,
      explanation:
        "108.5 metres — for over a century, no building in Milan was allowed to rise higher than her. Even today, modern towers pay symbolic respect with a small replica on top.",
    },
    {
      kind: "closing",
      heading: "And here we are.",
      body: "Six centuries condensed into one square. The Madonnina is still watching. Step outside and look up.",
    },
  ],
};
