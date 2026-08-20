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
function withAutoAdvance(matches: readonly Match[], teams: readonly DoublesTeam[]): Match[] {
  const reconciled = reconcileDerivedMatches(matches, teams);
  const derived = deriveNextStageMatches(reconciled, teams).map(materialize);
  return derived.length > 0 ? [...reconciled, ...derived] : [...reconciled];
}

/**
 * Entfernt inzwischen obsolete Rundenarten (aktuell: das ehemalige
 * Platzierungs-Halbfinale) und bringt den K.O.-Baum danach über
 * withAutoAdvance auf den korrekten Stand. Wird sowohl bei der lokalen
 * Storage-Migration (v2 -> v3) als auch beim Anwenden eines Firebase-
 * Sync-Snapshots verwendet, damit ein Turnierstand aus einer älteren
 * App-Version über beide Wege gleich sauber ankommt – ein Gerät, das den
 * Cloud-Sync nutzt und die App noch nicht neu geladen hat, würde den
 * alten Stand sonst immer wieder zurück in das gemeinsame Dokument
 * schreiben.
 */
export function normalizeIncomingMatches(matches: readonly Match[], teams: readonly DoublesTeam[]): Match[] {
  const withoutObsoleteRounds = matches.filter(
    (m) => !(m.matchType === "singles" && (m.round as string) === "consolation_semifinal"),
  );
  return withAutoAdvance(withoutObsoleteRounds, teams);
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
          matches: withAutoAdvance([...state.matches, materialize(input)], state.teams),
        })),

      updateMatch: (id, input) =>
        set((state) => ({
          matches: withAutoAdvance(state.matches.map((m) => (m.id === id ? { ...m, ...input } : m)), state.teams),
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
      version: 4,
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
        if (version < 3 && state?.matches) {
          // Migration auf v3: Platz 5-8 werden nicht mehr über ein eigenes
          // Platzierungs-Halbfinale ausgespielt, sondern direkt aus der
          // Vorrunden-Tabelle besetzt (Spiel um Platz 5 = Rang 5 vs. Rang 6,
          // Spiel um Platz 7 = Rang 7 vs. Rang 8). Bereits vorhandene
          // Platzierungs-Halbfinale-Spiele entfallen ersatzlos (ihr Ergebnis
          // hat unter der neuen Regel keine Bedeutung mehr); bereits
          // abgeleitete Spiele um Platz 5/7 werden über withAutoAdvance mit
          // den korrekten Teilnehmern neu besetzt (und dabei automatisch
          // zurückgesetzt, falls sie mit den alten, jetzt falschen
          // Teilnehmern schon gespielt wurden).
          const teamsV3 = state.teams?.length === 4 ? state.teams : DEFAULT_DOUBLES_TEAMS;
          state = { ...state, matches: normalizeIncomingMatches(state.matches, teamsV3) };
        }
        if (version < 4 && state?.matches) {
          // Migration auf v4: Nach Hin- und Rückrunde entscheidet jetzt ein
          // Finale zwischen Tabellenplatz 1 und 2 über den Doppel-Sieger,
          // statt die Platzierung direkt aus der Abschlusstabelle
          // abzuleiten (Platz 3/4 stehen weiterhin direkt fest). Für ein
          // bereits laufendes Turnier mit abgeschlossener Punktrunde wird
          // das Finale hier einmalig automatisch nachträglich angesetzt.
          const teamsV4 = state.teams?.length === 4 ? state.teams : DEFAULT_DOUBLES_TEAMS;
          state = { ...state, matches: withAutoAdvance(state.matches, teamsV4) };
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
