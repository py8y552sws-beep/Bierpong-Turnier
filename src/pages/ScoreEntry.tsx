import { useEffect, useMemo, useState } from "react";
import { AchievementToastStack, type AchievementToastEntry } from "../components/common/AchievementToast";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { FormDots } from "../components/common/FormDots";
import { PageHeader } from "../components/common/PageHeader";
import { YesNoToggle } from "../components/common/YesNoToggle";
import { getPlayerName, PLAYERS } from "../constants/players";
import { roundLabel } from "../constants/rounds";
import { useMatches, usePlayerForm, useTeamForm, useTeams, useTournamentActions } from "../hooks/useTournamentData";
import { calculateMatchAchievements } from "../logic/achievements";
import { isMatchPlayed } from "../logic/matchStatus";
import type { Match, MatchInput, MatchSide, MatchType, PlayerId, TeamId } from "../types";
import { generateId } from "../utils/id";
import { getSideLabel } from "../utils/matchLabels";
import styles from "./ScoreEntry.module.css";

interface Draft {
  readonly scoreA: number;
  readonly scoreB: number;
  /** 0/1 – Bounce/Island/Bombe/Trickshot sind Ja/Nein-Angaben pro Match. */
  readonly bounce: Record<string, number>;
  readonly streak: Record<string, number>;
  readonly cups: Record<string, number>;
  readonly island: Record<string, number>;
  readonly bomb: Record<string, number>;
  readonly trickshot: Record<string, number>;
  /** 1 = mit Umstellen (Default), 0 = "Ohne Umstellen" angehakt. */
  readonly rerack: Record<string, number>;
}

function buildDraft(match: Match | null): Draft {
  const draft: Draft = {
    scoreA: match?.scoreA ?? 0,
    scoreB: match?.scoreB ?? 0,
    bounce: {},
    streak: {},
    cups: {},
    island: {},
    bomb: {},
    trickshot: {},
    rerack: {},
  };
  if (!match) return draft;
  const players = [...match.sideA.playerIds, ...match.sideB.playerIds];
  const bounce: Record<string, number> = {};
  const streak: Record<string, number> = {};
  const cups: Record<string, number> = {};
  const island: Record<string, number> = {};
  const bomb: Record<string, number> = {};
  const trickshot: Record<string, number> = {};
  const rerack: Record<string, number> = {};
  for (const id of players) {
    const stat = match.playerStats.find((s) => s.playerId === id);
    bounce[id] = stat?.bounceHits ?? 0;
    // Default 1: wer mindestens einen Becher trifft, hat automatisch schon
    // eine Serie von 1 – 0 wäre nur bei komplett fehlendem Treffer korrekt.
    streak[id] = stat?.longestStreak ?? 1;
    cups[id] = stat?.cups ?? 0;
    island[id] = stat?.islandHits ?? 0;
    bomb[id] = stat?.bombHits ?? 0;
    trickshot[id] = stat?.trickshotHits ?? 0;
    rerack[id] = stat?.reRacks ?? 1;
  }
  return { ...draft, bounce, streak, cups, island, bomb, trickshot, rerack };
}

type TallyKind = "streak" | "cups";
type FlagKind = "bounce" | "island" | "bomb" | "trickshot";

/**
 * Effektiver Endstand einer Matchseite: bei Einzel direkt der ausgewählte
 * Score-Button, bei Doppel automatisch die Summe der pro Spieler
 * eingetragenen Becher-Treffer – so entsteht das Endergebnis immer korrekt
 * aus den Einzelbeiträgen, ohne dass beides manuell synchron gehalten
 * werden müsste.
 */
function effectiveScore(match: Match, side: "A" | "B", draft: Draft): number {
  if (match.matchType === "singles") {
    return side === "A" ? draft.scoreA : draft.scoreB;
  }
  const matchSide = side === "A" ? match.sideA : match.sideB;
  return matchSide.playerIds.reduce((sum, id) => sum + (draft.cups[id] ?? 0), 0);
}

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i); // 0..10

export function ScoreEntry() {
  const matches = useMatches();
  const teams = useTeams();
  const { updateMatch } = useTournamentActions();
  const [tournament, setTournament] = useState<MatchType>("singles");
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [toasts, setToasts] = useState<readonly AchievementToastEntry[]>([]);

  const list = useMemo(() => {
    const byTournament = matches.filter((m) => m.matchType === tournament);
    const base = filter === "open" ? byTournament.filter((m) => !isMatchPlayed(m)) : byTournament;
    return base.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [matches, filter, tournament]);

  const selected = list.find((m) => m.id === selectedId) ?? list[0] ?? null;
  const selectedKey = selected?.id ?? null;

  const [draft, setDraft] = useState<Draft>(() => buildDraft(selected));

  useEffect(() => {
    setDraft(buildDraft(list.find((m) => m.id === selectedKey) ?? null));
    setShowDetails(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  function dismissToast(toastId: string) {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }

  function setScore(side: "A" | "B", value: number) {
    setDraft((d) => ({ ...d, [side === "A" ? "scoreA" : "scoreB"]: value }));
  }

  function adjustTally(kind: TallyKind, playerId: string, delta: number) {
    setDraft((d) => ({
      ...d,
      [kind]: { ...d[kind], [playerId]: Math.max(0, (d[kind][playerId] ?? 0) + delta) },
    }));
  }

  function setFlag(kind: FlagKind, playerId: string, value: boolean) {
    setDraft((d) => ({ ...d, [kind]: { ...d[kind], [playerId]: value ? 1 : 0 } }));
  }

  function setNoRerack(playerId: string, noRerack: boolean) {
    setDraft((d) => ({ ...d, rerack: { ...d.rerack, [playerId]: noRerack ? 0 : 1 } }));
  }

  const scoreA = selected ? effectiveScore(selected, "A", draft) : 0;
  const scoreB = selected ? effectiveScore(selected, "B", draft) : 0;
  const tie = scoreA === scoreB;
  const canSave = selected !== null && !tie;

  function handleSave() {
    if (!selected || !canSave) return;
    const players = [...selected.sideA.playerIds, ...selected.sideB.playerIds];
    const playerStats = players.map((id) => ({
      playerId: id,
      cups:
        selected.matchType === "singles"
          ? selected.sideA.playerIds.includes(id)
            ? scoreA
            : scoreB
          : (draft.cups[id] ?? 0),
      bounceHits: draft.bounce[id] ?? 0,
      longestStreak: draft.streak[id] ?? 1,
      islandHits: draft.island[id] ?? 0,
      bombHits: draft.bomb[id] ?? 0,
      trickshotHits: draft.trickshot[id] ?? 0,
      reRacks: draft.rerack[id] ?? 1,
    }));

    const input: MatchInput = {
      matchType: selected.matchType,
      round: selected.round,
      sideA: selected.sideA,
      sideB: selected.sideB,
      scoreA,
      scoreB,
      playerStats,
    };

    // Achievement-Freischaltungen werden lokal simuliert, BEVOR der Store
    // aktualisiert wird: so lässt sich der genaue Unterschied (vorher/
    // nachher) für dieses eine Match ermitteln, unabhängig davon, wann React
    // den aktualisierten Store-Zustand tatsächlich neu rendert.
    const simulatedMatches = matches.map((m) => (m.id === selected.id ? { ...m, ...input } : m));
    const newlyUnlocked = calculateMatchAchievements(simulatedMatches, selected.id);

    updateMatch(selected.id, input);

    if (newlyUnlocked.length > 0) {
      const newToasts = newlyUnlocked.map((entry) => ({ ...entry, toastId: generateId("toast") }));
      setToasts((prev) => [...prev, ...newToasts]);
    }

    setSelectedId(null);
  }

  const isDoubles = tournament === "doubles";

  return (
    <>
      <AchievementToastStack toasts={toasts} onDismiss={dismissToast} />

      <PageHeader title="Ergebnis eintragen" subtitle="Turnier wählen, Endstand erfassen, speichern." />

      <Card>
        <div className={styles.pickerScroll}>
          <div className={styles.picker}>
            {(["singles", "doubles"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.chip} ${tournament === t ? styles.chipActive : ""}`}
                onClick={() => {
                  setTournament(t);
                  setSelectedId(null);
                }}
              >
                {t === "singles" ? "Einzelturnier" : "Doppelturnier"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.pickerScroll} style={{ marginTop: 8 }}>
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
        {list.length > 0 && (
          <div className={styles.pickerScroll} style={{ marginTop: 8 }}>
            <div className={styles.picker}>
              {list.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.chip} ${selected && m.id === selected.id ? styles.chipActive : ""} ${isMatchPlayed(m) ? styles.chipPlayed : ""}`}
                  onClick={() => setSelectedId(m.id)}
                >
                  {getSideLabel(m.sideA, teams)} vs. {getSideLabel(m.sideB, teams)}
                  <span className={styles.chipRound}>{roundLabel(m.matchType, m.round)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div style={{ height: 20 }} />

      {!selected ? (
        <Card>
          <EmptyState
            message={
              filter === "open"
                ? `Alle ${isDoubles ? "Doppelturnier" : "Einzelturnier"}-Spiele sind bereits gespielt. 🎉`
                : `Für das ${isDoubles ? "Doppelturnier" : "Einzelturnier"} sind noch keine Spiele angesetzt.`
            }
          />
        </Card>
      ) : (
        <Card
          title={roundLabel(selected.matchType, selected.round)}
          actions={<Badge variant={isDoubles ? "accent" : "neutral"}>{isDoubles ? "Doppel" : "Einzel"}</Badge>}
        >
          <div className={styles.arena}>
            <SidePanel
              side="A"
              match={selected}
              teams={teams}
              score={scoreA}
              onScoreSelect={(value) => setScore("A", value)}
              draft={draft}
              onTallyChange={adjustTally}
              onFlagChange={setFlag}
              onNoRerackChange={setNoRerack}
              isDoubles={isDoubles}
              showDetails={showDetails}
            />
            <span className={styles.vsDivider}>vs</span>
            <SidePanel
              side="B"
              match={selected}
              teams={teams}
              score={scoreB}
              onScoreSelect={(value) => setScore("B", value)}
              draft={draft}
              onTallyChange={adjustTally}
              onFlagChange={setFlag}
              onNoRerackChange={setNoRerack}
              isDoubles={isDoubles}
              showDetails={showDetails}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <button type="button" className={styles.detailsToggle} onClick={() => setShowDetails((v) => !v)}>
              {showDetails ? "Details ausblenden" : "Details (Bounce, Serie, Island, Bombe, Trickshot, Umstellen) anzeigen"}
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
      )}
    </>
  );
}

interface SidePanelProps {
  readonly side: "A" | "B";
  readonly match: Match;
  readonly teams: ReturnType<typeof useTeams>;
  readonly score: number;
  readonly onScoreSelect: (value: number) => void;
  readonly draft: Draft;
  readonly onTallyChange: (kind: TallyKind, playerId: string, delta: number) => void;
  readonly onFlagChange: (kind: FlagKind, playerId: string, value: boolean) => void;
  readonly onNoRerackChange: (playerId: string, noRerack: boolean) => void;
  readonly isDoubles: boolean;
  readonly showDetails: boolean;
}

function SidePanel({
  side,
  match,
  teams,
  score,
  onScoreSelect,
  draft,
  onTallyChange,
  onFlagChange,
  onNoRerackChange,
  isDoubles,
  showDetails,
}: SidePanelProps) {
  const matchSide: MatchSide = side === "A" ? match.sideA : match.sideB;
  const name = getSideLabel(matchSide, teams);

  return (
    <div className={styles.side}>
      <span className={styles.sideName}>{name}</span>
      <SideFormDots playerId={!isDoubles ? matchSide.playerIds[0] : undefined} teamId={matchSide.teamId} />

      {isDoubles ? (
        <div className={styles.cupsBlock}>
          {matchSide.playerIds.map((playerId) => (
            <div key={playerId} className={styles.playerTally}>
              <span className={styles.playerTallyName}>{getPlayerName(playerId)} · Cups</span>
              <TallyControls value={draft.cups[playerId] ?? 0} onChange={(d) => onTallyChange("cups", playerId, d)} />
            </div>
          ))}
          <div className={styles.computedScore}>
            Team-Score: <span className={styles.computedScoreValue}>{score}</span>
          </div>
        </div>
      ) : (
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
      )}

      {showDetails && (
        <div className={styles.detailsPanel}>
          {matchSide.playerIds.map((playerId) => (
            <div key={playerId} className={styles.detailsPlayer}>
              <span className={styles.detailsPlayerName}>{getPlayerName(playerId)}</span>
              <div className={styles.playerTally}>
                <span className={styles.playerTallyName}>Längste Serie</span>
                <TallyControls value={draft.streak[playerId] ?? 0} onChange={(d) => onTallyChange("streak", playerId, d)} />
              </div>
              <YesNoToggle
                label="Bounce-Treffer"
                value={(draft.bounce[playerId] ?? 0) > 0}
                onChange={(v) => onFlagChange("bounce", playerId, v)}
              />
              <YesNoToggle
                label="Island-Treffer"
                value={(draft.island[playerId] ?? 0) > 0}
                onChange={(v) => onFlagChange("island", playerId, v)}
              />
              <YesNoToggle
                label="Bomben-Treffer"
                value={(draft.bomb[playerId] ?? 0) > 0}
                onChange={(v) => onFlagChange("bomb", playerId, v)}
              />
              <YesNoToggle
                label="Trickshot"
                value={(draft.trickshot[playerId] ?? 0) > 0}
                onChange={(v) => onFlagChange("trickshot", playerId, v)}
              />
              <YesNoToggle
                label="Ohne Umstellen gespielt"
                value={(draft.rerack[playerId] ?? 1) === 0}
                onChange={(v) => onNoRerackChange(playerId, v)}
              />
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
