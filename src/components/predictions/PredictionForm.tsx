import { PLAYERS } from "../../constants/players";
import {
  PREDICTION_CATEGORIES,
  PREDICTION_CATEGORY_LABELS,
  PREDICTION_CATEGORY_PICK_COUNT,
  PREDICTION_CATEGORY_TARGET,
} from "../../constants/points";
import type { DoublesTeam, Prediction, PredictionCategory } from "../../types";
import { getTeamLabel } from "../../utils/matchLabels";
import styles from "./PredictionForm.module.css";

interface Option {
  readonly value: string;
  readonly label: string;
}

interface PredictionFormProps {
  readonly prediction: Prediction;
  readonly teams: readonly DoublesTeam[];
  readonly onChange: (next: Prediction) => void;
  readonly disabled?: boolean;
}

function getOptions(category: PredictionCategory, teams: readonly DoublesTeam[]): Option[] {
  if (PREDICTION_CATEGORY_TARGET[category] === "team") {
    return teams.map((t) => ({ value: t.id, label: getTeamLabel(t) }));
  }
  return PLAYERS.map((p) => ({ value: p.id, label: p.name }));
}

export function PredictionForm({ prediction, teams, onChange, disabled }: PredictionFormProps) {
  function updateSingle(category: PredictionCategory, value: string) {
    onChange({ ...prediction, [category]: value === "" ? null : value });
  }

  function toggleMulti(category: PredictionCategory, value: string, max: number) {
    const current = prediction[category] as readonly string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : current.length < max
        ? [...current, value]
        : current;
    onChange({ ...prediction, [category]: next });
  }

  return (
    <div className={styles.form}>
      {PREDICTION_CATEGORIES.map((category) => {
        const pickCount = PREDICTION_CATEGORY_PICK_COUNT[category];
        const options = getOptions(category, teams);

        if (pickCount === 1) {
          const value = (prediction[category] as string | null) ?? "";
          return (
            <div className={styles.field} key={category}>
              <label htmlFor={`pred-${category}`}>{PREDICTION_CATEGORY_LABELS[category]}</label>
              <select
                id={`pred-${category}`}
                className={styles.select}
                value={value}
                disabled={disabled}
                onChange={(e) => updateSingle(category, e.target.value)}
              >
                <option value="">– auswählen –</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        const selected = prediction[category] as readonly string[];
        return (
          <div className={styles.field} key={category}>
            <label>
              {PREDICTION_CATEGORY_LABELS[category]}
              <span className={styles.hint}>
                ({selected.length}/{pickCount} ausgewählt)
              </span>
            </label>
            <div className={styles.checkGrid}>
              {options.map((o) => {
                const checked = selected.includes(o.value);
                const optionDisabled = disabled || (!checked && selected.length >= pickCount);
                return (
                  <label
                    key={o.value}
                    className={`${styles.checkOption} ${checked ? styles.checkOptionChecked : ""} ${optionDisabled ? styles.checkOptionDisabled : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={optionDisabled}
                      onChange={() => toggleMulti(category, o.value, pickCount)}
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
