import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { QuickGuide } from "./components/QuickGuide";
import { AROverview } from "./components/AROverview";
import { ARArtifactDetail } from "./components/ARArtifactDetail";
import { TreasureHunt } from "./components/TreasureHunt";
import { QuizFeedback } from "./components/QuizFeedback";
import { Summary } from "./components/Summary";
import { PanoramaScene } from "../features/ar/xr/PanoramaScene";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/quick-guide",
    Component: QuickGuide,
  },
  {
    path: "/ar-overview",
    Component: AROverview,
  },
  {
    path: "/ar-xr",
    Component: PanoramaScene,
  },
  {
    path: "/ar-artifact/:landmarkId",
    Component: ARArtifactDetail,
  },
  {
    path: "/treasure-hunt",
    Component: TreasureHunt,
  },
  {
    path: "/quiz-feedback",
    Component: QuizFeedback,
  },
  {
    path: "/summary",
    Component: Summary,
  },
]);