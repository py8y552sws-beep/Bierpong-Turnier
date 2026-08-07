import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  readonly message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <p className={styles.empty}>{message}</p>;
}
