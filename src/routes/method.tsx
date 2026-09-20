import { createFileRoute, Link } from "@tanstack/react-router";
import { AidlcStrip } from "@/components/aidlc-strip";
import { IssueBar } from "@/components/issue-bar";
import { Pipeline } from "@/components/pipeline";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/method")({ component: Method });

const CONTRACT = `{
  "answer": "Operating margin improved to 18.4% [1].",
  "citations": [
    {
      "citation_number": 1,
      "page_number": 1,
      "chunk_index": 0,
      "quote": "Operating income increased…"
    }
  ]
}`;

const FORBIDDEN = [
  "Outside knowledge, even if it is true in the real world",
  "A claim without an inline [n] marker",
  "A citation number that does not map to a retrieved chunk",
  "Paraphrase presented as a verbatim quote",
];

function Method() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-[0.04]" />
      <IssueBar />
      <SiteHeader active="method" />

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Method</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">
          Retrieval first.
          <br />
          Generation second.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          CiteWise is a citation desk, not a chatbot. The model is only allowed to speak from passages BM25 already ranked. If it cannot, it says so — and still shows the closest quotes.
        </p>

        <section className="mt-16 border-t border-border pt-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">Pipeline</p>
          <div className="mt-8">
            <Pipeline />
          </div>
        </section>

        <section className="mt-16 grid gap-10 border-t border-border pt-12 md:grid-cols-2">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Retrieve</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">BM25, on purpose</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The original CiteWise used Titan embeddings and DynamoDB. This MVP drops the vector store so a class demo deploys on Vercel and Render without a database. Lexical ranking is deterministic, inspectable, and strong on short professional documents. Scores surface on every evidence card.
            </p>
            <p className="mt-4 font-mono text-xs leading-relaxed text-faint">
              k1 = 1.5 · b = 0.75 · top k = 5 · ~180 word windows · 30 word overlap
            </p>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Generate</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">A JSON contract</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Grok (temperature 0) may only use numbered sources. Invalid JSON falls back to extractive quotes from those same chunks. The product stays grounded with or without an API key.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed break-all text-muted whitespace-pre-wrap">
              {CONTRACT}
            </pre>
          </div>
        </section>

        <section className="mt-16 grid gap-10 border-t border-border pt-12 md:grid-cols-2">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Forbidden</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">What the model may not do</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
              {FORBIDDEN.map((item) => (
                <li key={item} className="border-l-2 border-border pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Deploy</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight">Vercel + Render</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The web app is self-contained: extract and retrieve in the browser, generate in a server function. Optional Render origin for the Python pipeline.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>Web — TanStack Start, Nitro Vercel preset</li>
              <li>API — FastAPI, pypdf, BM25, Grok</li>
              <li>Blueprint — render.yaml at the repo root</li>
            </ul>
          </div>
        </section>

        <section className="mt-16 border-t border-border pt-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">AI-DLC</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">Intent to operation</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Built through the same Kiro AIDLC harness as Flappy Kiro: ideation, inception, construction, operation. Specs, steering, and the intent record live in the repo — not in a slide deck.
          </p>
          <div className="mt-10">
            <AidlcStrip />
          </div>
          <ul className="mt-10 space-y-2 font-mono text-xs leading-relaxed break-all text-faint">
            <li>aidlc/spaces/default/intents/260917-citewise-ai</li>
            <li>.kiro/specs/citewise</li>
            <li>docs/architecture.md</li>
          </ul>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">Index a document</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/workspace">Open the desk</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
