// ARScene — new React Three Fiber + WebXR scene. Owner: P3.
//
// This is the real-3D replacement for the 2D AROverview mock.
// Wire a new route /ar-xr in src/app/routes.tsx to expose it, or leave it
// on the side until Week 2 when P3 + P5 swap the glTF model in.
//
// Deps to install (P6 runs in week 1):
//   pnpm add three @react-three/fiber @react-three/drei @react-three/xr
//   pnpm add -D @types/three

import { useEffect, useState } from "react";
// import { Canvas } from "@react-three/fiber";
// import { XR, createXRStore, XROrigin } from "@react-three/xr";
// import { useGLTF } from "@react-three/drei";

// const store = createXRStore();

export function ARScene() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (!("xr" in navigator)) {
      setSupported(false);
      return;
    }
    // @ts-expect-error WebXR types
    navigator.xr?.isSessionSupported("immersive-ar").then(setSupported);
  }, []);

  if (supported === false) {
    return (
      <div className="p-6 text-center text-sm text-stone-600">
        WebXR AR is not supported on this browser. Use Chrome on Android, or fall
        back to the existing <code>/ar-overview</code> route.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-lg">AR scene scaffold</p>
        <p className="text-xs text-stone-400">
          P3: uncomment the R3F/XR imports above, install deps, and place a glTF
          via WebXR Hit Test.
        </p>
      </div>
    </div>
  );
}

// Example skeleton for P3 to flesh out in Week 2:
// export function ARScene() {
//   return (
//     <>
//       <button onClick={() => store.enterAR()}>Enter AR</button>
//       <Canvas>
//         <XR store={store}>
//           <ambientLight intensity={0.8} />
//           <XROrigin />
//           <DuomoModel />
//         </XR>
//       </Canvas>
//     </>
//   );
// }
//
// function DuomoModel() {
//   const { scene } = useGLTF("/models/duomo-present.glb");
//   return <primitive object={scene} scale={0.1} />;
// }
