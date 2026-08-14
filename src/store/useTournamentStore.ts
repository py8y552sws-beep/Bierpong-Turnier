import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createEmptyPredictions } from "../constants/predictions";
import { DEFAULT_DOUBLES_TEAMS } from "../constants/teams";
import { isMatchPlayed } from "../logic/matchStatus";
import {
  deriveNextStageMatches,
  generateDoublesLeg,
  generateDoublesRoundRobin,
  generateSinglesRoundRobin,
  reconcileDerivedMatches,
  reshuffleUpcomingMatches,
} from "../logic/scheduleGenerator";
import type {
  DoublesTeam,
  Match,
  MatchInput,
  PlayerId,
  Prediction,
  TeamId,
} from "../types";
import { generateId } from "../utils/id";

export interface TournamentState {
  readonly teams: readonly DoublesTeam[];
  readonly matches: readonly Match[];
  readonly predictions: Readonly<Record<PlayerId, Prediction>>;
}

interface TournamentActions {
  setDoublesTeams: (teams: readonly DoublesTeam[]) => void;
  setTeamName: (teamId: TeamId, name: string) => void;
  addMatch: (input: MatchInput) => void;
  updateMatch: (id: string, input: MatchInput) => void;
  deleteMatch: (id: string) => void;
  setPrediction: (prediction: Prediction) => void;
  resetTournament: () => void;
  /** Mischt nur die noch nicht gespielten Matches neu, Ergebnisse bleiben unangetastet. */
  reshuffleSchedule: () => void;
}

export type TournamentStore = TournamentState & TournamentActions;

function materialize(input: MatchInput): Match {
  return { ...input, id: generateId("match"), createdAt: new Date().toISOString() };
}

/**
 * Baut den kompletten, sofort spielbereiten Turnierplan: die Einzel-
 * Vorrunde (jeder gegen jeden) und die Doppel-Punktrunde stehen von Anfang
 * an fest. Wird sowohl für den initialen Zustand als auch für "Turnier
 * zurücksetzen" verwendet, damit beide exakt denselben, frischen Spielplan
 * erzeugen.
 */
function buildInitialState(teams: readonly DoublesTeam[]): TournamentState {
  const baseTime = Date.now();
  const schedule = [...generateSinglesRoundRobin(), ...generateDoublesRoundRobin(teams)];
  return {
    teams,
    matches: schedule.map((input, index) => ({
      ...input,
      id: generateId("match"),
      createdAt: new Date(baseTime + index).toISOString(),
    })),
    predictions: createEmptyPredictions(),
  };
}

/**
 * Bringt den K.O.-Baum nach jeder Ergebniseingabe auf den korrekten Stand:
 * korrigiert zuerst bereits abgeleitete Folge-Matches, falls sich Sieger/
 * Verlierer einer Vorstufe nachträglich geändert haben, und hängt danach
 * neu ableitbare Folge-Matches an, sofern welche entstanden sind.
 */
function withAutoAdvance(matches: readonly Match[]): Match[] {
  const reconciled = reconcileDerivedMatches(matches);
  const derived = deriveNextStageMatches(reconciled).map(materialize);
  return derived.length > 0 ? [...reconciled, ...derived] : [...reconciled];
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set) => ({
      ...buildInitialState(DEFAULT_DOUBLES_TEAMS),

      setDoublesTeams: (teams) =>
        set((state) => {
          const doublesMatches = state.matches.filter((m) => m.matchType === "doubles");
          const safeToRegenerate = doublesMatches.every((m) => !isMatchPlayed(m));
          if (!safeToRegenerate) {
            // Es liegen bereits Ergebnisse vor – nur die Team-Stammdaten aktualisieren,
            // der bestehende Spielplan bleibt unangetastet.
            return { teams: [...teams] };
          }
          const otherMatches = state.matches.filter((m) => m.matchType !== "doubles");
          const newDoublesMatches = generateDoublesRoundRobin(teams).map(materialize);
          return { teams: [...teams], matches: [...otherMatches, ...newDoublesMatches] };
        }),

      setTeamName: (teamId, name) =>
        set((state) => ({
          teams: state.teams.map((t) => (t.id === teamId ? { ...t, name } : t)),
        })),

      addMatch: (input) =>
        set((state) => ({
          matches: withAutoAdvance([...state.matches, materialize(input)]),
        })),

      updateMatch: (id, input) =>
        set((state) => ({
          matches: withAutoAdvance(state.matches.map((m) => (m.id === id ? { ...m, ...input } : m))),
        })),

      deleteMatch: (id) =>
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
        })),

      setPrediction: (prediction) =>
        set((state) => ({
          predictions: { ...state.predictions, [prediction.playerId]: prediction },
        })),

      resetTournament: () => set(buildInitialState(DEFAULT_DOUBLES_TEAMS)),

      reshuffleSchedule: () => set((state) => ({ matches: reshuffleUpcomingMatches(state.matches) })),
    }),
    {
      // Wichtig: dieser Name bleibt ab jetzt stabil. Schema-Änderungen laufen
      // über `version` + `migrate` unten, damit bereits erfasste Ergebnisse
      // bei App-Updates nicht verloren gehen (ein neuer Name würde für
      // bestehende Nutzer:innen sonst wie ein kompletter Reset wirken).
      name: "beerpong-championship-v2",
      version: 2,
      migrate: (persistedState, version) => {
        let state = persistedState as TournamentState;
        if (version < 1 && state?.matches) {
          // Migration von v0 (unversioniert): der Spielplan wurde damals in
          // fester statt fairer/zufälliger Reihenfolge erzeugt. Bereits
          // gespielte Matches bleiben unangetastet, nur die noch offenen
          // werden einmalig neu gemischt.
          state = { ...state, matches: reshuffleUpcomingMatches(state.matches) };
        }
        if (version < 2 && state?.matches) {
          // Migration auf v2: das Doppelturnier bekommt eine Rückrunde dazu
          // (Hin- und Rückrunde statt einer einzelnen Punktrunde). Bereits
          // gespielte Doppel-Rundenspiele werden nur umbenannt
          // (round_robin -> round_robin_1) und bleiben inhaltlich
          // unangetastet; fehlt die Rückrunde noch komplett, wird sie
          // einmalig als 6 neue, ungespielte Matches ergänzt.
          const relabeled = state.matches.map((m) =>
            m.matchType === "doubles" && (m.round as string) === "round_robin"
              ? { ...m, round: "round_robin_1" as const }
              : m,
          );
          const hasLeg2 = relabeled.some((m) => m.matchType === "doubles" && m.round === "round_robin_2");
          let matches = relabeled;
          if (!hasLeg2) {
            const teams = state.teams?.length === 4 ? state.teams : DEFAULT_DOUBLES_TEAMS;
            const baseTime = Date.now();
            const leg2 = generateDoublesLeg(teams, "round_robin_2").map((input, index) => ({
              ...input,
              id: generateId("match"),
              createdAt: new Date(baseTime + index).toISOString(),
            }));
            matches = [...relabeled, ...leg2];
          }
          state = { ...state, matches };
        }
        return state;
      },
      partialize: (state) => ({
        teams: state.teams,
        matches: state.matches,
        predictions: state.predictions,
      }),
    },
  ),
);
