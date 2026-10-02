import type { Metadata } from "next";
import { fmtTime } from "@/components/app/format";
import { Shell } from "@/components/app/shell";
import { getAllCalls } from "@/lib/demo/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Tableau de bord", template: "%s · Ossian" },
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const calls = getAllCalls(now);
  const liveCount = calls.filter((c) => now.getTime() - new Date(c.startedAt).getTime() < 86_400_000).length;
  const recentCalls = calls.slice(0, 6).map((c) => ({
    id: c.id,
    label: c.caller.name ?? c.caller.phone,
    intent: c.intent,
    time: fmtTime(c.startedAt),
  }));

  return (
    <Shell liveCount={liveCount} recentCalls={recentCalls}>
      {children}
    </Shell>
  );
}
