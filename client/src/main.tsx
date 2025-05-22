import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="corebase-theme">
    <App />
  </ThemeProvider>
);
