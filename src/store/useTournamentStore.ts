import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createEmptyPredictions } from "../constants/predictions";
import type {
  DoublesTeam,
  Match,
  MatchInput,
  PlayerId,
  Prediction,
} from "../types";
import { generateId } from "../utils/id";

interface TournamentState {
  readonly teams: readonly DoublesTeam[];
  readonly matches: readonly Match[];
  readonly predictions: Readonly<Record<PlayerId, Prediction>>;
}

interface TournamentActions {
  setDoublesTeams: (teams: readonly DoublesTeam[]) => void;
  addMatch: (input: MatchInput) => void;
  updateMatch: (id: string, input: MatchInput) => void;
  deleteMatch: (id: string) => void;
  setPrediction: (prediction: Prediction) => void;
  resetTournament: () => void;
}

export type TournamentStore = TournamentState & TournamentActions;

const initialState: TournamentState = {
  teams: [],
  matches: [],
  predictions: createEmptyPredictions(),
};

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set) => ({
      ...initialState,

      setDoublesTeams: (teams) => set({ teams: [...teams] }),

      addMatch: (input) =>
        set((state) => ({
          matches: [
            ...state.matches,
            {
              ...input,
              id: generateId("match"),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateMatch: (id, input) =>
        set((state) => ({
          matches: state.matches.map((m) => (m.id === id ? { ...m, ...input } : m)),
        })),

      deleteMatch: (id) =>
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
        })),

      setPrediction: (prediction) =>
        set((state) => ({
          predictions: { ...state.predictions, [prediction.playerId]: prediction },
        })),

      resetTournament: () => set({ ...initialState, predictions: createEmptyPredictions() }),
    }),
    {
      name: "beerpong-championship-v1",
      partialize: (state) => ({
        teams: state.teams,
        matches: state.matches,
        predictions: state.predictions,
      }),
    },
  ),
);
