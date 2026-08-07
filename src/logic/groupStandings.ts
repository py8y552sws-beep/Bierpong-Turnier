import { getPlayerName, PLAYER_IDS } from "../constants/players";
import type { Match, PlayerId } from "../types";
import { getPlayedMatches } from "./matchStatus";

export interface GroupStandingEntry {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly wins: number;
  readonly losses: number;
  readonly cupsFor: number;
  readonly cupsAgainst: number;
  readonly diff: number;
}

/**
 * Tabelle der Einzel-Gruppenphase, ausschließlich aus Matches mit
 * round === "group" berechnet. Dient der Anzeige und als Grundlage der
 * "Ungeschlagen Gruppenphase"-Challenge-Anzeige im Turnierüberblick.
 */
export function calculateSinglesGroupStandings(
  matches: readonly Match[],
): readonly GroupStandingEntry[] {
  const groupMatches = getPlayedMatches(matches).filter(
    (m) => m.matchType === "singles" && m.round === "group",
  );

  const stats = new Map<PlayerId, { wins: number; losses: number; cupsFor: number; cupsAgainst: number }>(
    PLAYER_IDS.map((id) => [id, { wins: 0, losses: 0, cupsFor: 0, cupsAgainst: 0 }]),
  );
  const participants = new Set<PlayerId>();

  for (const match of groupMatches) {
    const playerA = match.sideA.playerIds[0];
    const playerB = match.sideB.playerIds[0];
    if (!playerA || !playerB) continue;
    const statA = stats.get(playerA);
    const statB = stats.get(playerB);
    if (!statA || !statB) continue;

    participants.add(playerA);
    participants.add(playerB);

    statA.cupsFor += match.scoreA;
    statA.cupsAgainst += match.scoreB;
    statB.cupsFor += match.scoreB;
    statB.cupsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      statA.wins += 1;
      statB.losses += 1;
    } else {
      statB.wins += 1;
      statA.losses += 1;
    }
  }

  return PLAYER_IDS.filter((id) => participants.has(id))
    .map((playerId) => {
      const s = stats.get(playerId);
      const wins = s?.wins ?? 0;
      const losses = s?.losses ?? 0;
      const cupsFor = s?.cupsFor ?? 0;
      const cupsAgainst = s?.cupsAgainst ?? 0;
      return {
        playerId,
        playerName: getPlayerName(playerId),
        wins,
        losses,
        cupsFor,
        cupsAgainst,
        diff: cupsFor - cupsAgainst,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.cupsFor - a.cupsFor);
}
