import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import { initFirebaseSync } from "./store/firebaseSync";
import "./styles/global.css";

// Startet den geräteübergreifenden Cloud-Sync (falls konfiguriert, siehe
// lib/firebaseConfig.ts) genau einmal beim App-Start – unabhängig vom
// React-Rendering, damit er auch Zustandsänderungen mitbekommt, die vor
// dem ersten Render passieren.
initFirebaseSync();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root-Element nicht gefunden");

// HashRouter statt BrowserRouter: GitHub Pages liefert keine
// Server-Rewrites für tiefe Links, daher muss das Routing rein
// clientseitig über den URL-Hash laufen (z.B. /#/spieler/flo).
createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
