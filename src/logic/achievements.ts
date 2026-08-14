import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_IDS, CUP_ACHIEVEMENT_THRESHOLDS } from "../constants/achievements";
import { getPlayerName, PLAYER_IDS } from "../constants/players";
import type { AchievementId, Match, PlayerId } from "../types";
import {
  calculatePlayerMatchAggregates,
  isUnbeatenInGroupStage,
  neverLostByMoreThan,
  type PlayerMatchAggregate,
} from "./matchAggregates";
import { getPlayedMatches, hasRemainingMatches } from "./matchStatus";

export interface PlayerAchievementProgress {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: import("../types").AchievementCategory;
  readonly points: number;
  readonly unlocked: boolean;
  readonly unlockedAt: string | null;
}

export interface PlayerAchievementSummary {
  readonly playerId: PlayerId;
  readonly achievements: readonly PlayerAchievementProgress[];
  readonly unlockedCount: number;
  readonly totalPoints: number;
}

/**
 * Prüft die reine Freischalt-Bedingung eines Achievements anhand des
 * Spieler-Aggregats. `matches` wird nur für die beiden Achievements
 * gebraucht, die erst nach vollständigem Turnierabschluss dieses Spielers
 * final werden dürfen (unbeatable/rock_solid) – analog zur bisherigen
 * Side-Challenge-Logik.
 */
function isAchieved(id: AchievementId, aggregate: PlayerMatchAggregate, matches: readonly Match[]): boolean {
  switch (id) {
    case "heat_check":
      return aggregate.longestStreakEver >= 3;
    case "on_fire":
      return aggregate.longestStreakEver >= 5;
    case "unstoppable":
      return aggregate.longestStreakEver >= 7;
    case "hot_streak":
      return aggregate.longestWinStreakEver >= 3;
    case "winning_machine":
      return aggregate.longestWinStreakEver >= 5;
    case "dominance":
      return aggregate.longestWinStreakEver >= 7;
    case "cup_hunter":
    case "cup_collector":
    case "cup_machine":
    case "cup_master":
    case "cup_legend":
    case "century_plus":
      return aggregate.cups >= CUP_ACHIEVEMENT_THRESHOLDS[id]!;
    case "bounce_master":
      return aggregate.bounceHits >= 1;
    case "island_hopper":
      return aggregate.islandHits >= 1;
    case "bomb_squad":
      return aggregate.bombHits >= 1;
    case "trickshot_artist":
      return aggregate.trickshotHits >= 1;
    case "no_rerack_needed":
      return aggregate.hasWinWithZeroRerack;
    case "shutout":
      return aggregate.hasShutoutWin;
    case "unbeatable":
      return isUnbeatenInGroupStage(aggregate);
    case "rock_solid":
      return neverLostByMoreThan(aggregate) && !hasRemainingMatches(matches, aggregate.playerId);
  }
}

/**
 * Ermittelt für jedes freigeschaltete Achievement den Zeitpunkt (createdAt
 * des auslösenden Matches) der ersten Freischaltung, indem die gespielten
 * Matches des Spielers chronologisch durchlaufen und das Aggregat jeweils
 * nur bis zu diesem Zeitpunkt neu berechnet wird.
 */
function computeUnlockTimestamps(
  matches: readonly Match[],
  playerId: PlayerId,
): Partial<Record<AchievementId, string>> {
  const playerMatches = getPlayedMatches(matches)
    .filter((m) => m.sideA.playerIds.includes(playerId) || m.sideB.playerIds.includes(playerId))
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const timestamps: Partial<Record<AchievementId, string>> = {};
  const unlockedSoFar = new Set<AchievementId>();

  for (const match of playerMatches) {
    const prefixMatches = matches.filter((m) => m.createdAt <= match.createdAt);
    const aggregate = calculatePlayerMatchAggregates(prefixMatches)[playerId];
    for (const id of ACHIEVEMENT_IDS) {
      if (unlockedSoFar.has(id)) continue;
      if (isAchieved(id, aggregate, matches)) {
        unlockedSoFar.add(id);
        timestamps[id] = match.createdAt;
      }
    }
  }

  return timestamps;
}

/**
 * Berechnet für jeden Spieler den vollständigen Achievement-Fortschritt
 * (alle 20 Achievements, unlocked/locked + Freischalt-Zeitpunkt). Baut
 * ausschließlich auf calculatePlayerMatchAggregates() auf.
 */
export function calculateAchievementSummaries(
  matches: readonly Match[],
): Readonly<Record<PlayerId, PlayerAchievementSummary>> {
  const aggregates = calculatePlayerMatchAggregates(matches);

  const result = {} as Record<PlayerId, PlayerAchievementSummary>;
  for (const playerId of PLAYER_IDS) {
    const aggregate = aggregates[playerId];
    const unlockTimestamps = computeUnlockTimestamps(matches, playerId);

    const achievements: PlayerAchievementProgress[] = ACHIEVEMENT_IDS.map((id) => {
      const def = ACHIEVEMENT_DEFINITIONS[id];
      const unlocked = isAchieved(id, aggregate, matches);
      return {
        id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        points: def.points,
        unlocked,
        unlockedAt: unlocked ? (unlockTimestamps[id] ?? null) : null,
      };
    });

    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    const totalPoints = achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0);

    result[playerId] = { playerId, achievements, unlockedCount, totalPoints };
  }

  return result;
}

/** Reine Achievement-Punktzahl je Spieler, abgeleitet aus calculateAchievementSummaries(). */
export function calculateAchievementPoints(
  matches: readonly Match[],
): Readonly<Record<PlayerId, number>> {
  const summaries = calculateAchievementSummaries(matches);
  const result = {} as Record<PlayerId, number>;
  for (const playerId of PLAYER_IDS) {
    result[playerId] = summaries[playerId].totalPoints;
  }
  return result;
}

export interface MatchAchievementEntry {
  readonly playerId: PlayerId;
  readonly achievementId: AchievementId;
  readonly name: string;
  readonly icon: string;
  readonly points: number;
}

/**
 * Ermittelt, welche Achievements ein einzelnes Match neu freigeschaltet hat:
 * der Unterschied im Achievement-Fortschritt mit und ohne dieses Match.
 * Ein bereits zuvor freigeschaltetes Achievement taucht hier nie erneut auf,
 * da nur der unlocked-false->true-Übergang zählt. Dient sowohl der
 * Match-Historie im Spielerprofil als auch der Freischalt-Animation direkt
 * nach dem Speichern eines Ergebnisses.
 */
export function calculateMatchAchievements(
  matches: readonly Match[],
  matchId: string,
): readonly MatchAchievementEntry[] {
  const target = matches.find((m) => m.id === matchId);
  if (!target) return [];

  const withMatch = calculateAchievementSummaries(matches);
  const withoutMatch = calculateAchievementSummaries(matches.filter((m) => m.id !== matchId));

  const players = [...target.sideA.playerIds, ...target.sideB.playerIds];
  const entries: MatchAchievementEntry[] = [];

  for (const playerId of players) {
    const before = withoutMatch[playerId];
    const after = withMatch[playerId];
    if (!before || !after) continue;

    for (const achievement of after.achievements) {
      const wasUnlocked = before.achievements.find((a) => a.id === achievement.id)?.unlocked ?? false;
      if (achievement.unlocked && !wasUnlocked) {
        entries.push({
          playerId,
          achievementId: achievement.id,
          name: achievement.name,
          icon: achievement.icon,
          points: achievement.points,
        });
      }
    }
  }

  return entries;
}

export interface RecentAchievementUnlock {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly achievementId: AchievementId;
  readonly name: string;
  readonly icon: string;
  readonly points: number;
  readonly unlockedAt: string;
}

/** Die zuletzt freigeschalteten Achievements aller Spieler, neueste zuerst. */
export function calculateRecentAchievementUnlocks(
  matches: readonly Match[],
  limit: number,
): readonly RecentAchievementUnlock[] {
  const summaries = calculateAchievementSummaries(matches);
  const unlocks: RecentAchievementUnlock[] = [];

  for (const playerId of PLAYER_IDS) {
    for (const a of summaries[playerId].achievements) {
      if (a.unlocked && a.unlockedAt) {
        unlocks.push({
          playerId,
          playerName: getPlayerName(playerId),
          achievementId: a.id,
          name: a.name,
          icon: a.icon,
          points: a.points,
          unlockedAt: a.unlockedAt,
        });
      }
    }
  }

  return unlocks.sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt)).slice(0, limit);
}

const QUANTIFIABLE_STREAK_THRESHOLDS: Partial<Record<AchievementId, number>> = {
  heat_check: 3,
  on_fire: 5,
  unstoppable: 7,
};

const QUANTIFIABLE_WIN_STREAK_THRESHOLDS: Partial<Record<AchievementId, number>> = {
  hot_streak: 3,
  winning_machine: 5,
  dominance: 7,
};

function quantifiableRemaining(id: AchievementId, aggregate: PlayerMatchAggregate): number | null {
  const cupThreshold = CUP_ACHIEVEMENT_THRESHOLDS[id];
  if (cupThreshold !== undefined) return Math.max(0, cupThreshold - aggregate.cups);

  const streakThreshold = QUANTIFIABLE_STREAK_THRESHOLDS[id];
  if (streakThreshold !== undefined) return Math.max(0, streakThreshold - aggregate.longestStreakEver);

  const winStreakThreshold = QUANTIFIABLE_WIN_STREAK_THRESHOLDS[id];
  if (winStreakThreshold !== undefined) return Math.max(0, winStreakThreshold - aggregate.longestWinStreakEver);

  return null;
}

function describeRemaining(id: AchievementId, remaining: number): string {
  if (CUP_ACHIEVEMENT_THRESHOLDS[id] !== undefined) return `noch ${remaining} Cups`;
  return `noch ${remaining} in Folge`;
}

export interface NextAchievementCandidate {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly achievementId: AchievementId;
  readonly name: string;
  readonly icon: string;
  readonly points: number;
  readonly remaining: number;
  readonly progressLabel: string;
}

/**
 * Die Achievements, die aktuell am nächsten an der Freischaltung sind
 * (kleinste verbleibende Distanz zuerst). Nur für quantifizierbare
 * Achievements (Serien, Cup-Meilensteine) ermittelbar – rein binäre
 * Achievements (z.B. Trickshot, Shutout) haben keinen Zwischenfortschritt
 * und werden daher hier nicht gelistet.
 */
export function calculateNextAchievementCandidates(
  matches: readonly Match[],
  limit: number,
): readonly NextAchievementCandidate[] {
  const aggregates = calculatePlayerMatchAggregates(matches);
  const summaries = calculateAchievementSummaries(matches);
  const candidates: NextAchievementCandidate[] = [];

  for (const playerId of PLAYER_IDS) {
    const aggregate = aggregates[playerId];
    for (const a of summaries[playerId].achievements) {
      if (a.unlocked) continue;
      const remaining = quantifiableRemaining(a.id, aggregate);
      if (remaining === null) continue;
      candidates.push({
        playerId,
        playerName: getPlayerName(playerId),
        achievementId: a.id,
        name: a.name,
        icon: a.icon,
        points: a.points,
        remaining,
        progressLabel: describeRemaining(a.id, remaining),
      });
    }
  }

  candidates.sort((a, b) => a.remaining - b.remaining || b.points - a.points);
  return candidates.slice(0, limit);
}

/**
 * Die 5 "Spezialwürfe"-Achievements, die schon beim ersten Vorkommen
 * vollständig erreicht sind (weitere Treffer derselben Art bringen keine
 * zusätzlichen Punkte mehr). Grundlage für die Ergebniseingabe: sobald ein
 * Spieler eines davon freigeschaltet hat, macht das zugehörige Eingabefeld
 * für ihn in künftigen Matches keinen Sinn mehr.
 */
export const SPECIAL_ENTRY_ACHIEVEMENT_IDS: readonly AchievementId[] = [
  "bounce_master",
  "island_hopper",
  "bomb_squad",
  "trickshot_artist",
  "no_rerack_needed",
];

/**
 * Ermittelt je Spieler, welche der 5 Spezialwürfe-Achievements bereits
 * freigeschaltet sind – ausgewertet OHNE das gerade bearbeitete Match
 * (excludeMatchId), damit ein Achievement, das genau in diesem Match zum
 * ersten Mal erreicht wird, dort weiterhin editierbar bleibt. Dient der
 * Ergebniseingabe, um bereits erreichte Spezialwürfe/„Ohne Umstellen" gar
 * nicht mehr als Eingabeoption anzubieten.
 */
export function calculateLockedSpecialAchievements(
  matches: readonly Match[],
  excludeMatchId: string | null,
): Readonly<Record<PlayerId, ReadonlySet<AchievementId>>> {
  const relevant = excludeMatchId ? matches.filter((m) => m.id !== excludeMatchId) : matches;
  const summaries = calculateAchievementSummaries(relevant);

  const result = {} as Record<PlayerId, ReadonlySet<AchievementId>>;
  for (const playerId of PLAYER_IDS) {
    const locked = new Set<AchievementId>();
    for (const id of SPECIAL_ENTRY_ACHIEVEMENT_IDS) {
      const unlocked = summaries[playerId].achievements.find((a) => a.id === id)?.unlocked ?? false;
      if (unlocked) locked.add(id);
    }
    result[playerId] = locked;
  }

  return result;
}
