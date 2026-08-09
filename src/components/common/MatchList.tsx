import type { ReactNode } from "react";
import type { DoublesTeam, Match } from "../../types";
import { getPlayerName } from "../../constants/players";
import { isMatchPlayed } from "../../logic/matchStatus";
import { roundLabel } from "../../constants/rounds";
import { useMatchAchievements } from "../../hooks/useTournamentData";
import { getSideLabel } from "../../utils/matchLabels";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import styles from "./MatchList.module.css";

interface MatchListProps {
  readonly matches: readonly Match[];
  readonly teams?: readonly DoublesTeam[];
  readonly emptyMessage?: string;
  readonly showRound?: boolean;
  readonly showAchievements?: boolean;
  readonly renderActions?: (match: Match) => ReactNode;
}

export function MatchList({
  matches,
  teams = [],
  emptyMessage = "Keine Matches.",
  showRound = false,
  showAchievements = false,
  renderActions,
}: MatchListProps) {
  if (matches.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className={styles.list}>
      {matches.map((match) => (
        <MatchRow
          key={match.id}
          match={match}
          teams={teams}
          showRound={showRound}
          showAchievements={showAchievements}
          renderActions={renderActions}
        />
      ))}
    </div>
  );
}

function MatchRow({
  match,
  teams,
  showRound,
  showAchievements,
  renderActions,
}: {
  match: Match;
  teams: readonly DoublesTeam[];
  showRound: boolean;
  showAchievements: boolean;
  renderActions?: (match: Match) => ReactNode;
}) {
  const played = isMatchPlayed(match);
  const winnerClass = played ? (match.scoreA > match.scoreB ? styles.winnerA : styles.winnerB) : "";
  const achievements = useMatchAchievements(showAchievements ? match.id : "");

  return (
    <div className={`${styles.row} ${winnerClass}`}>
      <span className={`${styles.side} ${styles.sideA}`}>{getSideLabel(match.sideA, teams)}</span>
      {played ? (
        <span className={styles.score}>
          {match.scoreA}:{match.scoreB}
        </span>
      ) : (
        <span className={`${styles.score} ${styles.pending}`}>–:–</span>
      )}
      <span className={styles.side}>{getSideLabel(match.sideB, teams)}</span>
      <span className={styles.actions}>
        {showRound && <span className={styles.pending}>{roundLabel(match.matchType, match.round)}</span>}
        {renderActions?.(match)}
      </span>
      {showAchievements && achievements.length > 0 && (
        <div className={styles.challengeRow}>
          {achievements.map((a, i) => (
            <Badge key={i} variant="accent">
              {getPlayerName(a.playerId)}: {a.icon} {a.name} +{a.points}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
