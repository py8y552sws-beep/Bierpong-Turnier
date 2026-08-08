import type { ComponentType, SVGProps } from "react";
import {
  IconAdmin,
  IconBolt,
  IconChart,
  IconClipboard,
  IconDashboard,
  IconDoubles,
  IconTrophy,
  IconUsers,
} from "../common/icons";

export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly end?: boolean;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/eingabe", label: "Ergebnis eintragen", icon: IconBolt },
  { to: "/spieler", label: "Spieler", icon: IconUsers },
  { to: "/einzelturnier", label: "Einzelturnier", icon: IconTrophy },
  { to: "/doppelturnier", label: "Doppelturnier", icon: IconDoubles },
  { to: "/predictions", label: "Predictions", icon: IconClipboard },
  { to: "/statistiken", label: "Statistiken", icon: IconChart },
];

export const ADMIN_NAV: NavItem = { to: "/admin", label: "Admin", icon: IconAdmin };
