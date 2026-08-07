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

export function AdminMatches() {
  const matches = useMatches();
  const teams = useTeams();
  const { addMatch, updateMatch, deleteMatch } = useTournamentActions();
  const [editing, setEditing] = useState<Match | "new" | null>(null);

  const sorted = matches.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleSubmit(input: MatchInput) {
    if (editing && editing !== "new") {
      updateMatch(editing.id, input);
    } else {
      addMatch(input);
    }
    setEditing(null);
  }

  function handleDelete(match: Match) {
    if (confirm(`Match "${getMatchTitle(match)}" wirklich löschen?`)) {
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
          <Button variant="primary" size="sm" onClick={() => setEditing("new")}>
            <IconPlus /> Neues Match
          </Button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState message="Noch keine Matches angelegt." />
        ) : (
          sorted.map((match) => (
            <div className={styles.row} key={match.id}>
              <Badge variant={match.matchType === "singles" ? "neutral" : "accent"}>
                {match.matchType === "singles" ? "Einzel" : "Doppel"}
              </Badge>
              <div>
                <div className={styles.sides}>{getMatchTitle(match)}</div>
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
