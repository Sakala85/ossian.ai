import type { DealershipProfile, DepartmentKey } from "@/lib/domain/types";
import { addDays, frenchDate, frenchTime, parisParts, weekdayOf } from "./time";

/**
 * Everything the agent can do in the dealership's systems.
 * `DemoBackend` simulates a DMS/CRM; production adapters (Nextlane, Keyloop,
 * Kerridge, Google Calendar, Salesforce…) implement the same interface.
 */
export interface AgentBackend {
  checkAvailability(i: { service: string; date?: string; part_of_day?: "matin" | "apres_midi" | "indifferent"; courtesy_vehicle?: boolean }): Promise<unknown>;
  bookAppointment(i: {
    customer_name: string;
    phone: string;
    vehicle: string;
    plate?: string;
    mileage?: number;
    service: string;
    slot_id: string;
    courtesy_vehicle?: boolean;
    notes?: string;
  }): Promise<unknown>;
  getRepairStatus(i: { plate?: string; customer_name?: string }): Promise<unknown>;
  searchInventory(i: { query: string; condition?: "neuf" | "occasion"; max_price?: number }): Promise<unknown>;
  createLead(i: {
    name: string;
    phone: string;
    email?: string;
    interest: "VN" | "VO" | "Reprise" | "Financement" | "LLD";
    vehicle_of_interest: string;
    budget?: number;
    trade_in?: string;
    test_drive_slot_id?: string;
    notes?: string;
  }): Promise<unknown>;
  transferCall(i: { department: DepartmentKey; reason: string }): Promise<unknown>;
  scheduleCallback(i: { name: string; phone: string; department: DepartmentKey; reason: string; priority: "normale" | "haute"; preferred_time?: string }): Promise<unknown>;
}

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Workshop opening windows in minutes, per weekday (0 = Sunday). */
const WORKSHOP: Record<number, [number, number][]> = {
  0: [],
  1: [[465, 720], [810, 1110]],
  2: [[465, 720], [810, 1110]],
  3: [[465, 720], [810, 1110]],
  4: [[465, 720], [810, 1110]],
  5: [[465, 720], [810, 1110]],
  6: [[480, 720]],
};

const SALES: Record<number, [number, number][]> = {
  0: [],
  1: [[540, 1140]],
  2: [[540, 1140]],
  3: [[540, 1140]],
  4: [[540, 1140]],
  5: [[540, 1140]],
  6: [[540, 1080]],
};

const DEPT_HOURS: Record<DepartmentKey, Record<number, [number, number][]>> = {
  apres_vente: WORKSHOP,
  carrosserie: WORKSHOP,
  pieces: WORKSHOP,
  vn: SALES,
  vo: SALES,
  accueil: SALES,
  comptabilite: { 0: [], 1: [[540, 1020]], 2: [[540, 1020]], 3: [[540, 1020]], 4: [[540, 1020]], 5: [[540, 1020]], 6: [] },
};

const INVENTORY = [
  { id: "VO-1182", label: "Toyota Yaris Hybride 130 Design", year: 2021, km: 32000, price: 17490, condition: "occasion" },
  { id: "VO-1204", label: "Peugeot 3008 Hybrid 225 GT", year: 2022, km: 41000, price: 31900, condition: "occasion" },
  { id: "VO-1219", label: "Renault Clio V TCe 90 Evolution", year: 2022, km: 24500, price: 14990, condition: "occasion" },
  { id: "VO-1233", label: "Volkswagen Tiguan 2.0 TDI 150 Life", year: 2020, km: 68000, price: 24900, condition: "occasion" },
  { id: "VO-1241", label: "Citroën C3 Aircross PureTech 110 Shine", year: 2021, km: 38000, price: 16490, condition: "occasion" },
  { id: "VN-E3008", label: "Peugeot E-3008 GT Grande Autonomie", year: 2026, km: 0, price: 49990, condition: "neuf" },
  { id: "VN-208", label: "Peugeot E-208 Allure", year: 2026, km: 0, price: 33490, condition: "neuf" },
  { id: "VN-RAV4", label: "Toyota RAV4 Hybride 222 Design", year: 2026, km: 0, price: 45900, condition: "neuf" },
  { id: "VN-EC3", label: "Citroën ë-C3 Max", year: 2026, km: 0, price: 27490, condition: "neuf" },
] as const;

export class DemoBackend implements AgentBackend {
  constructor(private profile: DealershipProfile, private now = new Date()) {}

  private slotsFor(date: string, partOfDay: string | undefined, seed: string, hours = WORKSHOP) {
    const windows = hours[weekdayOf(date)] ?? [];
    const candidates: number[] = [];
    for (const [a, b] of windows) for (let m = a; m + 30 <= b; m += 15) candidates.push(m);
    const today = parisParts(this.now);
    return candidates
      .filter((m) => (partOfDay === "matin" ? m < 720 : partOfDay === "apres_midi" ? m >= 720 : true))
      .filter((m) => date !== today.date || m > today.hour * 60 + today.minute + 90)
      .filter((m) => hash(`${seed}|${date}|${m}`) % 5 === 0); // ~20% of slots are free
  }

  async checkAvailability(i: Parameters<AgentBackend["checkAvailability"]>[0]) {
    const today = parisParts(this.now).date;
    let date = i.date && /^\d{4}-\d{2}-\d{2}$/.test(i.date) && i.date >= today ? i.date : addDays(today, 1);
    const slots: { slot_id: string; label: string }[] = [];
    const sales = /essai|test/i.test(i.service);
    // A specific date gets up to 3 well-spaced slots that day; otherwise one slot per day, like a receptionist would offer.
    const perDay = i.date ? 3 : 1;
    for (let k = 0; k < 10 && slots.length < 3; k++, date = addDays(date, 1)) {
      const free = this.slotsFor(date, i.part_of_day, i.service + (i.courtesy_vehicle ? "+cv" : ""), sales ? SALES : WORKSHOP);
      const picked: number[] = [];
      for (const m of free) {
        if (picked.length >= perDay || slots.length + picked.length >= 3) break;
        if (picked.every((p) => Math.abs(p - m) >= 120)) picked.push(m);
      }
      for (const m of picked) {
        const rel = date === addDays(today, 1) ? `demain ${frenchDate(date).split(" ")[0]}` : frenchDate(date);
        slots.push({ slot_id: `${date}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, label: `${rel} à ${frenchTime(m)}` });
      }
    }
    return {
      service: i.service,
      courtesy_vehicle: i.courtesy_vehicle ?? false,
      slots,
      note: slots.length ? "Proposer au maximum 2 ou 3 créneaux à l'oral." : "Aucun créneau trouvé sur 10 jours : proposer un rappel.",
    };
  }

  async bookAppointment(i: Parameters<AgentBackend["bookAppointment"]>[0]) {
    const [date, time] = i.slot_id.split("T");
    if (!date || !time) return { ok: false, error: "slot_id invalide : utiliser un slot_id renvoyé par check_availability." };
    const [h, m] = time.split(":").map(Number);
    const advisors = ["Karim Benali", "Sophie Martin", "Julien Morel"];
    return {
      ok: true,
      confirmation: `RDV-${(hash(i.phone + i.slot_id) % 90000) + 10000}`,
      when: `${frenchDate(date)} à ${frenchTime(h! * 60 + m!)}`,
      site: `${this.profile.sites[0]?.name ?? this.profile.name}, ${this.profile.sites[0]?.address ?? ""} ${this.profile.sites[0]?.city ?? ""}`.trim(),
      advisor: advisors[hash(i.slot_id) % advisors.length],
      courtesy_vehicle: i.courtesy_vehicle ?? false,
      sms_confirmation_sent: this.profile.agent.smsConfirmation,
      reminder: "Penser à apporter le carnet d'entretien et la carte grise.",
    };
  }

  async getRepairStatus(i: Parameters<AgentBackend["getRepairStatus"]>[0]) {
    const key = (i.plate || i.customer_name || "").toUpperCase().replace(/\s+/g, "");
    if (!key) return { found: false as const, error: "Il faut une immatriculation ou un nom." };
    const variants = [
      { status: "terminé", detail: "Intervention terminée, contrôle qualité validé.", ready: "aujourd'hui à partir de 17h", amount: "412,60 €" },
      { status: "en cours", detail: "Le technicien est en train de remplacer les plaquettes et disques avant.", ready: "aujourd'hui vers 18h", amount: "estimé à 365 €" },
      { status: "en attente de pièce", detail: "Pièce commandée (sonde lambda), livraison prévue demain matin.", ready: "demain en fin de journée", amount: "selon devis signé" },
    ];
    const v = variants[hash(key) % variants.length]!;
    return { found: true as const, reference: `OR-${(hash(key) % 9000) + 1000}`, ...v };
  }

  async searchInventory(i: Parameters<AgentBackend["searchInventory"]>[0]) {
    const words = i.query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const results = INVENTORY.filter((v) => (!i.condition || v.condition === i.condition) && (!i.max_price || v.price <= i.max_price))
      .map((v) => ({ v, score: words.filter((w) => v.label.toLowerCase().includes(w) || String(v.year).includes(w)).length }))
      .filter((x) => x.score > 0 || words.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ v }) => ({ ...v, price_label: `${v.price.toLocaleString("fr-FR")} €` }));
    return { results, note: results.length ? undefined : "Rien en stock correspondant : proposer de créer un lead pour une recherche personnalisée." };
  }

  async createLead(i: Parameters<AgentBackend["createLead"]>[0]) {
    const sales = i.interest === "VO" ? ["Marc Dubois", "Laura Petit"] : ["Inès Fontaine", "Thomas Girard"];
    const score = Math.min(97, 52 + (i.budget ? 12 : 0) + (i.trade_in ? 8 : 0) + (i.test_drive_slot_id ? 18 : 0) + (i.email ? 4 : 0));
    return {
      ok: true,
      lead_id: `lead_${(hash(i.phone + i.vehicle_of_interest) % 9000) + 1000}`,
      assignee: sales[hash(i.name) % sales.length],
      score,
      follow_up: i.test_drive_slot_id ? "Essai confirmé, le vendeur est notifié." : "Le vendeur rappellera dans les 2 heures ouvrées.",
    };
  }

  async transferCall(i: Parameters<AgentBackend["transferCall"]>[0]) {
    const dept = this.profile.departments.find((d) => d.key === i.department);
    const p = parisParts(this.now);
    const open = (DEPT_HOURS[i.department][p.weekday] ?? []).some(([a, b]) => p.hour * 60 + p.minute >= a && p.hour * 60 + p.minute < b);
    if (!open) {
      return { status: "ferme", department: dept?.label ?? i.department, hours: dept?.hours, instruction: "Service fermé : proposer schedule_callback." };
    }
    return { status: "transfert_en_cours", department: dept?.label ?? i.department, number: dept?.phone, context_sent: true };
  }

  async scheduleCallback(i: Parameters<AgentBackend["scheduleCallback"]>[0]) {
    const dept = this.profile.departments.find((d) => d.key === i.department);
    return {
      ok: true,
      ticket: `CB-${(hash(i.phone + i.reason) % 9000) + 1000}`,
      owner: dept?.label ?? i.department,
      sla: i.priority === "haute" ? "rappel sous 2 heures ouvrées" : "rappel dans la journée ouvrée",
      alert_sent: i.priority === "haute",
    };
  }
}
