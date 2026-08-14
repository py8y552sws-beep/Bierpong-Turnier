import { useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { PredictionEditor } from "../components/predictions/PredictionEditor";
import { AdminMatches } from "./admin/AdminMatches";
import { AdminReset } from "./admin/AdminReset";
import { AdminSync } from "./admin/AdminSync";
import { AdminTeams } from "./admin/AdminTeams";
import styles from "./Admin.module.css";

type AdminTab = "matches" | "teams" | "predictions" | "sync" | "reset";

const TABS: readonly { id: AdminTab; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "teams", label: "Doppelteams" },
  { id: "predictions", label: "Predictions" },
  { id: "sync", label: "Cloud-Sync" },
  { id: "reset", label: "Zurücksetzen" },
];

export function Admin() {
  const [tab, setTab] = useState<AdminTab>("matches");

  return (
    <>
      <PageHeader title="Adminbereich" subtitle="Teams, Matches, Ergebnisse und Predictions verwalten." />

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "matches" && <AdminMatches />}
      {tab === "teams" && <AdminTeams />}
      {tab === "predictions" && <PredictionEditor />}
      {tab === "sync" && <AdminSync />}
      {tab === "reset" && <AdminReset />}
    </>
  );
}
