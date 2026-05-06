import { Outlet, useLocation } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { BottomNav } from "./BottomNav";

/**
 * Wraps every page so the floating theme toggle and bottom nav are always
 * available. Routes that need a "raw" canvas (full-bleed AR) can opt out by
 * checking `pathname` and rendering their own chrome — see ARArtifactDetail.
 */
export function AppShell() {
  const { pathname } = useLocation();

  // The AR artefact detail screen is full-bleed by design — hide chrome there.
  const isImmersive = pathname.startsWith("/ar/artifact");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {!isImmersive && (
        <div className="fixed top-3 right-3 z-50 sm:top-4 sm:right-4">
          <ThemeToggle />
        </div>
      )}

      <main className={isImmersive ? "" : "pb-nav"}>
        <Outlet />
      </main>

      {!isImmersive && <BottomNav />}
    </div>
  );
}
