import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Achievements } from "./pages/Achievements";
import { Admin } from "./pages/Admin";
import { Dashboard } from "./pages/Dashboard";
import { DoublesTournament } from "./pages/DoublesTournament";
import { PlayerProfile } from "./pages/PlayerProfile";
import { PlayersList } from "./pages/PlayersList";
import { Predictions } from "./pages/Predictions";
import { Rules } from "./pages/Rules";
import { ScoreEntry } from "./pages/ScoreEntry";
import { SinglesTournament } from "./pages/SinglesTournament";
import { Statistics } from "./pages/Statistics";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/regeln" element={<Rules />} />
        <Route path="/eingabe" element={<ScoreEntry />} />
        <Route path="/spieler" element={<PlayersList />} />
        <Route path="/spieler/:playerId" element={<PlayerProfile />} />
        <Route path="/einzelturnier" element={<SinglesTournament />} />
        <Route path="/doppelturnier" element={<DoublesTournament />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/statistiken" element={<Statistics />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AppShell>
  );
}

export default App;
