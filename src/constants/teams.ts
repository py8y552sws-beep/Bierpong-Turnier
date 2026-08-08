import type { DoublesTeam } from "../types";

/**
 * Die vier Doppelteams stehen von Anfang an fest. Die Team-IDs sind
 * bewusst stabile, feste Slots ("team-1" .. "team-4") statt zufällig
 * generierter IDs, damit bereits erfasste Matches auch nach einer
 * erneuten Team-Zuordnung im Adminbereich ihren Bezug behalten.
 */
export const DEFAULT_DOUBLES_TEAMS: readonly DoublesTeam[] = [
  { id: "team-1", playerIds: ["alex", "flo"] },
  { id: "team-2", playerIds: ["simon", "steffen"] },
  { id: "team-3", playerIds: ["jonas", "fynn"] },
  { id: "team-4", playerIds: ["tobi", "niclas"] },
];
