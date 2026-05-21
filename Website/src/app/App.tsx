import { RouterProvider } from "react-router";
import { router } from "./routes";
import { HuntProvider } from "./components/HuntStateProvider";

export default function App() {
  return (
    <HuntProvider>
      <RouterProvider router={router} />
    </HuntProvider>
  );
}
