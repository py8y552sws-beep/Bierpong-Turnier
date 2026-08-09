import { useEffect } from "react";
import { getPlayerName } from "../../constants/players";
import type { MatchAchievementEntry } from "../../logic/achievements";
import styles from "./AchievementToast.module.css";

export interface AchievementToastEntry extends MatchAchievementEntry {
  readonly toastId: string;
}

interface AchievementToastProps {
  readonly toasts: readonly AchievementToastEntry[];
  readonly onDismiss: (toastId: string) => void;
}

const AUTO_DISMISS_MS = 5000;

/** Zeigt neu freigeschaltete Achievements kurz als Toast an, genau einmal je Freischaltung. */
export function AchievementToastStack({ toasts, onDismiss }: AchievementToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack}>
      {toasts.map((toast) => (
        <SingleToast key={toast.toastId} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: AchievementToastEntry;
  onDismiss: (toastId: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.toastId), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.toastId]);

  return (
    <div className={styles.toast} role="status">
      <span className={styles.icon}>{toast.icon}</span>
      <div className={styles.body}>
        <span className={styles.title}>Achievement freigeschaltet!</span>
        <span className={styles.name}>{toast.name}</span>
        <span className={styles.player}>{getPlayerName(toast.playerId)}</span>
      </div>
      <span className={styles.points}>+{toast.points}</span>
    </div>
  );
}
