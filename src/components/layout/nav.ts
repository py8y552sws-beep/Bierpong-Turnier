import type { ComponentType, SVGProps } from "react";
import {
  IconAdmin,
  IconBolt,
  IconChart,
  IconClipboard,
  IconDashboard,
  IconDoubles,
  IconStreak,
  IconTrophy,
  IconUsers,
} from "../common/icons";

export interface NavItem {
  readonly to: string;
  readonly label: string;
  /** Kurzer Beschriftungstext für die mobile Icon-Legende; fällt auf `label` zurück, falls nicht gesetzt. */
  readonly mobileLabel?: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly end?: boolean;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { to: "/", label: "Dashboard", mobileLabel: "Home", icon: IconDashboard, end: true },
  { to: "/eingabe", label: "Ergebnis eintragen", mobileLabel: "Eingabe", icon: IconBolt },
  { to: "/spieler", label: "Spieler", icon: IconUsers },
  { to: "/einzelturnier", label: "Einzelturnier", mobileLabel: "Einzel", icon: IconTrophy },
  { to: "/doppelturnier", label: "Doppelturnier", mobileLabel: "Doppel", icon: IconDoubles },
  { to: "/predictions", label: "Predictions", mobileLabel: "Tipps", icon: IconClipboard },
  { to: "/achievements", label: "Achievements", mobileLabel: "Erfolge", icon: IconStreak },
  { to: "/statistiken", label: "Statistiken", mobileLabel: "Stats", icon: IconChart },
];

export const ADMIN_NAV: NavItem = { to: "/admin", label: "Admin", icon: IconAdmin };

/** Alle Navigationspunkte (inkl. Admin) in einer Liste – Grundlage für die mobile Icon-Legende. */
export const ALL_NAV: readonly NavItem[] = [...PRIMARY_NAV, ADMIN_NAV];
