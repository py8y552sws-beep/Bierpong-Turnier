import { PLAYER_IDS } from "../constants/players";
import { DOUBLES_PLACEMENT_POINTS, SINGLES_PLACEMENT_POINTS } from "../constants/points";
import type { DoublesTeam, Match, PlayerId } from "../types";
import {
  calculateDoublesPlayerPlacements,
  calculateSinglesPlacements,
} from "./placements";

function zeroedPlayerRecord(): Record<PlayerId, number> {
  return Object.fromEntries(PLAYER_IDS.map((id) => [id, 0])) as Record<PlayerId, number>;
}

/** Punkte aus dem Einzelturnier je Spieler, ausschließlich aus der Platzierung abgeleitet. */
export function calculateSinglesPoints(
  matches: readonly Match[],
): Readonly<Record<PlayerId, number>> {
  const points = zeroedPlayerRecord();
  const placements = calculateSinglesPlacements(matches);

  for (const [playerId, rank] of Object.entries(placements) as [PlayerId, number][]) {
    points[playerId] = SINGLES_PLACEMENT_POINTS[rank] ?? 0;
  }

  return points;
}

/** Punkte aus dem Doppelturnier je Spieler, aus der Team-Platzierung abgeleitet. */
export function calculateDoublesPoints(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): Readonly<Record<PlayerId, number>> {
  const points = zeroedPlayerRecord();
  const placements = calculateDoublesPlayerPlacements(matches, teams);

  for (const [playerId, rank] of Object.entries(placements) as [PlayerId, number][]) {
    points[playerId] = DOUBLES_PLACEMENT_POINTS[rank] ?? 0;
  }

  return points;
}
