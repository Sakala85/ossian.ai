import { cn } from "@/lib/utils";

/** Brand-neutral logo placeholder: monogram on a hue gradient. */
export function Monogram({ mono, hue, size = 40, className }: { mono: string; hue: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-semibold tracking-tight text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: mono.length > 2 ? size * 0.28 : size * 0.36,
        background: `linear-gradient(140deg, oklch(0.72 0.14 ${hue}), oklch(0.5 0.16 ${hue + 30}))`,
        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.25), inset 0 0 0 1px oklch(0 0 0 / 0.06)",
      }}
    >
      {mono}
    </span>
  );
}
