import { useState } from "react";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { IconEdit, IconPlus, IconTrash } from "../../components/common/icons";
import { MatchForm } from "../../components/admin/MatchForm";
import { roundLabel } from "../../constants/rounds";
import { useMatches, useTeams, useTournamentActions } from "../../hooks/useTournamentData";
import { isMatchPlayed } from "../../logic/matchStatus";
import type { Match, MatchInput } from "../../types";
import { getMatchTitle } from "../../utils/matchLabels";
import styles from "./AdminMatches.module.css";

type MatchFilter = "open" | "played" | "all";

const FILTERS: readonly { id: MatchFilter; label: string }[] = [
  { id: "open", label: "Offen" },
  { id: "played", label: "Gespielt" },
  { id: "all", label: "Alle" },
];

export function AdminMatches() {
  const matches = useMatches();
  const teams = useTeams();
  const { addMatch, updateMatch, deleteMatch } = useTournamentActions();
  const [editing, setEditing] = useState<Match | "new" | null>(null);
  const [filter, setFilter] = useState<MatchFilter>("open");

  const filtered = matches.filter((m) => {
    if (filter === "open") return !isMatchPlayed(m);
    if (filter === "played") return isMatchPlayed(m);
    return true;
  });
  const sorted = filtered.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function handleSubmit(input: MatchInput) {
    if (editing && editing !== "new") {
      updateMatch(editing.id, input);
    } else {
      addMatch(input);
    }
    setEditing(null);
  }

  function handleDelete(match: Match) {
    if (confirm(`Match "${getMatchTitle(match, teams)}" wirklich löschen?`)) {
      deleteMatch(match.id);
    }
  }

  return (
    <>
      {editing && (
        <Card
          title={editing === "new" ? "Neues Match anlegen" : "Match bearbeiten"}
          subtitle="Ergebnis kann sofort oder später eingetragen werden."
        >
          <MatchForm
            teams={teams}
            initialMatch={editing === "new" ? undefined : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      <div style={{ height: editing ? 20 : 0 }} />

      <Card title="Matches">
        <div className={styles.toolbar}>
          <div className={styles.filterTabs}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filterTab} ${filter === f.id ? styles.filterTabActive : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setEditing("new")}>
            <IconPlus /> Neues Match
          </Button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState message="Keine Matches in dieser Ansicht." />
        ) : (
          sorted.map((match) => (
            <div className={styles.row} key={match.id}>
              <Badge variant={match.matchType === "singles" ? "neutral" : "accent"}>
                {match.matchType === "singles" ? "Einzel" : "Doppel"}
              </Badge>
              <div>
                <div className={styles.sides}>{getMatchTitle(match, teams)}</div>
                <div>{roundLabel(match.matchType, match.round)}</div>
              </div>
              <span className={styles.score}>
                {isMatchPlayed(match) ? `${match.scoreA}:${match.scoreB}` : "geplant"}
              </span>
              <span />
              <div className={styles.actions}>
                <Button size="sm" onClick={() => setEditing(match)} aria-label="Bearbeiten">
                  <IconEdit />
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(match)} aria-label="Löschen">
                  <IconTrash />
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
