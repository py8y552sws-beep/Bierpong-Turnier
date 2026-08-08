import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { FormDots } from "../components/common/FormDots";
import { PageHeader } from "../components/common/PageHeader";
import { getPlayerName, PLAYERS } from "../constants/players";
import { roundLabel } from "../constants/rounds";
import { useMatches, usePlayerForm, useTeamForm, useTeams, useTournamentActions } from "../hooks/useTournamentData";
import { isMatchPlayed } from "../logic/matchStatus";
import type { Match, MatchSide, PlayerId, TeamId } from "../types";
import { getSideLabel } from "../utils/matchLabels";
import styles from "./ScoreEntry.module.css";

interface Draft {
  readonly scoreA: number;
  readonly scoreB: number;
  readonly bounce: Record<string, number>;
  readonly streak: Record<string, number>;
  readonly cups: Record<string, number>;
}

function buildDraft(match: Match | null): Draft {
  const draft: Draft = { scoreA: match?.scoreA ?? 0, scoreB: match?.scoreB ?? 0, bounce: {}, streak: {}, cups: {} };
  if (!match) return draft;
  const players = [...match.sideA.playerIds, ...match.sideB.playerIds];
  const bounce: Record<string, number> = {};
  const streak: Record<string, number> = {};
  const cups: Record<string, number> = {};
  for (const id of players) {
    const stat = match.playerStats.find((s) => s.playerId === id);
    bounce[id] = stat?.bounceHits ?? 0;
    streak[id] = stat?.longestStreak ?? 0;
    cups[id] = stat?.cups ?? 0;
  }
  return { ...draft, bounce, streak, cups };
}

export function ScoreEntry() {
  const matches = useMatches();
  const teams = useTeams();
  const { updateMatch } = useTournamentActions();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const list = useMemo(() => {
    const base = filter === "open" ? matches.filter((m) => !isMatchPlayed(m)) : matches;
    return base.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [matches, filter]);

  const selected = list.find((m) => m.id === selectedId) ?? list[0] ?? null;
  const selectedKey = selected?.id ?? null;

  const [draft, setDraft] = useState<Draft>(() => buildDraft(selected));

  useEffect(() => {
    setDraft(buildDraft(list.find((m) => m.id === selectedKey) ?? null));
    setShowDetails(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  if (!selected) {
    return (
      <>
        <PageHeader title="Ergebnis eintragen" subtitle="Schnelle Live-Eingabe für den aktuellen Tisch." />
        <Card>
          <EmptyState message="Alle Matches sind bereits gespielt. 🎉" />
        </Card>
      </>
    );
  }

  function setScore(side: "A" | "B", value: number) {
    setDraft((d) => ({ ...d, [side === "A" ? "scoreA" : "scoreB"]: value }));
  }

  function adjustStat(kind: "bounce" | "streak" | "cups", playerId: string, delta: number) {
    setDraft((d) => ({
      ...d,
      [kind]: { ...d[kind], [playerId]: Math.max(0, (d[kind][playerId] ?? 0) + delta) },
    }));
  }

  const tie = draft.scoreA === draft.scoreB;
  const canSave = !tie;

  function handleSave() {
    if (!selected || !canSave) return;
    const players = [...selected.sideA.playerIds, ...selected.sideB.playerIds];
    const playerStats = players.map((id) => ({
      playerId: id,
      cups:
        selected.matchType === "singles"
          ? selected.sideA.playerIds.includes(id)
            ? draft.scoreA
            : draft.scoreB
          : (draft.cups[id] ?? 0),
      bounceHits: draft.bounce[id] ?? 0,
      longestStreak: draft.streak[id] ?? 0,
    }));

    updateMatch(selected.id, {
      matchType: selected.matchType,
      round: selected.round,
      sideA: selected.sideA,
      sideB: selected.sideB,
      scoreA: draft.scoreA,
      scoreB: draft.scoreB,
      playerStats,
    });
    setSelectedId(null);
  }

  const isDoubles = selected.matchType === "doubles";

  return (
    <>
      <PageHeader title="Ergebnis eintragen" subtitle="Endstand auswählen, Bounces zählen, speichern." />

      <Card>
        <div className={styles.pickerScroll}>
          <div className={styles.picker}>
            {(["open", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "open" ? "Offene Spiele" : "Alle Spiele"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.pickerScroll} style={{ marginTop: 8 }}>
          <div className={styles.picker}>
            {list.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`${styles.chip} ${m.id === selected.id ? styles.chipActive : ""} ${isMatchPlayed(m) ? styles.chipPlayed : ""}`}
                onClick={() => setSelectedId(m.id)}
              >
                {getSideLabel(m.sideA, teams)} vs. {getSideLabel(m.sideB, teams)}
                <span className={styles.chipRound}>{roundLabel(m.matchType, m.round)}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ height: 20 }} />

      <Card
        title={roundLabel(selected.matchType, selected.round)}
        actions={<Badge variant={isDoubles ? "accent" : "neutral"}>{isDoubles ? "Doppel" : "Einzel"}</Badge>}
      >
        <div className={styles.arena}>
          <SidePanel
            side="A"
            match={selected}
            teams={teams}
            score={draft.scoreA}
            onScoreSelect={(value) => setScore("A", value)}
            draft={draft}
            onStatChange={adjustStat}
            isDoubles={isDoubles}
            showDetails={showDetails}
          />
          <span className={styles.vsDivider}>vs</span>
          <SidePanel
            side="B"
            match={selected}
            teams={teams}
            score={draft.scoreB}
            onScoreSelect={(value) => setScore("B", value)}
            draft={draft}
            onStatChange={adjustStat}
            isDoubles={isDoubles}
            showDetails={showDetails}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <button type="button" className={styles.detailsToggle} onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? "Details ausblenden" : "Details (Cups pro Spieler, Serie) anzeigen"}
          </button>
        </div>

        <div className={styles.saveBar}>
          <span className={styles.saveHint}>
            {tie ? "Unentschieden ist nicht möglich – Ergebnisse müssen sich unterscheiden." : "Bereit zum Speichern."}
          </span>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            Ergebnis speichern
          </Button>
        </div>
      </Card>
    </>
  );
}

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i); // 0..10

interface SidePanelProps {
  readonly side: "A" | "B";
  readonly match: Match;
  readonly teams: ReturnType<typeof useTeams>;
  readonly score: number;
  readonly onScoreSelect: (value: number) => void;
  readonly draft: Draft;
  readonly onStatChange: (kind: "bounce" | "streak" | "cups", playerId: string, delta: number) => void;
  readonly isDoubles: boolean;
  readonly showDetails: boolean;
}

function SidePanel({ side, match, teams, score, onScoreSelect, draft, onStatChange, isDoubles, showDetails }: SidePanelProps) {
  const matchSide: MatchSide = side === "A" ? match.sideA : match.sideB;
  const name = getSideLabel(matchSide, teams);

  return (
    <div className={styles.side}>
      <span className={styles.sideName}>{name}</span>
      <SideFormDots playerId={!isDoubles ? matchSide.playerIds[0] : undefined} teamId={matchSide.teamId} />

      <div className={styles.scoreGrid} role="group" aria-label={`${name}: Becher auswählen`}>
        {SCORE_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.scoreOption} ${value === score ? styles.scoreOptionActive : ""}`}
            onClick={() => onScoreSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className={styles.bounceBlock}>
        {matchSide.playerIds.map((playerId) => (
          <div key={playerId} className={styles.playerTally}>
            <span className={styles.playerTallyName}>{getPlayerName(playerId)} · Bounce</span>
            <TallyControls value={draft.bounce[playerId] ?? 0} onChange={(d) => onStatChange("bounce", playerId, d)} />
          </div>
        ))}
      </div>

      {showDetails && (
        <div className={styles.detailsPanel}>
          {matchSide.playerIds.map((playerId) => (
            <div key={playerId} className={styles.detailsPlayer}>
              <span className={styles.detailsPlayerName}>{getPlayerName(playerId)}</span>
              {isDoubles && (
                <div className={styles.playerTally}>
                  <span className={styles.playerTallyName}>Cups</span>
                  <TallyControls value={draft.cups[playerId] ?? 0} onChange={(d) => onStatChange("cups", playerId, d)} />
                </div>
              )}
              <div className={styles.playerTally}>
                <span className={styles.playerTallyName}>Längste Serie</span>
                <TallyControls value={draft.streak[playerId] ?? 0} onChange={(d) => onStatChange("streak", playerId, d)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SideFormDots({ playerId, teamId }: { playerId?: PlayerId; teamId?: TeamId }) {
  const playerForm = usePlayerForm(playerId ?? PLAYERS[0]!.id, 5);
  const teamForm = useTeamForm(teamId ?? "", 5);
  return <FormDots entries={playerId ? playerForm : teamForm} />;
}

function TallyControls({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <span className={styles.tallyControls}>
      <button type="button" className={styles.tallyBtn} onClick={() => onChange(-1)} aria-label="Verringern">
        −
      </button>
      <span className={styles.tallyValue}>{value}</span>
      <button type="button" className={styles.tallyBtn} onClick={() => onChange(1)} aria-label="Erhöhen">
        +
      </button>
    </span>
  );
}
