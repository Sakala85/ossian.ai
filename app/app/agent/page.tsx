import type { Metadata } from "next";
import { AgentConfig } from "@/components/app/agent/agent-config";
import { LiveAgentEditor } from "@/components/app/live/live-agent-editor";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import { getAccount } from "@/lib/server/account";
import { formatFrench } from "@/lib/voice/phone";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agent" };

export default async function AgentPage() {
  const account = await getAccount();
  if (account) {
    const fallback = account.dealership.fallback_number;
    return <LiveAgentEditor profile={account.dealership.profile} fallback={fallback ? formatFrench(fallback) : ""} />;
  }
  return <AgentConfig profile={DEMO_PROFILE} />;
}
