import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly padded?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Card({ title, subtitle, actions, padded = true, className, children }: CardProps) {
  const classes = [styles.card, padded ? styles.padded : "", className].filter(Boolean).join(" ");
  return (
    <section className={classes}>
      {(title || actions) && (
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {title && <h3>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
