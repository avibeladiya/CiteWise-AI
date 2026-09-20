import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/method", label: "Method" },
  { to: "/workspace", label: "Workspace" },
] as const;

export function SiteHeader({
  active = "home",
  compact = false,
}: {
  active?: "home" | "method" | "workspace";
  compact?: boolean;
}) {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
      <Wordmark compact={compact} />
      <nav className="flex items-center gap-1">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={cn(
              "hidden h-11 items-center rounded-md px-3 text-sm transition-colors duration-150 sm:inline-flex",
              active === (l.label.toLowerCase() as typeof active)
                ? "text-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {l.label}
          </Link>
        ))}
        <ThemeToggle />
        {active !== "workspace" && (
          <Button variant="secondary" size="sm" asChild>
            <Link to="/workspace">Open desk</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
