import type {
  ChallengeDefinition,
  ChallengeId,
  OneTimeChallengeId,
  PredictionCategory,
  RepeatableChallengeId,
} from "../types";

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

export const REPEATABLE_CHALLENGES: Readonly<
  Record<RepeatableChallengeId, ChallengeDefinition<RepeatableChallengeId>>
> = {
  streak_3: { id: "streak_3", label: "3 Treffer in Folge", points: 2, repeatable: true },
  streak_5: { id: "streak_5", label: "5 Treffer in Folge", points: 5, repeatable: true },
  bounce_hit: { id: "bounce_hit", label: "Bounce Treffer", points: 1, repeatable: true },
};

export const ONE_TIME_CHALLENGES: Readonly<
  Record<OneTimeChallengeId, ChallengeDefinition<OneTimeChallengeId>>
> = {
  shutout: { id: "shutout", label: "Shutout (10:0)", points: 10, repeatable: false },
  cups_25: { id: "cups_25", label: "25 Cups", points: 5, repeatable: false },
  cups_50: { id: "cups_50", label: "50 Cups", points: 10, repeatable: false },
  unbeaten_group: {
    id: "unbeaten_group",
    label: "Ungeschlagen Gruppenphase",
    points: 8,
    repeatable: false,
  },
  no_big_loss: {
    id: "no_big_loss",
    label: "Kein Spiel mit mehr als 5 Cups Unterschied verloren",
    points: 6,
    repeatable: false,
  },
};

export const ALL_CHALLENGES: Readonly<Record<ChallengeId, ChallengeDefinition>> = {
  ...REPEATABLE_CHALLENGES,
  ...ONE_TIME_CHALLENGES,
};

/** Cup-Schwellenwerte, ab denen die jeweilige One-Time-Challenge greift. */
export const CUPS_25_THRESHOLD = 25;
export const CUPS_50_THRESHOLD = 50;

/** Mindest-Streak-Längen für die Treffer-in-Folge-Challenges. */
export const STREAK_3_THRESHOLD = 3;
export const STREAK_5_THRESHOLD = 5;

/** Endstand, der als "Shutout" zählt (Sieg zu Null). */
export const SHUTOUT_WINNING_SCORE = 10;
export const SHUTOUT_LOSING_SCORE = 0;

/** Maximale Cup-Differenz einer Niederlage für die "No Big Loss"-Challenge. */
export const MAX_LOSS_MARGIN_FOR_NO_BIG_LOSS = 5;

/** Terminale Runden, aus denen sich Endplatzierungen automatisch ergeben. */
export const SINGLES_PLACEMENT_ROUNDS = [
  "final",
  "third_place",
  "fifth_place",
  "seventh_place",
] as const;

export const DOUBLES_PLACEMENT_ROUNDS = ["final", "third_place"] as const;
