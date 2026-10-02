import type { DealershipProfile } from "@/lib/domain/types";
import { notifyTeam } from "@/lib/server/notify";
import { DemoBackend, type AgentBackend } from "./backend";

/**
 * Backend for REAL phone calls before a DMS/CRM connector is live.
 *
 * Safety first: Ossian never confirms something the dealership has not seen.
 * Appointments become "demandes" confirmed by an advisor (notified instantly),
 * leads and callbacks are pushed to the team, and anything that would need
 * dealership data we don't have yet (repair status, stock) turns into a
 * callback instead of an invented answer.
 */
export class PilotBackend implements AgentBackend {
  private demo: DemoBackend;

  constructor(
    private profile: DealershipProfile,
    private ctx: { callId?: string; callerNumber?: string } = {},
  ) {
    this.demo = new DemoBackend(profile);
  }

  async checkAvailability(i: Parameters<AgentBackend["checkAvailability"]>[0]) {
    const r = await this.demo.checkAvailability(i);
    return {
      ...r,
      note: "Créneaux indicatifs selon les horaires de l'atelier. Le rendez-vous sera une demande confirmée par SMS par un conseiller : le dire au client.",
    };
  }

  async bookAppointment(i: Parameters<AgentBackend["bookAppointment"]>[0]) {
    const [date, time] = i.slot_id.split("T");
    const slot = await this.demo.bookAppointment(i);
    const when = "when" in slot ? slot.when : `${date} ${time}`;
    await notifyTeam("rdv_demande", this.profile.name, "Nouvelle demande de rendez-vous atelier", {
      Client: i.customer_name,
      Téléphone: i.phone || this.ctx.callerNumber,
      Véhicule: [i.vehicle, i.plate, i.mileage ? `${i.mileage} km` : ""].filter(Boolean).join(" · "),
      Prestation: i.service,
      "Créneau souhaité": when,
      Courtoisie: i.courtesy_vehicle ? "Oui" : "Non",
      Notes: i.notes,
      Appel: this.ctx.callId,
    });
    return {
      ok: true,
      status: "demande_enregistree",
      when,
      instruction:
        "Dire au client que sa demande de rendez-vous est bien enregistrée pour ce créneau et qu'un conseiller la lui confirmera rapidement par SMS. Ne pas dire que c'est définitivement confirmé.",
    };
  }

  async getRepairStatus(i: Parameters<AgentBackend["getRepairStatus"]>[0]) {
    return {
      found: false as const,
      instruction:
        "Le suivi des réparations n'est pas encore connecté. Proposer que la réception atelier rappelle le client (schedule_callback, department apres_vente) en notant l'immatriculation ou le nom.",
      reference: i.plate || i.customer_name,
    };
  }

  async searchInventory(i: Parameters<AgentBackend["searchInventory"]>[0]) {
    return {
      results: [],
      instruction: `Le stock n'est pas encore connecté. Qualifier le besoin (${i.query}) puis créer un lead (create_lead) pour qu'un vendeur rappelle avec les disponibilités.`,
    };
  }

  async createLead(i: Parameters<AgentBackend["createLead"]>[0]) {
    await notifyTeam("lead", this.profile.name, `Nouveau lead ${i.interest}`, {
      Nom: i.name,
      Téléphone: i.phone || this.ctx.callerNumber,
      Email: i.email,
      Projet: i.vehicle_of_interest,
      Budget: i.budget ? `${i.budget} €` : undefined,
      Reprise: i.trade_in,
      "Essai souhaité": i.test_drive_slot_id,
      Notes: i.notes,
      Appel: this.ctx.callId,
    });
    return {
      ok: true,
      follow_up: i.test_drive_slot_id
        ? "Demande d'essai transmise : un vendeur confirmera le créneau par SMS."
        : "Un vendeur rappellera le client rapidement.",
    };
  }

  async transferCall(i: Parameters<AgentBackend["transferCall"]>[0]) {
    const r = await this.demo.transferCall(i);
    if (r.status === "transfert_en_cours") {
      await notifyTeam("transfert", this.profile.name, `Appel transféré — ${r.department}`, { Motif: i.reason, Appelant: this.ctx.callerNumber, Appel: this.ctx.callId });
    }
    return r;
  }

  async scheduleCallback(i: Parameters<AgentBackend["scheduleCallback"]>[0]) {
    const r = await this.demo.scheduleCallback(i);
    await notifyTeam("rappel", this.profile.name, `Rappel à faire${i.priority === "haute" ? " (PRIORITAIRE)" : ""}`, {
      Service: r.owner,
      Nom: i.name,
      Téléphone: i.phone || this.ctx.callerNumber,
      Motif: i.reason,
      "Moment souhaité": i.preferred_time,
      Appel: this.ctx.callId,
    });
    return r;
  }
}
