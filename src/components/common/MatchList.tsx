import type { ReactNode } from "react";
import type { DoublesTeam, Match } from "../../types";
import { isMatchPlayed } from "../../logic/matchStatus";
import { roundLabel } from "../../constants/rounds";
import { getSideLabel } from "../../utils/matchLabels";
import { EmptyState } from "./EmptyState";
import styles from "./MatchList.module.css";

interface MatchListProps {
  readonly matches: readonly Match[];
  readonly teams?: readonly DoublesTeam[];
  readonly emptyMessage?: string;
  readonly showRound?: boolean;
  readonly renderActions?: (match: Match) => ReactNode;
}

export function MatchList({
  matches,
  teams = [],
  emptyMessage = "Keine Matches.",
  showRound = false,
  renderActions,
}: MatchListProps) {
  if (matches.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className={styles.list}>
      {matches.map((match) => {
        const played = isMatchPlayed(match);
        const winnerClass = played
          ? match.scoreA > match.scoreB
            ? styles.winnerA
            : styles.winnerB
          : "";
        return (
          <div key={match.id} className={`${styles.row} ${winnerClass}`}>
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
              {showRound && (
                <span className={styles.pending}>{roundLabel(match.matchType, match.round)}</span>
              )}
              {renderActions?.(match)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
