"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShell } from "../shell-context";

type Item =
  | { kind: "appointment"; value: "confirme" | "en_attente" | "honore" | "no_show" | "annule" }
  | { kind: "lead"; value: "nouveau" | "contacte" | "essai" | "offre" | "gagne" | "perdu" }
  | { kind: "callback"; value: "done" | "open" };

/** Real follow-up actions on what the agent captured (saved, then the page data is refreshed). */
export function useAccountAction() {
  const router = useRouter();
  const { toast } = useShell();
  const [pending, setPending] = useState<string | null>(null);

  const update = async (id: string, item: Item, done: string) => {
    setPending(id);
    try {
      const res = await fetch("/api/account/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...item }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast(done);
      router.refresh();
    } catch {
      toast("La mise à jour n'a pas abouti. Réessayez dans un instant.", "danger");
    } finally {
      setPending(null);
    }
  };

  const request = async (topic: "integration" | "campaigns" | "team" | "help", detail: string | undefined, done: string) => {
    setPending(`${topic}:${detail ?? ""}`);
    try {
      const res = await fetch("/api/account/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, detail }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast(done);
      return true;
    } catch {
      toast("La demande n'a pas pu être envoyée. Réessayez dans un instant.", "danger");
      return false;
    } finally {
      setPending(null);
    }
  };

  return { update, request, pending };
}
