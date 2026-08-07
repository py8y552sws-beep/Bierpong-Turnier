import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { MatchList } from "../components/common/MatchList";
import { PageHeader } from "../components/common/PageHeader";
import tableStyles from "../components/common/table.module.css";
import { DOUBLES_PLACEMENT_POINTS } from "../constants/points";
import { DOUBLES_ROUND_LABELS } from "../constants/rounds";
import { useDoublesPlacements, useMatches, useTeams } from "../hooks/useTournamentData";
import { getTeamLabel } from "../utils/matchLabels";
import styles from "./SinglesTournament.module.css";

const ROUNDS = [
  { round: "semifinal" as const, label: DOUBLES_ROUND_LABELS.semifinal },
  { round: "final" as const, label: DOUBLES_ROUND_LABELS.final },
  { round: "third_place" as const, label: DOUBLES_ROUND_LABELS.third_place },
];

export function DoublesTournament() {
  const teams = useTeams();
  const matches = useMatches();
  const doublesMatches = matches.filter((m) => m.matchType === "doubles");
  const placements = useDoublesPlacements();

  const championTeamId = Object.entries(placements).find(([, rank]) => rank === 1)?.[0];
  const championTeam = teams.find((t) => t.id === championTeamId);

  return (
    <>
      <PageHeader title="Doppelturnier" subtitle="4 Teams · Halbfinale, Finale und Spiel um Platz 3." />

      {championTeam && (
        <div className={styles.placementBanner}>
          <span>Turniersieger Doppel</span>
          <strong>{getTeamLabel(championTeam)}</strong>
        </div>
      )}

      <Card title="Teams" subtitle="Im Adminbereich festgelegt">
        {teams.length === 0 ? (
          <EmptyState message="Noch keine Doppelteams festgelegt." />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Spieler</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, i) => (
                  <tr key={team.id}>
                    <td>Team {i + 1}</td>
                    <td>{getTeamLabel(team)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ height: 20 }} />

      <div className={styles.roundsGrid}>
        {ROUNDS.map(({ round, label }) => (
          <Card key={round} title={label}>
            <MatchList matches={doublesMatches.filter((m) => m.round === round)} emptyMessage="Noch nicht angesetzt." />
          </Card>
        ))}
      </div>

      <div style={{ height: 20 }} />

      <Card title="Endplatzierung & Punkte pro Spieler">
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Platz</th>
                <th>Team</th>
                <th className={tableStyles.num}>Punkte / Spieler</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DOUBLES_PLACEMENT_POINTS).map(([rank, points]) => {
                const entry = Object.entries(placements).find(([, r]) => r === Number(rank));
                const team = entry ? teams.find((t) => t.id === entry[0]) : undefined;
                return (
                  <tr key={rank}>
                    <td className={tableStyles.rankCell}>{rank}.</td>
                    <td>{team ? getTeamLabel(team) : "–"}</td>
                    <td className={tableStyles.num}>{team ? points : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
