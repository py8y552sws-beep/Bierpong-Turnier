import { Fragment } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { StatTile } from "../components/common/StatTile";
import tableStyles from "../components/common/table.module.css";
import { PointsProgressionChart } from "../components/charts/PointsProgressionChart";
import { ACHIEVEMENT_CATEGORY_LABELS, ACHIEVEMENT_CATEGORY_ORDER, MAX_ACHIEVEMENT_POINTS, TOTAL_ACHIEVEMENT_COUNT } from "../constants/achievements";
import { isPlayerId } from "../constants/players";
import { PREDICTION_CATEGORIES, PREDICTION_CATEGORY_LABELS } from "../constants/points";
import { roundLabel } from "../constants/rounds";
import { useTeams, usePlayerStats } from "../hooks/useTournamentData";
import { describePredictionValue } from "../utils/predictionDisplay";
import styles from "./PlayerProfile.module.css";

export function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();

  if (!playerId || !isPlayerId(playerId)) {
    return <Navigate to="/spieler" replace />;
  }

  return <PlayerProfileContent playerId={playerId} />;
}

function PlayerProfileContent({ playerId }: { playerId: import("../types").PlayerId }) {
  const stats = usePlayerStats(playerId);
  const teams = useTeams();

  return (
    <>
      <div className={styles.header}>
        <div className={styles.avatar}>{stats.playerName.slice(0, 2).toUpperCase()}</div>
        <div>
          <PageHeader
            title={stats.playerName}
            subtitle={`Platz ${stats.standing.rank} in der Gesamtwertung`}
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatTile label="Gesamtpunkte" value={stats.standing.totalPoints} />
        <StatTile label="Einzelpunkte" value={stats.standing.singlesPoints} />
        <StatTile label="Doppelpunkte" value={stats.standing.doublesPoints} />
        <StatTile label="Prediction-Punkte" value={stats.standing.predictionPoints} />
        <StatTile label="Achievement-Punkte" value={stats.standing.achievementPoints} />
        <StatTile
          label="Achievements freigeschaltet"
          value={`${stats.achievements.unlockedCount}/${TOTAL_ACHIEVEMENT_COUNT}`}
        />
        <StatTile label="Siege / Niederlagen" value={`${stats.wins} / ${stats.losses}`} />
        <StatTile label="Siegquote" value={`${(stats.winRate * 100).toFixed(0)}%`} />
        <StatTile label="Cups (Ø)" value={`${stats.cups} (${stats.averageCups.toFixed(1)})`} />
        <StatTile label="Bounce Treffer" value={stats.bounceHits} />
        <StatTile label="3er Serien" value={stats.streak3Count} />
        <StatTile label="5er Serien" value={stats.streak5Count} />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.stack}>
          <Card title="Punkteentwicklung">
            {stats.pointsProgression.length <= 1 ? (
              <EmptyState message="Noch keine Matches erfasst." />
            ) : (
              <PointsProgressionChart data={stats.pointsProgression} />
            )}
          </Card>

          <Card title="Match-Historie">
            {stats.matchHistory.length === 0 ? (
              <EmptyState message="Noch keine Matches gespielt." />
            ) : (
              <div className={tableStyles.tableWrap}>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>Gegner</th>
                      <th>Runde</th>
                      <th className={tableStyles.num}>Ergebnis</th>
                      <th className={tableStyles.num}>Cups</th>
                      <th className={tableStyles.num}>Bounce</th>
                      <th className={tableStyles.num}>Serie</th>
                      <th>Achievements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.matchHistory
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <tr key={entry.match.id}>
                          <td>
                            {entry.match.matchType === "singles" ? "Einzel" : "Doppel"} vs.{" "}
                            {entry.opponentLabel}
                          </td>
                          <td>{roundLabel(entry.match.matchType, entry.match.round)}</td>
                          <td className={tableStyles.num}>
                            <Badge variant={entry.won ? "win" : "loss"}>
                              {entry.ownScore}:{entry.opponentScore}
                            </Badge>
                          </td>
                          <td className={tableStyles.num}>{entry.ownStat?.cups ?? "–"}</td>
                          <td className={tableStyles.num}>{entry.ownStat?.bounceHits ?? "–"}</td>
                          <td className={tableStyles.num}>{entry.ownStat?.longestStreak ?? "–"}</td>
                          <td className={styles.achievementCell}>
                            {entry.achievements.length === 0
                              ? "–"
                              : entry.achievements.map((a, i) => (
                                  <Badge key={i} variant="accent">
                                    {a.icon} {a.name} +{a.points}
                                  </Badge>
                                ))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className={styles.stack}>
          <Card
            title="Achievements"
            subtitle={`${stats.achievements.unlockedCount}/${TOTAL_ACHIEVEMENT_COUNT} freigeschaltet · ${stats.achievements.totalPoints}/${MAX_ACHIEVEMENT_POINTS} Punkte`}
          >
            <div className={styles.achievementProgress}>
              <div className={styles.progressRow}>
                <span>Freigeschaltet</span>
                <span>
                  {stats.achievements.unlockedCount}/{TOTAL_ACHIEVEMENT_COUNT}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${(stats.achievements.unlockedCount / TOTAL_ACHIEVEMENT_COUNT) * 100}%` }}
                />
              </div>
              <div className={styles.progressRow}>
                <span>Achievement Points</span>
                <span>
                  {stats.achievements.totalPoints}/{MAX_ACHIEVEMENT_POINTS}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${(stats.achievements.totalPoints / MAX_ACHIEVEMENT_POINTS) * 100}%` }}
                />
              </div>
            </div>

            {ACHIEVEMENT_CATEGORY_ORDER.map((category) => (
              <div key={category} className={styles.achievementCategory}>
                <h4 className={styles.achievementCategoryTitle}>{ACHIEVEMENT_CATEGORY_LABELS[category]}</h4>
                <div className={styles.achievementGrid}>
                  {stats.achievements.achievements
                    .filter((a) => a.category === category)
                    .map((a) => (
                      <div
                        key={a.id}
                        className={`${styles.achievementCard} ${a.unlocked ? styles.achievementUnlocked : styles.achievementLocked}`}
                      >
                        <span className={styles.achievementIcon}>{a.unlocked ? a.icon : "🔒"}</span>
                        <div className={styles.achievementInfo}>
                          <span className={styles.achievementName}>{a.name}</span>
                          <span className={styles.achievementDesc}>{a.description}</span>
                          {a.unlocked && a.unlockedAt && (
                            <span className={styles.achievementDate}>
                              Freigeschaltet: {new Date(a.unlockedAt).toLocaleDateString("de-DE")}
                            </span>
                          )}
                        </div>
                        <Badge variant={a.unlocked ? "win" : "neutral"}>+{a.points}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </Card>

          <Card title="Predictions" subtitle={stats.predictionResult.pending ? "Wird nach Turnierende ausgewertet" : "Ausgewertet"}>
            <div className={styles.predictionGrid}>
              {PREDICTION_CATEGORIES.map((category) => {
                const result = stats.predictionResult.categories.find((c) => c.category === category);
                const value = stats.prediction ? stats.prediction[category] : null;
                return (
                  <Fragment key={category}>
                    <span className={styles.predictionLabel}>
                      {PREDICTION_CATEGORY_LABELS[category]}
                    </span>
                    <span className={styles.predictionValue}>
                      {describePredictionValue(value, teams)}{" "}
                      {!stats.predictionResult.pending && result && (
                        <Badge variant={result.correct ? "win" : "loss"}>
                          {result.correct ? `+${result.points}` : "0"}
                        </Badge>
                      )}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
