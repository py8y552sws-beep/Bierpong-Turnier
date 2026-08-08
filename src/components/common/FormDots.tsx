import type { FormEntry } from "../../logic/form";
import styles from "./FormDots.module.css";

interface FormDotsProps {
  readonly entries: readonly FormEntry[];
}

/** Kleine Formkurve: ein Punkt pro der letzten Spiele, ältestes links, aktuellstes rechts. */
export function FormDots({ entries }: FormDotsProps) {
  if (entries.length === 0) {
    return <span className={styles.empty}>Noch keine Spiele</span>;
  }
  return (
    <span className={styles.row} title={entries.map((e) => e.result).join(" ")}>
      {entries.map((e, i) => (
        <span key={e.matchId ?? i} className={`${styles.dot} ${e.result === "W" ? styles.win : styles.loss}`} />
      ))}
    </span>
  );
}
