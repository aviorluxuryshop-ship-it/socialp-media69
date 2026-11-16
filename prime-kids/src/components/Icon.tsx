import type { IconName } from "@/data/content";

type Name =
  | IconName | "bag" | "menu" | "close" | "instagram" | "store" | "whatsapp" | "phone" | "mail"
  | "pin" | "clock" | "arrow" | "chevron-left" | "chevron-right" | "check" | "plus" | "minus" | "external";

const paths: Record<Name, React.ReactNode> = {
  bag: <><path d="M5.5 8h13l-1 12h-11l-1-12Z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" /></>,
  store: <><path d="M4 10h16l-1.2-5H5.2L4 10Z" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5V14h4v5.5" /></>,
  whatsapp: <><path d="M4.5 19.5 5.7 16A7.5 7.5 0 1 1 8.3 18.4L4.5 19.5Z" /><path d="M9.3 9.2c.2 2.6 2.2 4.7 4.8 5.2l1-1.2-1.7-.9-.7.6c-.8-.4-1.5-1.1-1.9-1.9l.6-.7-.9-1.7-1.2.6Z" /></>,
  phone: <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  pin: <><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  "chevron-left": <path d="m14.5 5-7 7 7 7" />,
  "chevron-right": <path d="m9.5 5 7 7-7 7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  external: <><path d="M10 6H6v12h12v-4" /><path d="M13 5h6v6" /><path d="m19 5-8 8" /></>,
  ruler: <><rect x="3" y="8.5" width="18" height="7" rx="1.5" /><path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v2" /></>,
  gift: <><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M3 7h18v3H3zM12 7v13" /><path d="M12 7c-1.5-3.5-5.5-3-4.5-.5.5 1 2.5.5 4.5.5Zm0 0c1.5-3.5 5.5-3 4.5-.5-.5 1-2.5.5-4.5.5Z" /></>,
  return: <><path d="M4 9h11a5 5 0 0 1 0 10H8" /><path d="m8 5-4 4 4 4" /></>,
  truck: <><path d="M3 6.5h11v10H3zM14 10h4l3 3v3.5h-7" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  chat: <path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4v-11Z" />,
  boxes: <><rect x="3.5" y="12" width="8" height="8" rx="1" /><rect x="12.5" y="12" width="8" height="8" rx="1" /><rect x="8" y="4" width="8" height="8" rx="1" /></>,
  shield: <><path d="M12 3.5 5 6v5.5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.2 10" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
};

export default function Icon({ name, size = 20, className }: { name: Name; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
