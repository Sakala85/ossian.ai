import {
  Bot,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Phone,
  Plug,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; live?: boolean; keywords?: string };

export const NAV_MAIN: NavItem[] = [
  { href: "/app", label: "Vue d'ensemble", icon: LayoutDashboard, keywords: "accueil tableau de bord kpi" },
  { href: "/app/calls", label: "Appels", icon: Phone, live: true, keywords: "transcriptions historique" },
  { href: "/app/appointments", label: "Rendez-vous", icon: CalendarDays, keywords: "atelier planning agenda" },
  { href: "/app/leads", label: "Leads", icon: Target, keywords: "prospects ventes pipeline" },
  { href: "/app/campaigns", label: "Campagnes", icon: Megaphone, keywords: "sortants relances" },
];

export const NAV_CONFIG: NavItem[] = [
  { href: "/app/agent", label: "Agent", icon: Bot, keywords: "léa voix configuration règles" },
  { href: "/app/integrations", label: "Intégrations", icon: Plug, keywords: "dms crm api webhooks" },
  { href: "/app/settings", label: "Paramètres", icon: Settings, keywords: "équipe facturation rgpd" },
];

export const NAV_ALL = [...NAV_MAIN, ...NAV_CONFIG];

export function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}
