import {
  DOUBLES_PLACEMENT_ROUNDS,
  SINGLES_PLACEMENT_ROUNDS,
} from "../constants/points";
import type { DoublesTeam, Match, PlayerId, TeamId } from "../types";
import { getPlayedMatches, type PlayedMatch } from "./matchStatus";

type PlacementRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const SINGLES_ROUND_RANKS: Readonly<Record<string, readonly [PlacementRank, PlacementRank]>> = {
  final: [1, 2],
  third_place: [3, 4],
  fifth_place: [5, 6],
  seventh_place: [7, 8],
};

const DOUBLES_ROUND_RANKS: Readonly<Record<string, readonly [PlacementRank, PlacementRank]>> = {
  final: [1, 2],
  third_place: [3, 4],
};

function winnerAndLoserPlayer(match: PlayedMatch): { winner: PlayerId; loser: PlayerId } {
  const winnerSide = match.scoreA > match.scoreB ? match.sideA : match.sideB;
  const loserSide = match.scoreA > match.scoreB ? match.sideB : match.sideA;
  const winner = winnerSide.playerIds[0];
  const loser = loserSide.playerIds[0];
  if (!winner || !loser) {
    throw new Error(`Einzel-Match ${match.id} hat keine gültigen Teilnehmer`);
  }
  return { winner, loser };
}

function winnerAndLoserTeam(match: PlayedMatch): { winner: TeamId; loser: TeamId } {
  const winnerSide = match.scoreA > match.scoreB ? match.sideA : match.sideB;
  const loserSide = match.scoreA > match.scoreB ? match.sideB : match.sideA;
  if (!winnerSide.teamId || !loserSide.teamId) {
    throw new Error(`Doppel-Match ${match.id} hat keine Team-Zuordnung`);
  }
  return { winner: winnerSide.teamId, loser: loserSide.teamId };
}

/**
 * Leitet die Endplatzierung (1-8) jedes Einzel-Spielers automatisch aus den
 * terminalen Platzierungsspielen (final, third_place, fifth_place,
 * seventh_place) ab. Nur Matches mit eingetragenem Ergebnis zählen. Spieler
 * ohne bekannte Platzierung fehlen im Ergebnis.
 */
export function calculateSinglesPlacements(
  matches: readonly Match[],
): Partial<Record<PlayerId, PlacementRank>> {
  const placements: Partial<Record<PlayerId, PlacementRank>> = {};

  for (const match of getPlayedMatches(matches)) {
    if (match.matchType !== "singles") continue;
    const ranks = SINGLES_ROUND_RANKS[match.round];
    if (!ranks) continue;
    const { winner, loser } = winnerAndLoserPlayer(match);
    placements[winner] = ranks[0];
    placements[loser] = ranks[1];
  }

  return placements;
}

/** Leitet die Endplatzierung (1-4) jedes Doppel-Teams automatisch aus final/third_place ab. */
export function calculateDoublesTeamPlacements(
  matches: readonly Match[],
): Partial<Record<TeamId, PlacementRank>> {
  const placements: Partial<Record<TeamId, PlacementRank>> = {};

  for (const match of getPlayedMatches(matches)) {
    if (match.matchType !== "doubles") continue;
    const ranks = DOUBLES_ROUND_RANKS[match.round];
    if (!ranks) continue;
    const { winner, loser } = winnerAndLoserTeam(match);
    placements[winner] = ranks[0];
    placements[loser] = ranks[1];
  }

  return placements;
}

/** Überträgt Team-Platzierungen auf die einzelnen Spieler jedes Teams. */
export function calculateDoublesPlayerPlacements(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): Partial<Record<PlayerId, PlacementRank>> {
  const teamPlacements = calculateDoublesTeamPlacements(matches);
  const result: Partial<Record<PlayerId, PlacementRank>> = {};

  for (const team of teams) {
    const rank = teamPlacements[team.id];
    if (rank === undefined) continue;
    for (const playerId of team.playerIds) {
      result[playerId] = rank;
    }
  }

  return result;
}

function hasPlayedRound(matches: readonly PlayedMatch[], matchType: "singles" | "doubles", round: string): boolean {
  return matches.some((m) => m.matchType === matchType && m.round === round);
}

export function isSinglesTournamentComplete(matches: readonly Match[]): boolean {
  const played = getPlayedMatches(matches);
  const placements = calculateSinglesPlacements(matches);
  return (
    SINGLES_PLACEMENT_ROUNDS.every((round) => hasPlayedRound(played, "singles", round)) &&
    Object.keys(placements).length === 8
  );
}

export function isDoublesTournamentComplete(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): boolean {
  if (teams.length !== 4) return false;
  const played = getPlayedMatches(matches);
  const placements = calculateDoublesTeamPlacements(matches);
  return (
    DOUBLES_PLACEMENT_ROUNDS.every((round) => hasPlayedRound(played, "doubles", round)) &&
    Object.keys(placements).length === 4
  );
}

/** Das gesamte Turnier gilt als beendet, sobald beide Wettbewerbe final entschieden sind. */
export function isTournamentComplete(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): boolean {
  return isSinglesTournamentComplete(matches) && isDoublesTournamentComplete(matches, teams);
}
