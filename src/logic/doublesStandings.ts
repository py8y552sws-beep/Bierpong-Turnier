import { getTeamLabel } from "../utils/matchLabels";
import type { DoublesTeam, Match, TeamId } from "../types";
import { getPlayedMatches } from "./matchStatus";

export interface DoublesStandingEntry {
  readonly teamId: TeamId;
  readonly teamName: string;
  readonly wins: number;
  readonly losses: number;
  readonly cupsFor: number;
  readonly cupsAgainst: number;
  readonly diff: number;
}

/**
 * Abschlusstabelle des Doppelturniers, ausschließlich aus gespielten
 * Rundenspielen (Hin- und Rückrunde) berechnet. Einzige Quelle für
 * die Doppel-Platzierung (siehe calculateDoublesTeamPlacements).
 */
export function calculateDoublesStandings(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): readonly DoublesStandingEntry[] {
  const stats = new Map<TeamId, { wins: number; losses: number; cupsFor: number; cupsAgainst: number }>(
    teams.map((t) => [t.id, { wins: 0, losses: 0, cupsFor: 0, cupsAgainst: 0 }]),
  );

  const roundRobinMatches = getPlayedMatches(matches).filter(
    (m) => m.matchType === "doubles" && (m.round === "round_robin_1" || m.round === "round_robin_2"),
  );

  for (const match of roundRobinMatches) {
    const teamAId = match.sideA.teamId;
    const teamBId = match.sideB.teamId;
    if (!teamAId || !teamBId) continue;
    const statA = stats.get(teamAId);
    const statB = stats.get(teamBId);
    if (!statA || !statB) continue;

    statA.cupsFor += match.scoreA;
    statA.cupsAgainst += match.scoreB;
    statB.cupsFor += match.scoreB;
    statB.cupsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      statA.wins += 1;
      statB.losses += 1;
    } else {
      statB.wins += 1;
      statA.losses += 1;
    }
  }

  return teams
    .map((team) => {
      const s = stats.get(team.id);
      const wins = s?.wins ?? 0;
      const losses = s?.losses ?? 0;
      const cupsFor = s?.cupsFor ?? 0;
      const cupsAgainst = s?.cupsAgainst ?? 0;
      return {
        teamId: team.id,
        teamName: getTeamLabel(team),
        wins,
        losses,
        cupsFor,
        cupsAgainst,
        diff: cupsFor - cupsAgainst,
      };
    })
    .sort(
      (a, b) => b.wins - a.wins || b.diff - a.diff || b.cupsFor - a.cupsFor || a.teamName.localeCompare(b.teamName),
    );
}
