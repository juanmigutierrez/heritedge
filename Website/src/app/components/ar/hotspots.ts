// AR Experience — hotspot data for the camera overlay (Act Two).
// Owner: Task 3 — AR content & hotspots.
//
// Periods match the Tour Guide vocabulary: Birth / Crown / Modern.
// Task 4 reads this file to place gold dots on the camera feed.
//
// compassHeading: degrees from north, where 0° = toward the Duomo's central façade.
// Media is only defined for hotspots where real assets are available.

import cariatidiBefore from "@/assets/History/Salla_delle-Cariatidi.jpg";

export type ARPeriodId = "birth" | "crown" | "modern";

// ─── Period metadata ───────────────────────────────────────────────────────────

export interface ARPeriod {
  id: ARPeriodId;
  label: string;
  years: string;
  /** Accent colour — drives hotspot dots, sheet header, badges. */
  accent: string;
  /** Dark panel background tint for the sheet. */
  tintPanel: string;
  /** RGBA overlay applied to the camera / panorama for this period. */
  overlayColor: string;
  /** Description of ambient audio (Task 4 wires the actual audio file). */
  ambientDesc: string;
}

export const AR_PERIODS: Record<ARPeriodId, ARPeriod> = {
  birth: {
    id: "birth",
    label: "Birth",
    years: "1386 – 1500s",
    accent: "#D9A77A",
    tintPanel: "#221C16",
    overlayColor: "rgba(181,143,90,0.15)",
    ambientDesc: "Faint medieval chant",
  },
  crown: {
    id: "crown",
    label: "Crown",
    years: "1500s – 1860",
    accent: "#E8A84A",
    tintPanel: "#1E1A12",
    overlayColor: "rgba(220,155,60,0.12)",
    ambientDesc: "Soft baroque harpsichord",
  },
  modern: {
    id: "modern",
    label: "Modern",
    years: "1860 – today",
    accent: "#A8B8C4",
    tintPanel: "#141A1F",
    overlayColor: "rgba(0,0,0,0)",
    ambientDesc: "Faint distant tram bell",
  },
};

// ─── Media types ───────────────────────────────────────────────────────────────
// Only defined for hotspots where real assets exist.

export type ARMediaType = "image" | "audio" | "youtube";

export interface ARMedia {
  type: ARMediaType;
  /** For image: direct URL. For audio: path to audio file. For youtube: video ID only. */
  src: string;
  altText?: string;
  caption?: string;
  /** For audio: loop the playback. */
  looped?: boolean;
  /** For audio: static historical image shown behind the waveform. */
  staticImage?: string;
}

// ─── Before/After ─────────────────────────────────────────────────────────────

export interface ARBeforeAfter {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  caption?: string;
}

// ─── Photo challenge ───────────────────────────────────────────────────────────

export interface ARPhotoChallenge {
  prompt: string;
  /** Description sent to the vision model for verification. */
  verifierSubject: string;
  points: number;
}

// ─── Hotspot ───────────────────────────────────────────────────────────────────

export type ARLandmarkId = "duomo" | "galleria" | "palazzo";

export interface ARHotspot {
  id: string;
  period: ARPeriodId;
  /**
   * Which landmark this hotspot belongs to. Omit for piazza-wide stories
   * that have no specific building anchor — those won't render in any
   * landmark detail view until a landmark is assigned.
   * Use "all" to show in every landmark (e.g. the piazza meta-story).
   */
  landmark?: ARLandmarkId | "all";
  /** Short year shown as the badge e.g. "1386". */
  year: string;
  /** Full date for the eyebrow line e.g. "5 August 1386". Optional. */
  eyebrow?: string;
  /** Degrees from north. 0° = facing Duomo central façade. */
  compassHeading: number;
  title: string;
  /** Two-sentence story — shown in the sheet and fed to TTS. */
  body: string;
  /** Optional expanded text shown when the detail panel is opened. */
  detail?: string;
  /** Only set for hotspots that have real media available. */
  media?: ARMedia;
  /** Pre-filled question sent to chat when user taps "Tell me more →". */
  chatQuestion: string;
  /** Optional link back to a specific Tour scene. */
  tourSceneId?: string;
  /** Treasure-hunt photo challenge. Task 4 wires this to the camera flow. */
  beforeAfter?: ARBeforeAfter;
  photoChallenge?: ARPhotoChallenge;
  source: string;
  sourceUrl?: string;
}

// ─── Birth period (1386 – 1500s) ──────────────────────────────────────────────
// 6 hotspots — 3 events + 3 cultural life moments.
// No media available for Birth hotspots — body text only.

const BIRTH: ARHotspot[] = [
  {
    id: "ar-birth-first-stone",
    period: "birth",
    landmark: "duomo",
    year: "1386",
    eyebrow: "5 August 1386",
    compassHeading: 0,
    title: "The first stone",
    body: "Archbishop Antonio da Saluzzo blesses the cornerstone of a cathedral that will outlive every hand that touches it. Duke Gian Galeazzo Visconti adopts it as a state enterprise — Milan's Gothic answer to Cologne and Reims.",
    detail: "Visconti didn't just commission the Duomo — he granted the Candoglia marble quarry to the Fabbrica in perpetuity, so marble could travel down Milan's canals free of charge forever. The abbreviation stamped on those transport boats, AUF (Ad Usum Fabricae — 'for the use of the Fabbrica'), passed into Milanese dialect: doing something a ufo means getting it for free. Six centuries later, the boats still run.",
    chatQuestion: "Tell me about the founding of the Duomo in 1386 and the role of the Visconti dynasty.",
    tourSceneId: "scene-1-2",
    source: "Veneranda Fabbrica del Duomo — History",
    sourceUrl: "https://www.duomomilano.it/en/about-us/veneranda-fabbrica-duomo/",
  },
  {
    id: "ar-birth-plague-refuge",
    period: "birth",
    landmark: "duomo",
    year: "1402",
    eyebrow: "Milan, 1402",
    compassHeading: 340,
    title: "Plague refuge",
    body: "When plague returned to Milan, the Visconti court took shelter inside these walls. The Duomo served as sanctuary as much as a church — its thick marble a kind of quarantine, separating the devout from the dying city outside.",
    detail: "The Black Death of 1348 had killed roughly one in three Milanese before the Duomo's foundations were even laid. Recurring outbreaks shaped the entire fabric of medieval Milan — the city's guild patron saints, Sebastian and Roch, were plague saints first. The Fabbrica's worker records from those years show wages paid up to the exact day a mason stopped appearing in the ledger.",
    chatQuestion: "How did the Black Death and recurring plague affect Milan during the construction of the Duomo?",
    source: "Veneranda Fabbrica del Duomo — The Cathedral",
    sourceUrl: "https://www.duomomilano.it/en/art-and-culture/the-cathedral/",
  },
  {
    id: "ar-birth-leonardo",
    period: "birth",
    landmark: "duomo",
    year: "1487",
    eyebrow: "1487 – 1488",
    compassHeading: 90,
    title: "Leonardo in Milan",
    body: "Leonardo da Vinci was Ludovico Sforza's court engineer for seventeen years. In 1487 he submitted designs and a wooden model for the cathedral's tiburio dome — his sketches survive in the Codex Atlanticus at the Biblioteca Ambrosiana.",
    detail: "The tiburio was one of the great architectural problems of the 15th century: how to build a weight-bearing tower over the crossing without cracking the Gothic vaulting beneath. Leonardo's proposal applied principles he was simultaneously developing for military architecture — load distributed across multiple ribs rather than concentrated at the crown. His model was rejected, but his structural analysis was more rigorous than any competing submission.",
    chatQuestion: "What was Leonardo da Vinci's connection to Milan, the Sforza court, and the Duomo's construction?",
    tourSceneId: "scene-2-2",
    source: "Biblioteca Ambrosiana — Codex Atlanticus",
    sourceUrl: "https://www.ambrosiana.it/en/discover/codex-atlanticus-leonardo-da-vinci/",
  },
  {
    id: "ar-birth-piazza-mercanti",
    period: "birth",
    landmark: "galleria",
    year: "1400s",
    eyebrow: "Milan, c. 1400s",
    compassHeading: 290,
    title: "Piazza dei Mercanti",
    body: "This is where Milan bought its bread for six hundred years. Every morning a crier read the city's bread price aloud from the steps — the Galleria stands on top of the very market that fed medieval Milan.",
    detail: "Piazza dei Mercanti was Milan's legal and commercial heart: the Palazzo della Ragione (1233) held the courts of law, the Loggia degli Osii was where guild sentences were announced publicly, and covered market stalls ran along every side. The medieval city had no central square in the modern sense — the Duomo's piazza was a building site, not a public space. Everything civic happened here.",
    chatQuestion: "What was Piazza dei Mercanti and how did it function as the commercial centre of medieval Milan?",
    source: "Archivio Storico Civico di Milano",
  },
  {
    id: "ar-birth-bells",
    period: "birth",
    landmark: "duomo",
    year: "1400s",
    eyebrow: "Milan, c. 1400s",
    compassHeading: 10,
    title: "Bell-paced labour",
    body: "The cathedral's bell was Milan's clock. Eight strikes opened the markets at dawn; twelve called workers to eat; the evening campanone sent labourers home. There were no public clocks — the Duomo's bells were the city's heartbeat.",
    detail: "The first mechanical clock in Milan was installed on the Palazzo della Ragione in 1354 — but it showed only hours, not minutes. For most of the 15th century, Milanese daily life was still structured by canonical hours. The Fabbrica's construction contracts specified working hours by bell rather than sunrise. Missing a bell could cost a full day's wages.",
    chatQuestion: "How did the Duomo's bells organise daily life in medieval Milan before public clocks existed?",
    source: "Veneranda Fabbrica del Duomo — The Cathedral",
    sourceUrl: "https://www.duomomilano.it/en/art-and-culture/the-cathedral/",
  },
  {
    id: "ar-birth-fabbrica",
    period: "birth",
    landmark: "duomo",
    year: "1387",
    eyebrow: "Founded 1387",
    compassHeading: 170,
    title: "The Fabbrica payrolls",
    body: "Hundreds of masons, sculptors, and glassmakers worked this site daily. Their wages — recorded in soldi imperiali, week by week from 1387 — are among the most detailed labour records of medieval Italy. The Veneranda Fabbrica del Duomo still operates today.",
    detail: "The Fabbrica's archive contains individual wage records, sick-day notes, and accounts of fines for absence or drunk conduct — a medieval HR system. Skilled sculptors earned roughly three times an unskilled labourer; a master architect could earn ten times as much. The archive has never been fully digitised. Historians still visit it in person, in the same building where the payroll clerks once worked.",
    chatQuestion: "Tell me about the workers of the Fabbrica del Duomo — their wages, daily lives, and the organisation that employed them.",
    source: "Veneranda Fabbrica del Duomo — History",
    sourceUrl: "https://www.duomomilano.it/en/about-us/veneranda-fabbrica-duomo/",
  },
];

// ─── Crown period (1500s – 1860) ──────────────────────────────────────────────
// 7 hotspots — 4 events + 3 cultural life moments.
// Media available for: Madonnina (audio + image from Wikimedia Commons).

const CROWN: ARHotspot[] = [
  {
    id: "ar-crown-plague-borromeo",
    period: "crown",
    landmark: "duomo",
    year: "1576",
    eyebrow: "Autumn 1576",
    compassHeading: 180,
    title: "Borromeo's barefoot procession",
    body: "Cardinal Carlo Borromeo led a barefoot procession through this square at the height of the plague of San Carlo, praying for the city to be spared. He survived when thousands did not. The painting that commemorates his act still hangs in the Duomo today.",
    detail: "Borromeo stayed in Milan throughout the plague of 1576–77, organising food distribution and managing the city's 70 parishes after the civil authorities had fled. He instituted the first systematic quarantine procedures the city had seen: separating the infected, isolating the dead, disinfecting public wells. He was canonised in 1610, just twenty-six years after his death — the fastest canonisation of the Counter-Reformation era.",
    chatQuestion: "Who was Carlo Borromeo and what was his role in Milan during the 1576 plague?",
    source: "Duomo di Milano — The Cathedral",
    sourceUrl: "https://www.duomomilano.it/en/art-and-culture/the-cathedral/",
  },
  {
    id: "ar-crown-madonnina",
    period: "crown",
    landmark: "duomo",
    year: "1774",
    eyebrow: "30 December 1774",
    compassHeading: 0,
    title: "Milan's golden guardian",
    body: "A 4.16-metre gilded copper statue of the Virgin Mary is placed atop the central spire at 108.5 metres above the ground. An unwritten rule begins that no Milanese building shall ever rise above her.",
    detail: "The sculptor was Giuseppe Perego; the goldsmith was Giuseppe Bini. Raising her to 108.5 metres required a pulley system the Fabbrica's engineers designed specifically for this single task. When the Pirelli skyscraper opened in 1960 — fractionally taller than her spire — the city objected so loudly that a small replica of the Madonnina was placed on the tower's roof. The rule is unwritten, but Milan enforces it by other means.",
    media: {
      type: "audio",
      // CC0 church bell from Freesound — replace src with downloaded file path
      src: "/audio/madonnina-bells.mp3",
      staticImage: "/images/cathedral_brogi_18Century.png",
      altText: "18th-century view of the Duomo spires",
      caption: "The Madonnina, placed at 108.5 m on 30 December 1774. Still Milan's highest point by tradition.",
      looped: false,
    },
    chatQuestion: "Tell me the full story of the Madonnina — who made her, how she was raised, and the tradition about no building exceeding her height.",
    tourSceneId: "scene-2-4",
    photoChallenge: {
      prompt: "Point your camera up at the central spire and capture La Madonnina.",
      verifierSubject: "Gilded statue of the Virgin Mary on top of a Gothic spire",
      points: 100,
    },
    source: "Veneranda Fabbrica del Duomo — The Madonnina",
    sourceUrl: "https://www.duomomilano.it/en/art-and-culture/the-madonnina/",
  },
  {
    id: "ar-crown-napoleon",
    period: "crown",
    landmark: "duomo",
    year: "1805",
    eyebrow: "26 May 1805",
    compassHeading: 90,
    title: "Napoleon's coronation",
    body: "Right here, Napoleon's carriage stopped on the morning of his coronation as King of Italy. Inside the Duomo, he took the Iron Crown of Lombardy and placed it on his own head. He later funded the completion of the cathedral's long-stalled façade; his name is carved on it.",
    detail: "The Iron Crown — legend says it contains a nail from the True Cross, hammered into a thin band of iron — was brought from Monza Cathedral specifically for the ceremony. Napoleon's self-crowning was deliberate theatre: by placing the crown on his own head, he refused to acknowledge any authority above himself, not even the Pope's. The Duomo's façade, which he funded, was finally completed in 1813 — eight years after he crowned himself in it.",
    chatQuestion: "What happened during Napoleon's coronation as King of Italy in Milan's Duomo in 1805, and what did he leave behind?",
    source: "Museo del Risorgimento — Comune di Milano",
    sourceUrl: "https://en.wikipedia.org/wiki/Coronation_of_Napoleon_as_King_of_Italy",
  },
  {
    id: "ar-crown-risotto",
    period: "crown",
    landmark: "duomo",
    year: "1574",
    eyebrow: "A wedding in 1574",
    compassHeading: 350,
    title: "Risotto's accidental birthday",
    body: "A Belgian glass-painter named Maestro Valerio, finishing a stained-glass window inside the Duomo workshop, used powdered saffron to colour his glass. At his daughter's wedding he told the cook to add a pinch to the rice. Milan's most famous dish was invented by accident, inside this building.",
    detail: "The story first appears in a 19th-century Milanese chronicle, and may be as invented as the dish it describes — but the Duomo's stained-glass records do confirm the presence of Flemish glass-painters in the 1570s workshop, and saffron was genuinely used as a colourant in the medieval glass trade. Whether or not Maestro Valerio existed, risotto alla milanese was by the 17th century served at every Milanese wedding feast.",
    chatQuestion: "What is the origin story of risotto alla milanese and how is it connected to the Duomo's 16th-century glass workshops?",
    source: "Massimo Montanari, L'identità italiana in cucina, Laterza 2010",
  },
  {
    id: "ar-crown-caffe-illuminismo",
    period: "crown",
    // piazza-wide — no landmark anchor, intentionally untagged
    year: "1764",
    eyebrow: "Milan, 1764",
    compassHeading: 45,
    title: "The Enlightenment in espresso form",
    body: "The Verri brothers ran their journal Il Caffè from a café near here between 1764 and 1766. Sixty issues of Milanese Enlightenment thought arguing against censorship, superstition, and injustice — Italy's most important 18th-century intellectual journal, written in a café.",
    detail: "Pietro Verri was twenty-eight when he founded Il Caffè with his brother Alessandro. The journal's most consequential contribution was Cesare Beccaria's essay On Crimes and Punishments — arguably the most influential criminal justice text ever written, which argued against torture and the death penalty. Beccaria was so shy he could barely speak in public; the Verri brothers essentially forced him to write it, then edited it into shape.",
    chatQuestion: "Who were Pietro and Alessandro Verri and what was Il Caffè, the Milanese Enlightenment journal of 1764?",
    source: "Archivio Storico Civico di Milano",
  },
  {
    id: "ar-crown-salon",
    period: "crown",
    // piazza-wide — no landmark anchor, intentionally untagged
    year: "1834",
    eyebrow: "Milan, 1834",
    compassHeading: 80,
    title: "The salon era",
    body: "The Salotto Maffei, hosted by Clara Maffei from 1834, met two streets from here. Verdi, Manzoni, and Risorgimento conspirators planned a country over tea in her drawing room. The Italian unification was conspired in living rooms, not on barricades.",
    detail: "Clara Maffei maintained her salon for forty years, from 1834 until her death in 1886 — outlasting the Risorgimento itself. Giuseppe Verdi wrote to her almost every week for decades, and her letters are among the most detailed records of Risorgimento-era Milan's intellectual life. The salon met on Tuesdays. Attendance was by invitation only, but almost every major Italian cultural figure of the century had been once.",
    chatQuestion: "Tell me about the Salotto Maffei and how Milanese salons shaped the Risorgimento movement.",
    source: "Renata Pisu, I salotti milanesi dell'Ottocento, Editrice Bibliografica 1995",
  },
  {
    id: "ar-crown-carriage",
    period: "crown",
    // piazza-wide — no landmark anchor, intentionally untagged
    year: "1700s",
    eyebrow: "Milan, c. 1700s",
    compassHeading: 135,
    title: "The carriage promenade",
    body: "Every evening at sundown, the wealthy of Milan drove their carriages along the old city walls — to see and to be seen. The route was a kilometre long; an entire society compressed into a parade. It ended when the walls were demolished in the 1890s.",
    detail: "The Milanese corso followed the Bastioni — the 16th-century Spanish walls that circled the inner city. Carriages were judged as much as their passengers: the lacquer, the livery of the coachman, the number of horses all signalled rank. A family that had lost money but kept its carriage could maintain the appearance of wealth for years. When the walls came down the promenade continued on foot — it became what Milanese now call la passeggiata.",
    chatQuestion: "What was daily aristocratic life like in 18th-century Habsburg Milan?",
    source: "Archivio Storico Civico di Milano",
  },
];

// ─── Modern period (1860 – today) ─────────────────────────────────────────────
// 12 hotspots — events + cultural life moments + present-day.
// Media available for:
//   1943 Bombs  → YouTube (Giornale Luce) + BeforeAfter slider (Cariatidi)
//   1945 Liberation → YouTube (Istituto Luce)
//   1953 Guernica   → local image
//   height-rule, restoration, piazza → local images

const MODERN: ARHotspot[] = [
  {
    id: "ar-modern-mengoni",
    period: "modern",
    landmark: "galleria",
    year: "1877",
    eyebrow: "30 December 1877",
    compassHeading: 315,
    title: "Mengoni's fall",
    body: "Two days before the inauguration of his own arcade, architect Giuseppe Mengoni fell from the scaffolding of the triumphal arch facing the Duomo and died on the spot. Whether accident, heart attack at altitude, or suicide under financial pressure has never been resolved. He was 47.",
    detail: "Mengoni had devoted sixteen years to the Galleria — from winning the 1861 national competition to the eve of its opening. In the final months, he was known to be in serious financial difficulty; cost overruns had left him personally exposed. Witnesses saw him climb the scaffolding alone that December morning. No one saw him fall. The official inquest ruled accident. The inauguration on 1 January 1878 went ahead as planned, without him.",
    chatQuestion: "Tell me the full story of Giuseppe Mengoni — his design for the Galleria, his death, and the mystery that surrounds it.",
    tourSceneId: "scene-3-3",
    source: "Wikipedia — Giuseppe Mengoni",
    sourceUrl: "https://en.wikipedia.org/wiki/Giuseppe_Mengoni",
  },
  {
    id: "ar-modern-bull-mosaic",
    period: "modern",
    landmark: "galleria",
    year: "1877",
    eyebrow: "Galleria Vittorio Emanuele II, 1877",
    compassHeading: 320,
    title: "The lucky bull",
    body: "Four floor medallions mark the centre of the Galleria's octagon — Rome, Florence, Turin, and Milan, the capitals of the original Kingdom of Italy. Turin's bull has a tradition: Milanese spin on its testicles for good luck, wearing a groove into the mosaic that gets repatched every few years.",
    detail: "No one knows who started the custom or when. Some trace it to students spinning before exams; others to merchants sealing deals. The bull's anatomy has been repatched so many times that the repairs are themselves now historical. The Comune has considered ending the tradition by covering the spot — and every time, the city objects loudly enough that they don't.",
    photoChallenge: {
      prompt: "Find the bull mosaic in the Galleria floor and photograph it.",
      verifierSubject: "Floor mosaic of a bull at the centre of a decorative octagonal medallion in the Galleria Vittorio Emanuele II",
      points: 120,
    },
    chatQuestion: "What is the story of the bull mosaic in the Galleria Vittorio Emanuele II and why do people spin on it?",
    tourSceneId: "scene-3-3",
    source: "Wikipedia — Galleria Vittorio Emanuele II",
    sourceUrl: "https://en.wikipedia.org/wiki/Galleria_Vittorio_Emanuele_II",
  },
  {
    id: "ar-modern-campari",
    period: "modern",
    landmark: "galleria",
    year: "1867",
    eyebrow: "Opened 1867",
    compassHeading: 280,
    title: "Aperitivo is born",
    body: "Bar Campari opened at the Galleria's Duomo end in 1867. Gaspare Campari served a bitter red drink before dinner. The ritual it created — aperitivo, from the Latin aperire, to open the stomach — spread to the rest of Italy and never left.",
    detail: "Gaspare Campari had been working as a liqueur-maker in Turin before moving to Milan and opening at the Galleria. The precise Campari recipe remains a trade secret — it contains approximately 60 botanical ingredients. Camparino, still operating at the same corner today, introduced the custom of standing at the bar for a pre-dinner drink rather than sitting. The custom became the defining posture of Milanese urban life.",
    chatQuestion: "What is the history of Bar Campari in the Galleria and how did aperitivo become a Milanese then Italian ritual?",
    source: "Camparino in Galleria — History",
    sourceUrl: "https://www.camparino.com/en/beginning/",
  },
  {
    id: "ar-modern-bava-beccaris",
    period: "modern",
    landmark: "duomo",
    year: "1898",
    eyebrow: "6 – 9 May 1898",
    compassHeading: 200,
    title: "Bava-Beccaris opens fire",
    body: "Royal troops fired cannons on bread-riot protesters in this square and the surrounding streets, killing dozens. General Fiorenzo Bava-Beccaris was decorated by King Umberto I for restoring order. The city has never forgotten.",
    detail: "The official death toll was 80; opposition newspapers claimed over 400. The rioters had gathered because the price of bread had doubled in a single year. Bava-Beccaris used artillery against civilians including, reportedly, a crowd of monks outside a Capuchin monastery waiting for their daily soup. Two years later, King Umberto I was assassinated by an anarchist who explicitly cited the decoration of Bava-Beccaris as one of his reasons.",
    chatQuestion: "What was the Bava-Beccaris massacre in Milan in 1898, and what were its political consequences?",
    source: "Franco Della Peruta, Storia di Milano, Treccani 1994",
    sourceUrl: "https://en.wikipedia.org/wiki/Bava_Beccaris_massacre",
  },
  {
    id: "ar-modern-bombs",
    period: "modern",
    landmark: "palazzo",
    year: "1943",
    eyebrow: "15 August 1943",
    compassHeading: 90,
    title: "The bombs",
    body: "Allied incendiary bombs struck Palazzo Reale directly, gutting the 18th-century Sala delle Cariatidi. The hall's wooden roof burned for hours. After the war, restoration architects made a deliberate decision: leave the damage visible.",
    detail: "The decision to leave the Sala delle Cariatidi unrestored was made by architect Piero Portaluppi in the early 1950s. His argument: the scars were part of the hall's history, not a defect to be corrected. The caryatid figures were cleaned and stabilised but left with their damage intact. In 1953, Picasso agreed — he chose this hall specifically when Guernica came to Milan.",
    media: {
      // Giornale Luce — Milan bombardment aftermath footage
      type: "youtube",
      src: "xQ84S3q-w7k",
      caption: "Milan, August 1943 — Giornale Luce footage of the bombing aftermath.",
    },
    beforeAfter: {
      before: cariatidiBefore,
      after: "/images/bombed_cariatidi.jpg",
      beforeLabel: "c. 1900 — Intact",
      afterLabel: "1943 — After the bombs",
      caption: "Drag to compare. The roof burned for hours. Restoration architects chose to leave the scars visible.",
    },
    chatQuestion: "Tell me about the 1943 Allied bombing of Milan — what was destroyed, what survived, and why was the Sala delle Cariatidi left unrestored?",
    tourSceneId: "scene-3-5",
    photoChallenge: {
      prompt: "Find the entrance to the Sala delle Cariatidi inside Palazzo Reale and photograph it.",
      verifierSubject: "Doorway sign reading Sala delle Cariatidi or a view of damaged neoclassical columns",
      points: 100,
    },
    source: "Marco Fincardi, Milano sotto le bombe, Mondadori 2003",
  },
  {
    id: "ar-modern-liberation",
    period: "modern",
    landmark: "duomo",
    year: "1945",
    eyebrow: "25 April 1945",
    compassHeading: 0,
    title: "Liberation Day",
    body: "Three years earlier this square stood empty under air-raid sirens. Today it holds the largest crowd to fill it freely in years. The date — 25 April 1945 — is still a national public holiday in Italy.",
    detail: "The insurrection in Milan began on 25 April before the Allies arrived. The Committee of National Liberation ordered a general strike; partisan brigades seized radio stations, the prefecture, and the central train station. Mussolini had fled north two days earlier and was captured and shot on 28 April at Dongo on Lake Como. The Liberation of Milan was the only major Italian city freed primarily by Italians rather than Allied forces.",
    media: {
      // Istituto Luce — first free newsreel, Liberation of Milan
      type: "youtube",
      src: "g1DM2P8YQgE",
      caption: "Istituto Luce — Nuova Luce, first free newsreel of the Liberation, 25 April 1945.",
    },
    chatQuestion: "Tell me about Liberation Day on 25 April 1945 in Milan — what happened that day and what does the date mean to Italians today?",
    tourSceneId: "scene-3-4",
    source: "Archivio Storico Istituto Luce — 25 Aprile 1945",
    sourceUrl: "https://www.archivioluce.com/25-aprile-1945-la-liberazione/",
  },
  {
    id: "ar-modern-guernica",
    period: "modern",
    landmark: "palazzo",
    year: "1953",
    eyebrow: "Milan, 1953",
    compassHeading: 85,
    title: "Guernica arrives",
    body: "When Picasso's Guernica toured Europe in 1953, the Milanese hung it inside the Sala delle Cariatidi — against the still-blackened walls. The pairing was deliberate: the painting about war, in a room destroyed by war.",
    detail: "Guernica had been in exile since 1937, held at MoMA in New York under Picasso's instruction that it must not return to Spain until democracy was restored. Picasso specified the Sala delle Cariatidi himself when he heard about the bomb damage — he wanted the painting seen inside actual destruction, not a pristine gallery. Guernica did not return to Spain until 1981, six years after Franco's death.",
    media: {
      type: "image",
      src: "/images/guernica-cariatidi.jpg",
      altText: "Picasso's Guernica displayed against a bomb-damaged wall, 1953",
      caption: "Guernica against the ruins — Picasso specified a bombed space, not a pristine gallery.",
    },
    chatQuestion: "Why was Picasso's Guernica exhibited in the bomb-damaged Sala delle Cariatidi in 1953, and what did that pairing mean?",
    source: "Palazzo Reale di Milano — Picasso e Guernica",
    sourceUrl: "https://www.palazzorealemilano.it/-/picasso-e-guernica",
  },
  {
    id: "ar-modern-piazza-fontana",
    period: "modern",
    // piazza-wide — no landmark anchor, intentionally untagged
    year: "1969",
    eyebrow: "12 December 1969",
    compassHeading: 60,
    title: "Piazza Fontana",
    body: "Two streets from here, on 12 December 1969, a bomb exploded in the Banca Nazionale dell'Agricoltura and killed seventeen people. The Italian Years of Lead began. The square that had celebrated liberation was now a different kind of city.",
    detail: "The bombing was initially blamed on anarchists, and a railway worker named Giuseppe Pinelli died — reportedly falling from a fourth-floor window — during police questioning. The attack was eventually attributed to the neo-fascist group Ordine Nuovo, but no one served a full sentence for the deaths. The event gave Italy the phrase strategia della tensione — the strategy of tension: politically motivated violence designed to push the state toward authoritarian measures.",
    chatQuestion: "What was the Piazza Fontana bombing in 1969 and what were the Italian Years of Lead that followed?",
    source: "Paul Ginsborg, A History of Contemporary Italy, Penguin 1990",
    sourceUrl: "https://en.wikipedia.org/wiki/Piazza_Fontana_bombing",
  },
  {
    id: "ar-modern-pride",
    period: "modern",
    landmark: "duomo",
    year: "1994",
    eyebrow: "Milan, 1994",
    compassHeading: 200,
    title: "Pride ends here",
    body: "In 1994, this square held Milan's first Pride parade. A Pope's cathedral, a public queer celebration — the contrast still defines what kind of city Milan chooses to be. The parade has returned to this square every year since.",
    detail: "The first Milan Pride was organised by Arcigay Milano in a political climate with no legal protections for same-sex couples and a national broadcaster that had banned LGBTQ+ guests from television as recently as the 1980s. That it ended in front of the Duomo — seat of the Archbishop — was not an accident. The route was planned to make that point visible. Italy legalised civil unions in 2016. The parade still ends here.",
    chatQuestion: "When did Milan's Pride parade begin and what does its destination — Piazza del Duomo — say about the city?",
    source: "Archivio Storico Civico di Milano",
  },
  {
    id: "ar-modern-restoration",
    period: "modern",
    landmark: "duomo",
    year: "2026",
    eyebrow: "Ongoing today",
    compassHeading: 0,
    title: "The cathedral that never finishes",
    body: "The Veneranda Fabbrica del Duomo is still at work. Conservators use laser pulses to clean six centuries of grime without abrading the stone, and every spire is being 3D-scanned to build a digital twin of the entire cathedral.",
    detail: "The Fabbrica employs around 100 craftspeople today — stonecutters, gilders, restorers, and engineers. A new statue is added to the exterior roughly once a decade; there are currently 3,400, making it the most statue-dense building on earth. The 3D-scanning project, started in 2018, will eventually capture every surface to sub-millimetre accuracy. The scan already reveals cracks invisible to the naked eye.",
    media: {
      type: "image",
      src: "/images/present-restoration.jpg",
      altText: "Restoration scaffolding on the Duomo spires",
      caption: "Scaffolding climbs the spires today as it has for six centuries — the Fabbrica never stops.",
    },
    chatQuestion: "How is the Duomo being maintained and restored today, and what technologies are being used?",
    source: "Veneranda Fabbrica del Duomo — Conservation",
    sourceUrl: "https://www.duomomilano.it/en/art-and-culture/the-cathedral/",
  },
  {
    id: "ar-modern-height-rule",
    period: "modern",
    landmark: "duomo",
    year: "2026",
    eyebrow: "An unwritten law",
    compassHeading: 5,
    title: "The rule still holds",
    body: "Milan now has skyscrapers taller than the Madonnina — Torre Unicredit stands at 231 metres, more than twice her height. Every one of them has a small replica of the Madonnina placed on its roof. The rule is unwritten, but the city enforces it by other means.",
    detail: "The first building to exceed the Madonnina's 108.5 metres was the Pirelli Tower, opened in 1960 at 127 metres. The architect Gio Ponti placed a replica on the roof without being asked. The precedent held: Palazzo Lombardia, CityLife's three towers, Torre Unicredit — all carry their own Madonnina. The replicas are usually small and unannounced; you would not know they were there unless you looked for them.",
    media: {
      type: "image",
      src: "/images/present-height-rule.jpg",
      altText: "Aerial view of the Duomo spires with Milan's modern skyscrapers behind",
      caption: "Gothic spires, modern towers — every skyscraper behind her carries a replica on its roof.",
    },
    chatQuestion: "Which buildings in Milan have a Madonnina replica on their roof, and why does the tradition continue?",
    photoChallenge: {
      prompt: "Look up and photograph the Madonnina at the tip of the central spire.",
      verifierSubject: "Gilded statue of the Virgin Mary on top of a Gothic spire against the sky",
      points: 80,
    },
    source: "Veneranda Fabbrica del Duomo — The Madonnina",
    sourceUrl: "https://www.duomomilano.it/en/art-and-culture/the-madonnina/",
  },
  {
    id: "ar-modern-piazza",
    period: "modern",
    landmark: "all",
    year: "2026",
    eyebrow: "Italy's most photographed square",
    compassHeading: 180,
    title: "The piazza that holds everything",
    body: "This square has hosted a medieval market, a plague procession, Napoleon's carriage, a liberation crowd, cannon fire, and a Pride parade. Today it hosts fashion shows, New Year's Eve concerts, and roughly 15 million visitors a year. The same stones, every time.",
    detail: "Piazza del Duomo is technically owned by the Comune di Milano, but the Fabbrica holds maintenance rights over the paving directly in front of the cathedral. Every year the square is resurfaced in the areas damaged by foot traffic; the heaviest wear is directly under the arch where visitors stop to photograph the facade. The stones you are standing on were last replaced within the past decade.",
    media: {
      type: "image",
      src: "/images/present-piazza.jpg",
      altText: "Interior of the Galleria Vittorio Emanuele II today",
      caption: "The Galleria today — couture houses where medieval chapels once stood.",
    },
    chatQuestion: "What is the history of Piazza del Duomo as a public space — from medieval market to contemporary Milan?",
    source: "Comune di Milano — Piazza del Duomo",
    sourceUrl: "https://www.comune.milano.it",
  },
];

// ─── Exports ───────────────────────────────────────────────────────────────────

export const AR_HOTSPOTS: Record<ARPeriodId, ARHotspot[]> = {
  birth: BIRTH,
  crown: CROWN,
  modern: MODERN,
};

export const ALL_AR_HOTSPOTS: ARHotspot[] = [...BIRTH, ...CROWN, ...MODERN];

export const getARHotspots = (period: ARPeriodId): ARHotspot[] =>
  AR_HOTSPOTS[period];

/** Returns hotspots for a given period that belong to a specific landmark,
 *  including any tagged "all". Untagged hotspots are excluded. */
export const getARHotspotsForLandmark = (
  period: ARPeriodId,
  landmark: ARLandmarkId,
): ARHotspot[] =>
  AR_HOTSPOTS[period].filter(
    (h) => h.landmark === landmark || h.landmark === "all",
  );

export const getARPeriod = (id: ARPeriodId): ARPeriod => AR_PERIODS[id];
