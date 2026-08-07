import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "neutral" | "accent" | "win" | "loss";

interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly children: ReactNode;
}

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
