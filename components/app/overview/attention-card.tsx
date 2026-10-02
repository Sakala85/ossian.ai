import { ArrowUpRight, CalendarX, Flame, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AttentionItem = {
  id: string;
  kind: "complaint" | "hot_leads" | "no_show";
  title: string;
  body: string;
  meta: string;
  href: string;
  cta: string;
};

const KIND = {
  complaint: { icon: TriangleAlert, cls: "bg-danger-soft text-danger", label: "Urgent" },
  hot_leads: { icon: Flame, cls: "bg-primary-soft text-primary", label: "Ventes" },
  no_show: { icon: CalendarX, cls: "bg-warning-soft text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))]", label: "Atelier" },
} as const;

export function AttentionCard({ items }: { items: AttentionItem[] }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-sm font-medium tracking-tight">Points d&apos;attention</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular">{items.length}</span>
      </div>
      <ul className="flex-1 divide-y divide-border px-5">
        {items.map((it) => {
          const k = KIND[it.kind];
          const Icon = k.icon;
          return (
            <li key={it.id} className="py-3.5">
              <div className="flex gap-3">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", k.cls)}>
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">{it.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{it.body}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">{it.meta}</span>
                    <Link
                      href={it.href}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-opacity hover:opacity-80 [&_svg]:size-3.5"
                    >
                      {it.cta} <ArrowUpRight />
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
