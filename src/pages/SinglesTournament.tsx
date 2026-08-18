import { Card } from "../components/common/Card";
import { MatchList } from "../components/common/MatchList";
import tableStyles from "../components/common/table.module.css";
import { EmptyState } from "../components/common/EmptyState";
import { SINGLES_PLACEMENT_POINTS } from "../constants/points";
import { SINGLES_ROUND_LABELS } from "../constants/rounds";
import { PageHeader } from "../components/common/PageHeader";
import { getPlayerName } from "../constants/players";
import { useMatches, useSinglesGroupStandings, useSinglesPlacements } from "../hooks/useTournamentData";
import styles from "./SinglesTournament.module.css";

const KNOCKOUT_ROUNDS = [
  { round: "semifinal" as const, label: SINGLES_ROUND_LABELS.semifinal },
  { round: "final" as const, label: SINGLES_ROUND_LABELS.final },
  { round: "third_place" as const, label: SINGLES_ROUND_LABELS.third_place },
  { round: "fifth_place" as const, label: SINGLES_ROUND_LABELS.fifth_place },
  { round: "seventh_place" as const, label: SINGLES_ROUND_LABELS.seventh_place },
];

export function SinglesTournament() {
  const matches = useMatches();
  const singlesMatches = matches.filter((m) => m.matchType === "singles");
  const groupMatches = singlesMatches.filter((m) => m.round === "group");
  const groupStandings = useSinglesGroupStandings();
  const placements = useSinglesPlacements();

  const champion = Object.entries(placements).find(([, rank]) => rank === 1)?.[0];

  return (
    <>
      <PageHeader
        title="Einzelturnier"
        subtitle="8 Spieler · Vorrunde (jeder gegen jeden), danach K.O.-Runden für Platz 1-8."
      />

      {champion && (
        <div className={styles.placementBanner}>
          <span>Turniersieger Einzel</span>
          <strong>{getPlayerName(champion as import("../types").PlayerId)}</strong>
        </div>
      )}

      <Card
        title="Vorrunde – Tabelle"
        subtitle="Automatisch aus den Vorrundenspielen berechnet · Platz 1-4 spielen im Halbfinale um den Titel, Platz 5-8 um die Plätze 5-8"
      >
        {groupStandings.length === 0 ? (
          <EmptyState message="Noch keine Vorrundenspiele erfasst." />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Spieler</th>
                  <th className={tableStyles.num}>S</th>
                  <th className={tableStyles.num}>N</th>
                  <th className={tableStyles.num}>Cups +/-</th>
                  <th className={tableStyles.num}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {groupStandings.map((s, i) => (
                  <tr key={s.playerId} className={i < 4 ? tableStyles.highlightRow : ""}>
                    <td className={tableStyles.rankCell}>{i + 1}</td>
                    <td>{s.playerName}</td>
                    <td className={tableStyles.num}>{s.wins}</td>
                    <td className={tableStyles.num}>{s.losses}</td>
                    <td className={tableStyles.num}>
                      {s.cupsFor}:{s.cupsAgainst}
                    </td>
                    <td className={tableStyles.num}>
                      {s.diff > 0 ? "+" : ""}
                      {s.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ height: 20 }} />

      <Card title="Vorrunde – Spiele" subtitle={`${groupMatches.length} Spiele, jeder gegen jeden`}>
        <MatchList matches={groupMatches} emptyMessage="Noch nicht angesetzt." showAchievements />
      </Card>

      <div style={{ height: 20 }} />

      <div className={styles.roundsGrid}>
        {KNOCKOUT_ROUNDS.map(({ round, label }) => (
          <Card key={round} title={label}>
            <MatchList
              matches={singlesMatches.filter((m) => m.round === round)}
              emptyMessage="Steht erst nach Abschluss der Vorrunde fest."
              showAchievements
            />
          </Card>
        ))}
      </div>

      <div style={{ height: 20 }} />

      <Card title="Endplatzierung & Punkte">
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Platz</th>
                <th>Spieler</th>
                <th className={tableStyles.num}>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SINGLES_PLACEMENT_POINTS).map(([rank, points]) => {
                const entry = Object.entries(placements).find(([, r]) => r === Number(rank));
                return (
                  <tr key={rank}>
                    <td className={tableStyles.rankCell}>{rank}.</td>
                    <td>{entry ? getPlayerName(entry[0] as import("../types").PlayerId) : "–"}</td>
                    <td className={tableStyles.num}>{entry ? points : "–"}</td>
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
