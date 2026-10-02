import type { Metadata } from "next";
import { AgentConfig } from "@/components/app/agent/agent-config";
import { DEMO_PROFILE } from "@/lib/demo/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agent" };

export default function AgentPage() {
  return <AgentConfig profile={DEMO_PROFILE} />;
}
