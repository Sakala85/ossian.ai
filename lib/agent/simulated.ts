import type Anthropic from "@anthropic-ai/sdk";
import type { DealershipProfile } from "@/lib/domain/types";
import { DemoBackend } from "./backend";
import type { Emit } from "./events";

/**
 * Deterministic, rule-based stand-in for the LLM, used when no ANTHROPIC_API_KEY
 * is configured. It covers the main dealership scenarios well enough for a
 * scripted demo and speaks the exact same wire protocol as the Claude runtime.
 * State is re-derived from the caller's utterances on every turn (stateless server).
 */

type Intent = "rdv" | "status" | "sales" | "pieces" | "carrosserie" | "reclamation" | "human" | "info";

interface State {
  lang: "fr" | "en";
  intent?: Intent;
  vehicle?: string;
  service?: string;
  partOfDay?: "matin" | "apres_midi";
  courtesy?: boolean;
  slots?: { slot_id: string; label: string }[];
  slot?: { slot_id: string; label: string };
  name?: string;
  phone?: string;
  plate?: string;
  done?: boolean;
  ended?: boolean;
}

interface TurnOut {
  text: string;
  tools: { name: string; input: Record<string, unknown>; result: unknown }[];
  end?: { outcome: string; summary: string };
}

const MODELS =
  /\b(peugeot|citro[eë]n|toyota|renault|dacia|volkswagen|vw|ford|opel|fiat|bmw|audi|mercedes|kia|hyundai|tesla|skoda|seat|nissan|ds)\b[\s-]*([a-z]*[\s-]?\d{1,4}[a-z]*|[a-z]+)?|\b(clio|m[ée]gane|captur|208|2008|308|3008|5008|c3|c4|c5|berlingo|yaris|corolla|c-hr|chr|rav4|golf|polo|tiguan|sandero|duster|zo[ée])\b/i;

function detectIntent(t: string): Intent | undefined {
  if (/m[ée]content|inadmissible|plainte|r[ée]clamation|scandale|pas normal|furieux|d[ée][çc]u/.test(t)) return "reclamation";
  if (/pr[eê]te?\b|fini|termin[ée]|avancement|o[uù] en est|ready|statut|r[ée]cup[ée]rer|status/.test(t)) return "status";
  if (/carrosserie|choc|accroch|rayure|sinistre|pare-?choc|bosse|dent/.test(t)) return "carrosserie";
  if (/pi[eè]ce|r[ée]f[ée]rence|magasin|en stock/.test(t) && !/rendez|rdv/.test(t)) return "pieces";
  if (/acheter|achat|essai|essayer|neuve?\b|occasion|leasing|\bloa\b|\blld\b|reprise|test drive|buy|financement/.test(t)) return "sales";
  if (/rdv|rendez|r[ée]vision|vidange|entretien|pneu|frein|plaquette|clim|voyant|diagnostic|contr[oô]le|bruit|batterie|appointment|service|courroie|embrayage|tyre|tire|brake|check/.test(t)) return "rdv";
  if (/conseiller|humain|quelqu.un|parler [àa]|real person|someone/.test(t)) return "human";
  if (/horaire|ouvert|adresse|o[uù] (?:[eê]tes|se trouve)|hours|open/.test(t)) return "info";
  return undefined;
}

function detectService(t: string) {
  if (/vidange/.test(t)) return "Vidange + filtres";
  if (/pneu|tyre|tire/.test(t)) return "Pneumatiques";
  if (/frein|plaquette|brake/.test(t)) return "Freinage";
  if (/clim/.test(t)) return "Climatisation";
  if (/voyant|diagnostic|bruit|light|check/.test(t)) return "Diagnostic électronique";
  if (/batterie|battery/.test(t)) return "Batterie";
  if (/contr[oô]le technique/.test(t)) return "Pré-contrôle technique";
  if (/r[ée]vision|entretien|service/.test(t)) return "Révision constructeur";
  return undefined;
}

const isBye = (t: string) => /au revoir|bonne (?:journ[ée]e|soir[ée]e)|c.est tout|rien d.autre|non merci|that.s all|goodbye|bye/.test(t);
const isNo = (t: string) => /^(non|no)\b|pas besoin|^c.est bon/.test(t);

function pickSlot(t: string, slots: { slot_id: string; label: string }[]) {
  if (/premier|1er|first|le 1\b|\bun\b/.test(t)) return slots[0];
  if (/deuxi[eè]me|second|2e|le 2\b/.test(t)) return slots[1];
  if (/troisi[eè]me|third|3e|dernier|last/.test(t)) return slots[2];
  for (const s of slots) {
    const [day, , , hour] = s.label.split(" ");
    if (day && t.includes(day)) return s;
    if (hour && t.replace(/\s/g, "").includes(hour.replace("à", ""))) return s;
  }
  if (/oui|ok|parfait|d.accord|[çc]a me va|yes|perfect/.test(t)) return slots[0];
  return undefined;
}

function extractName(raw: string) {
  const m =
    raw.match(/(?:je m.appelle|mon nom est|mon nom c.est|c.est (?:monsieur|madame)|my name is|this is)\s+(?:monsieur|madame|mme|m\.)?\s*([\p{L}'-]+(?:\s+[\p{L}'-]+)?)/iu) ||
    raw.match(/(?:monsieur|madame)\s+([\p{L}'-]+)/iu) ||
    raw.match(/^\s*([A-ZÀ-Ý][\p{L}'-]+\s+[A-ZÀ-Ý][\p{L}'-]+)\s*[,.]?\s*(?:0|\+33)/u);
  const name = m?.[1]?.replace(/[,.]$/, "");
  return name ? name.replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : undefined;
}

const extractPhone = (raw: string) => {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.length >= 10 ? digits : undefined;
};

export async function runSimulatedTurn(opts: {
  profile: DealershipProfile;
  history: Anthropic.Beta.BetaMessageParam[];
  userText: string;
  emit: Emit;
}) {
  const backend = new DemoBackend(opts.profile);
  const utterances = [
    ...opts.history.filter((m) => m.role === "user" && typeof m.content === "string").map((m) => m.content as string),
    opts.userText,
  ];

  const st: State = { lang: "fr" };
  let out: TurnOut = { text: "", tools: [] };
  for (const raw of utterances) out = await step(st, raw, opts.profile, backend);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let i = 0;
  for (const tool of out.tools) {
    const id = `sim_${Date.now().toString(36)}_${i++}`;
    opts.emit({ type: "tool_call", id, name: tool.name, input: tool.input });
    await sleep(450);
    opts.emit({ type: "tool_result", id, name: tool.name, ok: true, result: tool.result });
  }
  for (const word of out.text.split(/(?<= )/)) {
    opts.emit({ type: "text", delta: word });
    await sleep(18);
  }
  if (out.end) opts.emit({ type: "end_call", ...out.end });
  opts.emit({
    type: "messages",
    messages: [
      { role: "user", content: opts.userText },
      { role: "assistant", content: out.text || "…" },
    ],
  });
}

async function step(st: State, raw: string, p: DealershipProfile, be: DemoBackend): Promise<TurnOut> {
  const t = raw.toLowerCase();
  if (/\b(hello|hi|my car|appointment|please|i need|i would|i'd like)\b/.test(t)) st.lang = "en";
  const en = st.lang === "en";
  const tools: TurnOut["tools"] = [];
  const agent = p.agent.name;

  st.name ??= extractName(raw);
  st.phone ??= extractPhone(raw);
  const vm = raw.match(MODELS);
  if (vm) st.vehicle ??= vm[0].trim();
  const plate = raw.match(/\b[A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}\b/i);
  if (plate) st.plate ??= plate[0].toUpperCase();
  if (/matin|morning/.test(t)) st.partOfDay = "matin";
  if (/apr[eè]s-?midi|afternoon/.test(t)) st.partOfDay = "apres_midi";
  if (/courtoisie|v[ée]hicule de pr[eê]t|voiture de pr[eê]t|loaner/.test(t)) st.courtesy = true;
  st.service ??= detectService(t);

  if (st.done && isBye(t)) {
    st.ended = true;
    return {
      text: en ? `My pleasure, have a great day!` : `Avec plaisir, très bonne journée et à bientôt chez ${p.name} !`,
      tools,
      end: { outcome: st.intent === "sales" ? "lead_cree" : st.intent === "rdv" || st.intent === "carrosserie" ? "rdv_pris" : "info_donnee", summary: `${INTENT_SUMMARY[st.intent ?? "info"]}${st.vehicle ? ` · ${st.vehicle}` : ""}${st.slot ? ` · ${st.slot.label}` : ""}.` },
    };
  }
  if (st.done && isNo(t)) {
    return { text: en ? "Perfect. Have a great day!" : `Parfait. Merci de votre appel et très bonne journée !`, tools, end: { outcome: "info_donnee", summary: INTENT_SUMMARY[st.intent ?? "info"] } };
  }

  const detected = detectIntent(t);
  if (!st.intent || (st.done && detected)) {
    st.intent = detected;
    if (st.done && detected) {
      st.done = false;
      st.slots = undefined;
      st.slot = undefined;
    }
  }

  switch (st.intent) {
    case "rdv":
    case "carrosserie": {
      if (st.intent === "carrosserie") st.service = "Expertise carrosserie / devis sinistre";
      if (!st.vehicle) {
        return { text: en ? "Of course. Which vehicle is it for? Make, model and roughly the mileage." : st.intent === "carrosserie" ? "Je suis désolée pour ce désagrément. Pour quel véhicule s'agit-il ? La marque et le modèle me suffisent." : "Bien sûr. Pour quel véhicule ? La marque, le modèle et si possible le kilométrage.", tools };
      }
      if (!st.service) {
        return { text: en ? "Got it. What do you need: a service, a diagnostic, tyres, brakes…?" : `Très bien, ${st.vehicle}. C'est pour une révision, un diagnostic, des pneus, les freins… ?`, tools };
      }
      if (!st.slots) {
        const r = await be.checkAvailability({ service: st.service, part_of_day: st.partOfDay, courtesy_vehicle: st.courtesy });
        st.slots = r.slots;
        tools.push({ name: "check_availability", input: { service: st.service, part_of_day: st.partOfDay ?? "indifferent", courtesy_vehicle: st.courtesy ?? false }, result: r });
        const [a, b] = st.slots;
        if (!a) return { text: "Le planning est complet sur les prochains jours. Je vous propose qu'un conseiller vous rappelle pour trouver une solution, d'accord ?", tools };
        return { text: en ? `I can offer ${a.label}${b ? ` or ${b.label}` : ""}. Which works best for you?` : `Pour votre ${st.service.toLowerCase().replace(" / devis sinistre", "")}, je peux vous proposer ${a.label}${b ? `, ou ${b.label}` : ""}. Qu'est-ce qui vous arrange ?`, tools };
      }
      if (!st.slot) {
        st.slot = pickSlot(t, st.slots);
        if (!st.slot) {
          const c = st.slots[2] ?? st.slots[0]!;
          return { text: en ? `I also have ${c.label}. Would that suit you?` : `J'ai aussi ${c.label}. Est-ce que cela vous conviendrait ?`, tools };
        }
      }
      if (!st.name || !st.phone) {
        return { text: en ? `Great, ${st.slot.label}. Could I have your name and a phone number for the confirmation text?` : `Parfait, ${st.slot.label}. À quel nom, et quel numéro pour vous envoyer la confirmation par SMS ?`, tools };
      }
      const r = await be.bookAppointment({ customer_name: st.name, phone: st.phone, vehicle: st.vehicle, plate: st.plate, service: st.service, slot_id: st.slot.slot_id, courtesy_vehicle: st.courtesy });
      tools.push({ name: "book_appointment", input: { customer_name: st.name, phone: st.phone, vehicle: st.vehicle, service: st.service, slot_id: st.slot.slot_id, courtesy_vehicle: st.courtesy ?? false }, result: r });
      st.done = true;
      return { text: en ? `You're booked ${r.when} with ${r.advisor}. You'll get a confirmation text. Anything else?` : `C'est confirmé : ${r.when} avec ${r.advisor}${st.courtesy ? ", avec un véhicule de courtoisie" : ""}. Vous allez recevoir un SMS de confirmation. Puis-je faire autre chose pour vous ?`, tools };
    }

    case "status": {
      if (!st.plate && !st.name) return { text: en ? "Sure. What's the licence plate or the name on the job?" : "Je regarde ça. Quelle est l'immatriculation du véhicule, ou le nom du dossier ?", tools };
      const r = await be.getRepairStatus({ plate: st.plate, customer_name: st.name });
      tools.push({ name: "get_repair_status", input: { plate: st.plate, customer_name: st.name }, result: r });
      st.done = true;
      return { text: r.found ? `Votre véhicule est ${r.status} : ${r.detail} Il sera disponible ${r.ready}, pour un montant ${String(r.amount).startsWith("estimé") || String(r.amount).startsWith("selon") ? r.amount : `de ${r.amount}`}. Autre chose ?` : "Je ne retrouve pas le dossier. Je peux demander à la réception de vous rappeler ?", tools };
    }

    case "sales": {
      if (!st.vehicle) return { text: en ? "Great! Which model are you interested in, new or used?" : "Avec plaisir ! Quel modèle vous intéresse, plutôt en neuf ou en occasion ?", tools };
      if (!st.slots) {
        const inv = await be.searchInventory({ query: st.vehicle });
        tools.push({ name: "search_inventory", input: { query: st.vehicle }, result: inv });
        const r = await be.checkAvailability({ service: `Essai ${st.vehicle}` });
        st.slots = r.slots;
        tools.push({ name: "check_availability", input: { service: `Essai ${st.vehicle}` }, result: r });
        const v = inv.results[0];
        const [a, b] = st.slots;
        return { text: `${v ? `Nous avons ${v.label}${v.condition === "occasion" ? ` de ${v.year}, ${v.km.toLocaleString("fr-FR")} kilomètres` : ""}, à ${v.price.toLocaleString("fr-FR")} euros. ` : ""}Je peux vous proposer un essai ${a?.label ?? "cette semaine"}${b ? ` ou ${b.label}` : ""}. Ça vous tente ?`, tools };
      }
      if (!st.slot) {
        st.slot = pickSlot(t, st.slots) ?? st.slots[0];
      }
      if (!st.name || !st.phone) return { text: `Noté pour ${st.slot?.label}. À quel nom, et à quel numéro le vendeur peut-il vous joindre ?`, tools };
      const r = await be.createLead({ name: st.name, phone: st.phone, interest: /occasion/.test(t) ? "VO" : "VN", vehicle_of_interest: st.vehicle, test_drive_slot_id: st.slot?.slot_id });
      tools.push({ name: "create_lead", input: { name: st.name, phone: st.phone, interest: "VN", vehicle_of_interest: st.vehicle, test_drive_slot_id: st.slot?.slot_id }, result: r });
      st.done = true;
      return { text: `C'est réservé : ${r.assignee} vous attendra ${st.slot?.label} pour l'essai. Vous recevrez un SMS récapitulatif. Autre chose ?`, tools };
    }

    case "pieces":
    case "human": {
      const department = st.intent === "pieces" ? "pieces" : "apres_vente";
      const r = await be.transferCall({ department, reason: raw.slice(0, 120) });
      tools.push({ name: "transfer_call", input: { department, reason: raw.slice(0, 120) }, result: r });
      st.done = true;
      if (r.status === "ferme") {
        const cb = await be.scheduleCallback({ name: st.name ?? "Client", phone: st.phone ?? "numéro appelant", department, reason: raw.slice(0, 120), priority: "normale" });
        tools.push({ name: "schedule_callback", input: { department, priority: "normale" }, result: cb });
        return { text: `Le service ${r.department.toLowerCase()} est fermé pour le moment. J'ai programmé un rappel dès l'ouverture, ${cb.sla}. Autre chose ?`, tools };
      }
      return { text: `Je vous mets en relation avec le service ${r.department.toLowerCase()}, je leur transmets votre demande pour que vous n'ayez pas à la répéter. Ne quittez pas.`, tools, end: { outcome: "transfere", summary: `Transfert vers ${r.department}.` } };
    }

    case "reclamation": {
      if (!st.phone && !st.name) return { text: "Je suis sincèrement désolée, je comprends votre mécontentement. Pouvez-vous me donner votre nom pour que je retrouve votre dossier ?", tools };
      const cb = await be.scheduleCallback({ name: st.name ?? "Client", phone: st.phone ?? "numéro appelant", department: "apres_vente", reason: raw.slice(0, 160), priority: "haute" });
      tools.push({ name: "schedule_callback", input: { department: "apres_vente", priority: "haute", reason: raw.slice(0, 160) }, result: cb });
      st.done = true;
      return { text: `Merci. J'ai transmis votre dossier en priorité haute : ${cb.owner.toLowerCase()} vous rappellera, ${cb.sla}. Encore désolée pour ce désagrément.`, tools };
    }

    case "info": {
      st.done = true;
      const site = p.sites[0];
      const h = p.hours.find((x) => /atelier/i.test(x.label)) ?? p.hours[0];
      return { text: `${site ? `Nous sommes au ${site.address}, ${site.city.replace(/^\d+\s/, "")}. ` : ""}${h ? `${h.label} : ${h.value.replace(/–/g, " à ")}. ` : ""}Je vous envoie l'adresse par SMS ?`, tools };
    }

    default:
      return {
        text: en
          ? `I'm ${agent}, the dealership's virtual assistant. I can book a workshop appointment, check on your car, or arrange a test drive. How can I help?`
          : `Je peux prendre un rendez-vous atelier, vous donner l'avancement de votre véhicule, organiser un essai ou vous mettre en relation avec un conseiller. Que puis-je faire pour vous ?`,
        tools,
      };
  }
}

const INTENT_SUMMARY: Record<Intent, string> = {
  rdv: "Rendez-vous atelier pris",
  carrosserie: "Expertise carrosserie réservée",
  status: "Statut de réparation communiqué",
  sales: "Lead qualifié et essai planifié",
  pieces: "Transfert magasin pièces",
  human: "Transfert vers un conseiller",
  reclamation: "Réclamation : rappel prioritaire programmé",
  info: "Informations pratiques communiquées",
};
