import type { ReactNode } from "react";
import type { DoublesTeam, Match } from "../../types";
import { getPlayerName } from "../../constants/players";
import { isMatchPlayed } from "../../logic/matchStatus";
import { roundLabel } from "../../constants/rounds";
import { useMatchChallenges } from "../../hooks/useTournamentData";
import { getSideLabel } from "../../utils/matchLabels";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import styles from "./MatchList.module.css";

interface MatchListProps {
  readonly matches: readonly Match[];
  readonly teams?: readonly DoublesTeam[];
  readonly emptyMessage?: string;
  readonly showRound?: boolean;
  readonly showChallenges?: boolean;
  readonly renderActions?: (match: Match) => ReactNode;
}

export function MatchList({
  matches,
  teams = [],
  emptyMessage = "Keine Matches.",
  showRound = false,
  showChallenges = false,
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
          showChallenges={showChallenges}
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
  showChallenges,
  renderActions,
}: {
  match: Match;
  teams: readonly DoublesTeam[];
  showRound: boolean;
  showChallenges: boolean;
  renderActions?: (match: Match) => ReactNode;
}) {
  const played = isMatchPlayed(match);
  const winnerClass = played ? (match.scoreA > match.scoreB ? styles.winnerA : styles.winnerB) : "";
  const challenges = useMatchChallenges(showChallenges ? match.id : "");

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
      {showChallenges && challenges.length > 0 && (
        <div className={styles.challengeRow}>
          {challenges.map((c, i) => (
            <Badge key={i} variant="accent">
              {getPlayerName(c.playerId)}: {c.label} +{c.points}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
