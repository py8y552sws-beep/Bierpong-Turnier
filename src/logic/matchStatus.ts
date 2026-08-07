import type { Match } from "../types";

export interface PlayedMatch extends Match {
  readonly scoreA: number;
  readonly scoreB: number;
}

/** Ein Match zählt erst dann in Statistiken/Platzierungen, wenn beide Ergebnisse gesetzt sind. */
export function isMatchPlayed(match: Match): match is PlayedMatch {
  return match.scoreA !== null && match.scoreB !== null;
}

export function getPlayedMatches(matches: readonly Match[]): readonly PlayedMatch[] {
  return matches.filter(isMatchPlayed);
}

export function getUpcomingMatches(matches: readonly Match[]): readonly Match[] {
  return matches.filter((m) => !isMatchPlayed(m)).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getNextUpcomingMatch(matches: readonly Match[]): Match | null {
  return getUpcomingMatches(matches)[0] ?? null;
}

export function getRecentPlayedMatches(matches: readonly Match[], limit: number): readonly PlayedMatch[] {
  return getPlayedMatches(matches)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
