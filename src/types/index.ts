/**
 * Zentrale Typdefinitionen der Beer Pong Championship App.
 * Diese Datei ist die Single Source of Truth für alle Domänen-Typen.
 */

export type PlayerId =
  | "flo"
  | "alex"
  | "simon"
  | "jonas"
  | "steffen"
  | "tobi"
  | "niclas"
  | "fynn";

export interface Player {
  readonly id: PlayerId;
  readonly name: string;
}

export type TeamId = string;

/**
 * Ein Doppel-Team aus genau zwei Spielern, im Adminbereich festgelegt.
 * `name` ist optional und frei durch das Team selbst wählbar; ohne
 * eigenen Namen wird die Spielerpaarung als Anzeigename verwendet.
 */
export interface DoublesTeam {
  readonly id: TeamId;
  readonly playerIds: readonly [PlayerId, PlayerId];
  readonly name?: string;
}

export type MatchType = "singles" | "doubles";

/**
 * Turnierrunden. Die "terminalen" Platzierungsspiele (final, third_place,
 * fifth_place, seventh_place) bestimmen die Einzel-Endplatzierung
 * automatisch. "semifinal" bezeichnet das Halbfinale um Platz 1-4,
 * "consolation_semifinal" das Halbfinale der Vorrundenletzten um Platz 5-8.
 */
export type SinglesRound =
  | "group"
  | "semifinal"
  | "consolation_semifinal"
  | "final"
  | "third_place"
  | "fifth_place"
  | "seventh_place";

/**
 * Das Doppelturnier besteht ausschließlich aus einer Punktrunde (jedes
 * Team spielt einmal gegen jedes andere); die Endplatzierung ergibt sich
 * automatisch aus der Abschlusstabelle, es gibt keine K.O.-Phase.
 */
export type DoublesRound = "round_robin";

export type MatchRound = SinglesRound | DoublesRound;

/** Teilnehmer einer Matchseite: 1 Spieler (Einzel) oder 2 Spieler (Doppel). */
export interface MatchSide {
  readonly playerIds: readonly PlayerId[];
  /** Nur bei Doppel-Matches gesetzt: das Team, das diese Seite bildet. */
  readonly teamId?: TeamId;
}

/** Pro Spieler erfasste Leistungsdaten innerhalb eines einzelnen Matches. */
export interface MatchPlayerStat {
  readonly playerId: PlayerId;
  readonly cups: number;
  readonly bounceHits: number;
  readonly longestStreak: number;
}

/**
 * Ein Match kann zunächst ohne Ergebnis angelegt werden (geplantes Spiel,
 * "Nächstes Spiel" auf dem Dashboard) und später über "Ergebnis eintragen"
 * abgeschlossen werden. scoreA/scoreB sind erst dann gesetzt; erst dann
 * fließt das Match in sämtliche Berechnungen (Statistiken, Platzierungen,
 * Punkte) ein.
 */
export interface Match {
  readonly id: string;
  readonly matchType: MatchType;
  readonly round: MatchRound;
  readonly sideA: MatchSide;
  readonly sideB: MatchSide;
  readonly scoreA: number | null;
  readonly scoreB: number | null;
  readonly playerStats: readonly MatchPlayerStat[];
  readonly createdAt: string;
}

export type MatchWinnerSide = "A" | "B";

/** Eingabedaten zum Anlegen/Bearbeiten eines Matches im Adminbereich. */
export interface MatchInput {
  readonly matchType: MatchType;
  readonly round: MatchRound;
  readonly sideA: MatchSide;
  readonly sideB: MatchSide;
  readonly scoreA: number | null;
  readonly scoreB: number | null;
  readonly playerStats: readonly MatchPlayerStat[];
}

/** Die zehn Tipp-Kategorien, die jeder Spieler vor Turnierbeginn abgibt. */
export interface Prediction {
  readonly playerId: PlayerId;
  singlesWinner: PlayerId | null;
  doublesWinner: TeamId | null;
  singlesSemifinalists: readonly PlayerId[];
  doublesFinalists: readonly TeamId[];
  singlesLastPlace: PlayerId | null;
  overallLastPlace: PlayerId | null;
  overallWinner: PlayerId | null;
  mostCups: PlayerId | null;
  mostWins: PlayerId | null;
  mostLosses: PlayerId | null;
}

export type PredictionCategory =
  | "singlesWinner"
  | "doublesWinner"
  | "singlesSemifinalists"
  | "doublesFinalists"
  | "singlesLastPlace"
  | "overallLastPlace"
  | "overallWinner"
  | "mostCups"
  | "mostWins"
  | "mostLosses";

export type RepeatableChallengeId = "streak_3" | "streak_5" | "bounce_hit";

export type OneTimeChallengeId =
  | "shutout"
  | "cups_25"
  | "cups_50"
  | "unbeaten_group"
  | "no_big_loss";

export type ChallengeId = RepeatableChallengeId | OneTimeChallengeId;

export interface ChallengeDefinition<T extends ChallengeId = ChallengeId> {
  readonly id: T;
  readonly label: string;
  readonly points: number;
  readonly repeatable: boolean;
}

/** Die komplette persistierte Rohdatenbasis der Anwendung. */
export interface TournamentData {
  readonly teams: readonly DoublesTeam[];
  readonly matches: readonly Match[];
  readonly predictions: Readonly<Record<PlayerId, Prediction>>;
}
