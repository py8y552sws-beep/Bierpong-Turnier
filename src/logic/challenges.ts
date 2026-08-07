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

function oneTimeProgress(aggregate: PlayerMatchAggregate): OneTimeChallengeProgress[] {
  const achieved: Record<OneTimeChallengeId, boolean> = {
    shutout: aggregate.hasShutoutWin,
    cups_25: aggregate.cups >= CUPS_25_THRESHOLD,
    cups_50: aggregate.cups >= CUPS_50_THRESHOLD,
    unbeaten_group: isUnbeatenInGroupStage(aggregate),
    no_big_loss: neverLostByMoreThan(aggregate),
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
    const oneTime = oneTimeProgress(aggregate);
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
