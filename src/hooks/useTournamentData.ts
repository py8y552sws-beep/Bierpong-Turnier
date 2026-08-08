import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { PLAYERS } from "../constants/players";
import { calculateChallengeSummaries } from "../logic/challenges";
import { calculateDoublesStandings } from "../logic/doublesStandings";
import { calculatePlayerForm, calculateTeamForm } from "../logic/form";
import { calculateSinglesGroupStandings } from "../logic/groupStandings";
import { calculateAllLeaderboards, calculateLeaderboard, type LeaderboardMetric } from "../logic/leaderboards";
import { getNextUpcomingMatch, getRecentPlayedMatches } from "../logic/matchStatus";
import {
  calculateDoublesTeamPlacements,
  calculateSinglesPlacements,
  isDoublesTournamentComplete,
  isSinglesTournamentComplete,
  isTournamentComplete,
} from "../logic/placements";
import { calculateAllPlayerStats, calculatePlayerStats } from "../logic/playerStats";
import { calculatePredictionResults } from "../logic/predictions";
import { calculateOverallStandings } from "../logic/standings";
import { useTournamentStore } from "../store/useTournamentStore";
import type { PlayerId } from "../types";

/**
 * Diese Datei bündelt alle Selector-Hooks, über die UI-Komponenten
 * abgeleitete Turnierdaten konsumieren. Komponenten rufen niemals die
 * calculate*-Funktionen aus src/logic direkt mit rohen Store-Daten auf –
 * ausschließlich über diese Hooks, damit Memoisierung und Datenzugriff an
 * einer Stelle gebündelt bleiben.
 */

export function useTeams() {
  return useTournamentStore((s) => s.teams);
}

export function useMatches() {
  return useTournamentStore((s) => s.matches);
}

export function usePredictions() {
  return useTournamentStore((s) => s.predictions);
}

export function useTournamentActions() {
  return useTournamentStore(
    useShallow((s) => ({
      setDoublesTeams: s.setDoublesTeams,
      setTeamName: s.setTeamName,
      addMatch: s.addMatch,
      updateMatch: s.updateMatch,
      deleteMatch: s.deleteMatch,
      setPrediction: s.setPrediction,
      resetTournament: s.resetTournament,
    })),
  );
}

export function useOverallStandings() {
  const matches = useMatches();
  const teams = useTeams();
  const predictions = usePredictions();
  return useMemo(
    () => calculateOverallStandings(matches, teams, predictions),
    [matches, teams, predictions],
  );
}

export function useAllPlayerStats() {
  const matches = useMatches();
  const teams = useTeams();
  const predictions = usePredictions();
  return useMemo(
    () => calculateAllPlayerStats(matches, teams, predictions),
    [matches, teams, predictions],
  );
}

export function usePlayerStats(playerId: PlayerId) {
  const matches = useMatches();
  const teams = useTeams();
  const predictions = usePredictions();
  return useMemo(
    () => calculatePlayerStats(playerId, matches, teams, predictions),
    [playerId, matches, teams, predictions],
  );
}

export function useLeaderboard(metric: LeaderboardMetric) {
  const matches = useMatches();
  return useMemo(() => calculateLeaderboard(matches, metric), [matches, metric]);
}

export function useAllLeaderboards() {
  const matches = useMatches();
  return useMemo(() => calculateAllLeaderboards(matches), [matches]);
}

export function useChallengeSummaries() {
  const matches = useMatches();
  return useMemo(() => calculateChallengeSummaries(matches), [matches]);
}

export function usePredictionResults() {
  const matches = useMatches();
  const teams = useTeams();
  const predictions = usePredictions();
  return useMemo(
    () => calculatePredictionResults(matches, teams, predictions),
    [matches, teams, predictions],
  );
}

export function useTournamentStatus() {
  const matches = useMatches();
  const teams = useTeams();
  return useMemo(
    () => ({
      singlesComplete: isSinglesTournamentComplete(matches),
      doublesComplete: isDoublesTournamentComplete(matches, teams),
      complete: isTournamentComplete(matches, teams),
    }),
    [matches, teams],
  );
}

export function usePlayers() {
  return PLAYERS;
}

export function useNextMatch() {
  const matches = useMatches();
  return useMemo(() => getNextUpcomingMatch(matches), [matches]);
}

export function useRecentMatches(limit: number) {
  const matches = useMatches();
  return useMemo(() => getRecentPlayedMatches(matches, limit), [matches, limit]);
}

export function useSinglesGroupStandings() {
  const matches = useMatches();
  return useMemo(() => calculateSinglesGroupStandings(matches), [matches]);
}

export function useSinglesPlacements() {
  const matches = useMatches();
  return useMemo(() => calculateSinglesPlacements(matches), [matches]);
}

export function useDoublesPlacements() {
  const matches = useMatches();
  const teams = useTeams();
  return useMemo(() => calculateDoublesTeamPlacements(matches, teams), [matches, teams]);
}

export function usePlayerForm(playerId: PlayerId, limit?: number) {
  const matches = useMatches();
  return useMemo(() => calculatePlayerForm(matches, playerId, limit), [matches, playerId, limit]);
}

export function useTeamForm(teamId: string, limit?: number) {
  const matches = useMatches();
  return useMemo(() => calculateTeamForm(matches, teamId, limit), [matches, teamId, limit]);
}

export function useDoublesStandings() {
  const matches = useMatches();
  const teams = useTeams();
  return useMemo(() => calculateDoublesStandings(matches, teams), [matches, teams]);
}
