import { Link } from "react-router-dom";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { IconBounce, IconCup, IconTrophy } from "../components/common/icons";
import { PageHeader } from "../components/common/PageHeader";
import { Podium } from "../components/common/Podium";
import { StatTile } from "../components/common/StatTile";
import tableStyles from "../components/common/table.module.css";
import { LEADERBOARD_LABELS } from "../logic/leaderboards";
import { roundLabel } from "../constants/rounds";
import {
  useChallengeSummaries,
  useLeaderboard,
  useMatches,
  useNextMatch,
  useOverallStandings,
  usePredictionResults,
  useRecentMatches,
  useTeams,
  useTournamentStatus,
} from "../hooks/useTournamentData";
import { ONE_TIME_CHALLENGES } from "../constants/points";
import { getPlayerName } from "../constants/players";
import { getPlayedMatches } from "../logic/matchStatus";
import { getMatchTitle } from "../utils/matchLabels";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const standings = useOverallStandings();
  const status = useTournamentStatus();
  const teams = useTeams();
  const matches = useMatches();
  const playedCount = getPlayedMatches(matches).length;
  const recentMatches = useRecentMatches(5);
  const nextMatch = useNextMatch();
  const predictionResults = usePredictionResults();
  const topCups = useLeaderboard("cups").slice(0, 5);
  const topWins = useLeaderboard("wins").slice(0, 5);
  const topBounce = useLeaderboard("bounceHits").slice(0, 5);
  const challengeSummaries = useChallengeSummaries();

  const predictionLeaderboard = Object.values(predictionResults)
    .slice()
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  const openOneTimeChallenges = Object.values(ONE_TIME_CHALLENGES).filter(
    (def) => !Object.values(challengeSummaries).some((s) => s.oneTime.some((c) => c.id === def.id && c.achieved)),
  );

  const leader = standings[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Beer Pong Championship – Überblick über Gesamtwertung, Turniere und Statistiken."
        actions={
          <Badge variant={status.complete ? "win" : "accent"}>
            {status.complete ? "Turnier beendet" : "Turnier läuft"}
          </Badge>
        }
      />

      <div className={styles.statsRow}>
        <StatTile label="Führender" value={leader ? leader.playerName : "–"} icon={IconTrophy} meta={leader ? `${leader.totalPoints} Punkte` : undefined} />
        <StatTile label="Einzel" value={status.singlesComplete ? "Beendet" : "Läuft"} />
        <StatTile label="Doppel" value={status.doublesComplete ? "Beendet" : "Läuft"} />
        <StatTile label="Gespielte Matches" value={playedCount} meta={`von ${matches.length} angesetzt`} />
      </div>

      <div className={styles.grid}>
        <div className={styles.stack}>
          <Card title="Gesamtwertung" subtitle="Einzel + Doppel + Predictions + Side Challenges" actions={<Link to="/statistiken">Alle Statistiken →</Link>}>
            {standings.every((s) => s.totalPoints === 0) ? (
              <EmptyState message="Noch keine Punkte vergeben – lege im Adminbereich Matches an." />
            ) : (
              <Podium entries={standings} />
            )}
            <div className={tableStyles.tableWrap} style={{ marginTop: 18 }}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Spieler</th>
                    <th className={tableStyles.num}>Einzel</th>
                    <th className={tableStyles.num}>Doppel</th>
                    <th className={tableStyles.num}>Predict.</th>
                    <th className={tableStyles.num}>Challenges</th>
                    <th className={tableStyles.num}>Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry) => (
                    <tr key={entry.playerId} className={entry.rank === 1 ? tableStyles.highlightRow : ""}>
                      <td className={tableStyles.rankCell}>{entry.rank}</td>
                      <td>
                        <Link className={tableStyles.playerLink} to={`/spieler/${entry.playerId}`}>
                          {entry.playerName}
                        </Link>
                      </td>
                      <td className={tableStyles.num}>{entry.singlesPoints}</td>
                      <td className={tableStyles.num}>{entry.doublesPoints}</td>
                      <td className={tableStyles.num}>{entry.predictionPoints}</td>
                      <td className={tableStyles.num}>{entry.challengePoints}</td>
                      <td className={tableStyles.num}>
                        <strong>{entry.totalPoints}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Letzte Ergebnisse">
            {recentMatches.length === 0 ? (
              <EmptyState message="Noch keine Ergebnisse erfasst." />
            ) : (
              recentMatches.map((match) => (
                <div key={match.id} className={styles.matchRow}>
                  <div className={styles.matchSides}>
                    <Badge variant={match.matchType === "singles" ? "neutral" : "accent"}>
                      {match.matchType === "singles" ? "Einzel" : "Doppel"}
                    </Badge>
                    {getMatchTitle(match, teams)}
                  </div>
                  <div>
                    <span className={styles.matchScore}>
                      {match.scoreA}:{match.scoreB}
                    </span>
                    <span className={styles.matchMeta}> · {roundLabel(match.matchType, match.round)}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div className={styles.stack}>
          <Card title="Nächstes Spiel">
            {nextMatch ? (
              <div className={styles.nextMatch}>
                <Badge variant={nextMatch.matchType === "singles" ? "neutral" : "accent"}>
                  {roundLabel(nextMatch.matchType, nextMatch.round)}
                </Badge>
                <div className={styles.nextMatchSides}>{getMatchTitle(nextMatch, teams)}</div>
              </div>
            ) : (
              <EmptyState message="Kein geplantes Spiel offen." />
            )}
          </Card>

          <Card title="Prediction Leaderboard">
            {predictionLeaderboard.every((p) => p.totalPoints === 0) && !predictionLeaderboard.some((p) => !p.pending) ? (
              <EmptyState message="Predictions werden nach Turnierende ausgewertet." />
            ) : (
              <div className={styles.miniList}>
                {predictionLeaderboard.map((p, i) => (
                  <div className={styles.miniRow} key={p.playerId}>
                    <span>
                      <span className={styles.miniRank}>{i + 1}.</span>
                      <Link className={tableStyles.playerLink} to={`/spieler/${p.playerId}`}>
                        {getPlayerName(p.playerId)}
                      </Link>
                    </span>
                    <span className={styles.miniValue}>{p.totalPoints} P</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={LEADERBOARD_LABELS.cups} actions={<IconCup width={16} height={16} />}>
            <MiniLeaderboard entries={topCups} suffix="Cups" />
          </Card>
          <Card title={LEADERBOARD_LABELS.wins} actions={<IconTrophy width={16} height={16} />}>
            <MiniLeaderboard entries={topWins} suffix="Siege" />
          </Card>
          <Card title={LEADERBOARD_LABELS.bounceHits} actions={<IconBounce width={16} height={16} />}>
            <MiniLeaderboard entries={topBounce} suffix="Treffer" />
          </Card>

          <Card title="Offene Side Challenges" subtitle="Noch von niemandem freigeschaltet">
            {openOneTimeChallenges.length === 0 ? (
              <EmptyState message="Alle einmaligen Challenges wurden bereits erreicht." />
            ) : (
              openOneTimeChallenges.map((c) => (
                <div className={styles.challengeChip} key={c.id}>
                  <span>{c.label}</span>
                  <Badge variant="accent">+{c.points}</Badge>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniLeaderboard({
  entries,
  suffix,
}: {
  entries: readonly { playerId: string; playerName: string; value: number; rank: number }[];
  suffix: string;
}) {
  if (entries.length === 0 || entries.every((e) => e.value === 0)) {
    return <EmptyState message="Noch keine Daten." />;
  }
  return (
    <div className={styles.miniList}>
      {entries.map((e) => (
        <div className={styles.miniRow} key={e.playerId}>
          <span>
            <span className={styles.miniRank}>{e.rank}.</span>
            <Link className={tableStyles.playerLink} to={`/spieler/${e.playerId}`}>
              {e.playerName}
            </Link>
          </span>
          <span className={styles.miniValue}>
            {Number.isInteger(e.value) ? e.value : e.value.toFixed(2)} {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
