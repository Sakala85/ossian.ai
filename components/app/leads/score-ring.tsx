import { cn } from "@/lib/utils";

/** Small radial meter for a 0–100 lead score. Track is a lighter step of the same hue. */
export function ScoreRing({ score, size = 32, className }: { score: number; size?: number; className?: string }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hot = score >= 75;
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${score} sur 100`}
      title={`Score ${score}/100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hot ? "var(--primary)" : "color-mix(in oklch, var(--primary) 55%, var(--muted))"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute text-[10.5px] font-semibold text-foreground tabular">{score}</span>
    </span>
  );
}
