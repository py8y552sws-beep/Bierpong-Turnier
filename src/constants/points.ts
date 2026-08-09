import type { PredictionCategory } from "../types";

/** Punktevergabe Einzelturnier nach Endplatzierung (1-8). */
export const SINGLES_PLACEMENT_POINTS: Readonly<Record<number, number>> = {
  1: 100,
  2: 80,
  3: 65,
  4: 55,
  5: 45,
  6: 35,
  7: 25,
  8: 15,
};

/** Punktevergabe Doppelturnier pro Spieler nach Team-Endplatzierung (1-4). */
export const DOUBLES_PLACEMENT_POINTS: Readonly<Record<number, number>> = {
  1: 80,
  2: 60,
  3: 40,
  4: 20,
};

/** Punkte für jede vollständig korrekte Prediction-Kategorie. */
export const PREDICTION_POINTS_PER_CATEGORY = 8;

export const PREDICTION_CATEGORIES: readonly PredictionCategory[] = [
  "singlesWinner",
  "doublesWinner",
  "singlesSemifinalists",
  "doublesFinalists",
  "singlesLastPlace",
  "overallLastPlace",
  "overallWinner",
  "mostCups",
  "mostWins",
  "mostLosses",
];

export const PREDICTION_CATEGORY_LABELS: Readonly<
  Record<PredictionCategory, string>
> = {
  singlesWinner: "Sieger Einzel",
  doublesWinner: "Sieger Doppel",
  singlesSemifinalists: "Halbfinale Einzel (4 Spieler)",
  doublesFinalists: "Finale Doppel (2 Teams)",
  singlesLastPlace: "Letzter Platz Einzel",
  overallLastPlace: "Letzter Platz Gesamtwertung",
  overallWinner: "Gewinner Gesamtwertung",
  mostCups: "Spieler mit den meisten Cups",
  mostWins: "Spieler mit den meisten Siegen",
  mostLosses: "Spieler mit den meisten Niederlagen",
};

/** Wählt die Prediction aus Spielern oder Doppel-Teams? */
export const PREDICTION_CATEGORY_TARGET: Readonly<Record<PredictionCategory, "player" | "team">> = {
  singlesWinner: "player",
  doublesWinner: "team",
  singlesSemifinalists: "player",
  doublesFinalists: "team",
  singlesLastPlace: "player",
  overallLastPlace: "player",
  overallWinner: "player",
  mostCups: "player",
  mostWins: "player",
  mostLosses: "player",
};

/** Anzahl erforderlicher Auswahlen je Kategorie (Sets werden ungeordnet verglichen). */
export const PREDICTION_CATEGORY_PICK_COUNT: Readonly<
  Record<PredictionCategory, number>
> = {
  singlesWinner: 1,
  doublesWinner: 1,
  singlesSemifinalists: 4,
  doublesFinalists: 2,
  singlesLastPlace: 1,
  overallLastPlace: 1,
  overallWinner: 1,
  mostCups: 1,
  mostWins: 1,
  mostLosses: 1,
};

/** Mindest-Streak-Längen für die Treffer-in-Folge-Statistik (siehe matchAggregates.ts). */
export const STREAK_3_THRESHOLD = 3;
export const STREAK_5_THRESHOLD = 5;

/** Endstand, der als "Shutout" zählt (Sieg zu Null). */
export const SHUTOUT_WINNING_SCORE = 10;
export const SHUTOUT_LOSING_SCORE = 0;

/** Maximale Cup-Differenz einer Niederlage für das "Fels in der Brandung"-Achievement. */
export const MAX_LOSS_MARGIN_FOR_NO_BIG_LOSS = 5;

/**
 * Terminale Einzel-Runden, aus denen sich Endplatzierungen automatisch
 * ergeben. Das Doppelturnier hat keine terminalen Runden – dort ergibt
 * sich die Platzierung direkt aus der Abschlusstabelle der Punktrunde
 * (siehe calculateDoublesStandings).
 */
export const SINGLES_PLACEMENT_ROUNDS = [
  "final",
  "third_place",
  "fifth_place",
  "seventh_place",
] as const;

/** Anzahl Runden-Matches im Doppel-Rundenturnier (4 Teams, Hin- und Rückrunde à je einmal gegeneinander). */
export const DOUBLES_ROUND_ROBIN_MATCH_COUNT = 12;

/** Anzahl Runden-Matches in der Einzel-Vorrunde (8 Spieler, jeder gegen jeden). */
export const SINGLES_ROUND_ROBIN_MATCH_COUNT = 28;
