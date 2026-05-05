import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Check } from "lucide-react";
import type { IllustrationId } from "./scenes";

/**
 * Dispatcher — pick the right illustration component for a scene.
 */
export function Illustration({ id }: { id: IllustrationId }) {
  switch (id) {
    case "foundation-dig":
      return <FoundationDig />;
    case "duomo-spires":
      return <DuomoSpires />;
    case "leonardo-tiburio":
      return <LeonardoTiburio />;
    case "madonnina-heights":
      return <MadonninaHeights />;
    default:
      return null;
  }
}

// ─── 1. FOUNDATION DIG ───────────────────────────────────────────────────────
// Tap each soil layer to reveal what foundation crews uncovered.

const DIG_LAYERS = [
  {
    id: "topsoil",
    label: "Topsoil",
    depth: "0–2 m",
    fact: "Medieval Milan's surface, full of broken pottery and the bones of older buildings.",
    color: "#7A5A3D",
  },
  {
    id: "roman",
    label: "Roman fragments",
    depth: "2–6 m",
    fact: "Stone blocks and tiles from the imperial city of Mediolanum, 1,000 years older than the cathedral.",
    color: "#B8895E",
  },
  {
    id: "clay",
    label: "Lombard clay",
    depth: "6–11 m",
    fact: "Dense, wet clay — useless for foundations, but it told the engineers exactly where they couldn't stop.",
    color: "#A66E47",
  },
  {
    id: "bedrock",
    label: "Stable gravel",
    depth: "11–14 m",
    fact: "The first stone of the cathedral rests here. Below this, the Po Valley sediments hold steady.",
    color: "#6B4A30",
  },
];

function FoundationDig() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const active = DIG_LAYERS.find((l) => l.id === activeId);

  const toggle = (id: string) => {
    setActiveId(id);
    setSeen((s) => new Set(s).add(id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-caption">{seen.size} / {DIG_LAYERS.length} layers</span>
        {seen.size > 0 && (
          <button
            onClick={() => { setSeen(new Set()); setActiveId(null); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        <svg viewBox="0 0 320 240" className="w-full block" role="img" aria-label="Cathedral foundation cross-section">
          {/* sky */}
          <rect x="0" y="0" width="320" height="40" fill="var(--secondary)" />
          {/* tiny cathedral silhouette */}
          <g fill="var(--muted-foreground)" opacity="0.7">
            <path d="M120 40 L130 18 L140 40 Z" />
            <path d="M150 40 L160 14 L170 40 Z" />
            <path d="M180 40 L190 22 L200 40 Z" />
            <rect x="118" y="32" width="84" height="8" />
          </g>

          {DIG_LAYERS.map((layer, i) => {
            const y = 40 + i * 50;
            const isActive = activeId === layer.id;
            const isSeen = seen.has(layer.id);
            return (
              <g key={layer.id} style={{ cursor: "pointer" }} onClick={() => toggle(layer.id)}>
                <rect
                  x="0"
                  y={y}
                  width="320"
                  height="50"
                  fill={layer.color}
                  opacity={isActive ? 1 : 0.78}
                />
                {/* highlight ring */}
                <rect
                  x="2"
                  y={y + 2}
                  width="316"
                  height="46"
                  fill="none"
                  stroke="#E5B948"
                  strokeWidth={isActive ? 2.5 : 0}
                  opacity={isActive ? 1 : 0}
                  rx="4"
                />
                <text x="14" y={y + 24} fontSize="11" fontWeight="500" fill="#FAFAF7">
                  {layer.label}
                </text>
                <text x="14" y={y + 38} fontSize="9" fill="#FAFAF7" opacity="0.85">
                  {layer.depth}
                </text>
                {/* checkmark when seen */}
                {isSeen && (
                  <g transform={`translate(290, ${y + 25})`}>
                    <circle r="9" fill="#E5B948" />
                    <path d="M-3 0 L-1 2 L4 -3" stroke="#1A1614" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-2xl p-4"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <p className="text-sm font-medium text-foreground">{active.label} · {active.depth}</p>
            <p className="text-sm text-foreground leading-relaxed mt-1">{active.fact}</p>
          </motion.div>
        )}
        {!active && (
          <motion.p
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-muted-foreground text-center"
          >
            Tap a layer to dig deeper.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 2. DUOMO SPIRES ─────────────────────────────────────────────────────────
// Tap each spire to reveal a story. 5 hotspots over a stylized facade.

const SPIRES = [
  {
    id: "madonnina",
    cx: 160, cy: 30,
    label: "La Madonnina",
    fact: "The tallest spire — 108.5 m — was finished much later, in 1774. The Visconti era only reached the lower tiers.",
  },
  {
    id: "north-pinnacle",
    cx: 75, cy: 70,
    label: "Pinnacle of San Bartolomeo",
    fact: "Saint Bartholomew, holding his own flayed skin. One of the most famous statues in the cathedral.",
  },
  {
    id: "south-pinnacle",
    cx: 245, cy: 72,
    label: "Pinnacle of the Donors",
    fact: "Discreetly carved here are the wealthy families who paid for the work — frozen in stone for eternity.",
  },
  {
    id: "central-cross",
    cx: 160, cy: 90,
    label: "The crossing tower",
    fact: "Right above the high altar. Below it, Leonardo would later sketch the tiburio that crowns the dome.",
  },
  {
    id: "mid-spire",
    cx: 115, cy: 105,
    label: "Visconti's serpent",
    fact: "The serpent biting a child — the Visconti family crest — appears on a corbel here. A medieval signature.",
  },
];

function DuomoSpires() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const active = SPIRES.find((s) => s.id === activeId);

  const tap = (id: string) => {
    setActiveId(id);
    setSeen((s) => new Set(s).add(id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-caption">{seen.size} / {SPIRES.length} secrets found</span>
        {seen.size > 0 && (
          <button
            onClick={() => { setSeen(new Set()); setActiveId(null); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(180deg, #1F1B19 0%, #14110F 100%)" }}
      >
        <svg viewBox="0 0 320 220" className="w-full block" role="img" aria-label="Cathedral facade with hotspots">
          {/* faint star field */}
          <g fill="#E5B948" opacity="0.18">
            <circle cx="40" cy="20" r="0.8" />
            <circle cx="280" cy="35" r="0.6" />
            <circle cx="220" cy="15" r="0.7" />
            <circle cx="60" cy="50" r="0.5" />
            <circle cx="290" cy="60" r="0.5" />
          </g>

          {/* facade silhouette */}
          <g fill="#EDE6DA" opacity="0.92">
            {/* base */}
            <rect x="50" y="170" width="220" height="40" />
            {/* tier 2 */}
            <rect x="60" y="140" width="200" height="30" />
            {/* facade gable */}
            <path d="M60 140 L160 95 L260 140 Z" />
            {/* spires — main row */}
            <path d="M70 140 L75 75 L80 140 Z" />
            <path d="M90 140 L95 90 L100 140 Z" />
            <path d="M110 140 L115 80 L120 140 Z" />
            <path d="M130 140 L135 95 L140 140 Z" />
            <path d="M180 140 L185 95 L190 140 Z" />
            <path d="M200 140 L205 80 L210 140 Z" />
            <path d="M220 140 L225 90 L230 140 Z" />
            <path d="M240 140 L245 75 L250 140 Z" />
            {/* central tall spire */}
            <path d="M152 105 L160 30 L168 105 Z" />
            {/* pinnacle base */}
            <rect x="155" y="100" width="10" height="10" />
            {/* doors */}
            <rect x="148" y="180" width="24" height="30" fill="#1A1614" opacity="0.5" />
          </g>

          {/* hotspots */}
          {SPIRES.map((s) => {
            const isActive = activeId === s.id;
            const isSeen = seen.has(s.id);
            return (
              <g key={s.id} style={{ cursor: "pointer" }} onClick={() => tap(s.id)}>
                {/* halo */}
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={isActive ? 14 : 10}
                  fill="#E5B948"
                  opacity={isActive ? 0.28 : 0.16}
                />
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r="6"
                  fill={isSeen ? "#E5B948" : "#FAFAF7"}
                  stroke="#E5B948"
                  strokeWidth="2"
                />
                {isSeen && (
                  <path
                    d={`M${s.cx - 2.5} ${s.cy} L${s.cx - 0.5} ${s.cy + 2} L${s.cx + 3} ${s.cy - 2.5}`}
                    stroke="#1A1614"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-2xl p-4"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <p className="text-sm font-medium text-foreground">{active.label}</p>
            <p className="text-sm text-foreground leading-relaxed mt-1">{active.fact}</p>
          </motion.div>
        ) : (
          <motion.p
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-muted-foreground text-center"
          >
            Five gold dots. Tap each one to find a story.
          </motion.p>
        )}
      </AnimatePresence>

      {seen.size === SPIRES.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 rounded-xl p-3 flex items-center gap-2 text-sm"
          style={{
            background: "color-mix(in srgb, var(--success) 18%, transparent)",
            borderLeft: "3px solid var(--success)",
            color: "var(--foreground)",
          }}
        >
          <Check className="w-4 h-4" style={{ color: "var(--success)" }} />
          <span>All five secrets found. The cathedral has more — but those you'll discover in person.</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── 3. LEONARDO TIBURIO ─────────────────────────────────────────────────────
// A schematic of the central dome. Tap each part to learn what it does.

const TIBURIO_PARTS = [
  {
    id: "lantern",
    label: "Lantern",
    fact: "The small spire on top. Lets light into the dome and gives the silhouette its sharp finish.",
    cx: 160, cy: 28, r: 8,
  },
  {
    id: "ribs",
    label: "Gothic ribs",
    fact: "The pointed structural arches that channel weight outward. Leonardo respected the existing Gothic skeleton — he proposed adding to it, not replacing it.",
    cx: 100, cy: 110, r: 9,
  },
  {
    id: "drum",
    label: "Octagonal drum",
    fact: "An eight-sided base for the dome. Leonardo's innovation: balance Gothic verticality with Renaissance geometric harmony.",
    cx: 160, cy: 130, r: 10,
  },
  {
    id: "buttress",
    label: "Flying buttress",
    fact: "Carries the dome's outward thrust to the ground. Without these, the spires above would crack the walls.",
    cx: 230, cy: 170, r: 9,
  },
];

function LeonardoTiburio() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const active = TIBURIO_PARTS.find((p) => p.id === activeId);

  const tap = (id: string) => {
    setActiveId(id);
    setSeen((s) => new Set(s).add(id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-caption">{seen.size} / {TIBURIO_PARTS.length} parts explored</span>
        {seen.size > 0 && (
          <button
            onClick={() => { setSeen(new Set()); setActiveId(null); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-border"
        style={{ background: "#FBF6E8" }}
      >
        <svg viewBox="0 0 320 240" className="w-full block" role="img" aria-label="Leonardo's tiburio schematic">
          {/* sketch-style "paper" texture */}
          <defs>
            <pattern id="paperGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#9C7A1F" strokeWidth="0.3" opacity="0.18" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="320" height="240" fill="url(#paperGrid)" />

          {/* base / drum */}
          <g fill="none" stroke="#3A2A18" strokeWidth="1.4">
            <rect x="100" y="160" width="120" height="60" />
            {/* drum (octagon-ish) */}
            <polygon points="105,120 130,100 190,100 215,120 215,160 105,160" />
            {/* dome curve */}
            <path d="M105 120 Q160 60 215 120" />
            {/* gothic ribs */}
            <path d="M115 160 L130 100" />
            <path d="M205 160 L190 100" />
            {/* lantern */}
            <rect x="152" y="38" width="16" height="22" />
            <path d="M152 38 L160 22 L168 38" />
            {/* central vertical line */}
            <line x1="160" y1="22" x2="160" y2="160" strokeDasharray="3 2" opacity="0.5" />
            {/* flying buttresses */}
            <path d="M70 200 Q90 170 100 160" />
            <path d="M250 200 Q230 170 220 160" />
            {/* ground */}
            <line x1="40" y1="220" x2="280" y2="220" />
          </g>

          {/* annotation labels */}
          <text x="160" y="14" fontSize="9" fill="#9C7A1F" textAnchor="middle" fontStyle="italic">
            tiburio · L. da Vinci, c. 1487
          </text>

          {/* hotspots */}
          {TIBURIO_PARTS.map((p) => {
            const isActive = activeId === p.id;
            const isSeen = seen.has(p.id);
            return (
              <g key={p.id} style={{ cursor: "pointer" }} onClick={() => tap(p.id)}>
                <circle cx={p.cx} cy={p.cy} r={isActive ? 14 : 10} fill="#E5B948" opacity={isActive ? 0.32 : 0.18} />
                <circle cx={p.cx} cy={p.cy} r="6" fill={isSeen ? "#E5B948" : "#FFFFFF"} stroke="#9C7A1F" strokeWidth="1.6" />
                {isSeen && (
                  <path
                    d={`M${p.cx - 2.5} ${p.cy} L${p.cx - 0.5} ${p.cy + 2} L${p.cx + 3} ${p.cy - 2.5}`}
                    stroke="#1A1614" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-2xl p-4"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <p className="text-sm font-medium text-foreground">{active.label}</p>
            <p className="text-sm text-foreground leading-relaxed mt-1">{active.fact}</p>
          </motion.div>
        ) : (
          <motion.p
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-muted-foreground text-center"
          >
            Tap each part of the dome to read Leonardo's notes.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 4. MADONNINA HEIGHTS ────────────────────────────────────────────────────
// Vertical bars comparing Milan landmarks to the Madonnina (108.5 m).

const HEIGHTS = [
  { id: "torre-velasca", label: "Torre Velasca", year: "1958", height: 106, fact: "An icon of post-war Milanese design — and the first tower the city allowed close to the Madonnina's height." },
  { id: "madonnina",     label: "Madonnina",     year: "1774", height: 108.5, fact: "For 200 years, no Milanese building was allowed to rise above her. She is gilded with thin sheets of gold leaf, replaced every few decades.", isFeature: true },
  { id: "pirelli",       label: "Pirelli Tower", year: "1960", height: 127, fact: "When it overtook the Madonnina, the city placed a small replica of her on its roof — a symbolic compromise that locals still demand of every taller building." },
  { id: "unicredit",     label: "UniCredit",     year: "2011", height: 231, fact: "Milan's tallest. Yes, she is up there too — a tiny gilded Madonnina watches the city from her spire as well." },
];

function MadonninaHeights() {
  const max = Math.max(...HEIGHTS.map((h) => h.height));
  const [activeId, setActiveId] = useState<string>("madonnina");
  const active = HEIGHTS.find((h) => h.id === activeId)!;

  return (
    <div>
      <p className="text-caption mb-2">Tap a tower</p>

      <div className="rounded-2xl overflow-hidden border border-border bg-card p-4">
        <div className="flex items-end justify-between gap-3 h-[200px]">
          {HEIGHTS.map((h) => {
            const isActive = activeId === h.id;
            const heightPct = (h.height / max) * 100;
            return (
              <button
                key={h.id}
                onClick={() => setActiveId(h.id)}
                className="flex-1 flex flex-col items-center justify-end h-full active:scale-[0.98] transition-transform"
                aria-label={`${h.label}, ${h.height} metres`}
              >
                {/* bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-t-md relative flex items-start justify-center"
                  style={{
                    background: isActive
                      ? "var(--accent)"
                      : h.isFeature
                      ? "color-mix(in srgb, var(--accent) 35%, var(--secondary))"
                      : "var(--secondary)",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    minHeight: "20px",
                    transition: "background 0.2s ease",
                  }}
                >
                  {/* Madonnina pin on top */}
                  {h.isFeature && (
                    <div
                      className="absolute -top-2 w-2 h-2 rounded-full"
                      style={{ background: "#E5B948", boxShadow: "0 0 6px #E5B948" }}
                    />
                  )}
                  {isActive && (
                    <span
                      className="absolute -top-6 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      {h.height} m
                    </span>
                  )}
                </motion.div>
              </button>
            );
          })}
        </div>

        {/* Labels */}
        <div className="mt-3 flex items-start justify-between gap-3">
          {HEIGHTS.map((h) => {
            const isActive = activeId === h.id;
            return (
              <div key={h.id} className="flex-1 text-center">
                <p
                  className="text-[11px] font-medium leading-tight"
                  style={{ color: isActive ? "var(--accent-strong)" : "var(--foreground)" }}
                >
                  {h.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{h.year}</p>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-2xl p-4"
          style={{
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <p className="text-sm font-medium text-foreground">{active.label} · {active.height} m</p>
          <p className="text-sm text-foreground leading-relaxed mt-1">{active.fact}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
