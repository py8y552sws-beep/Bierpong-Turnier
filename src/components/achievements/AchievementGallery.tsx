import { Badge } from "../common/Badge";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_CATEGORY_ORDER,
  CUP_ACHIEVEMENT_THRESHOLDS,
  MAX_ACHIEVEMENT_POINTS,
  TOTAL_ACHIEVEMENT_COUNT,
} from "../../constants/achievements";
import type { PlayerAchievementSummary } from "../../logic/achievements";
import styles from "./AchievementGallery.module.css";

interface AchievementGalleryProps {
  readonly summary: PlayerAchievementSummary;
  /** Aktuelle Gesamt-Cup-Zahl des Spielers, für den Cup-Fortschrittsbalken je Meilenstein. */
  readonly cups: number;
}

/**
 * Vollständige Achievement-Übersicht eines Spielers: Freischalt- und
 * Punkte-Fortschritt oben, darunter alle 20 Achievements nach Kategorie
 * gruppiert (freigeschaltet hervorgehoben, gesperrt ausgegraut). Wird sowohl
 * im Spielerprofil als auch auf der eigenständigen Achievements-Seite
 * verwendet, damit die Darstellung an beiden Stellen identisch bleibt.
 */
export function AchievementGallery({ summary, cups }: AchievementGalleryProps) {
  const unlockedPercent = (summary.unlockedCount / TOTAL_ACHIEVEMENT_COUNT) * 100;
  const pointsPercent = (summary.totalPoints / MAX_ACHIEVEMENT_POINTS) * 100;

  return (
    <>
      <div className={styles.achievementProgress}>
        <div className={styles.progressRow}>
          <span>Freigeschaltet</span>
          <span>
            {summary.unlockedCount}/{TOTAL_ACHIEVEMENT_COUNT} ({Math.round(unlockedPercent)}%)
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressBarFill} style={{ width: `${unlockedPercent}%` }} />
        </div>
        <div className={styles.progressRow}>
          <span>Achievement Points</span>
          <span>
            {summary.totalPoints}/{MAX_ACHIEVEMENT_POINTS}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressBarFill} style={{ width: `${pointsPercent}%` }} />
        </div>
      </div>

      {ACHIEVEMENT_CATEGORY_ORDER.map((category) => (
        <div key={category} className={styles.achievementCategory}>
          <h4 className={styles.achievementCategoryTitle}>{ACHIEVEMENT_CATEGORY_LABELS[category]}</h4>
          <div className={styles.achievementGrid}>
            {summary.achievements
              .filter((a) => a.category === category)
              .map((a) => {
                const cupThreshold = CUP_ACHIEVEMENT_THRESHOLDS[a.id];
                return (
                  <div
                    key={a.id}
                    className={`${styles.achievementCard} ${a.unlocked ? styles.achievementUnlocked : styles.achievementLocked}`}
                  >
                    <span className={styles.achievementIcon}>{a.unlocked ? a.icon : "🔒"}</span>
                    <div className={styles.achievementInfo}>
                      <span className={styles.achievementName}>{a.name}</span>
                      <span className={styles.achievementDesc}>{a.description}</span>
                      {a.unlocked && a.unlockedAt && (
                        <span className={styles.achievementDate}>
                          Freigeschaltet: {new Date(a.unlockedAt).toLocaleDateString("de-DE")}
                        </span>
                      )}
                      {cupThreshold !== undefined && (
                        <div className={styles.cupProgress}>
                          <div className={styles.cupProgressBar}>
                            <div
                              className={styles.cupProgressBarFill}
                              style={{ width: `${Math.min(100, (cups / cupThreshold) * 100)}%` }}
                            />
                          </div>
                          <span className={styles.cupProgressLabel}>
                            {Math.min(cups, cupThreshold)}/{cupThreshold} Cups
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant={a.unlocked ? "win" : "neutral"}>+{a.points}</Badge>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </>
  );
}
