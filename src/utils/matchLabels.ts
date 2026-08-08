import { getPlayerName } from "../constants/players";
import type { DoublesTeam, Match, MatchSide, PlayerId, TeamId } from "../types";

/** Anzeigename eines Teams: eigener Teamname, falls gesetzt, sonst die Spielerpaarung. */
export function getTeamLabel(team: DoublesTeam): string {
  const name = team.name?.trim();
  if (name) return name;
  return team.playerIds.map(getPlayerName).join(" & ");
}

export function getTeamById(teams: readonly DoublesTeam[], teamId: TeamId): DoublesTeam | undefined {
  return teams.find((t) => t.id === teamId);
}

/** Anzeigename einer Matchseite: bei Doppel-Seiten bevorzugt der Teamname. */
export function getSideLabel(side: MatchSide, teams: readonly DoublesTeam[] = []): string {
  if (side.teamId) {
    const team = getTeamById(teams, side.teamId);
    if (team) return getTeamLabel(team);
  }
  return side.playerIds.map(getPlayerName).join(" & ");
}

export function getMatchTitle(match: Match, teams: readonly DoublesTeam[] = []): string {
  return `${getSideLabel(match.sideA, teams)} vs. ${getSideLabel(match.sideB, teams)}`;
}

export function playerIsInMatch(match: Match, playerId: PlayerId): boolean {
  return match.sideA.playerIds.includes(playerId) || match.sideB.playerIds.includes(playerId);
}
