import type { PlayerStandingEntry } from "../../logic/standings";
import styles from "./Podium.module.css";

interface PodiumProps {
  readonly entries: readonly PlayerStandingEntry[];
}

const ORDER: readonly [index: number, placeClass: "second" | "first" | "third"][] = [
  [1, "second"],
  [0, "first"],
  [2, "third"],
];

export function Podium({ entries }: PodiumProps) {
  return (
    <div className={styles.podium}>
      {ORDER.map(([index, placeClass]) => {
        const entry = entries[index];
        if (!entry) return <div key={index} />;
        return (
          <div key={entry.playerId} className={`${styles.place} ${styles[placeClass] ?? ""}`}>
            <div className={styles.avatar}>{entry.playerName.slice(0, 2).toUpperCase()}</div>
            <div className={styles.name}>{entry.playerName}</div>
            <div className={styles.points}>{entry.totalPoints} P</div>
            <div className={styles.bar}>{entry.rank}</div>
          </div>
        );
      })}
    </div>
  );
}
