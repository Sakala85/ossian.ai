import { cn } from "@/lib/utils";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary-soft text-primary border-[color-mix(in_oklch,var(--primary)_22%,transparent)]",
  success: "bg-success-soft text-success border-[color-mix(in_oklch,var(--success)_22%,transparent)]",
  warning: "bg-warning-soft text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))] border-[color-mix(in_oklch,var(--warning)_28%,transparent)]",
  danger: "bg-danger-soft text-danger border-[color-mix(in_oklch,var(--danger)_22%,transparent)]",
  info: "bg-info-soft text-info border-[color-mix(in_oklch,var(--info)_22%,transparent)]",
};

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-medium whitespace-nowrap [&_svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
