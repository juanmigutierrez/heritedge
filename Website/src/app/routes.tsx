import { createBrowserRouter, useLocation } from "react-router";
import { AppShell } from "./components/ui/AppShell";
import { Home } from "./components/Home";
import { QuickGuide } from "./components/QuickGuide";
import { PanoramaScene } from "@/features/ar/xr/PanoramaScene";
import { ARArtifactDetail } from "./components/ARArtifactDetail";
import { TreasureHunt } from "./components/TreasureHunt";
import { QuizFeedback } from "./components/QuizFeedback";
import { Summary } from "./components/Summary";
import { HotspotSheetPreview } from "./components/ar/HotspotSheetPreview";
import { Tutorial } from "./components/Tutorial";
import { Hunt } from "./components/Hunt";
import { SouvenirFilter } from "./components/SouvenirFilter";
import { useHuntState } from "./components/HuntStateProvider";

function RouteGate() {
  const location = useLocation();
  const { state, ready, markTutorialSeen } = useHuntState();

  if (!ready) {
    return null;
  }

  if (!state.tutorialSeen && location.pathname === "/") {
    return <Tutorial onFinish={markTutorialSeen} />;
  }

  return <AppShell />;
}

export const router = createBrowserRouter([
  {
    element: <RouteGate />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/quick-guide", element: <QuickGuide /> },
      { path: "/ar-overview", element: <PanoramaScene /> },
      { path: "/ar-artifact/:landmarkId", element: <ARArtifactDetail /> },
      { path: "/treasure-hunt", element: <TreasureHunt /> },
      { path: "/quiz-feedback", element: <QuizFeedback /> },
      { path: "/hunt", element: <Hunt /> },
      { path: "/souvenir", element: <SouvenirFilter /> },
      { path: "/summary", element: <Summary /> },
      ...(import.meta.env.DEV ? [{ path: "/ar-hotspot-preview", element: <HotspotSheetPreview /> }] : []),
    ],
  },
]);
