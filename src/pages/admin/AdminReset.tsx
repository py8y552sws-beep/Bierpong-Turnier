import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { IconAlert, IconBolt } from "../../components/common/icons";
import { useTournamentActions, useTournamentStatus } from "../../hooks/useTournamentData";

export function AdminReset() {
  const { resetTournament, reshuffleSchedule } = useTournamentActions();
  const status = useTournamentStatus();

  function handleReset() {
    const confirmed = confirm(
      "Turnier wirklich zurücksetzen? Alle Teams, Matches und Predictions werden unwiderruflich gelöscht.",
    );
    if (confirmed) resetTournament();
  }

  function handleReshuffle() {
    const confirmed = confirm(
      "Reihenfolge der noch offenen Matches neu mischen? Bereits eingetragene Ergebnisse bleiben unverändert.",
    );
    if (confirmed) reshuffleSchedule();
  }

  return (
    <>
      <Card title="Spielplan neu mischen" subtitle="Nur die noch offenen Matches bekommen eine neue, zufällige Reihenfolge.">
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginBottom: 16 }}>
          Bereits gespielte Matches und ihre Ergebnisse bleiben dabei unangetastet – es wird nur neu gewürfelt, in
          welcher Reihenfolge die verbleibenden Spiele anstehen.
        </p>
        <Button variant="secondary" onClick={handleReshuffle}>
          <IconBolt /> Spielplan neu mischen
        </Button>
      </Card>

      <div style={{ height: 20 }} />

      <Card title="Turnier zurücksetzen" subtitle="Löscht alle Teams, Matches und Predictions dieser Championship.">
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginBottom: 16 }}>
          Aktueller Status: {status.complete ? "Turnier beendet" : "Turnier läuft"}. Diese Aktion kann nicht rückgängig
          gemacht werden.
        </p>
        <Button variant="danger" onClick={handleReset}>
          <IconAlert /> Turnier zurücksetzen
        </Button>
      </Card>
    </>
  );
}
