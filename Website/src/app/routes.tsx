import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/ui/AppShell";
import { Home } from "./components/Home";
import { QuickGuide } from "./components/QuickGuide";
import { PanoramaScene } from "@/features/ar/xr/PanoramaScene";
import { ARArtifactDetail } from "./components/ARArtifactDetail";
import { TreasureHunt } from "./components/TreasureHunt";
import { QuizFeedback } from "./components/QuizFeedback";
import { Summary } from "./components/Summary";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/quick-guide", element: <QuickGuide /> },
      { path: "/ar-overview", element: <PanoramaScene /> },
      { path: "/ar-artifact/:landmarkId", element: <ARArtifactDetail /> },
      { path: "/treasure-hunt", element: <TreasureHunt /> },
      { path: "/quiz", element: <QuizFeedback /> },
      { path: "/summary", element: <Summary /> },
    ],
  },
]);
