import type { Metadata } from "next";
import { CampaignsView } from "@/components/app/campaigns/campaigns-view";
import { LiveCampaigns } from "@/components/app/live/live-pages";
import { getCampaigns } from "@/lib/demo/data";
import { getAccount } from "@/lib/server/account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campagnes" };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const account = await getAccount();
  if (account) return <LiveCampaigns account={account} />;
  const sp = await searchParams;
  const now = new Date();
  return <CampaignsView campaigns={getCampaigns(now)} now={now.toISOString()} openNew={sp.new === "1"} />;
}
