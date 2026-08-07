import { PLAYER_IDS } from "./players";
import type { PlayerId, Prediction } from "../types";

export function createEmptyPrediction(playerId: PlayerId): Prediction {
  return {
    playerId,
    singlesWinner: null,
    doublesWinner: null,
    singlesSemifinalists: [],
    doublesFinalists: [],
    singlesLastPlace: null,
    overallLastPlace: null,
    overallWinner: null,
    mostCups: null,
    mostWins: null,
    mostLosses: null,
  };
}

export function createEmptyPredictions(): Record<PlayerId, Prediction> {
  return Object.fromEntries(
    PLAYER_IDS.map((id) => [id, createEmptyPrediction(id)]),
  ) as Record<PlayerId, Prediction>;
}
