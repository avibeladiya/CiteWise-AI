import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useProcessFile } from "@/hooks/useProcessFile";
import { SAMPLES } from "@/lib/rag/samples";
import { useDocStore } from "@/store/docs";
import { useUIStore } from "@/store/ui";

export function useSampleLoader() {
  const { processFile, busy } = useProcessFile();
  const indexing = useDocStore((s) =>
    s.docs.some((d) => d.status === "processing" || d.status === "uploading"),
  );
  const navigate = useNavigate();
  const setPendingAsk = useUIStore((s) => s.setPendingAsk);
  const locked = busy || indexing;

  async function loadSample(id: (typeof SAMPLES)[number]["id"], ask = false) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    const res = await fetch(sample.file);
    if (!res.ok) throw new Error("Could not load the sample document.");
    const text = await res.text();
    const file = new File([text], sample.name, { type: "text/plain" });
    if (ask) setPendingAsk(sample.ask);
    const doc = await processFile(file);
    if (doc) await navigate({ to: "/workspace" });
  }

  return { loadSample, busy: locked };
}

export function SampleCards() {
  const { loadSample, busy } = useSampleLoader();

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {SAMPLES.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={busy}
          onClick={() => void loadSample(s.id, true)}
          className="group rounded-xl border border-border bg-surface p-5 text-left transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{s.kicker}</p>
          <p className="mt-2 font-display text-2xl tracking-tight">{s.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.blurb}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-fg">
            Index and ask: {s.ask}
            <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </button>
      ))}
    </div>
  );
}

export function SampleCompact() {
  const { loadSample, busy } = useSampleLoader();

  return (
    <div className="grid w-full max-w-md gap-2">
      {SAMPLES.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={busy}
          onClick={() => void loadSample(s.id, true)}
          className="min-h-11 rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
        >
          <span className="block text-sm font-medium text-fg">{s.title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted">{s.ask}</span>
        </button>
      ))}
    </div>
  );
}
