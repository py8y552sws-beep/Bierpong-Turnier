import { PLAYER_IDS } from "../constants/players";
import type { DoublesTeam, Match, PlayerId } from "../types";
import { calculateChallengePoints } from "./challenges";
import { calculateDoublesPoints, calculateSinglesPoints } from "./tournamentPoints";

/**
 * Punktesumme aus Einzelturnier + Doppelturnier + Side Challenges, bewusst
 * OHNE Prediction-Punkte. Dient als Basis für die vollständige Gesamtwertung
 * (siehe standings.ts) und als Grundlage, gegen die die
 * "Gesamtwertung"-Predictions ausgewertet werden (siehe predictions.ts), um
 * einen Zirkelbezug zu vermeiden.
 */
export function calculateBaseStandingTotals(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): Readonly<Record<PlayerId, number>> {
  const singles = calculateSinglesPoints(matches);
  const doubles = calculateDoublesPoints(matches, teams);
  const challenges = calculateChallengePoints(matches);

  const totals = {} as Record<PlayerId, number>;
  for (const id of PLAYER_IDS) {
    totals[id] = singles[id] + doubles[id] + challenges[id];
  }
  return totals;
}
