import { Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import tableStyles from "../components/common/table.module.css";
import { useAllPlayerStats } from "../hooks/useTournamentData";

export function PlayersList() {
  const allStats = useAllPlayerStats();
  const sorted = allStats.slice().sort((a, b) => a.standing.rank - b.standing.rank);

  return (
    <>
      <PageHeader title="Spieler" subtitle="Alle acht Teilnehmer der Championship." />
      <Card>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Spieler</th>
                <th className={tableStyles.num}>Gesamt</th>
                <th className={tableStyles.num}>Siege</th>
                <th className={tableStyles.num}>Niederlagen</th>
                <th className={tableStyles.num}>Siegquote</th>
                <th className={tableStyles.num}>Cups</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.playerId} className={p.standing.rank === 1 ? tableStyles.highlightRow : ""}>
                  <td className={tableStyles.rankCell}>{p.standing.rank}</td>
                  <td>
                    <Link className={tableStyles.playerLink} to={`/spieler/${p.playerId}`}>
                      {p.playerName}
                    </Link>
                  </td>
                  <td className={tableStyles.num}>
                    <strong>{p.standing.totalPoints}</strong>
                  </td>
                  <td className={tableStyles.num}>{p.wins}</td>
                  <td className={tableStyles.num}>{p.losses}</td>
                  <td className={tableStyles.num}>{(p.winRate * 100).toFixed(0)}%</td>
                  <td className={tableStyles.num}>{p.cups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
