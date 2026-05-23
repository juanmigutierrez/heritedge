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
  /** Image type only — optional second image, renders as a side-by-side diptych. */
  src2?: string;
  /** Image type only — array of srcs for a swipeable slideshow (overrides src/src2). */
  srcs?: string[];
  altText?: string;
  altText2?: string;
  caption2?: string;
  objectPosition?: string;
  objectPosition2?: string;
  objectFit?: "cover" | "contain";
  caption?: string;
  /** Attribution for the image/video/audio itself — distinct from the hotspot's
   *  body source. The body source describes where the text content came from;
   *  this describes where the media file came from. */
  source?: string;
  sourceUrl?: string;
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
  source?: string;
  sourceUrl?: string;
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
    media: {
      type: "image",
      src: "/images/firststone.jpg",
      altText: "The 1386 foundation plaque of the Duomo di Milano, commemorating the laying of the first stone",
      caption: "The 1386 foundation plaque — marking the day Archbishop Antonio da Saluzzo blessed the cornerstone.",
      source: "Wikimedia Commons — Giovanni Dall'Orto",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:3302_-_Milano,_Duomo_-_Lapide_1386_-_Foto_Giovanni_Dall%27Orto,_6-Dec-2007.jpg",
    },
    chatQuestion: "Tell me about the founding of the Duomo in 1386 and the role of the Visconti dynasty.",
    tourSceneId: "scene-1-2",
    source: "Veneranda Fabbrica del Duomo — History",
    sourceUrl: "https://www.duomomilano.it/en/about-us/veneranda-fabbrica-duomo/",
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
    media: {
      type: "image",
      src: "/images/leonardodavinci.jpg",
      altText: "Leonardo da Vinci, Codex Atlanticus f. 850r — architectural study from the Biblioteca Ambrosiana",
      caption: "Milan, Biblioteca Ambrosiana, Leonardo da Vinci, Codex Atlanticus, f. 850r. ©Veneranda Biblioteca Ambrosiana/Metis e Mida.",
      source: "EAHN Journal — Leonardo's Duomo Studies",
      sourceUrl: "https://journal.eahn.org/article/id/8293/",
    },
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
    media: {
      type: "image",
      src: "/images/piazza-mercanti.jpg",
      altText: "Piazza dei Mercanti, the Merchants' Square — medieval Milan's commercial and legal heart",
      caption: "The Merchants' Square — Milan's medieval centre of trade, courts, and bread prices.",
      source: "Piazza Mercanti — Milano",
      sourceUrl: "https://www.piazzamercanti.milano.it/",
    },
    chatQuestion: "What was Piazza dei Mercanti and how did it function as the commercial centre of medieval Milan?",
    source: "Archivio Storico Civico di Milano",
  },
  {
    id: "ar-birth-mignot",
    period: "birth",
    landmark: "duomo",
    year: "1399",
    eyebrow: "Paris vs Milan, ~1399",
    compassHeading: 170,
    title: "\"Without science\" — the peril of ruin",
    body: "French master builder Jean Mignot was brought from Paris to inspect the half-built cathedral and issued a damning verdict: the work was sine scienzia — without science — and in peril of collapse. The Milanese engineers refused to concede, and refuted him point by point.",
    detail: "Mignot's complaints centred on the piers, which he argued were too slender to carry the planned vault loads at such heights. The Fabbrica's response became one of the most quoted lines in medieval architectural history: 'ars sine scientia nihil est' — art without science is nothing. The engineers proved their piers sound; Mignot was dismissed. But his challenge forced a leap in structural rigour and brought in Gabriele Stornaloco's geometric system that governed the cathedral's proportions for the next century.",
    chatQuestion: "Who was Jean Mignot and what was the dispute over the Duomo's structural safety in 1399?",
    source: "Wikipedia — Milan Cathedral",
    sourceUrl: "https://en.wikipedia.org/wiki/Milan_Cathedral",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL POLISH ADDITIONS — Galleria & Palazzo, Birth era
  // All IDs use the `final-` segment so they are greppable as `ar-*-final-*`.
  // ─────────────────────────────────────────────────────────────────────────

  // ── Galleria / Birth ──
  {
    id: "ar-birth-final-santa-tecla",
    period: "birth",
    landmark: "galleria",
    year: "300s",
    eyebrow: "Demolished 1461 – 1548",
    compassHeading: 325,
    title: "The basilica beneath your feet",
    body: "Where the Galleria now opens onto the piazza, a 4th-century palaeochristian basilica called Santa Tecla served as Milan's main cathedral for over a thousand years. It was demolished in stages between 1461 and 1548 to clear the square in front of the new Duomo.",
    detail: "Santa Tecla was the basilica vetus — the 'old basilica' — paired with the slightly later Santa Maria Maggiore as Milan's twin winter and summer cathedrals. Both stood directly in front of where the Duomo now rises. Excavations in 1961 during Metro M1 construction uncovered Santa Tecla's foundations and its octagonal baptistery, where Saint Augustine was baptised by Saint Ambrose on Easter night 387. The baptistery is preserved underground, accessible from inside the Duomo.",
    media: {
      type: "image",
      src: "/images/Santa_Tecla.jpg",
      altText: "Reconstruction drawing of the 4th–9th century episcopal complex with Santa Tecla at its centre",
      caption: "Reconstruction of the 4th–9th c. episcopal complex — Santa Tecla (2), the basilica that stood here until 1548.",
      source: "Lombardia Beni Culturali — Piazza del Duomo e la Galleria",
      sourceUrl: "https://www.lombardiabeniculturali.it/blog/percorsi/piazza-del-duomo-e-la-galleria/cenni-storici-dalle-origini-al-xvi-secolo/",
    },
    chatQuestion: "Tell me about Santa Tecla, the 4th-century basilica that stood in front of the Duomo until 1548.",
    source: "Soprintendenza Archeologia, Belle Arti e Paesaggio per la città metropolitana di Milano",
    sourceUrl: "https://en.wikipedia.org/wiki/Baptistery_of_San_Giovanni_alle_Fonti",
  },
  {
    id: "ar-birth-final-rebecchino",
    period: "birth",
    landmark: "galleria",
    year: "1400s",
    eyebrow: "Contrada del Rebecchino",
    compassHeading: 305,
    title: "The lane of inns",
    body: "A narrow medieval street called the Contrada del Rebecchino ran where the Galleria's southern arm now stands — a tangle of inns, taverns, and bakers' shops between the piazza and the goldsmiths' quarter. Pilgrims arriving to see the Duomo's first stones slept on its straw mattresses.",
    detail: "The street took its name from a 14th-century inn, the Albergo del Rebecchino, which stood on the corner facing the cathedral. It was barely four metres wide and so dense with hanging signs and projecting upper floors that two carts could not pass abreast. The Rebecchino survived for nearly five hundred years and was finally cleared between 1865 and 1867 to make room for Mengoni's Galleria — which deliberately preserved its alignment as the arcade's northern axis.",
    media: {
      type: "image",
      src: "/images/Rebecchino.jpg",
      altText: "Plan of medieval Milan around the Duomo, with the Contrada del Rebecchino labelled on the right",
      caption: "Plan of medieval Milan — the Rebecchino (right) ran where the Galleria's southern arm now stands.",
      source: "Divina Milano — Piazza del Duomo nei secoli",
      sourceUrl: "https://www.divinamilano.it/piazza-del-duomo-nei-secoli/",
    },
    chatQuestion: "What was the Contrada del Rebecchino, the medieval street that ran where the Galleria now stands?",
    source: "Archivio Storico Civico di Milano",
  },

  // ── Palazzo / Birth ──
  {
    id: "ar-birth-final-broletto-vecchio",
    period: "birth",
    landmark: "palazzo",
    year: "1100s",
    eyebrow: "Broletto Vecchio",
    compassHeading: 95,
    title: "Where Milan governed itself",
    body: "Long before kings or archbishops claimed it, this site was the Broletto Vecchio — Milan's first town hall. From around 1138 the city's free commune met in its open courtyard to argue laws, count taxes, and elect consuls under the open sky.",
    detail: "Broletto comes from brolo, an enclosed orchard — the medieval council literally met in a fenced garden. When the commune outgrew this site in 1233 it moved to the new Palazzo della Ragione in Piazza dei Mercanti, but the old broletto remained as a civic and judicial seat. Trial verdicts and tax declarations were nailed to its outer wall, where everyone could read them. The building you see today is built on those same foundations.",
    chatQuestion: "Tell me about the Broletto Vecchio — Milan's medieval town hall on the site of today's Palazzo Reale.",
    source: "Treccani — Enciclopedia Italiana",
    sourceUrl: "https://www.treccani.it/enciclopedia/broletto/",
  },
  {
    id: "ar-birth-final-visconti-court",
    period: "birth",
    landmark: "palazzo",
    year: "1336",
    eyebrow: "Visconti rule, 14th century",
    compassHeading: 80,
    title: "The Visconti move in",
    body: "Azzone Visconti made the old broletto his ducal residence in 1336, transforming the civic hall into a Lord's court. The frescoes he commissioned from Giotto — long since lost — once covered these walls.",
    detail: "Azzone hired Giotto in 1335 to decorate the palace with a cycle of frescoes depicting illustrious men of antiquity: Aeneas, Hercules, Attila, Charlemagne, and the Visconti themselves. The cycle was destroyed during 18th-century renovations, but a single chronicler's description survives in Galvano Fiamma's Opusculum de rebus gestis ab Azone, Luchino et Johanne Vicecomitibus. The Visconti court here became a magnet for poets and humanists — Petrarch was a frequent guest of Galeazzo II in the 1350s.",
    media: {
      type: "image",
      src: "/images/ducale.jpg",
      altText: "Historical illustration of the Visconti ducal court at the Palazzo Reale site in medieval Milan",
      caption: "The seat of Visconti power — the old broletto remade as a ducal court.",
      source: "Storia di Milano",
      sourceUrl: "https://www.storiadimilano.it/repertori/pres_dalre/dalre0005.html",
    },
    chatQuestion: "How did the Visconti family transform Milan's old town hall into a ducal court — and what did Giotto paint here?",
    source: "Treccani — Dizionario Biografico degli Italiani",
    sourceUrl: "https://www.treccani.it/enciclopedia/azzone-visconti_(Dizionario-Biografico)/",
  },
  {
    id: "ar-birth-final-sforza-bride",
    period: "birth",
    landmark: "palazzo",
    year: "1441",
    eyebrow: "25 October 1441",
    compassHeading: 105,
    title: "A wedding that changed Milan",
    body: "Bianca Maria Visconti, the only child of the last Visconti duke, married the condottiero Francesco Sforza in this palace in 1441. The marriage transferred the duchy of Milan from the Visconti to the Sforza dynasty and reshaped Italian politics for a century.",
    detail: "Bianca Maria was sixteen; Francesco was forty and one of the most feared mercenary captains in Italy. Her dowry included Cremona and Pontremoli; the political clause — never written down — was that Francesco would inherit Milan. When Filippo Maria Visconti died in 1447 without male heirs, Milan briefly declared itself the Ambrosian Republic. Francesco besieged the city and was acclaimed Duke in 1450, ruling from this palace until his death in 1466. Bianca Maria was widely considered the more able political mind of the partnership.",
    media: {
      type: "image",
      src: "/images/Bianca_Maria_Visconti.jpg",
      altText: "Portrait of Bianca Maria Visconti, daughter of the last Visconti duke and bride of Francesco Sforza",
      caption: "Bianca Maria Visconti — her marriage in 1441 ended a dynasty and founded another.",
      source: "Wikipedia — Bianca Maria Visconti",
      sourceUrl: "https://en.wikipedia.org/wiki/Bianca_Maria_Visconti",
    },
    chatQuestion: "Tell me about the 1441 marriage of Bianca Maria Visconti and Francesco Sforza, and how it changed the Duchy of Milan.",
    source: "Treccani — Dizionario Biografico degli Italiani",
    sourceUrl: "https://www.treccani.it/enciclopedia/bianca-maria-visconti_(Dizionario-Biografico)/",
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
    body: "Cardinal Carlo Borromeo led a barefoot procession through this square at the height of the plague of San Carlo, praying for the city to be spared. He survived when thousands did not. Every year on 4 November, monumental paintings commemorating his acts are hung inside the Duomo in his honour.",
    detail: "Borromeo stayed in Milan throughout the plague of 1576–77, organising food distribution and managing the city's 70 parishes after the civil authorities had fled. He instituted the first systematic quarantine procedures the city had seen: separating the infected, isolating the dead, disinfecting public wells. He was canonised in 1610, just twenty-six years after his death — the fastest canonisation of the Counter-Reformation era.",
    media: {
      type: "image",
      src: "/images/borromeo1.jpg",
      srcs: [
        "/images/borromeo1.jpg",
        "/images/borromeo2.jpg",
        "/images/borromeo3.jpg",
        "/images/borromeo4.jpg",
        "/images/borromeo5.jpg",
        "/images/borromeo6.jpg",
        "/images/borromeo7.jpg",
      ],
      altText: "Quadroni of St. Charles Borromeo displayed in the Duomo di Milano",
      caption: "The quadroni of St. Charles — monumental paintings displayed in the Duomo each November.",
      source: "Wikipedia — Quadroni of St. Charles",
      sourceUrl: "https://en.wikipedia.org/wiki/Quadroni_of_St._Charles",
    },
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
      objectPosition: "center 10%",
      altText: "18th-century view of the Duomo spires",
      caption: "The Madonnina, placed at 108.5 m on 30 December 1774. Still Milan's highest point by tradition.",
      source: "AbeBooks",
      sourceUrl: "https://www.abebooks.com/photographs/Italia-Milano-Cattedrale-Milano-Cupola-Superiore/22386679377/bd",
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
    id: "ar-crown-final-facade-debate",
    period: "crown",
    landmark: "duomo",
    year: "1649",
    eyebrow: "The façade question, 1600s – 1745",
    compassHeading: 5,
    title: "Two centuries of disagreement",
    body: "For two hundred years, Milan's greatest architects could not agree on how to finish the Duomo's façade. Gothic or classical? Five portals were built, then overruled. Juvarra submitted a design in 1733; Vanvitelli in 1745. None were used.",
    detail: "Federico Borromeo laid the first foundations of a new façade in the early 1600s, designed by Francesco Maria Richini and Fabio Mangone in a baroque-classical style. Work continued until 1638, producing five portals and two middle windows. Then in 1649 the new chief architect Carlo Buzzi reversed course entirely: the façade must return to Gothic, absorbing the already-finished classical details behind giant Gothic pilasters and twin belfries. Subsequent proposals by Filippo Juvarra (1733) and Luigi Vanvitelli (1745) went nowhere. The deadlock lasted until Napoleon ordered the façade finished in 1805 — and it was completed in Gothic style, as Buzzi had insisted 150 years earlier.",
    media: {
      type: "image",
      src: "/images/cathdral1745.jpg",
      altText: "Engraving of the Duomo di Milano circa 1745 by Marc'Antonio Dal Re, showing the unfinished façade",
      caption: "The cathedral as it appeared in 1745.",
      source: "Wikipedia — Milan Cathedral",
      sourceUrl: "https://en.wikipedia.org/wiki/Milan_Cathedral",
    },
    chatQuestion: "Why did it take two hundred years to finish the Duomo's façade, and who were the architects involved in the debate?",
    source: "Wikipedia — Milan Cathedral",
    sourceUrl: "https://en.wikipedia.org/wiki/Milan_Cathedral",
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
    media: {
      type: "image",
      src: "/images/napolean_coronation.jpg",
      altText: "Jacques-Louis David's painting of the Coronation of Napoleon, 1805",
      caption: "Jacques-Louis David, The Coronation of Napoleon (1805–1807).",
      source: "Wikimedia Commons — Jacques-Louis David",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Jacques-Louis_David,_The_Coronation_of_Napoleon_edit.jpg",
    },
    chatQuestion: "What happened during Napoleon's coronation as King of Italy in Milan's Duomo in 1805, and what did he leave behind?",
    source: "Museo del Risorgimento — Comune di Milano",
    sourceUrl: "https://en.wikipedia.org/wiki/Coronation_of_Napoleon_as_King_of_Italy",
  },
  {
    id: "ar-crown-final-facade-completion",
    period: "crown",
    landmark: "duomo",
    year: "1813",
    eyebrow: "Façade completed, 1805 – 1838",
    compassHeading: 10,
    title: "The façade finally finished",
    body: "Napoleon ordered the façade completed in 1805 and promised French treasury funds that never came. The Fabbrica sold real estate to pay for it themselves — and within seven years, after four centuries of delay, the Gothic façade was done. A statue of Napoleon was placed atop one of the spires.",
    detail: "Architect Pellicani largely followed Carlo Buzzi's 17th-century Gothic scheme, adding neo-Gothic details to the upper windows. In the following decades most of the remaining arches and spires were added, the statues on the southern wall finished, and between 1829 and 1858 new stained glass replaced the old windows. The Duomo continued to serve as the stage for royal ceremonies — in 1838 Ferdinand I of Austria was crowned King of Lombardy–Venetia here with the Iron Crown, in the last great Habsburg coronation the cathedral would ever host.",
    media: {
      type: "image",
      src: "/images/duomo1838.jpg",
      altText: "Alessandro Sanquirico's design for the crowning of Ferdinand I of Austria at the Duomo in 1838",
      caption: "Design for the crowning of Ferdinand I of Austria at the Duomo in 1838, by Alessandro Sanquirico.",
      source: "Wikipedia — Milan Cathedral",
      sourceUrl: "https://en.wikipedia.org/wiki/Milan_Cathedral",
    },
    chatQuestion: "How was the Duomo's façade finally completed after Napoleon's order in 1805, and what royal ceremonies followed?",
    source: "Wikipedia — Milan Cathedral",
    sourceUrl: "https://en.wikipedia.org/wiki/Milan_Cathedral",
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

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL POLISH ADDITIONS — Galleria & Palazzo, Crown era
  // All IDs use the `final-` segment so they are greppable as `ar-*-final-*`.
  // ─────────────────────────────────────────────────────────────────────────

  // ── Galleria / Crown ──
  {
    id: "ar-crown-final-coperto-figini",
    period: "crown",
    landmark: "galleria",
    year: "1606",
    eyebrow: "Built 1606, demolished 1864",
    compassHeading: 320,
    title: "Coperto dei Figini",
    body: "From 1606 a long arcade of porticoed houses called the Coperto dei Figini lined the northern side of the piazza — Milan's first true sheltered shopping street. For 250 years its colonnade was the place to meet, gossip, and trade out of the rain.",
    detail: "Designed by Pietro Antonio Barca for the wealthy Figini family, the arcade was 110 metres long and two storeys high, with thirty-five shops below and apartments above. It defined the piazza's edge so completely that early views of the Duomo almost always frame it against the Coperto's columns. Demolition began in 1864 to clear the site for the Galleria — and the Milanese mourned it. Newspaper editorials at the time argued that the Coperto, not the half-built cathedral, was the true heart of the city.",
    media: {
      type: "image",
      src: "/images/copertodifigini.jpg",
      altText: "Piazza del Duomo in 1838 by Angelo Inganni — the Coperto dei Figini visible on the left",
      caption: "Piazza del Duomo, 1838 — Angelo Inganni's painting; the Coperto dei Figini lines the left side.",
      source: "Wikipedia — Angelo Inganni",
      sourceUrl: "https://it.wikipedia.org/wiki/Angelo_Inganni",
    },
    chatQuestion: "Tell me about the Coperto dei Figini, the 17th-century arcade that stood where the Galleria is now.",
    source: "Wikipedia — Coperto dei Figini",
    sourceUrl: "https://it.wikipedia.org/wiki/Coperto_dei_Figini",
  },
  {
    id: "ar-crown-final-mengoni-competition",
    period: "crown",
    landmark: "galleria",
    year: "1861",
    eyebrow: "National competition, 1861",
    compassHeading: 300,
    title: "A nation picks its arcade",
    body: "In 1861 — months after Italy was unified — the city of Milan launched a national architecture competition for a covered arcade to connect the Duomo to La Scala. Out of 176 submissions from across the new country, a young Bolognese architect named Giuseppe Mengoni won.",
    detail: "The competition brief was deliberately ambitious: the arcade was meant to be a civic statement, the new kingdom's first great public space. Mengoni's design borrowed from Paris (the passage couverts), London (Crystal Palace), and Naples (Galleria Umberto's predecessor in concept), but combined them at a scale none had attempted. King Vittorio Emanuele II laid the first stone on 7 March 1865 — barely four years after unification. Construction would take twelve years and cost the architect his life.",
    media: {
      type: "image",
      src: "/images/Mengoni,_Giuseppe_(phot._Ferretti).jpeg",
      altText: "Photographic portrait of Giuseppe Mengoni, architect of the Galleria, by photographer Ferretti",
      caption: "Giuseppe Mengoni — the Bolognese architect who beat 175 other submissions in 1861.",
      source: "Wikipedia — Giuseppe Mengoni",
      sourceUrl: "https://en.wikipedia.org/wiki/Giuseppe_Mengoni",
    },
    chatQuestion: "How did the 1861 national competition for the Galleria work, and why did Mengoni win?",
    source: "Wikipedia — Galleria Vittorio Emanuele II",
    sourceUrl: "https://en.wikipedia.org/wiki/Galleria_Vittorio_Emanuele_II",
  },
  {
    id: "ar-crown-final-piazza-clearing",
    period: "crown",
    landmark: "galleria",
    year: "1858",
    eyebrow: "The piazza is cleared, 1858 – 1875",
    compassHeading: 285,
    title: "Erasing the medieval city",
    body: "Before Mengoni's arcade could rise, half a square kilometre of medieval Milan had to come down. Between 1858 and 1875 the city demolished the Rebecchino, the Coperto dei Figini, the old fish market, and three churches — all to enlarge the piazza into the grand civic space we know.",
    detail: "The clearing was directed by architect Giuseppe Vandoni and was the largest urban demolition Milan had ever undertaken. Some six hundred buildings came down. The piazza tripled in size. Public reaction was deeply divided: some celebrated the new monumentality, while others — including the poet Carlo Porta's circle — mourned the loss of the intimate, lived-in medieval square. The piazza you stand in today is not the one Milan inherited; it is the one Milan deliberately invented in the 1860s.",
    media: {
      type: "image",
      src: "/images/galleria_crown.jpg",
      src2: "/images/galleria_crown2.jpg",
      altText: "Photograph of the Galleria Vittorio Emanuele II construction site in Milan, 1865, with scaffolding and workers clearing rubble",
      altText2: "Painting of the cornerstone-laying ceremony for the Galleria Vittorio Emanuele II in Milan, 1865, with dignitaries and flags",
      caption: "Construction begins, 1865 — the site (left) and the cornerstone ceremony (right).",
      source: "Wikipedia — Galleria Vittorio Emanuele II",
      sourceUrl: "https://en.wikipedia.org/wiki/Galleria_Vittorio_Emanuele_II",
    },
    chatQuestion: "Tell me about the 19th-century clearing of Piazza del Duomo and what was demolished to make it.",
    source: "Comune di Milano — Storia urbanistica",
    sourceUrl: "https://www.comune.milano.it",
  },

  // ── Palazzo / Crown ──
  {
    id: "ar-crown-final-piermarini",
    period: "crown",
    landmark: "palazzo",
    year: "1773",
    eyebrow: "Giuseppe Piermarini, 1773 – 1778",
    compassHeading: 90,
    title: "Piermarini rebuilds it neoclassical",
    body: "When the Empress Maria Theresa of Austria gave Milan to her son Ferdinand in 1771, she sent her favourite architect — Giuseppe Piermarini — to rebuild the medieval palace into something fit for a Habsburg court. The neoclassical façade you see today is his.",
    detail: "Piermarini was a pupil of Vanvitelli (architect of the Royal Palace at Caserta) and had absorbed the cool, ordered grammar of high European neoclassicism. His brief was to flatten the medieval irregularities, present a single restrained façade to the Duomo, and arrange the interior around a sequence of staterooms suitable for receptions. He finished the main works in 1778 — and immediately moved across the city to begin his other Milan commission: the Teatro alla Scala, which opened that August. The two buildings are siblings, both Piermarini, both 1778.",
    media: {
      type: "image",
      src: "/images/MariaTheresa.jpg",
      altText: "Portrait of Maria Theresa of Austria by Anton von Maron",
      objectPosition: "center center",
      caption: "Portrait of Maria Theresa of Austria by Anton von Maron, displayed in the Palazzo Reale to celebrate her contributions to the city of Milan.",
      src2: "/images/Giuseppe_Piermarini,_ritratto_di_Martin_Knoller.jpg",
      altText2: "Portrait of Giuseppe Piermarini by Martin Knoller",
      objectPosition2: "center 15%",
      caption2: "Portrait of Giuseppe Piermarini by Martin Knoller.",
      source: "Wikipedia",
      sourceUrl: "https://en.wikipedia.org/wiki/Giuseppe_Piermarini",
    },
    chatQuestion: "Tell me about Giuseppe Piermarini and his 1773 neoclassical rebuild of Palazzo Reale.",
    source: "Wikipedia — Giuseppe Piermarini",
    sourceUrl: "https://en.wikipedia.org/wiki/Giuseppe_Piermarini",
  },
  {
    id: "ar-crown-final-palazzo-1760s",
    period: "crown",
    landmark: "palazzo",
    year: "1760",
    eyebrow: "Palazzo Reale, mid-18th century",
    compassHeading: 75,
    title: "The palace before the rebuild",
    body: "By the 1750s and 1760s, Palazzo Reale had accumulated centuries of additions — Spanish, medieval, and early Habsburg — into a sprawling, irregular complex. This view captures it before Piermarini's neoclassical overhaul transformed it into the unified façade you see today.",
    detail: "Under Spanish rule (1535 – 1706) the palace had been heavily modified to serve as the seat of the Governor of Milan, with fortified wings and administrative offices layered onto the medieval core. When the Habsburgs took over, the complex was functional but far from the elegant court architecture Maria Theresa expected. The 1760s view shows a building still carrying its accumulated history — the very building Piermarini was sent to remake into something worthy of a Habsburg court capital.",
    media: {
      type: "image",
      src: "/images/Pallazo1760.jpg",
      altText: "View of Palazzo Reale in Milan in the 1760s, before Piermarini's neoclassical rebuild",
      objectPosition: "center 30%",
      caption: "Palazzo Reale in the 1760s — a century of Spanish and Habsburg additions before Piermarini's transformation.",
      source: "Ghilli — Georg Balthasar Probst, La Residenza Ducale Milano",
      sourceUrl: "https://www.ghilli.it/prodotto/george-baltasar-probst-la-residenza-ducale-milano-ante-1748/",
    },
    chatQuestion: "What did Palazzo Reale look like before Piermarini's neoclassical rebuild in the 1770s?",
    source: "Wikipedia — Royal Palace of Milan",
    sourceUrl: "https://en.wikipedia.org/wiki/Royal_Palace_of_Milan",
  },
  {
    id: "ar-crown-final-napoleonic",
    period: "crown",
    landmark: "palazzo",
    year: "1796",
    eyebrow: "Napoleonic era, 1796 – 1814",
    compassHeading: 88,
    title: "Napoleon's royal palace",
    body: "In 1796 Napoleon occupied Milan and renamed this building the National Palace, making it the seat of his Cisalpine Republic. By 1805, as capital of the Kingdom of Italy, it had been lavishly restored under Viceroy Eugène de Beauharnais — grander than it had ever been under the Habsburgs.",
    detail: "Napoleon's general took Milan after the Battle of Lodi. The palazzo became the Directorate's headquarters, then was looted when the Austro-Russians briefly retook the city in 1799. After Napoleon's return, Beauharnais commissioned Andrea Appiani to fresco the main state rooms and Luigi Canonica to build an entire new block — 'La Cavallerizza' — with stables, a riding school, and offices in austere neoclassical style. A bridge on Via Restrelli connected the complex to the Cannobiana Theatre. When Napoleon fell in 1814, the palace passed back to Austria and became the seat of the Kingdom of Lombardy–Venetia.",
    media: {
      type: "image",
      src: "/images/napoleonic era.jpg",
      altText: "Commemorative painting by Andrea Appiani displayed in the Palazzo Reale, depicting Napoleon as a Roman emperor",
      caption: "One of the commemorative paintings by Andrea Appiani displayed in the Palazzo Reale, celebrating Napoleon's triumph by depicting him as a Roman emperor.",
      source: "Wikipedia — Royal Palace of Milan",
      sourceUrl: "https://en.wikipedia.org/wiki/Royal_Palace_of_Milan",
    },
    chatQuestion: "Tell me about the Napoleonic era at Palazzo Reale — the Cisalpine Republic, Beauharnais, and what was built and lost.",
    source: "Wikipedia — Royal Palace of Milan",
    sourceUrl: "https://en.wikipedia.org/wiki/Royal_Palace_of_Milan",
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
    media: {
      type: "image",
      src: "/images/Giuseppe_Mengoni_death.JPG",
      altText: "Plaque on the Duomo side of the Galleria Vittorio Emanuele II commemorating the death of architect Giuseppe Mengoni",
      caption: "A plaque was placed on the Duomo side of the Galleria to remember the fact.",
    },
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
    media: {
      type: "image",
      src: "/images/luckybull.jpg",
      altText: "Turin's bull mosaic on the floor of the Galleria Vittorio Emanuele II, with a worn metal patch covering the lucky-spin spot",
      caption: "Turin's bull on the Galleria's octagon — the metal patch covers the spot generations have spun for luck.",
      source: "BBC — The Uffizi",
      sourceUrl: "https://www.bbc.co.uk/programmes/p01jf4lb/p01jf2b5",
    },
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
    media: {
      type: "image",
      src: "/images/CAMPARI-1867.jpg",
      altText: "Vintage photograph of Bar Campari at the Galleria's Duomo entrance, with the CAMPARI / CAFFÈ sign above and a crowd standing outside",
      caption: "Bar Campari at the Galleria's Duomo end — the corner where standing for aperitivo became Milanese ritual.",
      source: "Camparino — History",
      sourceUrl: "https://www.camparino.com/history/",
    },
    chatQuestion: "What is the history of Bar Campari in the Galleria and how did aperitivo become a Milanese then Italian ritual?",
    source: "Camparino in Galleria — History",
    sourceUrl: "https://www.camparino.com/en/beginning/",
  },
  {
    id: "ar-modern-final-galleria-bombs",
    period: "modern",
    landmark: "galleria",
    year: "1943",
    eyebrow: "15 August 1943",
    compassHeading: 310,
    title: "Glass shattered",
    body: "On the night of 15 August 1943, Allied incendiary bombs shattered the Galleria's iron-and-glass dome. The arcade burned. Restorers spent the next decade rebuilding it from Mengoni's original drawings — bolt for bolt, pane for pane.",
    detail: "The same August raid that destroyed Palazzo Reale's Sala delle Cariatidi smashed the Galleria's central crossing. Postwar photographs show shoppers walking under bare iron ribs and open sky. The Comune debated whether to rebuild faithfully or replace with concrete and modern glazing; Milan chose fidelity. The dome you stand under today is a reconstruction completed in the 1950s, drawn from Mengoni's plans preserved in the city archive.",
    media: {
      type: "image",
      src: "/images/Milano,_Galleria_Vittorio_Emanuele_II_(bombardata)_01.jpg",
      altText: "Black-and-white photograph of the Galleria Vittorio Emanuele II after the 1943 bombing — iron dome skeleton exposed, debris on the ground, figures standing in the rubble",
      caption: "August 1943 — the dome stripped to its iron ribs, glass blown out, debris underfoot.",
      source: "Wikimedia Commons — Galleria Vittorio Emanuele II (bombardata)",
      sourceUrl: "https://commons.wikimedia.org/wiki/Category:Bombing_of_Milan_in_World_War_II",
    },
    chatQuestion: "Tell me about the 1943 bombing of the Galleria Vittorio Emanuele II and its postwar reconstruction.",
    source: "Comune di Milano — Storia urbanistica",
    sourceUrl: "https://www.comune.milano.it",
  },
  {
    id: "ar-modern-final-galleria-today",
    period: "modern",
    landmark: "galleria",
    year: "2026",
    eyebrow: "Italy's most expensive arcade",
    compassHeading: 295,
    title: "Milan's living room",
    body: "Today the Galleria is among the most expensive commercial real estate in Italy. Prada has been here since 1913; Louis Vuitton, Versace, Gucci, and Camparino share the arcade with roughly 15 million visitors a year.",
    detail: "The storefronts are leased by the Comune di Milano, not sold — every brand here is technically a guest of the city. The 2012 leasing competition for the Louis Vuitton corner reportedly closed at over €5 million per year. The Galleria has hosted Prada runways and Dolce & Gabbana presentations; the Salotto Galleria above Camparino is used for fashion-week receptions. The arcade is now both Milan's living room and the most public stage of Italian luxury.",
    media: {
      type: "image",
      src: "/images/Galleria_Milano_(179532365).jpeg",
      altText: "Interior of the Galleria Vittorio Emanuele II today — the restored iron-and-glass dome and luxury shopfronts",
      caption: "The Galleria today: Mengoni's dome restored, Prada and Camparino still here.",
      source: "Wikipedia — Galleria Vittorio Emanuele II",
      sourceUrl: "https://en.wikipedia.org/wiki/Galleria_Vittorio_Emanuele_II",
    },
    chatQuestion: "Tell me about the Galleria today — its luxury brands, rents, and how Milan manages its most famous shopping street.",
    source: "Comune di Milano",
    sourceUrl: "https://www.comune.milano.it",
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
    media: {
      type: "image",
      src: "/images/Beccarisopensfire.jpg",
      altText: "Piazza del Duomo, Milan, 1898 — troops deployed against demonstrators during the Bava-Beccaris massacre",
      caption: "Piazza del Duomo, Milan, 1898. Troops deployed against demonstrators.",
      source: "Wikipedia — Bava Beccaris massacre",
      sourceUrl: "https://en.wikipedia.org/wiki/Bava_Beccaris_massacre",
    },
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
      source: "Urbanfile",
      sourceUrl: "https://blog.urbanfile.org/2015/07/30/zona-duomo-lo-squallore-di-palazzo-reale/palazzo-reale-sala-cariatidi-milano-1/",
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
    id: "ar-modern-final-duomo-war",
    period: "modern",
    landmark: "duomo",
    year: "1943",
    eyebrow: "15 August 1943",
    compassHeading: 0,
    title: "The Duomo under fire",
    body: "On the night of 15 August 1943, Allied bombing raids struck central Milan. The Duomo was hit — stained glass blown out, stone facades scarred, the surrounding streets left in rubble. The cathedral had survived six centuries; it now faced its worst night.",
    detail: "Milan was one of the most heavily bombed Italian cities during WWII, targeted for its factories, railways, and symbolic value as Italy's industrial capital. The August 1943 raids — the same nights that destroyed the Galleria's dome and gutted the Sala delle Cariatidi at Palazzo Reale — left the piazza strewn with debris. The Duomo's marble structure survived structurally intact, but restoration of its windows and exterior took years. The damage visible in post-war photographs was repaired by the 1950s.",
    media: {
      type: "image",
      src: "/images/milanocathedralpostwar.jpg",
      altText: "A damaged Milan Cathedral following Allied bombing during WWII, 1943",
      objectFit: "contain",
      caption: "A damaged Milan Cathedral following Allied bombing during WWII, 1943.",
      source: "Instagram",
      sourceUrl: "https://www.instagram.com/p/C0ccDqeuYjc/",
    },
    chatQuestion: "How was the Duomo di Milano damaged during the 1943 Allied bombing raids, and how was it restored?",
    source: "Wikipedia — Bombing of Milan in World War II",
    sourceUrl: "https://en.wikipedia.org/wiki/Bombing_of_Milan_in_World_War_II",
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
      source: "Palazzo Reale di Milano",
      sourceUrl: "https://www.palazzorealemilano.it/-/picasso-e-guernica",
    },
    chatQuestion: "Why was Picasso's Guernica exhibited in the bomb-damaged Sala delle Cariatidi in 1953, and what did that pairing mean?",
    source: "Palazzo Reale di Milano — Picasso e Guernica",
    sourceUrl: "https://www.palazzorealemilano.it/-/picasso-e-guernica",
  },
  {
    id: "ar-modern-final-savoy-palace",
    period: "modern",
    landmark: "palazzo",
    year: "1859",
    eyebrow: "Savoy residence, 1859 – 1906",
    compassHeading: 95,
    title: "A palace without a king",
    body: "When Lombardy joined the Kingdom of Sardinia in 1859, Palazzo Reale became a Savoy royal residence — but one that was rarely used. Umberto I preferred the Royal Villa of Monza; his son Victor Emmanuel III visited only for official ceremonies. The last royal reception was held here in 1906.",
    detail: "The first governor appointed after annexation, Massimo d'Azeglio, occupied the palace for less than a year before the proclamation of the Kingdom of Italy in 1861. As the new kingdom's capital shifted — first to Turin, then to Florence, then to Rome — Milan's Palazzo Reale faded from the centre of power. The Savoys maintained it as a formal venue: in 1875 the Hall of Caryatids hosted a grand reception for Kaiser Wilhelm I of Germany. After the 1906 Milan International Exhibition, the palace ceased to function as a royal residence altogether.",
    media: {
      type: "image",
      src: "/images/royalplace1875.jpg",
      altText: "Illustration of the reception held in the Hall of Caryatids of Palazzo Reale in 1875 for Kaiser Wilhelm I",
      caption: "Reception in 1875 for William I, German Emperor, held in the 'Hall of Caryatids' of the Palazzo Reale before its destruction by fire on 15 August 1943.",
      source: "Wikipedia — Royal Palace of Milan",
      sourceUrl: "https://en.wikipedia.org/wiki/Royal_Palace_of_Milan",
    },
    chatQuestion: "How did Palazzo Reale change under Savoy rule after 1859, and why did the royal family rarely use it?",
    source: "Wikipedia — Royal Palace of Milan",
    sourceUrl: "https://en.wikipedia.org/wiki/Royal_Palace_of_Milan",
  },
  {
    id: "ar-modern-final-civic-palace",
    period: "modern",
    landmark: "palazzo",
    year: "1946",
    eyebrow: "2 June 1946",
    compassHeading: 100,
    title: "From royal court to civic museum",
    body: "When Italians voted to abolish the monarchy on 2 June 1946, Palazzo Reale ceased to be a royal residence. The bombed ducal halls were rebuilt as exhibition spaces, and the palace became one of Italy's busiest civic museums.",
    detail: "The 1946 referendum ended 85 years of House of Savoy rule. Ownership of Palazzo Reale transferred to the State, then to the Comune di Milano, which manages it today. The Picasso show in the Sala delle Cariatidi in 1953 was one of its first major postwar exhibitions; the programme has run continuously ever since. Recent blockbuster retrospectives — Caravaggio in 2017, Escher, Picasso again, Hayao Miyazaki — have each drawn hundreds of thousands of visitors. The Habsburg ballroom is now Italy's most-visited civic gallery.",
    media: {
      type: "image",
      src: "/images/Palazzo_Reale_now.jpg",
      altText: "Palazzo Reale in Milan today — the neoclassical façade facing Piazza del Duomo",
      caption: "Palazzo Reale today — the Habsburg ballroom is now Italy's most-visited civic gallery.",
      source: "Yes Milano",
      sourceUrl: "https://www.yesmilano.it/en/see-and-do/venues/palazzo-reale",
    },
    chatQuestion: "Tell me how Palazzo Reale went from a royal residence to one of Italy's most-visited civic museums after the 1946 republic referendum.",
    source: "Palazzo Reale di Milano — Comune di Milano",
    sourceUrl: "https://www.palazzorealemilano.it/",
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
      source: "Duomo di Milano",
      sourceUrl: "https://www.duomomilano.it/en/a-gaze-at-construction-sites-of-milan-duomo/",
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
      source: "Facebook — Cityscapes",
      sourceUrl: "https://www.facebook.com/groups/cityscapes/posts/3066321230226685/",
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
];

// ─── Exports ───────────────────────────────────────────────────────────────────

const byYear = (a: ARHotspot, b: ARHotspot) =>
  parseInt(a.year) - parseInt(b.year);

export const AR_HOTSPOTS: Record<ARPeriodId, ARHotspot[]> = {
  birth: [...BIRTH].sort(byYear),
  crown: [...CROWN].sort(byYear),
  modern: [...MODERN].sort(byYear),
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
