import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="ossian-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A79BFF" />
          <stop offset=".5" stopColor="#6A5AF9" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" className="fill-foreground" />
      <circle cx="16" cy="16" r="8.6" fill="none" stroke="url(#ossian-g)" strokeWidth="3" />
      <g className="fill-background">
        <rect x="12.1" y="13.4" width="1.7" height="5.2" rx=".85" />
        <rect x="15.15" y="10.9" width="1.7" height="10.2" rx=".85" />
        <rect x="18.2" y="12.9" width="1.7" height="6.2" rx=".85" />
      </g>
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="text-[17px] font-semibold tracking-[-0.03em]">
        ossian<span className="text-muted-foreground">.ai</span>
      </span>
    </span>
  );
}
