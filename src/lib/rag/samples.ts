export const SAMPLES = [
  {
    id: "ml-paper",
    file: "/samples/sample-ml-paper.txt",
    name: "Machine Learning Foundations.txt",
    kicker: "Research",
    title: "Foundations of modern ML",
    blurb: "Gradient descent, transformers, and RAG — a practitioner overview with page-level sections.",
    ask: "How does gradient descent update weights?",
  },
  {
    id: "financial",
    file: "/samples/sample-financial-report.txt",
    name: "Acme Q3 2026 Financial Report.txt",
    kicker: "Finance",
    title: "Acme Q3 earnings",
    blurb: "Revenue, margins, and raised guidance. Ask for the operating margin or cloud growth.",
    ask: "What was Q3 operating margin?",
  },
] as const;

const DEFAULT_ASK = [
  "What is the main argument of this document?",
  "Summarise the key findings with citations.",
  "Which figures or statistics are most important?",
  "What conclusions does the author draw?",
];

export function suggestionsFor(name: string): string[] {
  const n = name.toLowerCase();
  if (n.includes("financial") || n.includes("acme") || n.includes("q3")) {
    return [
      "What was Q3 operating margin?",
      "How fast did Cloud Services grow?",
      "What is the raised full-year revenue outlook?",
      "How much free cash flow did Acme generate?",
    ];
  }
  if (n.includes("machine") || n.includes("learning") || n.includes("ml")) {
    return [
      "How does gradient descent update weights?",
      "What is RAG and why does it reduce hallucination?",
      "What is the attention mechanism in transformers?",
      "What is supervised learning?",
    ];
  }
  return DEFAULT_ASK;
}
