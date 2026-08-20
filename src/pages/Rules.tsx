import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import tableStyles from "../components/common/table.module.css";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_CATEGORY_ORDER,
  ACHIEVEMENT_DEFINITIONS,
  MAX_ACHIEVEMENT_POINTS,
  TOTAL_ACHIEVEMENT_COUNT,
} from "../constants/achievements";
import { PLAYERS } from "../constants/players";
import {
  DOUBLES_PLACEMENT_POINTS,
  PREDICTION_CATEGORIES,
  PREDICTION_CATEGORY_LABELS,
  PREDICTION_POINTS_PER_CATEGORY,
  SINGLES_PLACEMENT_POINTS,
} from "../constants/points";
import { DEFAULT_DOUBLES_TEAMS } from "../constants/teams";
import { getTeamLabel } from "../utils/matchLabels";
import styles from "./Rules.module.css";

/**
 * Statische Regel-Übersicht, bewusst aus denselben Konstanten aufgebaut wie
 * die restliche App (Punktetabellen, Achievement-Definitionen, Teams) –
 * damit diese Seite nie von der tatsächlichen Spiellogik abweichen kann.
 */
export function Rules() {
  return (
    <>
      <PageHeader
        title="Regeln & Ablauf"
        subtitle="Kompakte Übersicht für alle: Turnierformat, Punktesystem und Achievements."
      />

      <Card title="Gesamtwertung">
        <p className={styles.text}>
          Es gibt zwei Turniere (Einzel + Doppel) sowie Predictions und Achievements. Am Ende zählt die
          Gesamtwertung:
        </p>
        <p className={styles.formula}>Gesamtpunkte = Einzelpunkte + Doppelpunkte + Prediction-Punkte + Achievement-Punkte</p>
        <p className={styles.text}>
          Bei Punktgleichheit entscheiden der Reihe nach: mehr Einzelpunkte → mehr Doppelpunkte → mehr
          Achievement-Punkte → mehr Prediction-Punkte.
        </p>
        <p className={styles.text}>
          Die 8 Spieler: {PLAYERS.map((p) => p.name).join(", ")}.
        </p>
      </Card>

      <div style={{ height: 20 }} />

      <Card title="🎯 Einzelturnier">
        <ol className={styles.steps}>
          <li>Vorrunde: jeder gegen jeden.</li>
          <li>K.O.-Runde: Platz 1–4 aus der Vorrunde spielen Halbfinale um den Titel, Platz 5–8 spielen um die Plätze 5–8.</li>
        </ol>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {Object.keys(SINGLES_PLACEMENT_POINTS).map((rank) => (
                  <th key={rank}>{rank}. Platz</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.values(SINGLES_PLACEMENT_POINTS).map((points, i) => (
                  <td key={i} className={tableStyles.num}>
                    {points}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ height: 20 }} />

      <Card title="🍺 Doppelturnier">
        <p className={styles.text}>
          Feste Teams: {DEFAULT_DOUBLES_TEAMS.map((t) => getTeamLabel(t)).join(" · ")} (Teamnamen dürft ihr frei
          wählen).
        </p>
        <ol className={styles.steps}>
          <li>Hin- und Rückrunde: jedes Team spielt zweimal gegen jedes andere Team.</li>
          <li>Platz 3 und 4 stehen direkt aus der Abschlusstabelle fest (Siege, Cup-Differenz).</li>
          <li>Platz 1 und 2 entscheidet ein Finale zwischen den beiden Tabellenersten.</li>
        </ol>
        <p className={styles.text}>Punkte pro Spieler nach Team-Platzierung:</p>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {Object.keys(DOUBLES_PLACEMENT_POINTS).map((rank) => (
                  <th key={rank}>{rank}. Platz</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.values(DOUBLES_PLACEMENT_POINTS).map((points, i) => (
                  <td key={i} className={tableStyles.num}>
                    {points}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ height: 20 }} />

      <Card title="🔮 Predictions">
        <p className={styles.text}>
          Vor Turnierstart tippt jeder in {PREDICTION_CATEGORIES.length} Kategorien. Jeder komplett richtige Tipp
          bringt <strong>+{PREDICTION_POINTS_PER_CATEGORY} Punkte</strong>.
        </p>
        <ul className={styles.chipList}>
          {PREDICTION_CATEGORIES.map((category) => (
            <li key={category} className={styles.chip}>
              {PREDICTION_CATEGORY_LABELS[category]}
            </li>
          ))}
        </ul>
        <p className={styles.text}>
          ⚠️ Sobald das erste Spiel gespielt wurde, sind alle Tipps gesperrt – also rechtzeitig vorher abgeben!
        </p>
      </Card>

      <div style={{ height: 20 }} />

      <Card
        title="🏅 Achievements"
        subtitle={`${TOTAL_ACHIEVEMENT_COUNT} Achievements, max. ${MAX_ACHIEVEMENT_POINTS} Punkte – jeweils einmal pro Spieler freischaltbar`}
      >
        <p className={styles.text}>
          Achievements schaltet ihr automatisch anhand der eingetragenen Ergebnisse frei – keine manuelle Vergabe.
          Bei den Spezialwürfen und „Ohne Umstellen" zählt nur das <strong>erste</strong> Mal: sobald ihr das
          Achievement erreicht habt, gibt es für weitere Treffer derselben Art keine zusätzlichen Punkte mehr (die
          Eingabemaske bietet die Option ab dann auch nicht mehr an).
        </p>

        {ACHIEVEMENT_CATEGORY_ORDER.map((category) => (
          <div key={category} className={styles.achievementCategory}>
            <h4 className={styles.achievementCategoryTitle}>{ACHIEVEMENT_CATEGORY_LABELS[category]}</h4>
            <div className={styles.achievementGrid}>
              {Object.values(ACHIEVEMENT_DEFINITIONS)
                .filter((a) => a.category === category)
                .map((a) => (
                  <div key={a.id} className={styles.achievementCard}>
                    <span className={styles.achievementIcon}>{a.icon}</span>
                    <div className={styles.achievementInfo}>
                      <span className={styles.achievementName}>{a.name}</span>
                      <span className={styles.achievementDesc}>{a.description}</span>
                    </div>
                    <span className={styles.achievementPoints}>+{a.points}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
