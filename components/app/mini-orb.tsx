import { cn } from "@/lib/utils";

/**
 * Static CSS rendition of the voice orb, for avatars and dense lists where a
 * canvas per item would be wasteful.
 */
export function MiniOrb({ size = 24, className, live }: { size?: number; className?: string; live?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, oklch(0.95 0.05 290 / 0.95), transparent 42%), radial-gradient(circle at 70% 72%, oklch(0.78 0.13 200 / 0.9), transparent 55%), radial-gradient(circle at 40% 60%, oklch(0.62 0.21 280), oklch(0.5 0.2 268))",
        boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.18), 0 1px 3px oklch(0.4 0.2 280 / 0.35)",
      }}
    >
      {live && (
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-success" />
      )}
    </span>
  );
}
