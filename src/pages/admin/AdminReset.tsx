import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { IconAlert } from "../../components/common/icons";
import { useTournamentActions, useTournamentStatus } from "../../hooks/useTournamentData";

export function AdminReset() {
  const { resetTournament } = useTournamentActions();
  const status = useTournamentStatus();

  function handleReset() {
    const confirmed = confirm(
      "Turnier wirklich zurücksetzen? Alle Teams, Matches und Predictions werden unwiderruflich gelöscht.",
    );
    if (confirmed) resetTournament();
  }

  return (
    <Card title="Turnier zurücksetzen" subtitle="Löscht alle Teams, Matches und Predictions dieser Championship.">
      <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginBottom: 16 }}>
        Aktueller Status: {status.complete ? "Turnier beendet" : "Turnier läuft"}. Diese Aktion kann nicht rückgängig
        gemacht werden.
      </p>
      <Button variant="danger" onClick={handleReset}>
        <IconAlert /> Turnier zurücksetzen
      </Button>
    </Card>
  );
}
