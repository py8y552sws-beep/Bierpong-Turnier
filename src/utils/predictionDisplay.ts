import { getPlayerName, isPlayerId } from "../constants/players";
import type { DoublesTeam } from "../types";
import { getTeamById, getTeamLabel } from "./matchLabels";

/** Löst eine einzelne Prediction-ID (Spieler oder Team) in einen lesbaren Namen auf. */
export function describePredictionId(id: string, teams: readonly DoublesTeam[]): string {
  if (isPlayerId(id)) return getPlayerName(id);
  const team = getTeamById(teams, id);
  return team ? getTeamLabel(team) : id;
}

export function describePredictionValue(
  value: string | readonly string[] | null | undefined,
  teams: readonly DoublesTeam[],
): string {
  if (value === null || value === undefined) return "–";
  if (Array.isArray(value)) {
    return value.length === 0 ? "–" : value.map((v) => describePredictionId(v, teams)).join(", ");
  }
  return describePredictionId(value as string, teams);
}
