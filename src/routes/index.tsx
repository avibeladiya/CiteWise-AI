import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Quote, Scale, Shield } from "lucide-react";
import { AidlcStrip } from "@/components/aidlc-strip";
import { GroundedCompare } from "@/components/compare";
import { IssueBar } from "@/components/issue-bar";
import { Pipeline } from "@/components/pipeline";
import { SampleCards, useSampleLoader } from "@/components/sample-actions";
import { SiteHeader } from "@/components/site-header";
import { Specimen } from "@/components/specimen";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import { formatBytes, formatRelative } from "@/lib/utils";
import { useDocStore } from "@/store/docs";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const docs = useDocStore((s) => s.docs);
  const select = useDocStore((s) => s.select);
  const navigate = useNavigate();
  const { loadSample, busy } = useSampleLoader();

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-[0.04]" />
      <IssueBar />
      <SiteHeader active="home" />

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <section className="grid items-end gap-10 pt-4 md:grid-cols-[1.15fr_0.85fr] md:gap-14 md:pt-6">
          <div className="rise">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              A citation desk for PDFs
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.94] tracking-tight text-fg sm:text-6xl md:text-7xl">
              Ask the document.
              <br />
              Not the model.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              CiteWise indexes your file, retrieves the passages that matter, and writes an answer you can audit — page, quote, and claim aligned.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" disabled={busy} onClick={() => void loadSample("financial", true)}>
                Run the Q3 demo
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/method">Read the method</Link>
              </Button>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-faint">
              Indexes the Acme earnings note, then asks: “What was Q3 operating margin?”
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <Shield className="size-4 text-accent" /> Grounded generation
              </span>
              <span className="flex items-center gap-2">
                <Quote className="size-4 text-accent" /> Verbatim quotes
              </span>
              <span className="flex items-center gap-2">
                <Scale className="size-4 text-accent" /> Built for high-stakes reading
              </span>
            </div>
          </div>
          <div className="rise rise-2">
            <Specimen />
          </div>
        </section>

        <section className="mt-16 md:mt-20">
          <UploadZone />
        </section>

        <section className="mt-8">
          <SampleCards />
        </section>

        {docs.length > 0 && (
          <section className="mt-14">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl tracking-tight">Recent</h2>
              <Link to="/workspace" className="text-sm text-muted hover:text-fg">
                Open workspace
              </Link>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {docs.slice(0, 4).map((doc) => (
                <button
                  key={doc.document_id}
                  type="button"
                  disabled={doc.status !== "ready"}
                  onClick={() => {
                    select(doc.document_id);
                    void navigate({ to: "/workspace" });
                  }}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-subtle disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{doc.document_name}</span>
                    <span className="font-mono text-xs uppercase tracking-wider text-faint">
                      {doc.status} · {formatBytes(doc.file_size)}
                      {doc.page_count ? ` · ${doc.page_count} pages` : ""} · {formatRelative(doc.created_at)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-faint" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-20 border-t border-border pt-12">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">The difference</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">Plausible is not proven.</h2>
            </div>
          </div>
          <GroundedCompare />
        </section>

        <section className="mt-20 border-t border-border pt-12">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">How it works</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">Four steps. No hidden context.</h2>
            </div>
            <Link to="/method" className="hidden text-sm text-muted hover:text-fg sm:inline">
              Read the method
            </Link>
          </div>
          <Pipeline compact />
        </section>

        <section className="mt-20 border-t border-border pt-12">
          <div className="mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">AI-DLC</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Intent to operation.</h2>
          </div>
          <AidlcStrip />
        </section>
      </main>

      <footer className="relative z-10 border-t border-border px-5 py-8 text-center font-mono text-xs uppercase tracking-[0.16em] text-faint">
        CiteWise AI · AIDLC submission · Vercel + Render
      </footer>
    </div>
  );
}
