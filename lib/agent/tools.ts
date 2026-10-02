import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AgentBackend } from "./backend";

const DEPARTMENT = ["apres_vente", "vn", "vo", "pieces", "carrosserie", "accueil", "comptabilite"] as const;
const OUTCOME = ["rdv_pris", "lead_cree", "transfere", "info_donnee", "rappel_programme", "abandonne"] as const;

/** Runtime validators (tool inputs are model output: always validate before executing). */
export const TOOL_INPUTS = {
  check_availability: z.object({
    service: z.string().min(1),
    date: z.string().optional(),
    part_of_day: z.enum(["matin", "apres_midi", "indifferent"]).optional(),
    courtesy_vehicle: z.boolean().optional(),
  }),
  book_appointment: z.object({
    customer_name: z.string().min(1),
    phone: z.string().min(4),
    vehicle: z.string().min(1),
    plate: z.string().optional(),
    mileage: z.number().optional(),
    service: z.string().min(1),
    slot_id: z.string().min(10),
    courtesy_vehicle: z.boolean().optional(),
    notes: z.string().optional(),
  }),
  get_repair_status: z.object({ plate: z.string().optional(), customer_name: z.string().optional() }),
  search_inventory: z.object({
    query: z.string(),
    condition: z.enum(["neuf", "occasion"]).optional(),
    max_price: z.number().optional(),
  }),
  create_lead: z.object({
    name: z.string().min(1),
    phone: z.string().min(4),
    email: z.string().optional(),
    interest: z.enum(["VN", "VO", "Reprise", "Financement", "LLD"]),
    vehicle_of_interest: z.string().min(1),
    budget: z.number().optional(),
    trade_in: z.string().optional(),
    test_drive_slot_id: z.string().optional(),
    notes: z.string().optional(),
  }),
  transfer_call: z.object({ department: z.enum(DEPARTMENT), reason: z.string().min(1) }),
  schedule_callback: z.object({
    name: z.string().min(1),
    phone: z.string().min(4),
    department: z.enum(DEPARTMENT),
    reason: z.string().min(1),
    priority: z.enum(["normale", "haute"]),
    preferred_time: z.string().optional(),
  }),
  end_call: z.object({ outcome: z.enum(OUTCOME), summary: z.string().min(1) }),
} as const;

export type ToolName = keyof typeof TOOL_INPUTS;

/** Tool definitions sent to Claude. Order is fixed (prompt-cache friendly). */
export const AGENT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "check_availability",
    description:
      "Cherche les créneaux libres dans le planning (atelier, carrosserie ou essais vendeurs). À appeler AVANT de proposer un horaire : ne jamais inventer de disponibilité. Renvoie jusqu'à 3 créneaux avec un slot_id à réutiliser pour réserver.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", description: "Prestation demandée, ex. « Révision constructeur », « Pneumatiques », « Essai E-3008 »." },
        date: { type: "string", description: "Date souhaitée au format YYYY-MM-DD (optionnel). Sans date : à partir de demain." },
        part_of_day: { type: "string", enum: ["matin", "apres_midi", "indifferent"] },
        courtesy_vehicle: { type: "boolean", description: "Le client a besoin d'un véhicule de courtoisie." },
      },
      required: ["service"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Réserve un rendez-vous atelier/carrosserie dans le DMS avec un slot_id renvoyé par check_availability. N'appeler qu'après accord explicite du client sur le créneau et après avoir obtenu son nom, son téléphone et son véhicule.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        phone: { type: "string" },
        vehicle: { type: "string", description: "Marque et modèle, ex. « Peugeot 3008 Hybrid »." },
        plate: { type: "string", description: "Immatriculation si connue." },
        mileage: { type: "number", description: "Kilométrage approximatif." },
        service: { type: "string" },
        slot_id: { type: "string" },
        courtesy_vehicle: { type: "boolean" },
        notes: { type: "string", description: "Symptômes, précisions utiles au conseiller service." },
      },
      required: ["customer_name", "phone", "vehicle", "service", "slot_id"],
    },
  },
  {
    name: "get_repair_status",
    description: "Donne l'état d'avancement d'un véhicule à l'atelier (ordre de réparation) à partir de l'immatriculation ou du nom du client.",
    input_schema: {
      type: "object",
      properties: { plate: { type: "string" }, customer_name: { type: "string" } },
    },
  },
  {
    name: "search_inventory",
    description: "Recherche dans le stock de véhicules neufs et d'occasion (disponibilité, prix, kilométrage).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Marque, modèle, motorisation, année…" },
        condition: { type: "string", enum: ["neuf", "occasion"] },
        max_price: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "create_lead",
    description:
      "Crée une opportunité commerciale qualifiée dans le CRM et l'assigne à un vendeur (achat VN/VO, reprise, financement, LLD). Appeler une fois le besoin qualifié (véhicule, budget, reprise, délai) et les coordonnées obtenues.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        interest: { type: "string", enum: ["VN", "VO", "Reprise", "Financement", "LLD"] },
        vehicle_of_interest: { type: "string" },
        budget: { type: "number", description: "Budget en euros." },
        trade_in: { type: "string", description: "Véhicule à reprendre (modèle, année, km)." },
        test_drive_slot_id: { type: "string", description: "slot_id d'essai accepté par le client, le cas échéant." },
        notes: { type: "string" },
      },
      required: ["name", "phone", "interest", "vehicle_of_interest"],
    },
  },
  {
    name: "transfer_call",
    description:
      "Transfère l'appel à un service humain avec une fiche de contexte. Si le service est fermé, la réponse l'indique : proposer alors un rappel (schedule_callback).",
    input_schema: {
      type: "object",
      properties: {
        department: { type: "string", enum: [...DEPARTMENT] },
        reason: { type: "string", description: "Résumé en une phrase pour la personne qui décroche." },
      },
      required: ["department", "reason"],
    },
  },
  {
    name: "schedule_callback",
    description: "Programme un rappel par un collaborateur (service fermé, demande complexe, réclamation). Priorité « haute » pour les réclamations et urgences.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        department: { type: "string", enum: [...DEPARTMENT] },
        reason: { type: "string" },
        priority: { type: "string", enum: ["normale", "haute"] },
        preferred_time: { type: "string" },
      },
      required: ["name", "phone", "department", "reason", "priority"],
    },
  },
  {
    name: "end_call",
    description: "Termine l'appel une fois que l'appelant a dit au revoir. Fournit l'issue et un résumé de 1 à 2 phrases pour l'équipe.",
    input_schema: {
      type: "object",
      properties: {
        outcome: { type: "string", enum: [...OUTCOME] },
        summary: { type: "string" },
      },
      required: ["outcome", "summary"],
    },
  },
];

export const TOOL_LABELS: Record<ToolName, string> = {
  check_availability: "Recherche de créneaux",
  book_appointment: "Rendez-vous créé",
  get_repair_status: "Statut atelier",
  search_inventory: "Recherche stock",
  create_lead: "Lead créé",
  transfer_call: "Transfert d'appel",
  schedule_callback: "Rappel programmé",
  end_call: "Fin d'appel",
};

export async function executeTool(
  backend: AgentBackend,
  name: string,
  rawInput: unknown,
): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> {
  if (!(name in TOOL_INPUTS)) return { ok: false, error: `Outil inconnu : ${name}` };
  const parsed = TOOL_INPUTS[name as ToolName].safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: `Paramètres invalides : ${parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}` };
  const input = parsed.data as never;
  switch (name as ToolName) {
    case "check_availability":
      return { ok: true, result: await backend.checkAvailability(input) };
    case "book_appointment":
      return { ok: true, result: await backend.bookAppointment(input) };
    case "get_repair_status":
      return { ok: true, result: await backend.getRepairStatus(input) };
    case "search_inventory":
      return { ok: true, result: await backend.searchInventory(input) };
    case "create_lead":
      return { ok: true, result: await backend.createLead(input) };
    case "transfer_call":
      return { ok: true, result: await backend.transferCall(input) };
    case "schedule_callback":
      return { ok: true, result: await backend.scheduleCallback(input) };
    case "end_call":
      return { ok: true, result: { ended: true } };
  }
}
