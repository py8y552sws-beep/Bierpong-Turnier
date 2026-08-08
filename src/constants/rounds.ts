import type { DoublesRound, SinglesRound } from "../types";

export const SINGLES_ROUND_LABELS: Readonly<Record<SinglesRound, string>> = {
  group: "Vorrunde (Jeder gegen Jeden)",
  semifinal: "Halbfinale",
  consolation_semifinal: "Platzierungs-Halbfinale (5.-8.)",
  final: "Finale",
  third_place: "Spiel um Platz 3",
  fifth_place: "Spiel um Platz 5",
  seventh_place: "Spiel um Platz 7",
};

export const DOUBLES_ROUND_LABELS: Readonly<Record<DoublesRound, string>> = {
  round_robin: "Rundenspiele (Jeder gegen Jeden)",
};

export const SINGLES_ROUNDS: readonly SinglesRound[] = [
  "group",
  "semifinal",
  "consolation_semifinal",
  "final",
  "third_place",
  "fifth_place",
  "seventh_place",
];

export const DOUBLES_ROUNDS: readonly DoublesRound[] = ["round_robin"];

export function roundLabel(matchType: "singles" | "doubles", round: string): string {
  if (matchType === "singles") return SINGLES_ROUND_LABELS[round as SinglesRound] ?? round;
  return DOUBLES_ROUND_LABELS[round as DoublesRound] ?? round;
}
