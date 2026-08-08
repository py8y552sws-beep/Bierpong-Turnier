import { PLAYER_IDS } from "../constants/players";
import {
  PREDICTION_CATEGORIES,
  PREDICTION_CATEGORY_PICK_COUNT,
  PREDICTION_POINTS_PER_CATEGORY,
} from "../constants/points";
import type {
  DoublesTeam,
  Match,
  PlayerId,
  Prediction,
  PredictionCategory,
  TeamId,
} from "../types";
import { calculateBaseStandingTotals } from "./baseTotals";
import { calculatePlayerMatchAggregates } from "./matchAggregates";
import {
  calculateDoublesTeamPlacements,
  calculateSinglesPlacements,
  isTournamentComplete,
} from "./placements";

export interface PredictionCategoryResult {
  readonly category: PredictionCategory;
  readonly correct: boolean;
  readonly points: number;
}

export interface PlayerPredictionResult {
  readonly playerId: PlayerId;
  /** true, solange das Turnier noch nicht vollständig entschieden ist. */
  readonly pending: boolean;
  readonly categories: readonly PredictionCategoryResult[];
  readonly totalPoints: number;
}

/** Die tatsächlichen, aus den Matchdaten ermittelten Antworten aller Prediction-Kategorien. */
export interface ActualPredictionAnswers {
  readonly singlesWinner: PlayerId | null;
  readonly doublesWinner: TeamId | null;
  readonly singlesSemifinalists: readonly PlayerId[];
  readonly doublesFinalists: readonly TeamId[];
  readonly singlesLastPlace: PlayerId | null;
  readonly overallWinnerCandidates: readonly PlayerId[];
  readonly overallLastPlaceCandidates: readonly PlayerId[];
  readonly mostCupsCandidates: readonly PlayerId[];
  readonly mostWinsCandidates: readonly PlayerId[];
  readonly mostLossesCandidates: readonly PlayerId[];
}

function findExtremeCandidates(
  values: Readonly<Record<PlayerId, number>>,
  mode: "max" | "min",
): PlayerId[] {
  let extreme: number | null = null;
  for (const id of PLAYER_IDS) {
    const value = values[id];
    if (extreme === null) extreme = value;
    else if (mode === "max" && value > extreme) extreme = value;
    else if (mode === "min" && value < extreme) extreme = value;
  }
  if (extreme === null) return [];
  return PLAYER_IDS.filter((id) => values[id] === extreme);
}

function singlesSemifinalists(matches: readonly Match[]): PlayerId[] {
  const players = new Set<PlayerId>();
  for (const match of matches) {
    if (match.matchType === "singles" && match.round === "semifinal") {
      match.sideA.playerIds.forEach((id) => players.add(id));
      match.sideB.playerIds.forEach((id) => players.add(id));
    }
  }
  return [...players];
}

/**
 * "Finale Doppel" gibt es im reinen Punktrundenformat nicht mehr als
 * eigenes Match – als tatsächliche Antwort gelten die beiden Teams auf
 * Platz 1 und 2 der Abschlusstabelle (erst befüllt, wenn die Punktrunde
 * komplett gespielt ist).
 */
function doublesFinalists(
  doublesPlacements: Partial<Record<TeamId, number>>,
): TeamId[] {
  return Object.entries(doublesPlacements)
    .filter(([, rank]) => rank === 1 || rank === 2)
    .map(([teamId]) => teamId);
}

function playerAtRank(
  placements: Partial<Record<PlayerId, number>>,
  rank: number,
): PlayerId | null {
  const entry = Object.entries(placements).find(([, r]) => r === rank);
  return entry ? (entry[0] as PlayerId) : null;
}

/**
 * Ermittelt die tatsächlichen Antworten aller Prediction-Kategorien aus den
 * Matchdaten. "Gewinner/Letzter Platz Gesamtwertung" beziehen sich bewusst
 * auf die Basis-Gesamtwertung (Einzel + Doppel + Challenges, ohne
 * Prediction-Punkte), um einen Zirkelbezug zu vermeiden – Predictions werden
 * erst nach Turnierende (also nach Feststehen aller anderen Punkte)
 * ausgewertet.
 */
export function calculateActualPredictionAnswers(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
): ActualPredictionAnswers {
  const singlesPlacements = calculateSinglesPlacements(matches);
  const doublesPlacements = calculateDoublesTeamPlacements(matches, teams);
  const aggregates = calculatePlayerMatchAggregates(matches);
  const baseTotals = calculateBaseStandingTotals(matches, teams);

  const cups = Object.fromEntries(PLAYER_IDS.map((id) => [id, aggregates[id].cups])) as Record<PlayerId, number>;
  const wins = Object.fromEntries(PLAYER_IDS.map((id) => [id, aggregates[id].wins])) as Record<PlayerId, number>;
  const losses = Object.fromEntries(PLAYER_IDS.map((id) => [id, aggregates[id].losses])) as Record<PlayerId, number>;

  return {
    singlesWinner: playerAtRank(singlesPlacements, 1),
    doublesWinner: Object.entries(doublesPlacements).find(([, r]) => r === 1)?.[0] ?? null,
    singlesSemifinalists: singlesSemifinalists(matches),
    doublesFinalists: doublesFinalists(doublesPlacements),
    singlesLastPlace: playerAtRank(singlesPlacements, 8),
    overallWinnerCandidates: findExtremeCandidates(baseTotals, "max"),
    overallLastPlaceCandidates: findExtremeCandidates(baseTotals, "min"),
    mostCupsCandidates: findExtremeCandidates(cups, "max"),
    mostWinsCandidates: findExtremeCandidates(wins, "max"),
    mostLossesCandidates: findExtremeCandidates(losses, "max"),
  };
}

function isCategoryCorrect(
  category: PredictionCategory,
  prediction: Prediction,
  actual: ActualPredictionAnswers,
): boolean {
  switch (category) {
    case "singlesWinner":
      return prediction.singlesWinner !== null && prediction.singlesWinner === actual.singlesWinner;
    case "doublesWinner":
      return prediction.doublesWinner !== null && prediction.doublesWinner === actual.doublesWinner;
    case "singlesLastPlace":
      return prediction.singlesLastPlace !== null && prediction.singlesLastPlace === actual.singlesLastPlace;
    case "singlesSemifinalists":
      return (
        prediction.singlesSemifinalists.length === 4 &&
        actual.singlesSemifinalists.length === 4 &&
        sameSet(prediction.singlesSemifinalists, actual.singlesSemifinalists)
      );
    case "doublesFinalists":
      return (
        prediction.doublesFinalists.length === 2 &&
        actual.doublesFinalists.length === 2 &&
        sameSet(prediction.doublesFinalists, actual.doublesFinalists)
      );
    case "overallWinner":
      return prediction.overallWinner !== null && actual.overallWinnerCandidates.includes(prediction.overallWinner);
    case "overallLastPlace":
      return prediction.overallLastPlace !== null && actual.overallLastPlaceCandidates.includes(prediction.overallLastPlace);
    case "mostCups":
      return prediction.mostCups !== null && actual.mostCupsCandidates.includes(prediction.mostCups);
    case "mostWins":
      return prediction.mostWins !== null && actual.mostWinsCandidates.includes(prediction.mostWins);
    case "mostLosses":
      return prediction.mostLosses !== null && actual.mostLossesCandidates.includes(prediction.mostLosses);
  }
}

/** Prüft, ob ein Spieler in allen 10 Kategorien einen Tipp abgegeben hat. */
export function isPredictionComplete(prediction: Prediction): boolean {
  return PREDICTION_CATEGORIES.every((category) => {
    const value = prediction[category];
    const required = PREDICTION_CATEGORY_PICK_COUNT[category];
    return required === 1 ? value !== null : Array.isArray(value) && value.length === required;
  });
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((item) => setB.has(item));
}

/**
 * Wertet die Predictions aller Spieler aus. Solange das Turnier nicht
 * abgeschlossen ist, bleiben alle Kategorien "pending" und tragen 0 Punkte
 * bei – erst nach Turnierende erfolgt die vollständige, automatische
 * Auswertung.
 */
export function calculatePredictionResults(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): Readonly<Record<PlayerId, PlayerPredictionResult>> {
  const complete = isTournamentComplete(matches, teams);
  const actual = complete ? calculateActualPredictionAnswers(matches, teams) : null;

  const result = {} as Record<PlayerId, PlayerPredictionResult>;

  for (const playerId of PLAYER_IDS) {
    const prediction = predictions[playerId];
    const categories: PredictionCategoryResult[] = PREDICTION_CATEGORIES.map((category) => {
      const correct = complete && actual && prediction ? isCategoryCorrect(category, prediction, actual) : false;
      return { category, correct, points: correct ? PREDICTION_POINTS_PER_CATEGORY : 0 };
    });

    result[playerId] = {
      playerId,
      pending: !complete,
      categories,
      totalPoints: categories.reduce((sum, c) => sum + c.points, 0),
    };
  }

  return result;
}

/** Reine Punktzahl je Spieler, abgeleitet aus calculatePredictionResults(). */
export function calculatePredictionPoints(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): Readonly<Record<PlayerId, number>> {
  const results = calculatePredictionResults(matches, teams, predictions);
  const points = {} as Record<PlayerId, number>;
  for (const playerId of PLAYER_IDS) {
    points[playerId] = results[playerId].totalPoints;
  }
  return points;
}
