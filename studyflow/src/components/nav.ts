import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  Library,
  PenLine,
  PlayCircle,
  Settings,
  Sparkles,
  TrendingUp,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Mobil alt çubukta görünür */
  bar?: boolean;
  group: "main" | "more";
}

export const NAV: NavItem[] = [
  { href: "/", label: "Ana sayfa", short: "Ana sayfa", icon: Home, bar: true, group: "main" },
  { href: "/ogren", label: "Yapay Zekâ ile Öğren", short: "Öğren", icon: Sparkles, bar: true, group: "main" },
  { href: "/notlar", label: "Notlarım", short: "Notlar", icon: PenLine, bar: true, group: "main" },
  { href: "/yukle", label: "Yüklediklerim", short: "Yükle", icon: Upload, group: "main" },
  { href: "/video", label: "Video İzle", short: "Video", icon: PlayCircle, group: "main" },
  { href: "/sinav", label: "Sınava Hazırlan", short: "Sınav", icon: ClipboardCheck, group: "main" },
  { href: "/ozet", label: "Özet Çıkar", short: "Özet", icon: FileText, group: "main" },
  { href: "/plan", label: "Plan", short: "Plan", icon: CalendarDays, bar: true, group: "more" },
  { href: "/ilerleme", label: "İlerleme", short: "İlerleme", icon: TrendingUp, group: "more" },
  { href: "/kitaplarim", label: "Kitaplarım", short: "Kitaplar", icon: Library, group: "more" },
  { href: "/ayarlar", label: "Ayarlar", short: "Ayarlar", icon: Settings, group: "more" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
