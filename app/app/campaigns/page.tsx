import type { Metadata } from "next";
import { CampaignsView } from "@/components/app/campaigns/campaigns-view";
import { getCampaigns } from "@/lib/demo/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campagnes" };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const now = new Date();
  return <CampaignsView campaigns={getCampaigns(now)} now={now.toISOString()} openNew={sp.new === "1"} />;
}
