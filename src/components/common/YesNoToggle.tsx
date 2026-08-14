import styles from "./YesNoToggle.module.css";

interface YesNoToggleProps {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}

/**
 * Zweistufiger Ja/Nein-Umschalter für binäre Match-Statistiken (Bounce,
 * Island, Bombe, Trickshot, Ohne Umstellen). Ersetzt Zähler-Controls dort,
 * wo pro Match nur "kam vor" vs. "kam nicht vor" relevant ist – für die
 * zugehörigen Achievements zählt ohnehin nur, ob es mindestens einmal
 * passiert ist.
 */
export function YesNoToggle({ label, value, onChange }: YesNoToggleProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.toggle} role="group" aria-label={label}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${!value ? styles.toggleBtnActive : ""}`}
          onClick={() => onChange(false)}
        >
          Nein
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${value ? styles.toggleBtnActiveYes : ""}`}
          onClick={() => onChange(true)}
        >
          Ja
        </button>
      </span>
    </div>
  );
}
