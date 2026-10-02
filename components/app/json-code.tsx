import { cn } from "@/lib/utils";

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/** Minimal JSON syntax highlighting using theme tokens only. */
export function JsonCode({ json, className }: { json: string; className?: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(<span key={i++} className="text-muted-foreground">{json.slice(last, at)}</span>);
    if (m[1] && m[2]) {
      nodes.push(
        <span key={i++} className="text-primary">
          {m[1]}
        </span>,
        <span key={i++} className="text-muted-foreground">
          {m[2]}
        </span>,
      );
    } else if (m[1]) {
      nodes.push(
        <span key={i++} className="text-[color-mix(in_oklch,var(--success)_70%,var(--foreground))]">
          {m[1]}
        </span>,
      );
    } else {
      nodes.push(
        <span key={i++} className="text-[color-mix(in_oklch,var(--warning)_65%,var(--foreground))]">
          {m[0]}
        </span>,
      );
    }
    last = at + m[0].length;
  }
  if (last < json.length) nodes.push(<span key={i++} className="text-muted-foreground">{json.slice(last)}</span>);

  return (
    <pre className={cn("scrollbar-thin overflow-auto p-4 font-mono text-[12px] leading-relaxed", className)}>
      <code>{nodes}</code>
    </pre>
  );
}
