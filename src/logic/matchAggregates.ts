import { PLAYER_IDS } from "../constants/players";
import {
  MAX_LOSS_MARGIN_FOR_NO_BIG_LOSS,
  SHUTOUT_LOSING_SCORE,
  SHUTOUT_WINNING_SCORE,
  STREAK_3_THRESHOLD,
  STREAK_5_THRESHOLD,
} from "../constants/points";
import type { Match, MatchPlayerStat, MatchWinnerSide, PlayerId } from "../types";
import { getPlayedMatches, type PlayedMatch } from "./matchStatus";

/**
 * Alle aus den Matchdaten abgeleiteten Rohwerte eines Spielers.
 * Dies ist die EINZIGE Stelle, an der über Matches iteriert wird, um
 * Spielerstatistiken zu aggregieren. Alle weiteren Berechnungen (Challenges,
 * Leaderboards, Spielerprofil) bauen ausschließlich auf diesem Ergebnis auf.
 */
export interface PlayerMatchAggregate {
  readonly playerId: PlayerId;
  readonly matchIds: readonly string[];
  readonly matchesPlayed: number;
  readonly wins: number;
  readonly losses: number;
  readonly cups: number;
  readonly bounceHits: number;
  readonly longestStreakEver: number;
  /** Anzahl Matches, in denen mindestens ein 3er-Serie erzielt wurde. */
  readonly streak3Count: number;
  /** Anzahl Matches, in denen mindestens ein 5er-Serie erzielt wurde. */
  readonly streak5Count: number;
  readonly groupMatchesPlayed: number;
  readonly groupWins: number;
  readonly hasShutoutWin: boolean;
  /** Größte Cup-Differenz unter allen verlorenen Matches (null = keine Niederlage). */
  readonly maxLossMargin: number | null;
}

function emptyAggregate(playerId: PlayerId): {
  playerId: PlayerId;
  matchIds: string[];
  matchesPlayed: number;
  wins: number;
  losses: number;
  cups: number;
  bounceHits: number;
  longestStreakEver: number;
  streak3Count: number;
  streak5Count: number;
  groupMatchesPlayed: number;
  groupWins: number;
  hasShutoutWin: boolean;
  maxLossMargin: number | null;
} {
  return {
    playerId,
    matchIds: [],
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    cups: 0,
    bounceHits: 0,
    longestStreakEver: 0,
    streak3Count: 0,
    streak5Count: 0,
    groupMatchesPlayed: 0,
    groupWins: 0,
    hasShutoutWin: false,
    maxLossMargin: null,
  };
}

function winnerSide(match: PlayedMatch): MatchWinnerSide {
  return match.scoreA > match.scoreB ? "A" : "B";
}

function findStat(match: PlayedMatch, playerId: PlayerId): MatchPlayerStat | undefined {
  return match.playerStats.find((s) => s.playerId === playerId);
}

/**
 * Berechnet für jeden Spieler die aggregierten Matchdaten. Nur Matches mit
 * eingetragenem Ergebnis fließen ein. Wird memoisiert über useMemo in den
 * konsumierenden Hooks aufgerufen, nie direkt in UI-Komponenten.
 */
export function calculatePlayerMatchAggregates(
  matches: readonly Match[],
): Readonly<Record<PlayerId, PlayerMatchAggregate>> {
  const result: Record<PlayerId, ReturnType<typeof emptyAggregate>> = Object.fromEntries(
    PLAYER_IDS.map((id) => [id, emptyAggregate(id)]),
  ) as Record<PlayerId, ReturnType<typeof emptyAggregate>>;

  for (const match of getPlayedMatches(matches)) {
    const winSide = winnerSide(match);
    const sides: Array<{ side: MatchWinnerSide; playerIds: readonly PlayerId[]; ownScore: number; oppScore: number }> = [
      { side: "A", playerIds: match.sideA.playerIds, ownScore: match.scoreA, oppScore: match.scoreB },
      { side: "B", playerIds: match.sideB.playerIds, ownScore: match.scoreB, oppScore: match.scoreA },
    ];

    for (const { side, playerIds, ownScore, oppScore } of sides) {
      const won = side === winSide;

      for (const playerId of playerIds) {
        const agg = result[playerId];
        if (!agg) continue;

        const stat = findStat(match, playerId);

        agg.matchIds.push(match.id);
        agg.matchesPlayed += 1;
        if (won) agg.wins += 1;
        else agg.losses += 1;

        if (stat) {
          agg.cups += stat.cups;
          agg.bounceHits += stat.bounceHits;
          agg.longestStreakEver = Math.max(agg.longestStreakEver, stat.longestStreak);
          if (stat.longestStreak >= STREAK_3_THRESHOLD) agg.streak3Count += 1;
          if (stat.longestStreak >= STREAK_5_THRESHOLD) agg.streak5Count += 1;
        }

        if (match.matchType === "singles" && match.round === "group") {
          agg.groupMatchesPlayed += 1;
          if (won) agg.groupWins += 1;
        }

        if (
          won &&
          ownScore === SHUTOUT_WINNING_SCORE &&
          oppScore === SHUTOUT_LOSING_SCORE
        ) {
          agg.hasShutoutWin = true;
        }

        if (!won) {
          const lossMargin = oppScore - ownScore;
          agg.maxLossMargin = agg.maxLossMargin === null
            ? lossMargin
            : Math.max(agg.maxLossMargin, lossMargin);
        }
      }
    }
  }

  return result;
}

export function winRate(aggregate: PlayerMatchAggregate): number {
  if (aggregate.matchesPlayed === 0) return 0;
  return aggregate.wins / aggregate.matchesPlayed;
}

export function averageCups(aggregate: PlayerMatchAggregate): number {
  if (aggregate.matchesPlayed === 0) return 0;
  return aggregate.cups / aggregate.matchesPlayed;
}

/** Jeder Spieler spielt in der Vorrunde gegen alle anderen 7 Spieler. */
export const SINGLES_GROUP_MATCHES_PER_PLAYER = PLAYER_IDS.length - 1;

/**
 * Erst wahr, wenn der Spieler seine komplette Vorrunde (alle 7 Spiele)
 * absolviert und dabei jedes einzelne gewonnen hat – nicht schon nach dem
 * ersten Sieg (sonst wäre die Challenge nach jedem Turnierstart-Sieg
 * fälschlich "erreicht", obwohl die Vorrunde noch läuft).
 */
export function isUnbeatenInGroupStage(aggregate: PlayerMatchAggregate): boolean {
  return (
    aggregate.groupMatchesPlayed === SINGLES_GROUP_MATCHES_PER_PLAYER &&
    aggregate.groupWins === SINGLES_GROUP_MATCHES_PER_PLAYER
  );
}

export function neverLostByMoreThan(
  aggregate: PlayerMatchAggregate,
  maxMargin: number = MAX_LOSS_MARGIN_FOR_NO_BIG_LOSS,
): boolean {
  return aggregate.matchesPlayed > 0 && (aggregate.maxLossMargin === null || aggregate.maxLossMargin <= maxMargin);
}
