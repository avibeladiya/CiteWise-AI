import { createFileRoute, Link } from "@tanstack/react-router";
import { Library, Quote } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { ChatView } from "@/components/chat-view";
import { CitationsPanel } from "@/components/citations-panel";
import { DocLibrary } from "@/components/doc-library";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";

export const Route = createFileRoute("/workspace")({ component: Workspace });

function Workspace() {
  const libraryOpen = useUIStore((s) => s.libraryOpen);
  const sourcesOpen = useUIStore((s) => s.sourcesOpen);
  const setLibraryOpen = useUIStore((s) => s.setLibraryOpen);
  const setSourcesOpen = useUIStore((s) => s.setSourcesOpen);

  return (
    <div className="flex h-dvh flex-col overflow-x-hidden bg-bg text-fg">
      <header className="flex min-w-0 items-center gap-3 border-b border-border px-3 py-2 md:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Toggle library"
          onClick={() => setLibraryOpen(!libraryOpen)}
        >
          <Library className="size-4" />
        </Button>
        <Wordmark compact />
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/method">Method</Link>
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle sources"
            onClick={() => setSourcesOpen(!sourcesOpen)}
          >
            <Quote className="size-4" />
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 min-w-0 flex-1">
        <div className="flex h-full min-h-0 min-w-0">
          <aside className="hidden h-full w-[260px] shrink-0 border-r border-border bg-surface lg:block xl:w-[280px]">
            <DocLibrary />
          </aside>
          <main className="min-h-0 min-w-0 flex-1 bg-bg">
            <ChatView />
          </main>
          <aside className="hidden h-full w-[320px] shrink-0 border-l border-border bg-surface lg:block xl:w-[340px]">
            <CitationsPanel />
          </aside>
        </div>

        <div
          className={cn(
            "absolute inset-y-0 left-0 z-20 w-[min(88vw,320px)] border-r border-border bg-surface shadow-soft transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            libraryOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <DocLibrary />
        </div>
        <div
          className={cn(
            "absolute inset-y-0 right-0 z-20 w-[min(92vw,360px)] border-l border-border bg-surface shadow-soft transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            sourcesOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <CitationsPanel />
        </div>
        {(libraryOpen || sourcesOpen) && (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-bg/50 lg:hidden"
            aria-label="Close panels"
            onClick={() => {
              setLibraryOpen(false);
              setSourcesOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
