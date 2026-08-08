import type { Match, PlayerId, TeamId } from "../types";
import { getPlayedMatches } from "./matchStatus";

export interface FormEntry {
  readonly matchId: string;
  readonly result: "W" | "L";
  readonly margin: number;
}

const DEFAULT_FORM_LENGTH = 5;

/**
 * Die letzten Ergebnisse eines Spielers (älteste zuerst, aktuellstes
 * zuletzt), unabhängig davon ob Einzel oder Doppel. Grundlage der
 * "Formkurve" in der Schnelleingabe.
 */
export function calculatePlayerForm(
  matches: readonly Match[],
  playerId: PlayerId,
  limit = DEFAULT_FORM_LENGTH,
): readonly FormEntry[] {
  const played = getPlayedMatches(matches)
    .filter((m) => m.sideA.playerIds.includes(playerId) || m.sideB.playerIds.includes(playerId))
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return played.slice(-limit).map((m) => {
    const onSideA = m.sideA.playerIds.includes(playerId);
    const own = onSideA ? m.scoreA : m.scoreB;
    const opponent = onSideA ? m.scoreB : m.scoreA;
    return { matchId: m.id, result: own > opponent ? "W" : "L", margin: Math.abs(own - opponent) };
  });
}

/** Die letzten Ergebnisse eines Doppel-Teams (nur Rundenspiele). */
export function calculateTeamForm(
  matches: readonly Match[],
  teamId: TeamId,
  limit = DEFAULT_FORM_LENGTH,
): readonly FormEntry[] {
  const played = getPlayedMatches(matches)
    .filter((m) => m.matchType === "doubles" && (m.sideA.teamId === teamId || m.sideB.teamId === teamId))
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return played.slice(-limit).map((m) => {
    const onSideA = m.sideA.teamId === teamId;
    const own = onSideA ? m.scoreA : m.scoreB;
    const opponent = onSideA ? m.scoreB : m.scoreA;
    return { matchId: m.id, result: own > opponent ? "W" : "L", margin: Math.abs(own - opponent) };
  });
}
