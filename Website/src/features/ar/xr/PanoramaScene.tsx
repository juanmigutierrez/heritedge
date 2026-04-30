// PanoramaScene — 360° panoramic viewer for 3 historical eras of Piazza Duomo.
// Drag (mouse/touch) to look around. Gyroscope auto-enabled on Android, permission-gated on iOS.
// Tap a landmark hotspot to navigate to /ar-artifact/:id?period=<era>.
//
// Deps (run `pnpm install` after package.json update):
//   three  @react-three/fiber  @react-three/drei  @types/three

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Html } from "@react-three/drei";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Navigation, RotateCcw } from "lucide-react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

type Era = "medieval" | "postwar" | "present";

interface EraConfig {
  id: Era;
  label: string;
  century: string;
  subtitle: string;
  description: string;
  skyProps: {
    sunPosition: [number, number, number];
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
  };
  fogColor: string;
  groundColor: string;
  ambientColor: string;
  ambientIntensity: number;
  accentClass: string;
}

// ─── Era data ─────────────────────────────────────────────────────────────────

const ERAS: EraConfig[] = [
  {
    id: "medieval",
    label: "Medieval",
    century: "14th Century",
    subtitle: "Gothic Spires",
    description: "Construction of the Gothic cathedral spans five centuries",
    skyProps: {
      sunPosition: [0.3, 0.06, -1],
      turbidity: 14,
      rayleigh: 4,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
    },
    fogColor: "#c8874a",
    groundColor: "#6b4c1e",
    ambientColor: "#d49060",
    ambientIntensity: 0.55,
    accentClass: "bg-amber-600",
  },
  {
    id: "postwar",
    label: "1950s",
    century: "Post-War",
    subtitle: "Reconstruction",
    description: "Post-WWII Milan restores and rebuilds the piazza",
    skyProps: {
      sunPosition: [1, 0.25, 0],
      turbidity: 20,
      rayleigh: 0.6,
      mieCoefficient: 0.04,
      mieDirectionalG: 0.7,
    },
    fogColor: "#9a9a9a",
    groundColor: "#5a5a5a",
    ambientColor: "#b0b0b0",
    ambientIntensity: 0.35,
    accentClass: "bg-stone-500",
  },
  {
    id: "present",
    label: "Present",
    century: "2020s",
    subtitle: "Modern Milan",
    description: "Busy cultural hub — tourists, pigeons, and living history",
    skyProps: {
      sunPosition: [1, 0.65, 0],
      turbidity: 4,
      rayleigh: 2,
      mieCoefficient: 0.003,
      mieDirectionalG: 0.88,
    },
    fogColor: "#87b8e6",
    groundColor: "#3a5a2a",
    ambientColor: "#cce8ff",
    ambientIntensity: 0.9,
    accentClass: "bg-blue-500",
  },
];

// Landmark hotspot positions (facing the main square)
const LANDMARKS = [
  { id: "duomo",    name: "Duomo di Milano",  emoji: "⛪", pos: [0, 0.8, -9] as [number, number, number] },
  { id: "galleria", name: "Galleria Vittorio", emoji: "🏛️", pos: [-7, 0.8, -5.6] as [number, number, number] },
  { id: "palazzo",  name: "Palazzo Reale",    emoji: "🏰", pos: [7, 0.8, -5.6] as [number, number, number] },
];

// ─── Camera controllers ───────────────────────────────────────────────────────

// Keeps camera fixed at origin; translates mouse/touch drag and arrow keys
// into smooth, damped yaw/pitch rotation.
function LookAround() {
  const { camera, gl } = useThree();

  // Target rotation (driven by input) and current rotation (eased per frame).
  const target  = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last     = useRef({ x: 0, y: 0 });
  const keys     = useRef<Record<string, boolean>>({});
  const euler    = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  const PITCH_MIN   = -Math.PI / 3.3;   // ~ -54°
  const PITCH_MAX   =  Math.PI / 2.4;   // ~ +75°
  const SENSITIVITY = 0.0035;
  const DAMPING     = 0.18;             // 0 = instant, 1 = never moves
  const KEY_SPEED   = 1.6;              // rad/sec for arrow keys

  useEffect(() => {
    camera.position.set(0, 0, 0);
    (camera as THREE.PerspectiveCamera).fov = 90;
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    el.style.cursor      = "grab";

    const startDrag = (x: number, y: number) => {
      dragging.current = true;
      last.current = { x, y };
      el.style.cursor = "grabbing";
    };

    const updateDrag = (x: number, y: number) => {
      if (!dragging.current) return;
      const dx = x - last.current.x;
      const dy = y - last.current.y;
      target.current.y -= dx * SENSITIVITY;
      target.current.x  = clamp(target.current.x - dy * SENSITIVITY, PITCH_MIN, PITCH_MAX);
      last.current = { x, y };
    };

    const endDrag = () => {
      dragging.current = false;
      el.style.cursor = "grab";
    };

    // ── Mouse ─────────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      startDrag(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => updateDrag(e.clientX, e.clientY);
    const onMouseUp   = () => endDrag();

    // ── Touch ─────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || e.touches.length !== 1) return;
      e.preventDefault();
      updateDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => endDrag();

    // ── Keyboard (window-level so canvas doesn't need focus) ──────────
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const onKeyUp   = (e: KeyboardEvent) => { keys.current[e.key] = false; };

    // Mousedown on canvas; move/up on window so drags continue off-canvas.
    el.addEventListener("mousedown",   onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("blur",      onMouseUp);   // alt-tab safety

    el.addEventListener("touchstart",  onTouchStart, { passive: true });
    el.addEventListener("touchmove",   onTouchMove,  { passive: false });
    el.addEventListener("touchend",    onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);

    return () => {
      el.removeEventListener("mousedown",   onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("blur",      onMouseUp);

      el.removeEventListener("touchstart",  onTouchStart);
      el.removeEventListener("touchmove",   onTouchMove);
      el.removeEventListener("touchend",    onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);

      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, [gl]);

  // Per-frame: keyboard input → target, then ease current toward target.
  useFrame((_, dt) => {
    const k = keys.current;
    const step = KEY_SPEED * dt;
    if (k["ArrowLeft"]  || k["a"] || k["A"]) target.current.y += step;
    if (k["ArrowRight"] || k["d"] || k["D"]) target.current.y -= step;
    if (k["ArrowUp"]    || k["w"] || k["W"]) target.current.x = Math.min(PITCH_MAX, target.current.x + step);
    if (k["ArrowDown"]  || k["s"] || k["S"]) target.current.x = Math.max(PITCH_MIN, target.current.x - step);

    // Frame-rate-independent damping.
    const t = 1 - Math.pow(DAMPING, dt * 60);
    current.current.x += (target.current.x - current.current.x) * t;
    current.current.y += (target.current.y - current.current.y) * t;

    euler.current.set(current.current.x, current.current.y, 0);
    camera.quaternion.setFromEuler(euler.current);
  });

  return null;
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Updates camera quaternion from DeviceOrientation when active.
// Uses the canonical three.js DeviceOrientationControls algorithm with
// quaternion math (no gimbal lock) plus screen-orientation compensation,
// so tilting past horizontal no longer flips the view upside-down.
function GyroTracker({ active }: { active: boolean }) {
  const { camera } = useThree();
  const orient   = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const screenAngle = useRef(0);

  // Pre-allocated, reused each frame.
  const deviceEuler = useRef(new THREE.Euler());
  const deviceQuat  = useRef(new THREE.Quaternion());
  const screenQuat  = useRef(new THREE.Quaternion());
  const Z_AXIS      = useRef(new THREE.Vector3(0, 0, 1));
  // Rotates camera frame (-Z forward) into device frame (+Z out the back of phone):
  //   = quaternion for -PI/2 around X axis
  const FRAME_FIX   = useRef(new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2));

  useEffect(() => {
    if (!active) return;

    const onOrient = (e: DeviceOrientationEvent) => {
      orient.current = {
        alpha: e.alpha ?? 0,   // 0..360, rotation around device Z (compass)
        beta:  e.beta  ?? 0,   // -180..180, front-back tilt
        gamma: e.gamma ?? 0,   // -90..90, left-right tilt
      };
    };

    const readScreenAngle = () => {
      // Modern API first, then iOS fallback
      const a =
        (screen.orientation && screen.orientation.angle) ??
        // @ts-expect-error legacy
        window.orientation ?? 0;
      screenAngle.current = a;
    };

    readScreenAngle();
    window.addEventListener("deviceorientation", onOrient);
    window.addEventListener("orientationchange", readScreenAngle);
    if (screen.orientation) {
      screen.orientation.addEventListener("change", readScreenAngle);
    }

    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("orientationchange", readScreenAngle);
      if (screen.orientation) {
        screen.orientation.removeEventListener("change", readScreenAngle);
      }
    };
  }, [active]);

  useFrame(() => {
    if (!active) return;
    const { alpha, beta, gamma } = orient.current;
    const screenA = screenAngle.current;

    // 1) Build device orientation as a quaternion using ZXY (the device convention).
    deviceEuler.current.set(
      THREE.MathUtils.degToRad(beta),
      THREE.MathUtils.degToRad(alpha),
      THREE.MathUtils.degToRad(-gamma),
      "YXZ",
    );
    deviceQuat.current.setFromEuler(deviceEuler.current);

    // 2) Camera looks down -Z, device "looks" down +Z out the back → fix.
    deviceQuat.current.multiply(FRAME_FIX.current);

    // 3) Compensate for screen orientation (portrait/landscape rotation).
    screenQuat.current.setFromAxisAngle(
      Z_AXIS.current,
      -THREE.MathUtils.degToRad(screenA),
    );
    deviceQuat.current.multiply(screenQuat.current);

    camera.quaternion.copy(deviceQuat.current);
  });

  return null;
}

// ─── Landmark hotspot ─────────────────────────────────────────────────────────

interface HotspotProps {
  id: string;
  name: string;
  emoji: string;
  pos: [number, number, number];
  onTap: (id: string) => void;
}

function Hotspot({ id, name, emoji, pos, onTap }: HotspotProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  // Gentle float animation
  useFrame(({ clock }) => {
    groupRef.current.position.y = pos[1] + Math.sin(clock.elapsedTime * 1.5 + pos[0]) * 0.12;
  });

  return (
    <group ref={groupRef} position={pos}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onTap(id); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.15 : 1}
      >
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#3b82f6" : "#f5f0e8"}
          emissive={hovered ? "#1d4ed8" : "#888888"}
          emissiveIntensity={0.35}
          transparent
          opacity={0.88}
        />
      </mesh>
      <Html center distanceFactor={12}>
        <div
          className="pointer-events-none select-none text-center"
          style={{ marginTop: "-52px" }}
        >
          <div className="text-2xl leading-none">{emoji}</div>
          <div className="text-white text-[11px] bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-full whitespace-nowrap mt-1 shadow">
            {name}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── 3-D scene ────────────────────────────────────────────────────────────────

interface SceneProps {
  era: Era;
  gyro: boolean;
  onTap: (id: string) => void;
}

function Scene({ era, gyro, onTap }: SceneProps) {
  const cfg = ERAS.find(e => e.id === era)!;
  return (
    <>
      <Sky {...cfg.skyProps} />
      <ambientLight color={cfg.ambientColor} intensity={cfg.ambientIntensity} />
      <directionalLight position={cfg.skyProps.sunPosition} intensity={0.9} castShadow={false} />
      <fog attach="fog" args={[cfg.fogColor, 10, 60]} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color={cfg.groundColor} />
      </mesh>

      {LANDMARKS.map(lm => (
        <Hotspot key={lm.id} {...lm} onTap={onTap} />
      ))}

      <LookAround />
      <GyroTracker active={gyro} />
    </>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

type IOSDeviceOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

export function PanoramaScene() {
  const navigate = useNavigate();
  const [era,     setEra]     = useState<Era>("present");
  const [gyro,    setGyro]    = useState(false);
  const [canGyro, setCanGyro] = useState(false);
  const [fading,  setFading]  = useState(false);
  const cfg = ERAS.find(e => e.id === era)!;

  // Detect gyroscope; auto-enable on Android (no permission gate)
  useEffect(() => {
    if (!("DeviceOrientationEvent" in window)) return;
    setCanGyro(true);
    const reqPerm = (DeviceOrientationEvent as IOSDeviceOrientation).requestPermission;
    if (typeof reqPerm !== "function") setGyro(true);
  }, []);

  const switchEra = (next: Era) => {
    if (next === era || fading) return;
    setFading(true);
    setTimeout(() => { setEra(next); setFading(false); }, 350);
  };

  const requestGyro = async () => {
    const reqPerm = (DeviceOrientationEvent as IOSDeviceOrientation).requestPermission;
    if (typeof reqPerm === "function") {
      const perm = await reqPerm();
      if (perm === "granted") setGyro(true);
    } else {
      setGyro(g => !g);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black touch-none select-none">

      {/* ── 3-D canvas ────────────────────────────────────────────────────── */}
      <Canvas camera={{ fov: 90, position: [0, 0, 0.001] }} style={{ background: "#000" }}>
        <Suspense fallback={null}>
          <Scene
            era={era}
            gyro={gyro}
            onTap={id => navigate(`/ar-artifact/${id}?period=${era}`)}
          />
        </Suspense>
      </Canvas>

      {/* ── Era-switch fade overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {fading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── Top HUD ───────────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 px-5 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>

          <motion.div
            key={era}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-center"
          >
            <p className="text-white text-sm font-medium">{cfg.label}</p>
            <p className="text-white/65 text-[11px]">{cfg.century}</p>
          </motion.div>

          {canGyro ? (
            <button
              onClick={requestGyro}
              title={gyro ? "Gyro on" : "Enable gyroscope"}
              className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-all ${
                gyro ? "bg-blue-500/75" : "bg-black/50"
              }`}
            >
              <Navigation className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <motion.p
          key={era + "-desc"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-white/75 text-xs"
        >
          {cfg.description}
        </motion.p>
      </div>

      {/* ── Drag hint (auto-fades after 3 s) ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 1.2 }}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <div className="bg-black/45 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-white" />
          <span className="text-white text-sm">Drag to explore</span>
        </div>
      </motion.div>

      {/* ── Bottom era switcher ────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 px-5 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent z-10">

        {/* Era pills */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {ERAS.map(e => (
            <button
              key={e.id}
              onClick={() => switchEra(e.id)}
              className={`px-4 py-2 rounded-2xl flex flex-col items-center transition-all active:scale-95 ${
                era === e.id
                  ? `${e.accentClass} text-white shadow-lg`
                  : "bg-white/15 backdrop-blur-sm text-white/80"
              }`}
            >
              <span className="text-xs font-medium">{e.label}</span>
              <span className="text-[10px] opacity-70">{e.subtitle}</span>
            </button>
          ))}
        </div>

        {/* Quick toggle: present ↔ medieval */}
        <div className="flex justify-center">
          <button
            onClick={() => switchEra(era === "present" ? "medieval" : "present")}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2.5 rounded-full text-white text-sm active:scale-95 transition-transform"
          >
            <Clock className="w-4 h-4" />
            <span>Switch to {era === "present" ? "Medieval" : "Present"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
