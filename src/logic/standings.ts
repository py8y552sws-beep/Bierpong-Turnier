import { PLAYER_IDS } from "../constants/players";
import { getPlayerName } from "../constants/players";
import type { DoublesTeam, Match, PlayerId, Prediction } from "../types";
import { calculateBaseStandingTotals } from "./baseTotals";
import { calculateChallengePoints } from "./challenges";
import { calculatePredictionPoints } from "./predictions";
import { calculateDoublesPoints, calculateSinglesPoints } from "./tournamentPoints";

export interface PlayerStandingEntry {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly rank: number;
  readonly singlesPoints: number;
  readonly doublesPoints: number;
  readonly predictionPoints: number;
  readonly challengePoints: number;
  readonly totalPoints: number;
}

/**
 * Berechnet die vollständige Gesamtwertung:
 * Gesamtpunkte = Einzelturnier + Doppelturnier + Predictions + Side Challenges.
 * Dies ist die einzige Stelle, an der die vier Komponenten zur Gesamtwertung
 * zusammengeführt werden. Sortiert absteigend nach Gesamtpunkten; bei
 * Punktgleichheit wird alphabetisch nach Name sortiert, um eine stabile
 * Reihenfolge zu garantieren.
 */
export function calculateOverallStandings(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): readonly PlayerStandingEntry[] {
  const singles = calculateSinglesPoints(matches);
  const doubles = calculateDoublesPoints(matches, teams);
  const challenges = calculateChallengePoints(matches);
  const predictionPoints = calculatePredictionPoints(matches, teams, predictions);

  const entries = PLAYER_IDS.map((playerId) => {
    const singlesPoints = singles[playerId];
    const doublesPoints = doubles[playerId];
    const challengePoints = challenges[playerId];
    const predPoints = predictionPoints[playerId];
    return {
      playerId,
      playerName: getPlayerName(playerId),
      singlesPoints,
      doublesPoints,
      predictionPoints: predPoints,
      challengePoints,
      totalPoints: singlesPoints + doublesPoints + predPoints + challengePoints,
    };
  });

  entries.sort((a, b) => b.totalPoints - a.totalPoints || a.playerName.localeCompare(b.playerName));

  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Alias mit dem in der Spezifikation genannten Funktionsnamen. */
export function calculateStandings(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): readonly PlayerStandingEntry[] {
  return calculateOverallStandings(matches, teams, predictions);
}

export function calculateOverallRanking(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): readonly PlayerStandingEntry[] {
  return calculateOverallStandings(matches, teams, predictions);
}

export { calculateBaseStandingTotals };
