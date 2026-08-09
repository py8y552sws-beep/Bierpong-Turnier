import { PLAYER_IDS } from "../constants/players";
import { getPlayerName } from "../constants/players";
import type { DoublesTeam, Match, PlayerId, Prediction } from "../types";
import { calculateAchievementPoints } from "./achievements";
import { calculateBaseStandingTotals } from "./baseTotals";
import { calculatePredictionPoints } from "./predictions";
import { calculateDoublesPoints, calculateSinglesPoints } from "./tournamentPoints";

export interface PlayerStandingEntry {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly rank: number;
  readonly singlesPoints: number;
  readonly doublesPoints: number;
  readonly predictionPoints: number;
  readonly achievementPoints: number;
  readonly totalPoints: number;
}

/**
 * Berechnet die vollständige Gesamtwertung:
 * Gesamtpunkte = Einzelturnier + Doppelturnier + Predictions + Achievements.
 * Dies ist die einzige Stelle, an der die vier Komponenten zur Gesamtwertung
 * zusammengeführt werden. Sortiert absteigend nach Gesamtpunkten; bei
 * Punktgleichheit entscheiden zuerst mehr Einzelpunkte, dann mehr
 * Doppelpunkte, dann mehr Achievementpunkte, dann mehr Predictionpunkte –
 * erst danach greift der Name als letzter, rein stabilisierender Fallback.
 */
export function calculateOverallStandings(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): readonly PlayerStandingEntry[] {
  const singles = calculateSinglesPoints(matches);
  const doubles = calculateDoublesPoints(matches, teams);
  const achievements = calculateAchievementPoints(matches);
  const predictionPoints = calculatePredictionPoints(matches, teams, predictions);

  const entries = PLAYER_IDS.map((playerId) => {
    const singlesPoints = singles[playerId];
    const doublesPoints = doubles[playerId];
    const achievementPoints = achievements[playerId];
    const predPoints = predictionPoints[playerId];
    return {
      playerId,
      playerName: getPlayerName(playerId),
      singlesPoints,
      doublesPoints,
      predictionPoints: predPoints,
      achievementPoints,
      totalPoints: singlesPoints + doublesPoints + predPoints + achievementPoints,
    };
  });

  entries.sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.singlesPoints - a.singlesPoints ||
      b.doublesPoints - a.doublesPoints ||
      b.achievementPoints - a.achievementPoints ||
      b.predictionPoints - a.predictionPoints ||
      a.playerName.localeCompare(b.playerName),
  );

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
