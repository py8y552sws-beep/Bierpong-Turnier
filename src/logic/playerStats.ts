import { getPlayerName, PLAYERS } from "../constants/players";
import type { DoublesTeam, Match, MatchPlayerStat, PlayerId, Prediction } from "../types";
import { getSideLabel } from "../utils/matchLabels";
import {
  calculateAchievementSummaries,
  calculateMatchAchievements,
  type MatchAchievementEntry,
  type PlayerAchievementSummary,
} from "./achievements";
import { calculateBaseStandingTotals } from "./baseTotals";
import { averageCups, calculatePlayerMatchAggregates, winRate } from "./matchAggregates";
import { getPlayedMatches, type PlayedMatch } from "./matchStatus";
import { calculatePredictionResults, type PlayerPredictionResult } from "./predictions";
import { calculateOverallStandings, type PlayerStandingEntry } from "./standings";

export interface PlayerMatchHistoryEntry {
  readonly match: PlayedMatch;
  readonly opponentLabel: string;
  readonly won: boolean;
  readonly ownScore: number;
  readonly opponentScore: number;
  readonly ownStat: MatchPlayerStat | undefined;
  readonly achievements: readonly MatchAchievementEntry[];
}

export interface PointsProgressionPoint {
  readonly label: string;
  readonly cumulativePoints: number;
}

export interface PlayerProfileStats {
  readonly playerId: PlayerId;
  readonly playerName: string;
  readonly standing: PlayerStandingEntry;
  readonly achievements: PlayerAchievementSummary;
  readonly predictionResult: PlayerPredictionResult;
  readonly prediction: Prediction | undefined;
  readonly matchesPlayed: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
  readonly cups: number;
  readonly averageCups: number;
  readonly bounceHits: number;
  readonly streak3Count: number;
  readonly streak5Count: number;
  readonly matchHistory: readonly PlayerMatchHistoryEntry[];
  readonly pointsProgression: readonly PointsProgressionPoint[];
}

function opponentLabel(match: PlayedMatch, playerId: PlayerId, teams: readonly DoublesTeam[]): string {
  const onSideA = match.sideA.playerIds.includes(playerId);
  const opponentSide = onSideA ? match.sideB : match.sideA;
  return getSideLabel(opponentSide, teams);
}

function buildMatchHistory(
  matches: readonly Match[],
  playerId: PlayerId,
  teams: readonly DoublesTeam[],
): PlayerMatchHistoryEntry[] {
  const playerMatches = getPlayedMatches(matches).filter(
    (m) => m.sideA.playerIds.includes(playerId) || m.sideB.playerIds.includes(playerId),
  );

  return playerMatches
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((match) => {
      const onSideA = match.sideA.playerIds.includes(playerId);
      const ownScore = onSideA ? match.scoreA : match.scoreB;
      const opponentScore = onSideA ? match.scoreB : match.scoreA;
      return {
        match,
        opponentLabel: opponentLabel(match, playerId, teams),
        won: ownScore > opponentScore,
        ownScore,
        opponentScore,
        ownStat: match.playerStats.find((s) => s.playerId === playerId),
        achievements: calculateMatchAchievements(matches, match.id).filter((a) => a.playerId === playerId),
      };
    });
}

function buildPointsProgression(
  history: readonly PlayerMatchHistoryEntry[],
  allMatches: readonly Match[],
  teams: readonly DoublesTeam[],
  playerId: PlayerId,
  predictionPoints: number,
  tournamentComplete: boolean,
): PointsProgressionPoint[] {
  const points: PointsProgressionPoint[] = [{ label: "Start", cumulativePoints: 0 }];

  history.forEach((entry, index) => {
    const matchesSoFar = allMatches.filter((m) => m.createdAt <= entry.match.createdAt);
    const base = calculateBaseStandingTotals(matchesSoFar, teams)[playerId];
    points.push({ label: `Match ${index + 1}`, cumulativePoints: base });
  });

  if (tournamentComplete && predictionPoints > 0) {
    const lastEntry = points[points.length - 1];
    const lastValue = lastEntry ? lastEntry.cumulativePoints : 0;
    points.push({ label: "Predictions", cumulativePoints: lastValue + predictionPoints });
  }

  return points;
}

/**
 * Aggregiert sämtliche Kennzahlen eines Spielerprofils. Führt selbst keine
 * eigenständigen Berechnungen durch, sondern kombiniert ausschließlich die
 * zentralen calculate*-Funktionen.
 */
export function calculatePlayerStats(
  playerId: PlayerId,
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): PlayerProfileStats {
  const aggregates = calculatePlayerMatchAggregates(matches);
  const aggregate = aggregates[playerId];
  const standings = calculateOverallStandings(matches, teams, predictions);
  const standing = standings.find((s) => s.playerId === playerId);
  if (!standing) throw new Error(`Keine Gesamtwertung für Spieler ${playerId} gefunden`);

  const achievementSummaries = calculateAchievementSummaries(matches);
  const predictionResults = calculatePredictionResults(matches, teams, predictions);
  const matchHistory = buildMatchHistory(matches, playerId, teams);
  const pointsProgression = buildPointsProgression(
    matchHistory,
    matches,
    teams,
    playerId,
    predictionResults[playerId].totalPoints,
    !predictionResults[playerId].pending,
  );

  return {
    playerId,
    playerName: getPlayerName(playerId),
    standing,
    achievements: achievementSummaries[playerId],
    predictionResult: predictionResults[playerId],
    prediction: predictions[playerId],
    matchesPlayed: aggregate.matchesPlayed,
    wins: aggregate.wins,
    losses: aggregate.losses,
    winRate: winRate(aggregate),
    cups: aggregate.cups,
    averageCups: averageCups(aggregate),
    bounceHits: aggregate.bounceHits,
    streak3Count: aggregate.streak3Count,
    streak5Count: aggregate.streak5Count,
    matchHistory,
    pointsProgression,
  };
}

export function calculateAllPlayerStats(
  matches: readonly Match[],
  teams: readonly DoublesTeam[],
  predictions: Readonly<Record<PlayerId, Prediction>>,
): readonly PlayerProfileStats[] {
  return PLAYERS.map((p) => calculatePlayerStats(p.id, matches, teams, predictions));
}
