import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconStudent(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export function IconMoney(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v.01M18 14v.01" />
    </svg>
  );
}

export function IconExpense(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  );
}

export function IconCollected(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function IconPending(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function IconTask(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconExam(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M6.5 9.75V15c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V9.75" />
    </svg>
  );
}

export function IconCourse(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 22Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19" />
    </svg>
  );
}

export function IconBank(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v9M10 10v9M14 10v9M19 10v9" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function IconCash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="7" width="19" height="11" rx="2" />
      <circle cx="12" cy="12.5" r="2.2" />
    </svg>
  );
}

export function IconCard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}

export function IconPos(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

export function IconTransfer(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h14M14 3l4 4-4 4" />
      <path d="M20 17H6M10 21l-4-4 4-4" />
    </svg>
  );
}

export function IconStaff(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" />
      <circle cx="17.5" cy="8.5" r="2.2" />
      <path d="M15.8 14.2c2.4.3 4.2 2.2 4.2 5" />
    </svg>
  );
}

export function IconReport(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M20 20H4" />
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

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.3-2-3.4-2.3.6a8 8 0 0 0-1.7-1l-.4-2.4H9l-.4 2.4a8 8 0 0 0-1.7 1l-2.3-.6-2 3.4L4.6 11a7.9 7.9 0 0 0 0 2l-2 1.3 2 3.4 2.3-.6a8 8 0 0 0 1.7 1l.4 2.4h4.9l.4-2.4a8 8 0 0 0 1.7-1l2.3.6 2-3.4Z" />
    </svg>
  );
}
