import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "inverted";
type Size = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[inset_0_1px_0_0_oklch(1_0_0/18%),0_1px_2px_0_oklch(0_0_0/20%)]",
  secondary: "bg-muted text-foreground hover:bg-[color-mix(in_oklch,var(--muted)_80%,var(--foreground)_6%)]",
  outline:
    "border border-border bg-card text-foreground shadow-soft hover:bg-subtle hover:border-border-strong",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90",
  inverted: "bg-foreground text-background hover:opacity-90 shadow-[0_1px_2px_0_oklch(0_0_0/20%)]",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9.5 px-4 text-sm gap-2 rounded-[10px]",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-xl",
  icon: "size-9 rounded-[10px]",
  "icon-sm": "size-7 rounded-md",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background,color,border,opacity,transform,box-shadow] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...props} />;
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonVariants({ variant, size, className })} {...props} />;
}
