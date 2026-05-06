import { Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";

/**
 * Small pill in the top-right of every screen that flips light/dark.
 * Default is "auto" (follows the OS); first tap commits to a manual override.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggle } = useTheme();
  const nextLabel = isDark ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel.toLowerCase()} mode`}
      title={`Switch to ${nextLabel.toLowerCase()} mode`}
      className={
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 " +
        "bg-secondary text-foreground border border-border " +
        "hover:border-[var(--border-strong)] hover:bg-muted " +
        "active:scale-[0.97] transition-all " +
        "text-xs font-medium select-none " +
        className
      }
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <Moon className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      <span className="leading-none">{nextLabel}</span>
    </button>
  );
}
