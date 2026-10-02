import type { Metadata } from "next";
import { fmtTime } from "@/components/app/format";
import { Shell } from "@/components/app/shell";
import { getAllCalls } from "@/lib/demo/data";
import { getAccount } from "@/lib/server/account";
import { toCallRecords, workspaceFor } from "@/lib/server/account-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Tableau de bord", template: "%s · Ossian" },
  robots: { index: false, follow: false },
};

/**
 * Dashboard shell. A dealership signed in with its private access link sees its
 * own workspace and calls; everyone else sees the demo workspace.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const account = await getAccount();
  const calls = account ? toCallRecords(account.calls) : getAllCalls(now);
  const liveCount = calls.filter((c) => now.getTime() - new Date(c.startedAt).getTime() < 86_400_000).length;
  const recentCalls = calls.slice(0, 6).map((c) => ({
    id: c.id,
    label: c.caller.name ?? c.caller.phone,
    intent: c.intent,
    time: fmtTime(c.startedAt),
  }));

  return (
    <Shell liveCount={liveCount} recentCalls={recentCalls} workspace={account ? workspaceFor(account) : undefined}>
      {children}
    </Shell>
  );
}
