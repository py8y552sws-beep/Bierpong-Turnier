import { PLAYER_IDS, getPlayerName } from "../constants/players";
import type { Match, PlayerId } from "../types";
import { averageCups, calculatePlayerMatchAggregates, winRate } from "./matchAggregates";

export type LeaderboardMetric =
  | "cups"
  | "wins"
  | "losses"
  | "bounceHits"
  | "winRate"
  | "averageCups"
  | "longestStreak"
  | "longestWinStreak"
  | "islandHits"
  | "bombHits"
  | "trickshotHits"
  | "noRerackWins";

export interface LeaderboardEntry {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly value: number;
  readonly rank: number;
}

export const LEADERBOARD_LABELS: Readonly<Record<LeaderboardMetric, string>> = {
  cups: "Meiste Cups",
  wins: "Meiste Siege",
  losses: "Meiste Niederlagen",
  bounceHits: "Meiste Bounce Treffer",
  winRate: "Beste Siegquote",
  averageCups: "Durchschnitt Cups",
  longestStreak: "Längste Treffer-Serie",
  longestWinStreak: "Längste Siegesserie",
  islandHits: "Meiste Island-Treffer",
  bombHits: "Meiste Bomben-Treffer",
  trickshotHits: "Meiste Trickshots",
  noRerackWins: "Meiste Siege ohne Umstellen",
};

function metricValue(
  metric: LeaderboardMetric,
  aggregate: ReturnType<typeof calculatePlayerMatchAggregates>[PlayerId],
): number {
  switch (metric) {
    case "cups":
      return aggregate.cups;
    case "wins":
      return aggregate.wins;
    case "losses":
      return aggregate.losses;
    case "bounceHits":
      return aggregate.bounceHits;
    case "winRate":
      return winRate(aggregate);
    case "averageCups":
      return averageCups(aggregate);
    case "longestStreak":
      return aggregate.longestStreakEver;
    case "longestWinStreak":
      return aggregate.longestWinStreakEver;
    case "islandHits":
      return aggregate.islandHits;
    case "bombHits":
      return aggregate.bombHits;
    case "trickshotHits":
      return aggregate.trickshotHits;
    case "noRerackWins":
      return aggregate.noRerackWins;
  }
}

/**
 * Berechnet ein Leaderboard für die angegebene Kennzahl ausschließlich aus
 * den Matchdaten. Absteigend sortiert, bei Gleichstand alphabetisch nach
 * Name für eine stabile Reihenfolge.
 */
export function calculateLeaderboard(
  matches: readonly Match[],
  metric: LeaderboardMetric,
): readonly LeaderboardEntry[] {
  const aggregates = calculatePlayerMatchAggregates(matches);

  const entries = PLAYER_IDS.map((playerId) => ({
    playerId,
    playerName: getPlayerName(playerId),
    value: metricValue(metric, aggregates[playerId]),
  }));

  entries.sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName));

  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function calculateAllLeaderboards(
  matches: readonly Match[],
): Readonly<Record<LeaderboardMetric, readonly LeaderboardEntry[]>> {
  const metrics = Object.keys(LEADERBOARD_LABELS) as LeaderboardMetric[];
  return Object.fromEntries(
    metrics.map((metric) => [metric, calculateLeaderboard(matches, metric)]),
  ) as Record<LeaderboardMetric, readonly LeaderboardEntry[]>;
}
