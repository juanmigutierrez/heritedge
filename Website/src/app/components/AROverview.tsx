// AROverview — refined UI/UX + stable layout

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { X } from "lucide-react";

import {
  getEra,
  listLandmarks,
  type Era,
  type EraId,
  type LandmarkId,
  type LandmarkMeta,
} from "@/content/landmarks";

import {
  EraBadge,
  EraScrub,
  FG,
  SANS,
  VoicePill,
  haptic,
} from "./ar/shared";

import { pickVoiceHint } from "./ar/voiceHints";
import { landmarkVT, startViewTransition } from "./ar/viewTransition";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const LANDMARK_POS: Record<LandmarkId, { x: number; y: number }> = {
  duomo: { x: 50, y: 45 },
  galleria: { x: 30, y: 55 },
  palazzo: { x: 70, y: 50 },
};

const LANDMARK_GLYPH: Record<LandmarkId, string> = {
  duomo: "⛪",
  galleria: "🏛️",
  palazzo: "🏰",
};

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function DashboardStat({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-amber-200 uppercase">{label}</p>
      <p className="text-2xl text-white mt-2">{value}</p>
    </div>
  );
}

function ARMapPin({
  landmark,
  era,
  focused,
  onClick,
}: {
  landmark: LandmarkMeta;
  era: Era;
  focused: boolean;
  onClick: () => void;
}) {
  const pos = LANDMARK_POS[landmark.id];

  const glyph = LANDMARK_GLYPH[landmark.id] ?? "◉";

  return (
    <motion.button
      onClick={onClick}
      data-vt-name={landmarkVT(landmark.id)}
      className="absolute flex flex-col items-center justify-center rounded-full"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        width: 84,
        height: 84,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full border"
        style={{
          width: 72,
          height: 72,
          background: focused ? era.accent : "rgba(255,255,255,0.14)",
          borderColor: era.accent,
          borderWidth: 2,
        }}
      >
        <span className="text-3xl leading-none">{glyph}</span>
      </div>
      <span className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/90 text-center w-full">
        {landmark.name}
      </span>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                       */
/* -------------------------------------------------------------------------- */

export function AROverview() {
  const navigate = useNavigate();

  const [entered, setEntered] = useState(true);
  const [eraId, setEraId] = useState<EraId>("present");
  const [focusedLandmark, setFocusedLandmark] = useState<LandmarkId>("duomo");
  const [showHelp, setShowHelp] = useState(false);
  const [shakeFact, setShakeFact] = useState<string | null>(null);

  const shakeTimeoutRef = useRef<number | null>(null);

  const era = useMemo(() => getEra(eraId)!, [eraId]);
  const landmarks = useMemo(() => listLandmarks(), []);
  const voiceHint = useMemo(() => pickVoiceHint(), []);
  const totalFacts = useMemo(
    () => landmarks.reduce((sum, landmark) => sum + landmark.didYouKnow.length, 0),
    [landmarks]
  );

  const activeLandmark =
    landmarks.find((landmark) => landmark.id === focusedLandmark) || landmarks[0];

  const mapRef = useRef<HTMLDivElement>(null);

  const ERA_PATTERNS: Array<[RegExp, EraId]> = [
    [/medieval/i, "medieval"],
    [/post[\s-]?war|war/i, "postwar"],
    [/present|now|today/i, "present"],
  ];

  const LANDMARK_PATTERNS: Array<[RegExp, LandmarkId]> = [
    [/duomo/i, "duomo"],
    [/galleria/i, "galleria"],
    [/palazzo/i, "palazzo"],
  ];

  const navigateToLandmark = useCallback(
    (id: LandmarkId, eraOverride: EraId = eraId) => {
      startViewTransition(() => {
        navigate(`/ar-artifact/${id}?period=${eraOverride}`);
      });
    },
    [navigate, eraId]
  );

  const handleLandmarkClick = useCallback(
    (id: LandmarkId) => {
      haptic(10);
      setFocusedLandmark(id);
      window.setTimeout(() => navigateToLandmark(id), 120);
    },
    [navigateToLandmark]
  );

  const handleVoiceCommand = useCallback(
    (transcript: string) => {
      const command = transcript.trim().toLowerCase();

      let detectedEra: EraId | null = null;
      let detectedLandmark: LandmarkId | null = null;

      for (const [pattern, eraMatch] of ERA_PATTERNS) {
        if (pattern.test(command)) {
          detectedEra = eraMatch;
          break;
        }
      }

      for (const [pattern, landmarkMatch] of LANDMARK_PATTERNS) {
        if (pattern.test(command)) {
          detectedLandmark = landmarkMatch;
          break;
        }
      }

      const resolvedEra = detectedEra ?? eraId;

      if (detectedEra) {
        setEraId(detectedEra);
      }

      if (detectedLandmark) {
        haptic(12);
        setFocusedLandmark(detectedLandmark);
        navigateToLandmark(detectedLandmark, resolvedEra);
      }
    },
    [eraId, navigateToLandmark]
  );

  const triggerShake = useCallback(() => {
    if (!landmarks.length) return;

    const target = landmarks[Math.floor(Math.random() * landmarks.length)];
    if (!target.didYouKnow.length) return;

    const fact = target.didYouKnow[
      Math.floor(Math.random() * target.didYouKnow.length)
    ];

    haptic([10, 40, 10]);
    setShakeFact(`${target.name}: ${fact.a}`);

    if (shakeTimeoutRef.current) {
      window.clearTimeout(shakeTimeoutRef.current);
    }

    shakeTimeoutRef.current = window.setTimeout(() => {
      setShakeFact(null);
    }, 4200);
  }, [landmarks]);

  const toggleHelp = useCallback(() => {
    setShowHelp((current) => !current);
  }, []);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  if (!entered) {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center gap-10"
        style={{ background: era.tintBg, fontFamily: SANS }}
      >
        <h1 className="text-4xl text-white">AR Experience</h1>

        <div className="flex gap-8">
          <div>🗺️ Map</div>
          <div>🕰️ Time</div>
          <div>🎤 Voice</div>
        </div>

        <button
          onClick={() => setEntered(true)}
          className="px-6 py-3 rounded-xl bg-amber-500 font-semibold"
        >
          Enter
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{ background: era.tintBg, color: FG, fontFamily: SANS }}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone-300">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          AR Active
        </div>

        <EraBadge era={era} />

        <button
          onClick={() => navigate("/")}
          className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
        >
          <X size={16} />
        </button>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1.6fr_1fr] gap-6 p-4 overflow-hidden">
        <section className="flex flex-col gap-4 min-h-0">
          <div
            ref={mapRef}
            className="relative flex-1 rounded-2xl overflow-hidden border"
            style={{ borderColor: `${era.accent}33`, background: era.tintPanel }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none grid grid-cols-8 grid-rows-12">
              {Array.from({ length: 96 }).map((_, index) => (
                <div key={index} style={{ border: `1px solid ${era.accent}` }} />
              ))}
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="30%" y1="55%" x2="50%" y2="45%" stroke={era.accent} strokeDasharray="4 4" opacity="0.3" />
              <line x1="50%" y1="45%" x2="70%" y2="50%" stroke={era.accent} strokeDasharray="4 4" opacity="0.3" />
            </svg>

            {landmarks.map((landmark) => (
              <ARMapPin
                key={landmark.id}
                landmark={landmark}
                era={era}
                focused={focusedLandmark === landmark.id}
                onClick={() => handleLandmarkClick(landmark.id)}
              />
            ))}

            <div className="absolute bottom-4 left-4 text-[10px] px-3 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur">
              Piazza del Duomo · {era.label}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <p className="text-xs uppercase tracking-widest text-amber-200/80">Era</p>
              <div className="mt-3">
                <EraScrub value={eraId} onChange={setEraId} accent={era.accent} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
              <p className="text-xs uppercase tracking-widest text-amber-200/80">Focus</p>
              <p className="mt-2 text-lg font-semibold">{activeLandmark.name}</p>
              <p className="text-sm text-stone-300">{activeLandmark.kicker}</p>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <DashboardStat label="Landmarks" value={`${landmarks.length}`} />
            <DashboardStat label="Hidden facts" value={`${totalFacts}`} />
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-xs uppercase tracking-widest text-amber-200/80">Active</p>
            <h2 className="mt-3 text-xl font-semibold">{activeLandmark.name}</h2>
            <p className="text-sm text-stone-300 mt-1">{activeLandmark.kicker}</p>

            <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/10">
              <p className="text-xs uppercase text-stone-400">Insight</p>
              <p className="text-sm mt-2 text-stone-200">
                {activeLandmark.didYouKnow[0]?.a ?? "Tap a landmark to explore."}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-xs uppercase tracking-widest text-amber-200/80">Actions</p>

            <div className="mt-4 space-y-3">
              <VoicePill
                era={era}
                onCommand={handleVoiceCommand}
                hint={
                  <span className="text-sm">
                    Try "<b>{voiceHint}</b>"
                  </span>
                }
              />

              <button
                onClick={toggleHelp}
                className="w-full py-2 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60"
              >
                {showHelp ? "Hide Tips" : "Show Tips"}
              </button>

              <button
                onClick={triggerShake}
                className="w-full py-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400"
              >
                Random Fact
              </button>
            </div>
          </div>

          {showHelp && (
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 text-sm text-stone-300">
              <p className="font-semibold text-white">Voice controls</p>
              <p className="mt-2">Say “Duomo”, “Galleria”, or “Palazzo” to jump to a landmark.</p>
              <p className="mt-2">Say “Medieval”, “Post-war”, or “Present” to move through time.</p>
            </div>
          )}

          {shakeFact && (
            <div className="p-4 rounded-2xl border border-white/10 bg-amber-500/15 text-sm text-amber-100">
              {shakeFact}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
