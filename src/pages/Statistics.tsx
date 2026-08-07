import { Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import tableStyles from "../components/common/table.module.css";
import { LEADERBOARD_LABELS, type LeaderboardMetric } from "../logic/leaderboards";
import { useAllLeaderboards } from "../hooks/useTournamentData";
import styles from "./Statistics.module.css";

const PERCENT_METRICS: readonly LeaderboardMetric[] = ["winRate"];
const DECIMAL_METRICS: readonly LeaderboardMetric[] = ["averageCups"];

function formatValue(metric: LeaderboardMetric, value: number): string {
  if (PERCENT_METRICS.includes(metric)) return `${(value * 100).toFixed(0)}%`;
  if (DECIMAL_METRICS.includes(metric)) return value.toFixed(1);
  return String(value);
}

export function Statistics() {
  const leaderboards = useAllLeaderboards();
  const metrics = Object.keys(LEADERBOARD_LABELS) as LeaderboardMetric[];

  return (
    <>
      <PageHeader title="Statistiken" subtitle="Alle Leaderboards, ausschließlich aus den erfassten Matchdaten berechnet." />
      <div className={styles.grid}>
        {metrics.map((metric) => {
          const entries = leaderboards[metric];
          return (
            <Card key={metric} title={LEADERBOARD_LABELS[metric]}>
              {entries.every((e) => e.value === 0) ? (
                <EmptyState message="Noch keine Daten." />
              ) : (
                <div className={tableStyles.tableWrap}>
                  <table className={tableStyles.table}>
                    <tbody>
                      {entries.slice(0, 8).map((e) => (
                        <tr key={e.playerId} className={e.rank === 1 ? tableStyles.highlightRow : ""}>
                          <td className={tableStyles.rankCell}>{e.rank}</td>
                          <td>
                            <Link className={tableStyles.playerLink} to={`/spieler/${e.playerId}`}>
                              {e.playerName}
                            </Link>
                          </td>
                          <td className={tableStyles.num}>{formatValue(metric, e.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
