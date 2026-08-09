import type { AchievementCategory, AchievementDefinition, AchievementId } from "../types";

/**
 * Zentrale Definition aller 20 Achievements. Einzige Quelle der Wahrheit für
 * Namen, Beschreibung, Kategorie, Icon und Punktwert – die eigentliche
 * Freischalt-Logik (wann ein Achievement erreicht ist) lebt ausschließlich
 * in src/logic/achievements.ts, niemals hier.
 */
export const ACHIEVEMENT_DEFINITIONS: Readonly<Record<AchievementId, AchievementDefinition>> = {
  heat_check: {
    id: "heat_check",
    name: "Heat Check",
    description: "3 Treffer in Folge",
    category: "streak",
    points: 2,
    icon: "🌶️",
  },
  on_fire: {
    id: "on_fire",
    name: "On Fire",
    description: "5 Treffer in Folge",
    category: "streak",
    points: 4,
    icon: "🔥",
  },
  unstoppable: {
    id: "unstoppable",
    name: "Unstoppable",
    description: "7 Treffer in Folge",
    category: "streak",
    points: 6,
    icon: "⚡",
  },

  hot_streak: {
    id: "hot_streak",
    name: "Hot Streak",
    description: "3 Siege in Folge",
    category: "win_streak",
    points: 3,
    icon: "📈",
  },
  winning_machine: {
    id: "winning_machine",
    name: "Winning Machine",
    description: "5 Siege in Folge",
    category: "win_streak",
    points: 5,
    icon: "🤖",
  },
  dominance: {
    id: "dominance",
    name: "Dominance",
    description: "7 Siege in Folge",
    category: "win_streak",
    points: 8,
    icon: "👑",
  },

  cup_hunter: {
    id: "cup_hunter",
    name: "Cup Hunter",
    description: "25 Cups insgesamt getroffen",
    category: "cups",
    points: 2,
    icon: "🥤",
  },
  cup_collector: {
    id: "cup_collector",
    name: "Cup Collector",
    description: "50 Cups insgesamt getroffen",
    category: "cups",
    points: 3,
    icon: "🍺",
  },
  cup_machine: {
    id: "cup_machine",
    name: "Cup Machine",
    description: "75 Cups insgesamt getroffen",
    category: "cups",
    points: 4,
    icon: "🛢️",
  },
  cup_master: {
    id: "cup_master",
    name: "Cup Master",
    description: "100 Cups insgesamt getroffen",
    category: "cups",
    points: 5,
    icon: "🏺",
  },
  cup_legend: {
    id: "cup_legend",
    name: "Cup Legend",
    description: "125 Cups insgesamt getroffen",
    category: "cups",
    points: 6,
    icon: "🏆",
  },
  century_plus: {
    id: "century_plus",
    name: "Century+",
    description: "150 Cups insgesamt getroffen",
    category: "cups",
    points: 8,
    icon: "💯",
  },

  bounce_master: {
    id: "bounce_master",
    name: "Bounce Master",
    description: "Mindestens 1 Bounce-Treffer",
    category: "special_shot",
    points: 3,
    icon: "🏀",
  },
  island_hopper: {
    id: "island_hopper",
    name: "Island Hopper",
    description: "Mindestens 1 Island-Treffer",
    category: "special_shot",
    points: 4,
    icon: "🏝️",
  },
  bomb_squad: {
    id: "bomb_squad",
    name: "Bomb Squad",
    description: "Mindestens 1 Bomben-Treffer",
    category: "special_shot",
    points: 4,
    icon: "💣",
  },
  trickshot_artist: {
    id: "trickshot_artist",
    name: "Trickshot Artist",
    description: "Mindestens 1 gültiger Trickshot",
    category: "special_shot",
    points: 6,
    icon: "🎩",
  },
  no_rerack_needed: {
    id: "no_rerack_needed",
    name: "No Re-Rack Needed",
    description: "Ein Spiel gewinnen, ohne die Becher umzustellen",
    category: "special_shot",
    points: 6,
    icon: "🧱",
  },

  shutout: {
    id: "shutout",
    name: "Shutout",
    description: "Ein Spiel 10:0 gewinnen",
    category: "special",
    points: 8,
    icon: "🧹",
  },
  unbeatable: {
    id: "unbeatable",
    name: "Unbeatable",
    description: "Einzel-Gruppenphase ohne Niederlage abschließen",
    category: "special",
    points: 6,
    icon: "🛡️",
  },
  rock_solid: {
    id: "rock_solid",
    name: "Fels in der Brandung",
    description: "Nie mit mehr als 5 Cups Unterschied verloren",
    category: "special",
    points: 4,
    icon: "🪨",
  },
};

export const ACHIEVEMENT_IDS: readonly AchievementId[] = Object.keys(
  ACHIEVEMENT_DEFINITIONS,
) as AchievementId[];

export const ACHIEVEMENT_CATEGORY_ORDER: readonly AchievementCategory[] = [
  "streak",
  "win_streak",
  "cups",
  "special_shot",
  "special",
];

export const ACHIEVEMENT_CATEGORY_LABELS: Readonly<Record<AchievementCategory, string>> = {
  streak: "Treffer-Serien",
  win_streak: "Siegesserien",
  cups: "Cup-Meilensteine",
  special_shot: "Spezialwürfe",
  special: "Besondere Leistungen",
};

/**
 * Cup-Schwellenwerte je Cup-Meilenstein-Achievement. Einzige Quelle der
 * Wahrheit dafür, sowohl für die Freischalt-Bedingung (logic/achievements.ts)
 * als auch für die Fortschrittsbalken-Anzeige (AchievementGallery).
 */
export const CUP_ACHIEVEMENT_THRESHOLDS: Readonly<Partial<Record<AchievementId, number>>> = {
  cup_hunter: 25,
  cup_collector: 50,
  cup_machine: 75,
  cup_master: 100,
  cup_legend: 125,
  century_plus: 150,
};

/** Gesamtzahl aller Achievements (20). */
export const TOTAL_ACHIEVEMENT_COUNT = ACHIEVEMENT_IDS.length;

/** Maximal erreichbare Achievement-Punkte, wenn alle 20 Achievements freigeschaltet sind (97). */
export const MAX_ACHIEVEMENT_POINTS = Object.values(ACHIEVEMENT_DEFINITIONS).reduce(
  (sum, def) => sum + def.points,
  0,
);
