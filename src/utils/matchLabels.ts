import { getPlayerName } from "../constants/players";
import type { DoublesTeam, Match, MatchSide, PlayerId, TeamId } from "../types";

export function getTeamLabel(team: DoublesTeam): string {
  return team.playerIds.map(getPlayerName).join(" & ");
}

export function getTeamById(teams: readonly DoublesTeam[], teamId: TeamId): DoublesTeam | undefined {
  return teams.find((t) => t.id === teamId);
}

export function getSideLabel(side: MatchSide): string {
  return side.playerIds.map(getPlayerName).join(" & ");
}

export function getMatchTitle(match: Match): string {
  return `${getSideLabel(match.sideA)} vs. ${getSideLabel(match.sideB)}`;
}

export function playerIsInMatch(match: Match, playerId: PlayerId): boolean {
  return match.sideA.playerIds.includes(playerId) || match.sideB.playerIds.includes(playerId);
}
