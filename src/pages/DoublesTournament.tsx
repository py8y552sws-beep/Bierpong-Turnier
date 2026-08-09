import { useState } from "react";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { MatchList } from "../components/common/MatchList";
import { PageHeader } from "../components/common/PageHeader";
import tableStyles from "../components/common/table.module.css";
import { DOUBLES_PLACEMENT_POINTS } from "../constants/points";
import {
  useDoublesPlacements,
  useDoublesStandings,
  useMatches,
  useTeams,
  useTournamentActions,
} from "../hooks/useTournamentData";
import { getPlayerName } from "../constants/players";
import { getTeamLabel } from "../utils/matchLabels";
import type { DoublesTeam } from "../types";
import styles from "./DoublesTournament.module.css";

export function DoublesTournament() {
  const teams = useTeams();
  const matches = useMatches();
  const doublesMatches = matches.filter((m) => m.matchType === "doubles");
  const standings = useDoublesStandings();
  const placements = useDoublesPlacements();

  const championTeamId = Object.entries(placements).find(([, rank]) => rank === 1)?.[0];
  const championTeam = teams.find((t) => t.id === championTeamId);

  return (
    <>
      <PageHeader
        title="Doppelturnier"
        subtitle="4 Teams · Hin- und Rückrunde (12 Spiele, 6 pro Spieler), die Endplatzierung ergibt sich aus der Abschlusstabelle."
      />

      {championTeam && (
        <div className={styles.placementBanner}>
          <span>Turniersieger Doppel</span>
          <strong>{getTeamLabel(championTeam)}</strong>
        </div>
      )}

      <Card title="Teams" subtitle="Spielerpaarungen werden im Adminbereich festgelegt – der Teamname darf frei gewählt werden">
        {teams.length === 0 ? (
          <EmptyState message="Noch keine Doppelteams festgelegt." />
        ) : (
          teams.map((team) => <TeamRow key={team.id} team={team} />)
        )}
      </Card>

      <div style={{ height: 20 }} />

      <Card title="Tabelle" subtitle="Automatisch aus den Rundenspielen berechnet">
        {standings.every((s) => s.wins === 0 && s.losses === 0) ? (
          <EmptyState message="Noch keine Rundenspiele erfasst." />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th className={tableStyles.num}>S</th>
                  <th className={tableStyles.num}>N</th>
                  <th className={tableStyles.num}>Cups +/-</th>
                  <th className={tableStyles.num}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.teamId} className={i === 0 && s.wins > 0 ? tableStyles.highlightRow : ""}>
                    <td className={tableStyles.rankCell}>{i + 1}</td>
                    <td>{s.teamName}</td>
                    <td className={tableStyles.num}>{s.wins}</td>
                    <td className={tableStyles.num}>{s.losses}</td>
                    <td className={tableStyles.num}>
                      {s.cupsFor}:{s.cupsAgainst}
                    </td>
                    <td className={tableStyles.num}>
                      {s.diff > 0 ? "+" : ""}
                      {s.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ height: 20 }} />

      <Card title="Rundenspiele" subtitle="Hinrunde und Rückrunde, je 6 Spiele">
        <MatchList matches={doublesMatches} teams={teams} emptyMessage="Noch keine Spiele angesetzt." showRound showAchievements />
      </Card>

      <div style={{ height: 20 }} />

      <Card title="Endplatzierung & Punkte pro Spieler">
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Platz</th>
                <th>Team</th>
                <th className={tableStyles.num}>Punkte / Spieler</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DOUBLES_PLACEMENT_POINTS).map(([rank, points]) => {
                const entry = Object.entries(placements).find(([, r]) => r === Number(rank));
                const team = entry ? teams.find((t) => t.id === entry[0]) : undefined;
                return (
                  <tr key={rank}>
                    <td className={tableStyles.rankCell}>{rank}.</td>
                    <td>{team ? getTeamLabel(team) : "–"}</td>
                    <td className={tableStyles.num}>{team ? points : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function TeamRow({ team }: { team: DoublesTeam }) {
  const { setTeamName } = useTournamentActions();
  const [value, setValue] = useState(team.name ?? "");

  function commit() {
    if (value.trim() !== (team.name ?? "")) {
      setTeamName(team.id, value.trim());
    }
  }

  return (
    <div className={styles.teamRow}>
      <div className={styles.teamNameField}>
        <label htmlFor={`team-name-${team.id}`}>Teamname</label>
        <input
          id={`team-name-${team.id}`}
          className={styles.teamNameInput}
          value={value}
          placeholder={team.playerIds.map(getPlayerName).join(" & ")}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          maxLength={30}
        />
      </div>
      <span className={styles.teamPlayers}>{team.playerIds.map(getPlayerName).join(" & ")}</span>
    </div>
  );
}
