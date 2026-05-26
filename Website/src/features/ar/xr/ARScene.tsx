// ARScene — React Three Fiber + WebXR scene. Owner: P3.

import { useEffect, useState } from "react";

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
      </div>
    </div>
  );
}
