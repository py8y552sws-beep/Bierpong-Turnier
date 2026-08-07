import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.9-3.4 3-5 5.5-5s4.6 1.6 5.5 5" />
      <circle cx="17.5" cy="8.5" r="2.6" />
      <path d="M15.2 12.4c2.4.2 4 1.7 4.8 4.9" />
    </svg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v5c0 3-2.2 5.4-5 5.8C9.2 14.4 7 12 7 9V4Z" />
      <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 9 4.5 11 7 11.3" />
      <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5C21 9 19.5 11 17 11.3" />
      <path d="M10 14.8v2.7" />
      <path d="M14 14.8v2.7" />
      <path d="M8 20h8" />
      <path d="M9.5 17.5h5l.6 2.5h-6.2l.6-2.5Z" />
    </svg>
  );
}

export function IconDoubles(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="7" r="2.6" />
      <circle cx="16" cy="7" r="2.6" />
      <path d="M4 19c.6-3 2-4.6 4-4.6s3.4 1.6 4 4.6" />
      <path d="M12 19c.6-3 2-4.6 4-4.6s3.4 1.6 4 4.6" />
    </svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function IconAdmin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 4 6.5V11c0 5 3.4 8.4 8 9.9 4.6-1.5 8-4.9 8-9.9V6.5L12 3Z" />
      <path d="m9.3 12.2 1.8 1.8 3.6-3.8" />
    </svg>
  );
}

export function IconCup(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4h12l-1.4 12.5c-.3 2.4-2.3 4.2-4.6 4.2h0c-2.3 0-4.3-1.8-4.6-4.2L6 4Z" />
      <path d="M5.5 3.2h13" />
    </svg>
  );
}

export function IconStreak(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.4-2-1-2.6.4 1.6-.4 2.6-1.4 2.6-1.4 0-1.6-1.4-1-2.6C15.4 4.8 13.6 3 12 2Z" />
      <path d="M8.5 13.5A4 4 0 0 0 12 20a4 4 0 0 0 3.5-6.5" />
    </svg>
  );
}

export function IconBounce(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="6" r="2.4" />
      <path d="M7 8.4V14" />
      <path d="M7 14 3.5 20.5" />
      <path d="M7 14l4.5 2 3-6.5 4.5 2" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3" rx="1" />
      <path d="M8.5 11h7" />
      <path d="M8.5 15h7" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.8c0-.4.4-.8 1-.8h4c.6 0 1 .4 1 .8V7" />
      <path d="M6 7l1 13c0 .6.5 1 1 1h8c.5 0 1-.4 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 6 4 4" />
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
