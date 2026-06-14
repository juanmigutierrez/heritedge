// PanoramaScene — 360° panoramic viewer for 3 historical eras of Piazza Duomo.
// Drag (mouse/touch) to look around. Gyroscope auto-enabled on Android, permission-gated on iOS.
// Tap a landmark hotspot to navigate to /ar-artifact/:id?period=<era>.
//
// Deps (run `pnpm install` after package.json update):
//   three  @react-three/fiber  @react-three/drei  @types/three

import { useRef, useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Html } from "@react-three/drei";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Compass, Camera, CameraOff, ImageDown, Info } from "lucide-react";
import * as THREE from "three";

import { ERAS, getEra, listLandmarks, type EraId, type LandmarkId } from "@/content/landmarks";
import {
  EraScrub, FG, MONO, SERIF, VoicePill,
  parseVoiceIntent, describeIntent, VoiceConfirmToast, VoiceAlreadyHereToast,
  ARIntroOverlay,
  type VoiceIntent,
} from "@/app/components/ar/shared";
import { CenteringArrow } from "@/app/components/ar/CenteringArrow";
import { captureARSnapshot, shareOrDownloadSnapshot, type SnapshotMeta, type SnapshotLandmark } from "@/services/captureARSnapshot";
import { landmarkVT } from "@/app/components/ar/viewTransition";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";
import { useCameraStream } from "./useCameraStream";

// ─── Per-era render config (sky / fog / ground) ───────────────────────────────
// Age metadata (label, year, accent color) lives in content/landmarks.ts so
// every screen shares one source of truth. Render-only details that only the
// 3D scene needs stay here, keyed by EraId.

interface EraRender {
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
}

// CSS filters applied to the live camera feed — re-tints reality so picking a
// past era *feels* like time travel even though the camera always shows present
// day. Kept small so the scene stays recognizable; tune to taste per era.
const ERA_CAMERA_FILTER: Record<EraId, string> = {
  // Birth — warm terracotta/amber; the world looks sunbaked and ancient
  birth:
    "sepia(0.50) saturate(0.88) brightness(0.91) contrast(1.06)",
  // Crown — richer golden warmth; slightly more saturated than Birth
  crown:
    "sepia(0.30) hue-rotate(10deg) saturate(1.08) brightness(0.95) contrast(1.04)",
  // Modern — cool blue-grey tint; present day feels crisp and neutral
  modern:
    "saturate(0.94) brightness(1.01) contrast(1.02)",
};

const ERA_RENDER: Record<EraId, EraRender> = {
  birth: {
    description: "Gothic marble rises stone by stone — a cathedral built across five centuries",
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
  },
  crown: {
    description: "Sforza dukes, Spanish governors, Napoleon — power writes itself into stone",
    skyProps: {
      sunPosition: [0.8, 0.18, -0.5],
      turbidity: 10,
      rayleigh: 3,
      mieCoefficient: 0.008,
      mieDirectionalG: 0.78,
    },
    fogColor: "#b8924a",
    groundColor: "#5a4020",
    ambientColor: "#e0a860",
    ambientIntensity: 0.65,
  },
  modern: {
    description: "Fashion weeks, liberation crowds, and 15 million visitors a year",
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
  },
};

// Landmark hotspot positions (facing the main square).
// Names come from content/landmarks.ts (canonical) — keep `name`/`shortName`
// in sync with that source. Only positions and emoji glyphs are scene-local.
// Order matches the geographic layout (left-to-right as the user faces the
// piazza), so chips and sheet rows read intuitively: Galleria · Duomo · Palazzo.
const LANDMARKS: Array<{
  id: LandmarkId;
  name: string;
  shortName: string;
  emoji: string;
  pos: [number, number, number];
}> = [
  { id: "galleria", name: "Galleria Vittorio Emanuele II",   shortName: "Galleria", emoji: "🏛️", pos: [-7, 0.8, -5.6] },
  { id: "duomo",    name: "Duomo di Milano",                 shortName: "Duomo",    emoji: "⛪",  pos: [0, 0.8, -9] },
  { id: "palazzo",  name: "Palazzo Reale",                   shortName: "Palazzo",  emoji: "🏰",  pos: [7, 0.8, -5.6] },
];

// Yaw (radians) the camera should look at to face each landmark from origin.
// World axis convention: yaw 0 looks down -Z, positive yaw turns left (toward +X
// in our LookAround math: we *subtract* dx*sens). Compute from the landmark's
// (x, z) so it stays correct if positions move.
const landmarkYaw = (pos: [number, number, number]) => Math.atan2(-pos[0], -pos[2]);

// sessionStorage keys — preserve user state across navigation within a tab
// session (panorama → detail → back) so the experience feels continuous.
const GYRO_STORAGE_KEY  = "heritedge:gyro";
const VIEW_STORAGE_KEY  = "heritedge:view";  // last camera yaw/pitch as JSON
const ERA_STORAGE_KEY   = "heritedge:era";   // last selected era id
const INTRO_STORAGE_KEY = "heritedge:ar-intro"; // "seen" once the welcome is dismissed

const isEraId = (v: string | null): v is EraId =>
  v === "birth" || v === "crown" || v === "modern";


// ─── Camera controllers ───────────────────────────────────────────────────────

// Imperative handle the page can use to nudge the look target (e.g. snap to a
// landmark). Lives outside the component so refs can be passed in via props.
export interface LookHandle {
  /** Set the target yaw (and optional pitch). Easing in LookAround animates the rest. */
  lookAt: (yaw: number, pitch?: number) => void;
  /** Whether the user has interacted at least once (drag / key / programmatic). */
  hasInteracted: () => boolean;
  /** Current displayed yaw/pitch (in radians). For persisting across navigation. */
  getView: () => { yaw: number; pitch: number };
}

interface LookAroundProps {
  /** Imperative handle — call lookAt() to snap-to-landmark from outside. */
  handleRef?: React.MutableRefObject<LookHandle | null>;
  /** Fired the first time the user drags / presses arrows / snaps. */
  onFirstInteract?: () => void;
  /** Initial yaw/pitch (radians) — used to restore the panorama view after
   *  navigating to a detail page and back. Defaults to (0, 0) = looking at
   *  the central Duomo hotspot. */
  initialView?: { yaw: number; pitch: number };
}

// Keeps camera fixed at origin; translates mouse/touch drag and arrow keys
// into smooth, damped yaw/pitch rotation.
function LookAround({ handleRef, onFirstInteract, initialView }: LookAroundProps) {
  const { camera, gl } = useThree();

  // Initial framing: pitch=0 + yaw=0 looks straight at the central Duomo
  // hotspot, which is what the "Look at Duomo" snap button does. The earlier
  // attempt to bias pitch upward used the wrong sign (positive X in YXZ-Euler
  // convention here pitches the camera *down*, not up) and ended up pointing
  // at the ground.
  // initialView lets the page restore the user's last view after navigating
  // back from the detail page.
  const initX = initialView?.pitch ?? 0;
  const initY = initialView?.yaw ?? 0;
  const target  = useRef({ x: initX, y: initY });
  const current = useRef({ x: initX, y: initY });
  const dragging = useRef(false);
  const last     = useRef({ x: 0, y: 0 });
  const keys     = useRef<Record<string, boolean>>({});
  const euler    = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const interacted = useRef(false);

  // Active "transport-me-there" tween — used by lookAt(). We need a separate
  // path from the per-frame drag damping so we can pick a longer duration and
  // a stronger ease curve, giving the snap a sense of travel rather than snap.
  const tween = useRef<{
    fromX: number; fromY: number;
    toX: number;   toY: number;
    start: number; duration: number;
  } | null>(null);
  const SNAP_DURATION_MS = 1200;

  const markInteracted = () => {
    if (interacted.current) return;
    interacted.current = true;
    onFirstInteract?.();
  };

  const PITCH_MIN   = -Math.PI / 3.3;   // ~ -54°
  const PITCH_MAX   =  Math.PI / 2.4;   // ~ +75°
  const SENSITIVITY = 0.0035;
  const DAMPING     = 0.18;             // 0 = instant, 1 = never moves
  const KEY_SPEED   = 1.6;              // rad/sec for arrow keys

  useEffect(() => {
    camera.position.set(0, 0, 0);
    (camera as THREE.PerspectiveCamera).fov = 90;
    camera.updateProjectionMatrix();
    // Apply the initial orientation synchronously. Without this, the first
    // rendered frame uses whatever R3F's default lookAt() gave us — which,
    // because the configured position [0,0,0.001] is essentially *at* the
    // origin and looks at it, produces an unstable downward tilt that lands
    // the user staring at the green ground plane.
    euler.current.set(current.current.x, current.current.y, 0);
    camera.quaternion.setFromEuler(euler.current);
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    el.style.cursor      = "grab";

    const startDrag = (x: number, y: number) => {
      dragging.current = true;
      last.current = { x, y };
      el.style.cursor = "grabbing";
      markInteracted();
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
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      // Only the keys we actually use count as interaction.
      if (
        e.key === "ArrowLeft" || e.key === "ArrowRight" ||
        e.key === "ArrowUp"   || e.key === "ArrowDown"  ||
        e.key === "w" || e.key === "W" ||
        e.key === "a" || e.key === "A" ||
        e.key === "s" || e.key === "S" ||
        e.key === "d" || e.key === "D"
      ) markInteracted();
    };
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
    // markInteracted is stable for the lifetime of the component (refs only).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  // Imperative handle for the page (snap-to-landmark, etc.).
  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      lookAt: (yaw, pitch) => {
        // Pick the equivalent yaw closest to the *current view* so the
        // shortest arc is taken (avoids spinning the long way round).
        const TWO_PI = Math.PI * 2;
        const cur = current.current.y;
        const delta = ((yaw - cur + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
        const toY = cur + delta;
        const toX = typeof pitch === "number"
          ? clamp(pitch, PITCH_MIN, PITCH_MAX)
          : current.current.x;

        tween.current = {
          fromX: current.current.x,
          fromY: current.current.y,
          toX, toY,
          start: performance.now(),
          duration: SNAP_DURATION_MS,
        };
        // Park the drag target on the destination so when the tween hands
        // off to the damping loop, nothing yanks the camera back.
        target.current.x = toX;
        target.current.y = toY;
        markInteracted();
      },
      hasInteracted: () => interacted.current,
      getView: () => ({ yaw: current.current.y, pitch: current.current.x }),
    };
    return () => { if (handleRef) handleRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-frame: keyboard input → target, then ease current toward target.
  useFrame((_, dt) => {
    // If a snap tween is running it takes over current.* directly. Active drag
    // cancels it so the user always wins.
    if (tween.current) {
      if (dragging.current) {
        // Park target at the current view, otherwise the damping loop eases
        // toward the snap destination after we exit and the snap visibly
        // "finalizes" before the drag takes over.
        target.current.x = current.current.x;
        target.current.y = current.current.y;
        tween.current = null;
      } else {
        const tw = tween.current;
        const t = Math.min(1, (performance.now() - tw.start) / tw.duration);
        // easeInOutCubic — accelerates and decelerates symmetrically, which
        // reads as "travel" rather than the linear glide of a slider.
        const eased = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
        current.current.x = tw.fromX + (tw.toX - tw.fromX) * eased;
        current.current.y = tw.fromY + (tw.toY - tw.fromY) * eased;
        if (t >= 1) tween.current = null;
        euler.current.set(current.current.x, current.current.y, 0);
        camera.quaternion.setFromEuler(euler.current);
        return;
      }
    }

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
  /** Full name (kept for accessibility and parity with content/landmarks.ts). */
  name: string;
  /** Short display label for the floating in-scene chip; SERIF italic looks
   *  cramped at this distance-rescaled size, so we keep this short and SANS. */
  shortName: string;
  emoji: string;
  pos: [number, number, number];
  onTap: (id: string) => void;
}

function Hotspot({ id, name, shortName, emoji, pos, onTap }: HotspotProps) {
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
        <sphereGeometry args={[0.7, 24, 24]} />
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
          style={{ marginTop: "-78px" }}
        >
          <div className="text-2xl leading-none">{emoji}</div>
          <div className="text-white text-[11px] bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-full whitespace-nowrap mt-1 shadow">
            {shortName}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── 3-D scene ────────────────────────────────────────────────────────────────

interface SceneProps {
  era: EraId;
  gyro: boolean;
  /** When true, hide the synthetic sky/ground/fog so the live camera feed
   *  shows through the transparent canvas behind the landmark hotspots. */
  cameraMode: boolean;
  lookHandleRef: React.MutableRefObject<LookHandle | null>;
  onFirstInteract: () => void;
  /** Optional yaw/pitch to start at — restored after navigating back. */
  initialView?: { yaw: number; pitch: number };
  onTap: (id: string) => void;
}

function Scene({ era, gyro, cameraMode, lookHandleRef, onFirstInteract, initialView, onTap }: SceneProps) {
  const cfg = ERA_RENDER[era];
  return (
    <>
      {/* Synthetic backdrop — only when not passing through the real camera. */}
      {!cameraMode && (
        <>
          <Sky {...cfg.skyProps} />
          <fog attach="fog" args={[cfg.fogColor, 10, 60]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <circleGeometry args={[60, 64]} />
            <meshStandardMaterial color={cfg.groundColor} />
          </mesh>
        </>
      )}

      {/* Lights stay on in both modes — landmark spheres need to be lit. */}
      <ambientLight color={cfg.ambientColor} intensity={cfg.ambientIntensity} />
      <directionalLight position={cfg.skyProps.sunPosition} intensity={0.9} castShadow={false} />

      {LANDMARKS.map(lm => (
        <Hotspot key={lm.id} {...lm} onTap={onTap} />
      ))}

      <LookAround
        handleRef={lookHandleRef}
        onFirstInteract={onFirstInteract}
        initialView={initialView}
      />
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
  const [searchParams] = useSearchParams();
  const focusLandmarkId = searchParams.get("landmark");

  // Restore the last era the user picked this session so back-navigating
  // from a detail page doesn't reset to "present".
  const [era,     setEra]     = useState<EraId>(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return "modern";
    const raw = window.sessionStorage.getItem(ERA_STORAGE_KEY);
    return isEraId(raw) ? raw : "modern";
  });
  const [gyro,    setGyro]    = useState(false);
  const [canGyro, setCanGyro] = useState(false);
  const [fading,  setFading]  = useState(false);

  const era_ = getEra(era)!;            // shared age metadata (label/year/accent)
  const cfg  = ERA_RENDER[era];          // 3D-only render config

  const lookHandleRef = useRef<LookHandle | null>(null);

  // Restore the last camera orientation on mount so navigating back from a
  // detail view drops the user where they were, not at the default Duomo
  // pose. Read once (useState initializer) so re-renders don't re-read.
  // When entering from the Home landmark cards, face that specific landmark
  // instead of the saved orientation.
  const [initialView] = useState<{ yaw: number; pitch: number } | undefined>(() => {
    if (focusLandmarkId) {
      const lm = LANDMARKS.find(l => l.id === focusLandmarkId);
      if (lm) return { yaw: landmarkYaw(lm.pos), pitch: 0 };
    }
    if (typeof window === "undefined" || !window.sessionStorage) return undefined;
    const raw = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.yaw === "number" && typeof parsed?.pitch === "number") {
        return { yaw: parsed.yaw, pitch: parsed.pitch };
      }
    } catch { /* corrupt entry — ignore */ }
    return undefined;
  });

  const persistView = useCallback(() => {
    const view = lookHandleRef.current?.getView();
    if (!view || typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
  }, []);

  // Save the view on every unmount path (back button, sphere tap, browser
  // navigation, etc.) so the next mount can restore it.
  useEffect(() => {
    return () => persistView();
  }, [persistView]);

  // Camera-passthrough AR — opt-in enhancement layered behind the 3D overlays.
  // When unavailable / denied, the panorama backdrop stays as the visual fallback.
  const [cameraMode, setCameraMode] = useState(false);
  const camera = useCameraStream(cameraMode);
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Capability intro — shown once per tab session on first AR entry, then
  // reopenable via the (i) button. Explains which interaction mode the device
  // supports and how to reach the fuller one.
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== "seen";
  });
  const closeIntro = useCallback(() => {
    setShowIntro(false);
    window.sessionStorage?.setItem(INTRO_STORAGE_KEY, "seen");
  }, []);

  const handleCapture = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturing) return;
    setCapturing(true);
    try {
      // Project each landmark's 3D position to normalised screen coords using
      // the same YXZ-Euler convention LookAround applies every frame.
      const view = lookHandleRef.current?.getView() ?? { yaw: 0, pitch: 0 };
      // Canvas fov:90 is vertical FOV in Three.js. Derive horizontal from aspect.
      const aspect = window.innerWidth / window.innerHeight;
      const FOV_V = Math.PI / 2; // 90° vertical — matches fov:90 on the Canvas
      const FOV_H = 2 * Math.atan(Math.tan(FOV_V / 2) * aspect);

      const visibleLandmarks: SnapshotLandmark[] = LANDMARKS.flatMap(lm => {
        const [lx, ly, lz] = lm.pos;
        // Inverse of Euler(pitch, yaw, 0, 'YXZ') — same order Three.js uses.
        // Step 1: inverse yaw — rotate around world Y by -yaw
        const cosY = Math.cos(-view.yaw), sinY = Math.sin(-view.yaw);
        const cx =  lx * cosY + lz * sinY;
        const cy =  ly;
        const cz = -lx * sinY + lz * cosY;
        // Step 2: inverse pitch — rotate around local X by -pitch
        const cosP = Math.cos(-view.pitch), sinP = Math.sin(-view.pitch);
        const cy2 = cy * cosP - cz * sinP;
        const cz2 = cy * sinP + cz * cosP;
        // Three.js camera forward is -Z; cz2 >= 0 means behind the camera
        if (cz2 >= 0) return [];
        const screenX = 0.5 + (cx  / -cz2) / (2 * Math.tan(FOV_H / 2));
        const screenY = 0.5 - (cy2 / -cz2) / (2 * Math.tan(FOV_V / 2));
        if (screenX < 0.05 || screenX > 0.95 || screenY < 0.1 || screenY > 0.9) return [];
        return [{ emoji: lm.emoji, shortName: lm.shortName, screenX, screenY }];
      });

      const meta: SnapshotMeta = {
        eraLabel:       era_.label,
        eraYear:        era_.year,
        eraAccent:      era_.accent,
        eraDescription: ERA_RENDER[era].description,
        landmarks:      visibleLandmarks,
      };
      const blobUrl = await captureARSnapshot(video, canvas, era, meta);
      if (blobUrl) await shareOrDownloadSnapshot(blobUrl, era);
    } finally {
      setTimeout(() => setCapturing(false), 400);
    }
  }, [era, era_, capturing]);

  // Detect support upfront so the toggle doesn't appear on browsers that
  // can't grant camera access (insecure context, very old browsers).
  const cameraSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  // Bind / release the video element when the stream changes.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = camera.stream;
    if (camera.stream) {
      v.play().catch(() => { /* autoplay blocked is fine — user gesture got us here */ });
    }
  }, [camera.stream]);

  // If a stream request is denied or errors, fall back to panorama view.
  useEffect(() => {
    if (camera.status === "denied" || camera.status === "unsupported" || camera.status === "error") {
      setCameraMode(false);
    }
  }, [camera.status]);

  const toggleCamera = () => setCameraMode(c => !c);

  // Detect gyroscope and restore the user's previous toggle for this tab
  // session. Note we do NOT auto-enable on first visit — the original logic
  // assumed "no requestPermission API ⇒ Android, safe to auto-enable", but
  // desktop Chrome also has DeviceOrientationEvent without requestPermission
  // and was getting incorrectly turned on. Always require an explicit tap.
  useEffect(() => {
    if (!("DeviceOrientationEvent" in window)) return;
    setCanGyro(true);
    const remembered = typeof window !== "undefined" && window.sessionStorage?.getItem(GYRO_STORAGE_KEY) === "on";
    if (remembered) {
      // The user previously enabled gyro this session (e.g. on the panorama,
      // then navigated to detail and back). Re-attach the listener silently;
      // iOS keeps OS-level permission alive for the page lifetime.
      setGyro(true);
    }
  }, []);

  // Persist the user's gyro preference for the rest of the tab session.
  useEffect(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    if (gyro) window.sessionStorage.setItem(GYRO_STORAGE_KEY, "on");
    else window.sessionStorage.removeItem(GYRO_STORAGE_KEY);
  }, [gyro]);

  // Persist the selected era so detail views (and a back-navigation here)
  // start at the same point in time the user last picked.
  useEffect(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(ERA_STORAGE_KEY, era);
  }, [era]);

  const switchEra = useCallback((next: EraId) => {
    if (next === era || fading) return;
    setFading(true);
    setTimeout(() => { setEra(next); setFading(false); }, 350);
  }, [era, fading]);

  const requestGyro = async () => {
    const reqPerm = (DeviceOrientationEvent as IOSDeviceOrientation).requestPermission;
    if (typeof reqPerm === "function") {
      const perm = await reqPerm();
      if (perm === "granted") setGyro(true);
    } else {
      setGyro(g => !g);
    }
  };

  const handleSnapToLandmark = (pos: [number, number, number]) => {
    lookHandleRef.current?.lookAt(landmarkYaw(pos), 0);
  };

  // Show snap-to-landmark chips only when there's no gyro experience: redirecting
  // the view manually on a gyro-tracked phone breaks the immersive orientation feel.
  const showLandmarkChips = !canGyro || !gyro;

  // Landmarks shortcut sheet — same affordance as ARArtifactDetail's bottom
  // hex button; lets the user jump straight into a landmark detail without
  // hunting for the sphere.
  const [landmarksOpen, setLandmarksOpen] = useState(false);
  const allLandmarks = useMemo(() => listLandmarks(), []);

  const goToLandmarkDetail = useCallback((id: LandmarkId) => {
    setLandmarksOpen(false);
    persistView();
    navigate(`/ar-artifact/${id}?period=${era}`, { viewTransition: true });
  }, [navigate, era, persistView]);

  // Voice — intent parsing with confirmation toast before acting.
  const [pendingIntent, setPendingIntent] = useState<(VoiceIntent & { label: string }) | null>(null);
  const [alreadyHereLabel, setAlreadyHereLabel] = useState<string | null>(null);
  const [notUnderstood, setNotUnderstood] = useState(false);

  const commitIntent = useCallback((intent: VoiceIntent) => {
    setPendingIntent(null);
    if (intent.landmark) {
      const targetEra = intent.era ?? era;
      if (intent.era) window.sessionStorage?.setItem(ERA_STORAGE_KEY, intent.era);
      persistView();
      navigate(`/ar-artifact/${intent.landmark}?period=${targetEra}`, { viewTransition: true });
    } else if (intent.era) {
      switchEra(intent.era);
    }
  }, [era, switchEra, persistView, navigate]);

  const handleVoiceCommand = useCallback((transcript: string) => {
    const intent = parseVoiceIntent(transcript);

    if (intent.overview) return; // already on the map — nothing to do.

    if (intent.landmark || intent.era) {
      if (intent.landmark) {
        setPendingIntent({ ...intent, label: describeIntent(intent) });
        return;
      }
      // Era-only — already on this era or switching.
      if (intent.era) {
        if (intent.era === era) {
          setAlreadyHereLabel(describeIntent({ landmark: null, era: intent.era }));
        } else {
          setPendingIntent({ ...intent, label: describeIntent({ landmark: null, era: intent.era }) });
        }
      }
      return;
    }

    // Nothing recognised — fall back to RAG.
    setNotUnderstood(true);
    stopSpeaking();
    sendMessage(transcript, "duomo")
      .then((res) => {
        const reply = res.answer || res.reply;
        if (reply) speak(reply);
      })
      .catch(() => { /* silent — voice nav alone is acceptable */ });
  }, [era, switchEra, commitIntent]);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-black touch-none select-none">

      {/* ── Live camera feed (behind the 3-D canvas) ──────────────────────── */}
      {cameraMode && camera.status === "live" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            filter: ERA_CAMERA_FILTER[era],
            transition: "filter 0.7s cubic-bezier(0.4, 0.1, 0.2, 1)",
          }}
        />
      )}

      {/* ── 3-D canvas ────────────────────────────────────────────────────── */}
      <Canvas
        camera={{ fov: 90, position: [0, 0, 0.001] }}
        style={{ background: cameraMode && camera.status === "live" ? "transparent" : "#000" }}
        gl={{ alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        className="relative z-10"
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
          });
        }}
      >
        <Suspense fallback={null}>
          <Scene
            era={era}
            gyro={gyro}
            cameraMode={cameraMode && camera.status === "live"}
            lookHandleRef={lookHandleRef}
            initialView={initialView}
            onFirstInteract={() => { /* reserved for future first-interact UX */ }}
            onTap={id => {
              // R3F's event system dispatches outside React's normal commit
              // flow, so the manual startViewTransition() + flushSync() path
              // races with R3F's batching and the VT snapshot misses the
              // chip before the new view mounts. React Router 7's built-in
              // viewTransition option integrates with the router's commit
              // lifecycle and handles this case correctly.
              persistView();
              navigate(`/ar-artifact/${id}?period=${era}`, { viewTransition: true });
            }}
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

      {/* ── Capture flash ────────────────────────────────────────────────────
           Brief white flash gives tactile feedback that a snapshot was taken,
           same convention as native camera apps. */}
      <AnimatePresence>
        {capturing && (
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 bg-white z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── Top HUD ──────────────────────────────────────────────────────────
          Layout:
            Row 1 (controls bar): X on left · controls on right.
            Row 2 (scene header, centered): era chip, then description.
          The header uses the same MONO + SERIF tokens as ARArtifactDetail
          so the type voice is consistent across screens. */}
      <div className="absolute top-0 inset-x-0 px-5 pt-12 pb-5 bg-gradient-to-b from-black/70 to-transparent z-10">
        {/* Row 1 — controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              aria-label="Back to home"
              title="Back to home"
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowIntro(true)}
              aria-label="How to explore"
              title="How to explore"
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Snapshot — leftmost, only when camera feed is live. */}
            {cameraMode && camera.status === "live" && (
              <button
                onClick={handleCapture}
                disabled={capturing}
                title="Save memory"
                aria-label="Save memory photo"
                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all ${
                  capturing ? "bg-white/30 scale-95" : "bg-black/50 active:scale-95"
                }`}
              >
                <ImageDown className="w-4 h-4" />
              </button>
            )}

            {/* Camera-passthrough toggle */}
            {cameraSupported && (
              <button
                onClick={toggleCamera}
                title={cameraMode ? "Turn camera off" : "Turn camera on"}
                aria-pressed={cameraMode}
                disabled={camera.status === "requesting"}
                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-all ${
                  cameraMode && camera.status === "live"
                    ? "bg-red-500/80"
                    : "bg-black/50"
                } ${camera.status === "requesting" ? "opacity-60" : ""}`}
              >
                {cameraMode && camera.status === "live"
                  ? <Camera className="w-4 h-4" />
                  : <CameraOff className="w-4 h-4" />}
              </button>
            )}

            {canGyro ? (
              <button
                onClick={requestGyro}
                title={gyro ? "Gyro on" : "Enable gyroscope"}
                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-all ${
                  gyro ? "bg-blue-500/75" : "bg-black/50"
                }`}
              >
                <Compass className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10" />
            )}

            <CenteringArrow onPress={() => lookHandleRef.current?.lookAt(0, 0)} />
          </div>
        </div>

        {/* Row 2 — centered scene header */}
        <div className="mt-4 flex flex-col items-center text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: `1px solid ${era_.accent}55`,
              color: era_.accent,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              textShadow: "0 1px 4px rgba(0,0,0,0.85)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: era_.accent, boxShadow: `0 0 6px ${era_.accent}` }}
            />
            {era_.label} · <span style={{ textTransform: "none" }}>{era_.year}</span>
          </div>

          <motion.p
            key={era + "-desc"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 max-w-md text-white/90 italic"
            style={{
              fontFamily: SERIF,
              fontSize: 16,
              lineHeight: 1.35,
              textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.55)",
            }}
          >
            {cfg.description}
          </motion.p>
        </div>
      </div>

      {/* ── Bottom controls ────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 inset-x-0 px-5 pt-6 bg-gradient-to-t from-black/80 to-transparent z-10"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}
      >

        {/* Snap-to-landmark chips — no-gyro fallback only.
            On a phone with gyro, manual yaw snaps would break the
            "looking-around-physically" feel of the immersive experience. */}
        {showLandmarkChips && (
          <div className="flex items-center justify-center gap-2 mb-3">
            {LANDMARKS.map(lm => (
              <button
                key={lm.id}
                onClick={() => handleSnapToLandmark(lm.pos)}
                className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/95 flex items-center gap-1.5 active:scale-95 transition-transform"
                aria-label={`Look at ${lm.name}`}
                data-vt-name={!landmarksOpen ? landmarkVT(lm.id) : undefined}
                style={{
                  fontFamily: SERIF, fontStyle: "italic", fontSize: 16,
                  // Shared-element source: when a follow-up sphere tap fires
                  // a navigation, this chip morphs into the detail image.
                  // Suppressed while the landmarks sheet is open so the sheet
                  // rows can claim the same names without duplicates.
                  ...(landmarksOpen ? {} : { viewTransitionName: landmarkVT(lm.id) }),
                } as React.CSSProperties}
              >
                <span className="text-sm leading-none not-italic">{lm.emoji}</span>
                <span>{lm.shortName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Era slider — the single age-navigation control used app-wide
            (also in ARArtifactDetail). Stays in sync via content/landmarks.ts. */}
        <div className="mx-auto w-full max-w-md px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10">
          <EraScrub value={era} onChange={switchEra} accent={era_.accent} />
        </div>

        {/* Bottom action row — landmarks · voice. */}
        <div className="mx-auto w-full max-w-md mt-3 flex items-center gap-2">
          <button
            onClick={() => setLandmarksOpen(true)}
            title="Landmarks"
            aria-label="Open landmarks"
            style={{
              width: 46, height: 46, borderRadius: 23,
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              color: FG, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              position: "relative", flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L13.5 4.5V11.5L8 14.5L2.5 11.5V4.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </button>

          <VoicePill
            era={era_}
            onCommand={handleVoiceCommand}
          />
        </div>
      </div>

      {/* ── Landmarks sheet ─────────────────────────────────────────────────
          Same affordance as ARArtifactDetail; tapping a landmark navigates
          straight into its detail view. */}
      {/* ── Already-here toast ──────────────────────────────────────────────── */}
      {notUnderstood && (() => {
        const otherEra = (["birth", "crown", "modern"] as EraId[]).find(p => p !== era);
        const msg = `Try "show me Galleria" or "switch to ${otherEra}"`;
        return <VoiceAlreadyHereToast message={msg} accent={era_.accent} prefix="" onDismiss={() => setNotUnderstood(false)} />;
      })()}
      {alreadyHereLabel && (
        <VoiceAlreadyHereToast
          message={alreadyHereLabel}
          accent={era_.accent}
          onDismiss={() => setAlreadyHereLabel(null)}
        />
      )}

      {/* ── Voice confirmation toast ────────────────────────────────────────── */}
      {pendingIntent && (
        <VoiceConfirmToast
          message={pendingIntent.label}
          accent={era_.accent}
          prefix={pendingIntent.landmark ? "Taking you to" : "Switching to"}
          onCommit={() => commitIntent(pendingIntent)}
          onDismiss={() => setPendingIntent(null)}
        />
      )}

      {/* ── Capability intro (first entry / reopened via the ⓘ button) ───────── */}
      {showIntro && (
        <ARIntroOverlay
          accent={era_.accent}
          tintPanel={era_.tintPanel}
          canGyro={canGyro}
          gyroOn={gyro}
          cameraSupported={cameraSupported}
          cameraOn={cameraMode && camera.status === "live"}
          onEnableMotion={requestGyro}
          onToggleCamera={toggleCamera}
          onClose={closeIntro}
        />
      )}

      {landmarksOpen && (
        <div
          className="absolute inset-0 z-40 flex items-end"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setLandmarksOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", color: FG,
              background: era_.tintPanel,
              borderTopLeftRadius: 18, borderTopRightRadius: 18,
              padding: "14px 16px 22px", maxHeight: "60%", overflowY: "auto",
              border: `1px solid ${era_.accent}33`,
              animation: "panoSheetUp 0.3s cubic-bezier(0.4,0.1,0.2,1)",
            }}
          >
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 12px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontFamily: MONO, letterSpacing: "0.14em", color: era_.accent, textTransform: "uppercase", fontWeight: 600 }}>
                Landmarks · {allLandmarks.length}
              </div>
              <div style={{ fontSize: 12, fontFamily: MONO, color: "rgba(244,242,236,0.55)" }}>{era_.label}</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {allLandmarks.map((l) => (
                <button
                  key={l.id}
                  onClick={() => goToLandmarkDetail(l.id)}
                  style={{
                    padding: 10, border: "none", cursor: "pointer", textAlign: "left",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    display: "flex", alignItems: "center", gap: 12,
                    fontFamily: SERIF,
                  }}
                >
                  <span
                    data-vt-name={landmarkVT(l.id)}
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `${era_.accent}22`,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                      // Shared-element source for the sheet row → detail morph.
                      // Chips above suppress their VT name while the sheet is
                      // open, so these rows own the names exclusively.
                      viewTransitionName: landmarkVT(l.id),
                    } as React.CSSProperties}
                  >
                    {l.emoji}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: "block",
                      fontFamily: SERIF, fontStyle: "italic",
                      fontSize: 18, color: FG,
                      marginBottom: 2,
                    }}>
                      {l.shortName}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "rgba(244,242,236,0.6)", fontFamily: MONO, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {l.kicker}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <style>{`@keyframes panoSheetUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
          </div>
        </div>
      )}
    </div>
  );
}
