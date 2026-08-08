import { PLAYER_IDS } from "../constants/players";
import {
  CUPS_25_THRESHOLD,
  CUPS_50_THRESHOLD,
  ONE_TIME_CHALLENGES,
  REPEATABLE_CHALLENGES,
} from "../constants/points";
import type { Match, OneTimeChallengeId, PlayerId, RepeatableChallengeId } from "../types";
import {
  calculatePlayerMatchAggregates,
  isUnbeatenInGroupStage,
  neverLostByMoreThan,
  type PlayerMatchAggregate,
} from "./matchAggregates";
import { hasRemainingMatches } from "./matchStatus";

export interface RepeatableChallengeProgress {
  readonly id: RepeatableChallengeId;
  readonly label: string;
  readonly count: number;
  readonly points: number;
}

export interface OneTimeChallengeProgress {
  readonly id: OneTimeChallengeId;
  readonly label: string;
  readonly achieved: boolean;
  readonly points: number;
}

export interface PlayerChallengeSummary {
  readonly playerId: PlayerId;
  readonly repeatable: readonly RepeatableChallengeProgress[];
  readonly oneTime: readonly OneTimeChallengeProgress[];
  readonly totalPoints: number;
}

function repeatableProgress(aggregate: PlayerMatchAggregate): RepeatableChallengeProgress[] {
  const counts: Record<RepeatableChallengeId, number> = {
    streak_3: aggregate.streak3Count,
    streak_5: aggregate.streak5Count,
    bounce_hit: aggregate.bounceHits,
  };

  return Object.values(REPEATABLE_CHALLENGES).map((def) => ({
    id: def.id,
    label: def.label,
    count: counts[def.id],
    points: counts[def.id] * def.points,
  }));
}

function oneTimeProgress(
  aggregate: PlayerMatchAggregate,
  matches: readonly Match[],
): OneTimeChallengeProgress[] {
  // "Kein Spiel mit mehr als 5 Cups Unterschied verloren" ist eine
  // Aussage über die GESAMTE Turnierteilnahme dieses Spielers und darf
  // daher erst gelten, wenn keine weiteren Spiele mehr für ihn anstehen –
  // sonst wäre sie nach dem allerersten Spiel ohne große Niederlage schon
  // (verfrüht) erfüllt.
  const noBigLoss = neverLostByMoreThan(aggregate) && !hasRemainingMatches(matches, aggregate.playerId);

  const achieved: Record<OneTimeChallengeId, boolean> = {
    shutout: aggregate.hasShutoutWin,
    cups_25: aggregate.cups >= CUPS_25_THRESHOLD,
    cups_50: aggregate.cups >= CUPS_50_THRESHOLD,
    unbeaten_group: isUnbeatenInGroupStage(aggregate),
    no_big_loss: noBigLoss,
  };

  return Object.values(ONE_TIME_CHALLENGES).map((def) => ({
    id: def.id,
    label: def.label,
    achieved: achieved[def.id],
    points: achieved[def.id] ? def.points : 0,
  }));
}

/**
 * Berechnet für jeden Spieler den vollständigen Side-Challenge-Fortschritt.
 * Baut ausschließlich auf calculatePlayerMatchAggregates() auf – es wird an
 * keiner Stelle erneut über die Matchliste iteriert.
 */
export function calculateChallengeSummaries(
  matches: readonly Match[],
): Readonly<Record<PlayerId, PlayerChallengeSummary>> {
  const aggregates = calculatePlayerMatchAggregates(matches);

  const result = {} as Record<PlayerId, PlayerChallengeSummary>;
  for (const playerId of PLAYER_IDS) {
    const aggregate = aggregates[playerId];
    const repeatable = repeatableProgress(aggregate);
    const oneTime = oneTimeProgress(aggregate, matches);
    const totalPoints =
      repeatable.reduce((sum, c) => sum + c.points, 0) +
      oneTime.reduce((sum, c) => sum + c.points, 0);

    result[playerId] = { playerId, repeatable, oneTime, totalPoints };
  }

  return result;
}

/** Reine Punktzahl je Spieler, abgeleitet aus calculateChallengeSummaries(). */
export function calculateChallengePoints(
  matches: readonly Match[],
): Readonly<Record<PlayerId, number>> {
  const summaries = calculateChallengeSummaries(matches);
  const result = {} as Record<PlayerId, number>;
  for (const playerId of PLAYER_IDS) {
    result[playerId] = summaries[playerId].totalPoints;
  }
  return result;
}

export interface MatchChallengeEntry {
  readonly playerId: PlayerId;
  readonly label: string;
  readonly points: number;
}

/**
 * Ermittelt, welche Side-Challenge-Punkte ein einzelnes Match beigetragen
 * hat: der Unterschied im Challenge-Fortschritt mit und ohne dieses Match.
 * Erklärt z.B., woher Challenge-Punkte eines Spielers kommen, der das
 * Match verloren hat (etwa Bounce-Treffer, die unabhängig vom Ausgang
 * zählen) – ohne die Challenge-Regeln an anderer Stelle zu duplizieren.
 */
export function calculateMatchChallenges(
  matches: readonly Match[],
  matchId: string,
): readonly MatchChallengeEntry[] {
  const target = matches.find((m) => m.id === matchId);
  if (!target) return [];

  const withMatch = calculateChallengeSummaries(matches);
  const withoutMatch = calculateChallengeSummaries(matches.filter((m) => m.id !== matchId));

  const players = [...target.sideA.playerIds, ...target.sideB.playerIds];
  const entries: MatchChallengeEntry[] = [];

  for (const playerId of players) {
    const before = withoutMatch[playerId];
    const after = withMatch[playerId];
    if (!before || !after) continue;

    for (const rep of after.repeatable) {
      const beforeCount = before.repeatable.find((r) => r.id === rep.id)?.count ?? 0;
      const deltaCount = rep.count - beforeCount;
      if (deltaCount > 0) {
        const pointsPerUnit = REPEATABLE_CHALLENGES[rep.id].points;
        entries.push({ playerId, label: `${rep.label} ×${deltaCount}`, points: deltaCount * pointsPerUnit });
      }
    }

    for (const ot of after.oneTime) {
      const wasAchieved = before.oneTime.find((o) => o.id === ot.id)?.achieved ?? false;
      if (ot.achieved && !wasAchieved) {
        entries.push({ playerId, label: ot.label, points: ot.points });
      }
    }
  }

  return entries;
}
