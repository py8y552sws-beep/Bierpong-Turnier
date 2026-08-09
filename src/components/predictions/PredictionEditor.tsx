import { useState } from "react";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { PLAYERS } from "../../constants/players";
import { PREDICTION_POINTS_PER_CATEGORY } from "../../constants/points";
import {
  useIsTournamentStarted,
  usePredictionResults,
  usePredictions,
  useTeams,
  useTournamentActions,
} from "../../hooks/useTournamentData";
import { isPredictionComplete } from "../../logic/predictions";
import { PredictionForm } from "./PredictionForm";
import styles from "./PredictionEditor.module.css";

/**
 * Wiederverwendbarer Predictions-Editor: Spielerauswahl + Formular für die
 * 10 Tipp-Kategorien. Wird sowohl auf der öffentlichen Predictions-Seite als
 * auch im Adminbereich ("Predictions bearbeiten") eingesetzt.
 */
export function PredictionEditor() {
  const [selectedPlayer, setSelectedPlayer] = useState(PLAYERS[0]!.id);
  const predictions = usePredictions();
  const teams = useTeams();
  const results = usePredictionResults();
  const started = useIsTournamentStarted();
  const { setPrediction } = useTournamentActions();

  const currentPrediction = predictions[selectedPlayer];
  const currentResult = results[selectedPlayer];

  return (
    <div className={styles.layout}>
      <Card title="Spieler">
        <div className={styles.playerList}>
          {PLAYERS.map((p) => {
            const complete = isPredictionComplete(predictions[p.id]);
            const result = results[p.id];
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.playerBtn} ${selectedPlayer === p.id ? styles.playerBtnActive : ""}`}
                onClick={() => setSelectedPlayer(p.id)}
              >
                {p.name}
                {result.pending ? (
                  <Badge variant={complete ? "accent" : "neutral"}>{complete ? "Abgegeben" : "Offen"}</Badge>
                ) : (
                  <Badge variant="win">{result.totalPoints} P</Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card
        title={`Tipps von ${PLAYERS.find((p) => p.id === selectedPlayer)?.name}`}
        subtitle={
          started
            ? "Turnier läuft bereits – Tipps sind gesperrt"
            : currentResult.pending
              ? "Wird automatisch nach Turnierende ausgewertet"
              : `${currentResult.totalPoints} von ${currentResult.categories.length * PREDICTION_POINTS_PER_CATEGORY} Punkten erzielt`
        }
      >
        {started && (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginBottom: 16 }}>
            Das Turnier hat bereits begonnen. Tipps können ab jetzt nicht mehr geändert werden.
          </p>
        )}
        <PredictionForm
          prediction={currentPrediction}
          teams={teams}
          onChange={(next) => setPrediction(next)}
          disabled={started}
        />
      </Card>
    </div>
  );
}
