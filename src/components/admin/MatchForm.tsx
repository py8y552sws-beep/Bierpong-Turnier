import { useState } from "react";
import { Button } from "../common/Button";
import formStyles from "../common/form.module.css";
import { getPlayerName, PLAYERS } from "../../constants/players";
import { DOUBLES_ROUNDS, SINGLES_ROUNDS, roundLabel } from "../../constants/rounds";
import { getTeamLabel } from "../../utils/matchLabels";
import type { DoublesTeam, Match, MatchInput, MatchPlayerStat, MatchType, PlayerId, TeamId } from "../../types";
import styles from "./MatchForm.module.css";

interface MatchFormProps {
  readonly teams: readonly DoublesTeam[];
  readonly initialMatch?: Match;
  readonly onSubmit: (input: MatchInput) => void;
  readonly onCancel?: () => void;
}

interface StatInput {
  cups: string;
  bounceHits: string;
  longestStreak: string;
  islandHits: string;
  bombHits: string;
  trickshotHits: string;
  reRacks: string;
}

function emptyStat(): StatInput {
  return {
    cups: "",
    bounceHits: "",
    longestStreak: "",
    islandHits: "",
    bombHits: "",
    trickshotHits: "",
    // Default "mit Umstellen" (1) – die meisten Spiele laufen so, "ohne
    // Umstellen" (0) wird explizit über die Checkbox gesetzt.
    reRacks: "1",
  };
}

function statFromMatch(match: Match | undefined, playerId: PlayerId): StatInput {
  const stat = match?.playerStats.find((s) => s.playerId === playerId);
  if (!stat) return emptyStat();
  return {
    cups: String(stat.cups),
    bounceHits: String(stat.bounceHits),
    longestStreak: String(stat.longestStreak),
    islandHits: String(stat.islandHits ?? 0),
    bombHits: String(stat.bombHits ?? 0),
    trickshotHits: String(stat.trickshotHits ?? 0),
    reRacks: String(stat.reRacks ?? 1),
  };
}

function toNonNegativeInt(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function MatchForm({ teams, initialMatch, onSubmit, onCancel }: MatchFormProps) {
  const [matchType, setMatchType] = useState<MatchType>(initialMatch?.matchType ?? "singles");
  const [round, setRound] = useState<string>(initialMatch?.round ?? "group");
  const [playerA, setPlayerA] = useState<PlayerId | "">(
    initialMatch?.matchType === "singles" ? (initialMatch.sideA.playerIds[0] ?? "") : "",
  );
  const [playerB, setPlayerB] = useState<PlayerId | "">(
    initialMatch?.matchType === "singles" ? (initialMatch.sideB.playerIds[0] ?? "") : "",
  );
  const [teamA, setTeamA] = useState<TeamId | "">(
    initialMatch?.matchType === "doubles" ? (initialMatch.sideA.teamId ?? "") : "",
  );
  const [teamB, setTeamB] = useState<TeamId | "">(
    initialMatch?.matchType === "doubles" ? (initialMatch.sideB.teamId ?? "") : "",
  );
  const [scoreAText, setScoreAText] = useState(initialMatch?.scoreA != null ? String(initialMatch.scoreA) : "");
  const [scoreBText, setScoreBText] = useState(initialMatch?.scoreB != null ? String(initialMatch.scoreB) : "");
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Record<PlayerId, StatInput>>(() => {
    const record: Partial<Record<PlayerId, StatInput>> = {};
    for (const p of PLAYERS) record[p.id] = statFromMatch(initialMatch, p.id);
    return record as Record<PlayerId, StatInput>;
  });

  const rounds = matchType === "singles" ? SINGLES_ROUNDS : DOUBLES_ROUNDS;

  function handleMatchTypeChange(next: MatchType) {
    setMatchType(next);
    setRound(next === "singles" ? "group" : "round_robin_1");
  }

  const sideAPlayers: PlayerId[] =
    matchType === "singles"
      ? playerA
        ? [playerA]
        : []
      : (teams.find((t) => t.id === teamA)?.playerIds as PlayerId[] | undefined) ?? [];
  const sideBPlayers: PlayerId[] =
    matchType === "singles"
      ? playerB
        ? [playerB]
        : []
      : (teams.find((t) => t.id === teamB)?.playerIds as PlayerId[] | undefined) ?? [];

  const bothScoresGiven = scoreAText.trim() !== "" && scoreBText.trim() !== "";
  const relevantPlayers = bothScoresGiven ? [...sideAPlayers, ...sideBPlayers] : [];

  function updateStat(playerId: PlayerId, field: keyof StatInput, value: string) {
    setStats((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  }

  function handleSubmit() {
    if (matchType === "singles") {
      if (!playerA || !playerB) return setError("Bitte beide Spieler auswählen.");
      if (playerA === playerB) return setError("Ein Spieler kann nicht gegen sich selbst spielen.");
    } else {
      if (teams.length !== 4) return setError("Bitte zuerst im Bereich „Teams“ alle 4 Doppelteams festlegen.");
      if (!teamA || !teamB) return setError("Bitte beide Teams auswählen.");
      if (teamA === teamB) return setError("Ein Team kann nicht gegen sich selbst spielen.");
    }

    const scoreATrim = scoreAText.trim();
    const scoreBTrim = scoreBText.trim();
    if ((scoreATrim === "") !== (scoreBTrim === "")) {
      return setError("Bitte entweder beide Ergebnisse eintragen oder beide leer lassen.");
    }

    let scoreA: number | null = null;
    let scoreB: number | null = null;
    if (scoreATrim !== "" && scoreBTrim !== "") {
      scoreA = toNonNegativeInt(scoreATrim);
      scoreB = toNonNegativeInt(scoreBTrim);
      if (scoreA === scoreB) return setError("Unentschieden ist nicht möglich – die Ergebnisse müssen sich unterscheiden.");
    }

    setError(null);

    const playerStats: MatchPlayerStat[] =
      scoreA !== null && scoreB !== null
        ? relevantPlayers.map((playerId) => {
            const s = stats[playerId] ?? emptyStat();
            return {
              playerId,
              cups: toNonNegativeInt(s.cups),
              bounceHits: toNonNegativeInt(s.bounceHits),
              longestStreak: toNonNegativeInt(s.longestStreak),
              islandHits: toNonNegativeInt(s.islandHits),
              bombHits: toNonNegativeInt(s.bombHits),
              trickshotHits: toNonNegativeInt(s.trickshotHits),
              reRacks: toNonNegativeInt(s.reRacks),
            };
          })
        : [];

    onSubmit({
      matchType,
      round: round as MatchInput["round"],
      sideA:
        matchType === "singles"
          ? { playerIds: [playerA as PlayerId] }
          : { playerIds: sideAPlayers, teamId: teamA as TeamId },
      sideB:
        matchType === "singles"
          ? { playerIds: [playerB as PlayerId] }
          : { playerIds: sideBPlayers, teamId: teamB as TeamId },
      scoreA,
      scoreB,
      playerStats,
    });
  }

  return (
    <div className={styles.form}>
      <div className={formStyles.grid2}>
        <div className={formStyles.field}>
          <label>Turnier</label>
          <select
            className={formStyles.select}
            value={matchType}
            onChange={(e) => handleMatchTypeChange(e.target.value as MatchType)}
          >
            <option value="singles">Einzelturnier</option>
            <option value="doubles">Doppelturnier</option>
          </select>
        </div>
        <div className={formStyles.field}>
          <label>Runde</label>
          <select className={formStyles.select} value={round} onChange={(e) => setRound(e.target.value)}>
            {rounds.map((r) => (
              <option key={r} value={r}>
                {roundLabel(matchType, r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={formStyles.grid2}>
        {matchType === "singles" ? (
          <>
            <div className={formStyles.field}>
              <label>Spieler A</label>
              <select className={formStyles.select} value={playerA} onChange={(e) => setPlayerA(e.target.value as PlayerId)}>
                <option value="">– auswählen –</option>
                {PLAYERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={formStyles.field}>
              <label>Spieler B</label>
              <select className={formStyles.select} value={playerB} onChange={(e) => setPlayerB(e.target.value as PlayerId)}>
                <option value="">– auswählen –</option>
                {PLAYERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className={formStyles.field}>
              <label>Team A</label>
              <select className={formStyles.select} value={teamA} onChange={(e) => setTeamA(e.target.value as TeamId)}>
                <option value="">– auswählen –</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getTeamLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className={formStyles.field}>
              <label>Team B</label>
              <select className={formStyles.select} value={teamB} onChange={(e) => setTeamB(e.target.value as TeamId)}>
                <option value="">– auswählen –</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getTeamLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className={formStyles.grid2}>
        <div className={formStyles.field}>
          <label>Endstand Seite A</label>
          <input
            className={formStyles.input}
            type="number"
            min={0}
            value={scoreAText}
            placeholder="offen / geplant"
            onChange={(e) => setScoreAText(e.target.value)}
          />
        </div>
        <div className={formStyles.field}>
          <label>Endstand Seite B</label>
          <input
            className={formStyles.input}
            type="number"
            min={0}
            value={scoreBText}
            placeholder="offen / geplant"
            onChange={(e) => setScoreBText(e.target.value)}
          />
        </div>
      </div>
      <p className={formStyles.hint}>
        Ergebnis leer lassen, um das Match nur als geplant anzulegen ("Nächstes Spiel"). Ergebnis später über
        „Bearbeiten“ nachtragen.
      </p>

      {bothScoresGiven && (
        <div className={styles.statsSection}>
          <h4>Spielerstatistiken für dieses Match</h4>
          <div className={styles.playerStatRow}>
            <span />
            <span className={styles.scoreLabel}>Cups</span>
            <span className={styles.scoreLabel}>Bounce</span>
            <span className={styles.scoreLabel}>Längste Serie</span>
          </div>
          {relevantPlayers.map((playerId) => (
            <div className={styles.playerStatRow} key={playerId}>
              <span>{getPlayerName(playerId)}</span>
              <input
                className={formStyles.input}
                type="number"
                min={0}
                value={stats[playerId]?.cups ?? ""}
                onChange={(e) => updateStat(playerId, "cups", e.target.value)}
              />
              <input
                className={formStyles.input}
                type="number"
                min={0}
                value={stats[playerId]?.bounceHits ?? ""}
                onChange={(e) => updateStat(playerId, "bounceHits", e.target.value)}
              />
              <input
                className={formStyles.input}
                type="number"
                min={0}
                value={stats[playerId]?.longestStreak ?? ""}
                onChange={(e) => updateStat(playerId, "longestStreak", e.target.value)}
              />
            </div>
          ))}

          <div className={styles.playerStatRow}>
            <span />
            <span className={styles.scoreLabel}>Island</span>
            <span className={styles.scoreLabel}>Bombe</span>
            <span className={styles.scoreLabel}>Trickshot</span>
          </div>
          {relevantPlayers.map((playerId) => (
            <div className={styles.playerStatRow} key={`${playerId}-special`}>
              <span>{getPlayerName(playerId)}</span>
              <input
                className={formStyles.input}
                type="number"
                min={0}
                value={stats[playerId]?.islandHits ?? ""}
                onChange={(e) => updateStat(playerId, "islandHits", e.target.value)}
              />
              <input
                className={formStyles.input}
                type="number"
                min={0}
                value={stats[playerId]?.bombHits ?? ""}
                onChange={(e) => updateStat(playerId, "bombHits", e.target.value)}
              />
              <input
                className={formStyles.input}
                type="number"
                min={0}
                value={stats[playerId]?.trickshotHits ?? ""}
                onChange={(e) => updateStat(playerId, "trickshotHits", e.target.value)}
              />
            </div>
          ))}

          <div className={styles.playerStatRow}>
            <span />
            <span className={styles.scoreLabel}>Ohne Umstellen</span>
            <span />
            <span />
          </div>
          {relevantPlayers.map((playerId) => (
            <div className={styles.playerStatRow} key={`${playerId}-rerack`}>
              <span>{getPlayerName(playerId)}</span>
              <label className={styles.rerackCheckbox}>
                <input
                  type="checkbox"
                  checked={(stats[playerId]?.reRacks ?? "1") === "0"}
                  onChange={(e) => updateStat(playerId, "reRacks", e.target.checked ? "0" : "1")}
                />
                Ohne Umstellen gewonnen
              </label>
            </div>
          ))}
        </div>
      )}

      {error && <p className={formStyles.errorText}>{error}</p>}

      <div className={formStyles.formActions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button variant="primary" onClick={handleSubmit}>
          {initialMatch ? "Match speichern" : "Match anlegen"}
        </Button>
      </div>
    </div>
  );
}
