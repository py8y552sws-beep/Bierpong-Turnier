import { useState } from "react";
import { AchievementGallery } from "../components/achievements/AchievementGallery";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { TOTAL_ACHIEVEMENT_COUNT } from "../constants/achievements";
import { PLAYERS } from "../constants/players";
import { useAllPlayerStats } from "../hooks/useTournamentData";
import styles from "./Achievements.module.css";

/**
 * Eigenständige Achievements-Seite: links alle Spieler mit ihrem
 * Freischalt-Prozentsatz, rechts die vollständige Achievement-Galerie des
 * ausgewählten Spielers – analog zum Aufbau der Predictions-Seite.
 */
export function Achievements() {
  const allStats = useAllPlayerStats();
  const [selectedPlayer, setSelectedPlayer] = useState(PLAYERS[0]!.id);
  const selected = allStats.find((s) => s.playerId === selectedPlayer) ?? allStats[0]!;

  return (
    <>
      <PageHeader
        title="Achievements"
        subtitle={`Alle ${TOTAL_ACHIEVEMENT_COUNT} Achievements im Überblick – wähle einen Spieler, um zu sehen, welche er schon freigeschaltet hat und welche noch offen sind.`}
      />

      <div className={styles.layout}>
        <Card title="Spieler">
          <div className={styles.playerList}>
            {allStats.map((s) => {
              const percent = Math.round((s.achievements.unlockedCount / TOTAL_ACHIEVEMENT_COUNT) * 100);
              return (
                <button
                  key={s.playerId}
                  type="button"
                  className={`${styles.playerBtn} ${selectedPlayer === s.playerId ? styles.playerBtnActive : ""}`}
                  onClick={() => setSelectedPlayer(s.playerId)}
                >
                  <span>{s.playerName}</span>
                  <Badge variant={percent === 100 ? "win" : "accent"}>{percent}%</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title={`Achievements von ${selected.playerName}`}
          subtitle={`${selected.achievements.unlockedCount}/${TOTAL_ACHIEVEMENT_COUNT} freigeschaltet · ${selected.achievements.totalPoints} Achievement-Punkte`}
        >
          <AchievementGallery summary={selected.achievements} cups={selected.cups} />
        </Card>
      </div>
    </>
  );
}
