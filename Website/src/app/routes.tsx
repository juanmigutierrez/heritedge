import { createBrowserRouter } from "react-router-dom";
import { Home } from "./components/Home";
import { QuickGuide } from "./components/QuickGuide";
import { AROverview } from "./components/AROverview";
import { ARArtifactDetail } from "./components/ARArtifactDetail";
import { TreasureHunt } from "./components/TreasureHunt";
import { QuizFeedback } from "./components/QuizFeedback";
import { Summary } from "./components/Summary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/quick-guide",
    element: <QuickGuide />,
  },
  {
    path: "/ar-overview",
    element: <AROverview />,
  },
  {
    path: "/ar-artifact/:landmarkId",
    element: <ARArtifactDetail />,
  },
  {
    path: "/treasure-hunt",
    element: <TreasureHunt />,
  },
  {
    path: "/quiz-feedback",
    element: <QuizFeedback />,
  },
  {
    path: "/summary",
    element: <Summary />,
  },
]);