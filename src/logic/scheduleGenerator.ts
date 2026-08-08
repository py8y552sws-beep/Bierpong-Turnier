import { PLAYER_IDS } from "../constants/players";
import type { DoublesTeam, Match, MatchInput, PlayerId, SinglesRound } from "../types";
import { shuffle } from "../utils/random";
import { calculateSinglesGroupStandings } from "./groupStandings";
import { isMatchPlayed, type PlayedMatch } from "./matchStatus";

/**
 * Teilt eine (gerade Anzahl an) Teilnehmer in Runden ein, in denen jeder
 * Teilnehmer genau einmal pro Runde spielt ("Circle-Method"/Polygon-
 * Verfahren für Rundenturnier-Spielpläne). So entstehen bei n Teilnehmern
 * n-1 Runden mit je n/2 Paarungen – jeder wartet dadurch zwischen seinen
 * Spielen ungefähr gleich lange, statt dass ein Spieler mehrfach hinter-
 * einander und ein anderer erst ganz am Ende zum Zug kommt.
 */
function circleMethodRounds<T>(items: readonly T[]): Array<Array<readonly [T, T]>> {
  const n = items.length;
  const fixed = items[0]!;
  let rotating = items.slice(1);
  const rounds: Array<Array<readonly [T, T]>> = [];

  for (let round = 0; round < n - 1; round++) {
    const pairs: Array<readonly [T, T]> = [[fixed, rotating[0]!]];
    for (let i = 1; i < n / 2; i++) {
      pairs.push([rotating[i]!, rotating[n - 1 - i]!]);
    }
    rounds.push(pairs);
    rotating = [rotating[rotating.length - 1]!, ...rotating.slice(0, rotating.length - 1)];
  }

  return rounds;
}

/**
 * Erzeugt eine faire und zugleich zufällige Paarungsreihenfolge für ein
 * vollständiges Rundenturnier: Teilnehmer-Reihenfolge, Runden-Reihenfolge
 * und die Paarungen innerhalb jeder Runde werden zufällig gemischt, die
 * Circle-Method sorgt aber weiterhin dafür, dass jeder Teilnehmer in jeder
 * Runde genau einmal spielt.
 */
function fairRandomPairOrder<T>(items: readonly T[]): Array<readonly [T, T]> {
  const rounds = circleMethodRounds(shuffle(items)).map((round) => shuffle(round));
  return shuffle(rounds).flat();
}

/**
 * Mischt ausschließlich die noch nicht gespielten Matches neu (zufällige
 * Reihenfolge), ohne bereits erfasste Ergebnisse anzutasten. Einzel- und
 * Doppel-Matches werden getrennt gemischt, Einzel-Vorrunde bleibt dabei
 * immer vor der Doppel-Punktrunde einsortiert. Wird sowohl für die
 * einmalige Migration bestehender Turniere als auch für die manuelle
 * "Spielplan neu mischen"-Aktion im Adminbereich verwendet.
 */
export function reshuffleUpcomingMatches(matches: readonly Match[]): Match[] {
  const played = matches.filter(isMatchPlayed);
  const upcomingSingles = shuffle(matches.filter((m) => !isMatchPlayed(m) && m.matchType === "singles"));
  const upcomingDoubles = shuffle(matches.filter((m) => !isMatchPlayed(m) && m.matchType === "doubles"));

  const baseTime = Date.now();
  const reordered = [...upcomingSingles, ...upcomingDoubles].map((m, index) => ({
    ...m,
    createdAt: new Date(baseTime + index).toISOString(),
  }));

  return [...played, ...reordered];
}

/**
 * Generiert die vollständige Einzel-Vorrunde: jeder der 8 Spieler spielt
 * einmal gegen jeden anderen (28 Matches), alle zunächst ohne Ergebnis.
 * Die Reihenfolge ist zufällig, aber so verteilt, dass jeder Spieler
 * zwischen seinen Spielen ungefähr gleich lange Pause hat.
 */
export function generateSinglesRoundRobin(): MatchInput[] {
  return fairRandomPairOrder(PLAYER_IDS).map(([a, b]) => singlesMatchInput("group", a, b));
}

/**
 * Generiert die vollständige Doppel-Punktrunde: jedes der 4 Teams spielt
 * einmal gegen jedes andere Team (6 Matches), alle zunächst ohne Ergebnis.
 * Ebenfalls zufällig, aber gleichmäßig auf Wartezeiten verteilt.
 */
export function generateDoublesRoundRobin(teams: readonly DoublesTeam[]): MatchInput[] {
  return fairRandomPairOrder(teams).map(([a, b]) => doublesMatchInput(a, b));
}

function singlesMatchInput(round: SinglesRound, a: PlayerId, b: PlayerId): MatchInput {
  return {
    matchType: "singles",
    round,
    sideA: { playerIds: [a] },
    sideB: { playerIds: [b] },
    scoreA: null,
    scoreB: null,
    playerStats: [],
  };
}

function doublesMatchInput(teamA: DoublesTeam, teamB: DoublesTeam): MatchInput {
  return {
    matchType: "doubles",
    round: "round_robin",
    sideA: { playerIds: [...teamA.playerIds], teamId: teamA.id },
    sideB: { playerIds: [...teamB.playerIds], teamId: teamB.id },
    scoreA: null,
    scoreB: null,
    playerStats: [],
  };
}

function winnerOf(match: PlayedMatch): PlayerId {
  const player = (match.scoreA > match.scoreB ? match.sideA : match.sideB).playerIds[0];
  if (!player) throw new Error(`Match ${match.id} hat keinen gültigen Sieger`);
  return player;
}

function loserOf(match: PlayedMatch): PlayerId {
  const player = (match.scoreA > match.scoreB ? match.sideB : match.sideA).playerIds[0];
  if (!player) throw new Error(`Match ${match.id} hat keinen gültigen Verlierer`);
  return player;
}

/**
 * Prüft, welche Einzel-K.O.-Runden aufgrund bereits vorliegender Ergebnisse
 * jetzt automatisch angelegt werden können, und gibt genau diese neuen
 * Matches zurück (leeres Array, wenn nichts Neues ableitbar ist). Wird nach
 * jeder Ergebniseingabe erneut aufgerufen – rein lesend, erzeugt selbst
 * keine IDs/Zeitstempel (Aufgabe des Stores).
 *
 * Plätze 1-4 der Vorrunden-Tabelle spielen im Halbfinale um den Titel
 * (Seed 1 vs. 4, Seed 2 vs. 3); Plätze 5-8 spielen im
 * Platzierungs-Halbfinale die Plätze 5-8 aus (Seed 5 vs. 8, Seed 6 vs. 7).
 */
export function deriveNextStageMatches(matches: readonly Match[]): MatchInput[] {
  const newMatches: MatchInput[] = [];
  const singlesMatches = matches.filter((m) => m.matchType === "singles");
  const hasRound = (round: string) => singlesMatches.some((m) => m.round === round);

  const groupMatches = singlesMatches.filter((m) => m.round === "group");
  const groupComplete = groupMatches.length === 28 && groupMatches.every(isMatchPlayed);

  if (groupComplete && !hasRound("semifinal") && !hasRound("consolation_semifinal")) {
    const standings = calculateSinglesGroupStandings(matches);
    const [r1, r2, r3, r4, r5, r6, r7, r8] = standings.map((s) => s.playerId);
    if (r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8) {
      newMatches.push(
        singlesMatchInput("semifinal", r1, r4),
        singlesMatchInput("semifinal", r2, r3),
        singlesMatchInput("consolation_semifinal", r5, r8),
        singlesMatchInput("consolation_semifinal", r6, r7),
      );
    }
  }

  const semifinals = singlesMatches.filter((m) => m.round === "semifinal");
  if (semifinals.length === 2 && semifinals.every(isMatchPlayed) && !hasRound("final") && !hasRound("third_place")) {
    const [semi1, semi2] = semifinals;
    if (semi1 && semi2) {
      newMatches.push(
        singlesMatchInput("final", winnerOf(semi1), winnerOf(semi2)),
        singlesMatchInput("third_place", loserOf(semi1), loserOf(semi2)),
      );
    }
  }

  const consolationSemifinals = singlesMatches.filter((m) => m.round === "consolation_semifinal");
  if (
    consolationSemifinals.length === 2 &&
    consolationSemifinals.every(isMatchPlayed) &&
    !hasRound("fifth_place") &&
    !hasRound("seventh_place")
  ) {
    const [semi1, semi2] = consolationSemifinals;
    if (semi1 && semi2) {
      newMatches.push(
        singlesMatchInput("fifth_place", winnerOf(semi1), winnerOf(semi2)),
        singlesMatchInput("seventh_place", loserOf(semi1), loserOf(semi2)),
      );
    }
  }

  return newMatches;
}
