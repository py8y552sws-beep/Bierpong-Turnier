import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import formStyles from "../../components/common/form.module.css";
import { PLAYERS } from "../../constants/players";
import { useTeams, useTournamentActions } from "../../hooks/useTournamentData";
import type { DoublesTeam, PlayerId, TeamId } from "../../types";

const TEAM_SLOT_IDS: readonly TeamId[] = ["team-1", "team-2", "team-3", "team-4"];

type SlotState = readonly [PlayerId | "", PlayerId | ""];

function buildInitialSlots(teams: readonly DoublesTeam[]): SlotState[] {
  return TEAM_SLOT_IDS.map((slotId) => {
    const team = teams.find((t) => t.id === slotId);
    return team ? [team.playerIds[0], team.playerIds[1]] : ["", ""];
  });
}

export function AdminTeams() {
  const teams = useTeams();
  const { setDoublesTeams } = useTournamentActions();
  const [slots, setSlots] = useState<SlotState[]>(() => buildInitialSlots(teams));
  const [error, setError] = useState<string | null>(null);

  function updateSlot(index: number, side: 0 | 1, value: string) {
    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        const next: [PlayerId | "", PlayerId | ""] = [slot[0], slot[1]];
        next[side] = value as PlayerId | "";
        return next;
      }),
    );
  }

  function handleSave() {
    const allSelected = slots.flatMap((s) => s.filter((v) => v !== "")) as PlayerId[];
    if (allSelected.length !== 8) {
      setError("Bitte alle 8 Spieler auf die 4 Teams verteilen.");
      return;
    }
    if (new Set(allSelected).size !== 8) {
      setError("Jeder Spieler darf nur einem Team angehören.");
      return;
    }
    for (const slot of slots) {
      if (slot[0] === slot[1]) {
        setError("Ein Team benötigt zwei unterschiedliche Spieler.");
        return;
      }
    }

    setError(null);
    const next: DoublesTeam[] = slots.map((slot, i) => {
      const slotId = TEAM_SLOT_IDS[i]!;
      const existingName = teams.find((t) => t.id === slotId)?.name;
      return {
        id: slotId,
        playerIds: [slot[0] as PlayerId, slot[1] as PlayerId],
        ...(existingName ? { name: existingName } : {}),
      };
    });
    setDoublesTeams(next);
  }

  const usedPlayers = new Set(slots.flatMap((s) => s.filter((v) => v !== "")));

  return (
    <Card title="Doppelteams festlegen" subtitle="4 Teams à 2 Spieler – jeder Spieler genau einmal.">
      <div className={formStyles.grid2}>
        {slots.map((slot, i) => (
          <div key={TEAM_SLOT_IDS[i]} className={formStyles.formRow}>
            <div className={formStyles.field} style={{ flex: 1 }}>
              <label>Team {i + 1} · Spieler A</label>
              <select
                className={formStyles.select}
                value={slot[0]}
                onChange={(e) => updateSlot(i, 0, e.target.value)}
              >
                <option value="">– auswählen –</option>
                {PLAYERS.filter((p) => p.id === slot[0] || !usedPlayers.has(p.id)).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={formStyles.field} style={{ flex: 1 }}>
              <label>Team {i + 1} · Spieler B</label>
              <select
                className={formStyles.select}
                value={slot[1]}
                onChange={(e) => updateSlot(i, 1, e.target.value)}
              >
                <option value="">– auswählen –</option>
                {PLAYERS.filter((p) => p.id === slot[1] || !usedPlayers.has(p.id)).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      {error && <p className={formStyles.errorText} style={{ marginTop: 10 }}>{error}</p>}
      <div className={formStyles.formActions}>
        <Button variant="primary" onClick={handleSave}>
          Teams speichern
        </Button>
      </div>
    </Card>
  );
}
