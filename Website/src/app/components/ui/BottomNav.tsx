import { Link, useLocation } from "react-router";
import { Home as HomeIcon, Camera, MessageSquare, Compass } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Routes that should also light up this tab. */
  match?: (path: string) => boolean;
};

const items: NavItem[] = [
  {
    to: "/",
    label: "Home",
    icon: HomeIcon,
    match: (p) => p === "/",
  },
  {
    to: "/ar-overview",
    label: "AR",
    icon: Camera,
    match: (p) => p.startsWith("/ar"),
  },
  {
    to: "/quick-guide",
    label: "Guide",
    icon: MessageSquare,
    match: (p) => p.startsWith("/quick-guide") || p.startsWith("/chat"),
  },
  {
    to: "/treasure-hunt",
    label: "Hunt",
    icon: Compass,
    match: (p) =>
      p.startsWith("/treasure-hunt") ||
      p.startsWith("/quiz") ||
      p.startsWith("/summary"),
  },
];

/**
 * Floating bottom navigation. Mobile-first; on desktop it stays centered
 * and capped at a comfortable width so it reads as a pill rather than a bar.
 */
export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className={
        "fixed bottom-0 inset-x-0 z-40 flex justify-center " +
        "px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 " +
        "pointer-events-none"
      }
    >
      <ul
        className={
          "pointer-events-auto flex items-center justify-around gap-1 " +
          "w-full max-w-md rounded-full px-1.5 py-1.5 " +
          "bg-card/85 backdrop-blur-md border border-border " +
          "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]"
        }
      >
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match ? match(pathname) : pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={
                  "flex flex-col items-center justify-center gap-0.5 " +
                  "rounded-full px-2 py-1.5 transition-colors " +
                  (active
                    ? "text-[var(--accent-strong)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
                <span className="text-[10px] leading-none tracking-wide">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
