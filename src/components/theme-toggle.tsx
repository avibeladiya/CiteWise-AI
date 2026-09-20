import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";

export function ThemeToggle() {
  const dark = useUIStore((s) => s.dark);
  const toggleDark = useUIStore((s) => s.toggleDark);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
