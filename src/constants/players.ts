import type { Player, PlayerId } from "../types";

/**
 * Zentrale, unveränderliche Spielerliste. Einzige Quelle der Wahrheit für
 * alle acht Teilnehmer – wird überall in der App wiederverwendet
 * (Predictions, Turniere, Statistiken, Admin).
 */
export const PLAYERS: readonly Player[] = [
  { id: "flo", name: "Flo" },
  { id: "alex", name: "Alex" },
  { id: "simon", name: "Simon" },
  { id: "jonas", name: "Jonas" },
  { id: "steffen", name: "Steffen" },
  { id: "tobi", name: "Tobi" },
  { id: "niclas", name: "Niclas" },
  { id: "fynn", name: "Fynn" },
] as const;

export const PLAYER_IDS: readonly PlayerId[] = PLAYERS.map((p) => p.id);

const PLAYER_MAP: ReadonlyMap<PlayerId, Player> = new Map(
  PLAYERS.map((p) => [p.id, p]),
);

export function getPlayer(id: PlayerId): Player {
  const player = PLAYER_MAP.get(id);
  if (!player) throw new Error(`Unbekannte Spieler-ID: ${id}`);
  return player;
}

export function getPlayerName(id: PlayerId): string {
  return getPlayer(id).name;
}

export function isPlayerId(value: string): value is PlayerId {
  return PLAYER_MAP.has(value as PlayerId);
}
