import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Apply persisted theme preference before first paint to avoid a flash.
// "auto" follows the OS via prefers-color-scheme; "light" / "dark" override it.
(function applyInitialTheme() {
  try {
    const stored = localStorage.getItem("heritedge.theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch {
    // localStorage might be blocked (incognito) — fall back to OS preference.
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
