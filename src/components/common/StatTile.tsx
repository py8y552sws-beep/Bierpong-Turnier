import type { ComponentType, ReactNode, SVGProps } from "react";
import styles from "./StatTile.module.css";

interface StatTileProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly meta?: ReactNode;
  readonly icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export function StatTile({ label, value, meta, icon: Icon }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>
        {Icon && <Icon aria-hidden="true" />}
        {label}
      </span>
      <span className={styles.value}>{value}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  );
}
