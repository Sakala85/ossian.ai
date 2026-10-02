"use client";

import { Check, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccountAction } from "./use-account-action";

/** Sends a request to the Ossian team (connector, campaigns, team members…) and remembers it on this page. */
export function RequestButton({
  topic,
  detail,
  label,
  sentLabel = "Demande envoyée",
  toastMessage = "Demande envoyée à l'équipe Ossian : nous revenons vers vous rapidement.",
  variant = "outline",
}: {
  topic: "integration" | "campaigns" | "team" | "help";
  detail?: string;
  label: string;
  sentLabel?: string;
  toastMessage?: string;
  variant?: "outline" | "primary" | "secondary";
}) {
  const { request, pending } = useAccountAction();
  const [sent, setSent] = useState(false);
  const busy = pending === `${topic}:${detail ?? ""}`;
  return (
    <Button
      variant={sent ? "secondary" : variant}
      size="sm"
      disabled={busy || sent}
      onClick={async () => setSent(await request(topic, detail, toastMessage))}
    >
      {sent ? <Check className="text-success" /> : <Send />}
      {sent ? sentLabel : busy ? "Envoi…" : label}
    </Button>
  );
}
