import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { ADMIN_NAV, ALL_NAV, PRIMARY_NAV } from "./nav";
import styles from "./AppShell.module.css";

const FOOTER_SYNC_LABELS: Readonly<Record<string, string>> = {
  disabled: "lokal gespeichert",
  connecting: "Sync verbindet …",
  waiting_for_bootstrap: "Sync bereit (siehe Admin)",
  synced: "Cloud-Sync aktiv",
  offline: "Sync offline",
  error: "Sync-Fehler",
};

interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const syncStatus = useSyncStatus();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <svg className={styles.brandMark} viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M8 6h16l-1.9 18c-.4 3.4-3.3 6-6.8 6h0c-3.5 0-6.4-2.6-6.8-6L8 6Z"
              fill="var(--accent)"
            />
            <rect x="7" y="5" width="18" height="2.4" rx="1.2" fill="var(--accent)" />
          </svg>
          <div className={styles.brandText}>
            BPC
            <span>Championship</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Hauptnavigation">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              <item.icon className={styles.navIcon} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}

          <div className={styles.navDivider} />
          <div className={styles.navGroupLabel}>Verwaltung</div>
          <NavLink
            to={ADMIN_NAV.to}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            <ADMIN_NAV.icon className={styles.navIcon} aria-hidden="true" />
            {ADMIN_NAV.label}
          </NavLink>
        </nav>

        <div className={styles.footer}>8 Spieler · {FOOTER_SYNC_LABELS[syncStatus]}</div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>

      <nav className={styles.mobileNav} aria-label="Hauptnavigation (mobil)">
        {ALL_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}` : styles.mobileNavLink
            }
          >
            <item.icon className={styles.mobileNavIcon} aria-hidden="true" />
            <span className={styles.mobileNavLabel}>{item.mobileLabel ?? item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
