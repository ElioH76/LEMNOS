import "server-only";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { documentAmounts, todayIso } from "./calc";
import { type CommercialSettings, formatNumber, withDefaults } from "./settings";
import type {
  Client,
  ClientProfileInput,
  ClientType,
  CommercialDocument,
  DocumentLine,
  DocumentType,
  Payment,
  ProductTemplate,
} from "./types";

/**
 * Stockage de la gestion commerciale — même double implémentation que le reste
 * de l'admin : Postgres (Vercel/Neon) si une chaîne de connexion existe, repli
 * mémoire sinon. Chaque entité est stockée entière en jsonb (`data`) : les
 * lignes, paiements et l'historique voyagent avec leur document.
 *
 * Tables :
 * - billing_clients    fiches clients
 * - billing_templates  modèles de lignes produits
 * - billing_invoices   devis, factures et avoirs (numéro UNIQUE)
 * - billing_counters   compteurs de numérotation (1 ligne par préfixe + année)
 * - billing_settings   paramètres (entreprise, banque, conditions, emails…)
 */

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

const sql = connectionString ? neon(connectionString) : null;

export function storageBackend(): "postgres" | "memory" {
  return sql ? "postgres" : "memory";
}

type Store = {
  invoices: CommercialDocument[];
  clients: Client[];
  templates: ProductTemplate[];
  counters: Record<string, number>;
  settings: Partial<CommercialSettings> | null;
};
const mem: Store = ((globalThis as Record<string, unknown>).__lemnosBilling ??= {
  invoices: [],
  clients: [],
  templates: [],
  counters: {},
  settings: null,
}) as Store;
// Mémoire créée par une version antérieure du module : compléter les champs.
mem.counters ??= {};
mem.settings ??= null;

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS billing_clients (
        id uuid PRIMARY KEY,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS billing_templates (
        id uuid PRIMARY KEY,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS billing_invoices (
        id uuid PRIMARY KEY,
        number text UNIQUE NOT NULL,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS billing_counters (
        key text PRIMARY KEY,
        value integer NOT NULL
      )`;
      await sql`CREATE TABLE IF NOT EXISTS billing_settings (
        id text PRIMARY KEY,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parse<T>(row: any): T {
  return (typeof row.data === "string" ? JSON.parse(row.data) : row.data) as T;
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

// ── Paramètres ─────────────────────────────────────────────────────────────

export async function getSettings(): Promise<CommercialSettings> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_settings WHERE id = 'main' LIMIT 1`) as unknown[];
    return withDefaults(rows.length ? parse<Partial<CommercialSettings>>(rows[0]) : null);
  }
  return withDefaults(mem.settings);
}

export async function saveSettings(settings: CommercialSettings): Promise<CommercialSettings> {
  const clean = withDefaults(settings);
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_settings (id, data, updated_at)
      VALUES ('main', ${JSON.stringify(clean)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  } else {
    mem.settings = clean;
  }
  return clean;
}

// ── Numérotation ───────────────────────────────────────────────────────────

/** Plus grand numéro de séquence déjà utilisé pour « PREFIXE-ANNÉE-». */
async function maxUsedSequence(prefix: string, year: number): Promise<number> {
  const head = `${prefix}-${year}-`;
  let numbers: string[];
  if (sql) {
    const rows = (await sql`SELECT number FROM billing_invoices WHERE number LIKE ${head + "%"}`) as {
      number: string;
    }[];
    numbers = rows.map((r) => r.number);
  } else {
    numbers = mem.invoices.map((i) => i.number ?? "").filter((n) => n.startsWith(head));
  }
  return numbers.reduce((max, n) => {
    const seq = parseInt(n.slice(head.length), 10);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
}

/**
 * Dernière valeur consommée du compteur « PREFIXE-ANNÉE » (0 si jamais servi).
 * Tient compte des numéros déjà présents en base (reprise de données).
 */
export async function currentSequence(prefix: string, year: number): Promise<number> {
  const key = `${prefix}-${year}`;
  const used = await maxUsedSequence(prefix, year);
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT value FROM billing_counters WHERE key = ${key}`) as { value: number }[];
    return Math.max(used, rows[0]?.value ?? 0);
  }
  return Math.max(used, mem.counters[key] ?? 0);
}

/**
 * Réserve atomiquement le prochain numéro. L'incrément est fait par Postgres
 * (UPDATE … RETURNING) : deux émissions simultanées ne peuvent pas obtenir la
 * même valeur, et un numéro consommé n'est jamais resservi, même si le
 * document est ensuite supprimé.
 */
async function reserveSequence(prefix: string, year: number): Promise<number> {
  const key = `${prefix}-${year}`;
  const used = await maxUsedSequence(prefix, year);
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_counters (key, value) VALUES (${key}, ${used}) ON CONFLICT (key) DO NOTHING`;
    const rows = (await sql`UPDATE billing_counters
      SET value = GREATEST(value, ${used}) + 1 WHERE key = ${key} RETURNING value`) as { value: number }[];
    return rows[0].value;
  }
  const next = Math.max(mem.counters[key] ?? 0, used) + 1;
  mem.counters[key] = next;
  return next;
}

/**
 * Fixe le prochain numéro (Paramètres → Numérotation). Refuse tout retour en
 * arrière : un numéro déjà attribué ne peut jamais être réutilisé.
 */
export async function setNextSequence(prefix: string, year: number, next: number): Promise<void> {
  const current = await currentSequence(prefix, year);
  if (!Number.isInteger(next) || next <= current) {
    throw new Error(`Le prochain numéro doit être supérieur à ${current}.`);
  }
  const key = `${prefix}-${year}`;
  if (sql) {
    await sql`INSERT INTO billing_counters (key, value) VALUES (${key}, ${next - 1})
      ON CONFLICT (key) DO UPDATE SET value = GREATEST(billing_counters.value, EXCLUDED.value)`;
  } else {
    mem.counters[key] = next - 1;
  }
}

export async function allocateNumber(type: DocumentType, date: string): Promise<string> {
  const { numbering } = await getSettings();
  const prefix =
    type === "devis" ? numbering.quotePrefix : type === "avoir" ? numbering.creditPrefix : numbering.invoicePrefix;
  const year = parseInt(date.slice(0, 4), 10) || new Date().getFullYear();
  const seq = await reserveSequence(prefix, year);
  return formatNumber(prefix, year, seq, numbering.padding);
}

// ── Clients ────────────────────────────────────────────────────────────────

const CLIENT_TYPES: ClientType[] = ["association", "entreprise", "particulier"];

function normalizeClient(raw: any): Client {
  return {
    id: str(raw.id),
    createdAt: str(raw.createdAt, new Date(0).toISOString()),
    archived: raw.archived === true,
    type: CLIENT_TYPES.includes(raw.type) ? raw.type : "association",
    club: str(raw.club),
    contact: str(raw.contact),
    contactRole: str(raw.contactRole),
    address: str(raw.address),
    city: str(raw.city),
    zip: str(raw.zip),
    country: str(raw.country, "France"),
    phone: str(raw.phone),
    email: str(raw.email),
    siren: str(raw.siren),
    siret: str(raw.siret),
    rna: str(raw.rna),
    colors: Array.isArray(raw.colors) ? raw.colors : [],
    notes: str(raw.notes),
    logoUrl: str(raw.logoUrl),
  };
}

export async function listClients(opts: { includeArchived?: boolean } = {}): Promise<Client[]> {
  let all: Client[];
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_clients ORDER BY created_at DESC`) as unknown[];
    all = rows.map((r) => normalizeClient(parse(r)));
  } else {
    all = mem.clients.map(normalizeClient);
  }
  return opts.includeArchived ? all : all.filter((c) => !c.archived);
}

export async function getClient(id: string): Promise<Client | null> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_clients WHERE id = ${id} LIMIT 1`) as unknown[];
    return rows.length ? normalizeClient(parse(rows[0])) : null;
  }
  const c = mem.clients.find((x) => x.id === id);
  return c ? normalizeClient(c) : null;
}

export async function createClient(input: Partial<ClientProfileInput> & { club: string }): Promise<Client> {
  const client = normalizeClient({ ...input, id: randomUUID(), createdAt: new Date().toISOString() });
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_clients (id, data, created_at) VALUES (${client.id}, ${JSON.stringify(client)}::jsonb, ${client.createdAt})`;
  } else {
    mem.clients.unshift(client);
  }
  return client;
}

async function writeClient(client: Client): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`UPDATE billing_clients SET data = ${JSON.stringify(client)}::jsonb WHERE id = ${client.id}`;
  } else {
    const i = mem.clients.findIndex((x) => x.id === client.id);
    if (i >= 0) mem.clients[i] = client;
  }
}

export async function updateClient(id: string, input: ClientProfileInput): Promise<Client | null> {
  const existing = await getClient(id);
  if (!existing) return null;
  const updated = normalizeClient({ ...existing, ...input, id: existing.id, createdAt: existing.createdAt });
  await writeClient(updated);
  return updated;
}

export async function setClientArchived(id: string, archived: boolean): Promise<void> {
  const existing = await getClient(id);
  if (existing) await writeClient({ ...existing, archived });
}

/** Suppression définitive — réservée aux fiches sans aucun document. */
export async function deleteClient(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM billing_clients WHERE id = ${id}`;
  } else {
    mem.clients = mem.clients.filter((x) => x.id !== id);
  }
}

/** Documents d'un client : par lien direct (clientId) ou, à défaut, par nom. */
export async function invoicesForClient(client: Client): Promise<CommercialDocument[]> {
  const all = await listInvoices();
  const name = client.club.trim().toLowerCase();
  return all.filter(
    (i) => i.clientId === client.id || (!i.clientId && i.client.club.trim().toLowerCase() === name),
  );
}

// ── Modèles produits ───────────────────────────────────────────────────────

export async function listProductTemplates(): Promise<ProductTemplate[]> {
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_templates ORDER BY created_at DESC`) as unknown[];
    return rows.map((r) => parse<ProductTemplate>(r));
  }
  return [...mem.templates];
}

export async function createProductTemplate(
  input: Omit<ProductTemplate, "id" | "createdAt">,
): Promise<ProductTemplate> {
  const tpl: ProductTemplate = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_templates (id, data, created_at) VALUES (${tpl.id}, ${JSON.stringify(tpl)}::jsonb, ${tpl.createdAt})`;
  } else {
    mem.templates.unshift(tpl);
  }
  return tpl;
}

export async function deleteProductTemplate(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM billing_templates WHERE id = ${id}`;
  } else {
    mem.templates = mem.templates.filter((t) => t.id !== id);
  }
}

// ── Documents ──────────────────────────────────────────────────────────────

function normalizeLine(raw: any): DocumentLine {
  return {
    id: str(raw.id) || randomUUID(),
    label: str(raw.label),
    description: str(raw.description),
    quantity: num(raw.quantity),
    unitPriceHt: num(raw.unitPriceHt),
    vatRate: num(raw.vatRate),
    discountType: raw.discountType === "percent" ? "percent" : "amount",
    discountValue: num(raw.discountValue),
  };
}

/**
 * Normalise un document stocké. Gère aussi les factures créées par la première
 * version du module (statuts envoyee/payee, champ `deposit`, numéros LEM-…) :
 * elles restent consultables et comptabilisées, sans migration destructive.
 */
export function normalizeDocument(raw: any): CommercialDocument {
  const type: DocumentType = raw.type ?? (raw.documentType === "devis" ? "devis" : "facture");
  const legacy = raw.type === undefined;
  const createdAt = str(raw.createdAt, new Date(0).toISOString());
  const date = str(raw.date, createdAt.slice(0, 10));

  let lifecycle = raw.lifecycle as CommercialDocument["lifecycle"];
  const payments: Payment[] = Array.isArray(raw.payments) ? raw.payments : [];
  const deductions = Array.isArray(raw.deductions) ? raw.deductions : [];

  if (legacy) {
    const old = str(raw.status, "brouillon");
    lifecycle = old === "annulee" ? "annulee" : old === "brouillon" ? "brouillon" : "emise";
    if (num(raw.deposit) > 0) {
      deductions.push({ invoiceId: null, number: null, date, amount: num(raw.deposit), label: "Acompte versé" });
    }
  }

  const doc: CommercialDocument = {
    id: str(raw.id),
    type,
    kind: raw.kind === "acompte" || raw.kind === "solde" ? raw.kind : "standard",
    number: typeof raw.number === "string" && !raw.number.startsWith("draft:") ? raw.number : null,
    quoteStatus: raw.quoteStatus ?? (legacy && raw.status === "envoyee" ? "envoye" : "brouillon"),
    lifecycle: lifecycle ?? "brouillon",
    clientId: raw.clientId ?? null,
    client: {
      type: raw.client?.type ?? "association",
      club: str(raw.client?.club),
      contact: str(raw.client?.contact),
      contactRole: str(raw.client?.contactRole),
      address: str(raw.client?.address),
      city: str(raw.client?.city),
      zip: str(raw.client?.zip),
      country: str(raw.client?.country),
      phone: str(raw.client?.phone),
      email: str(raw.client?.email),
      siren: str(raw.client?.siren),
      siret: str(raw.client?.siret),
      rna: str(raw.client?.rna),
    },
    subject: str(raw.subject, str(raw.projectRef)),
    date,
    lines: Array.isArray(raw.lines) ? raw.lines.map(normalizeLine) : [],
    globalDiscountType: raw.globalDiscountType === "percent" ? "percent" : "amount",
    globalDiscountValue: num(raw.globalDiscountValue),
    globalDiscountLabel: str(raw.globalDiscountLabel, "Remise"),
    shipping: num(raw.shipping),
    notes: str(raw.notes),
    paymentTerms: str(raw.paymentTerms),
    internalComments: str(raw.internalComments),
    validUntil: str(raw.validUntil),
    plannedDeliveryDate: str(raw.plannedDeliveryDate),
    deliveryLeadTime: str(raw.deliveryLeadTime),
    depositType: raw.depositType === "percent" || raw.depositType === "amount" ? raw.depositType : "none",
    depositValue: num(raw.depositValue),
    dueDate: str(raw.dueDate),
    deliveryDate: str(raw.deliveryDate),
    paymentMethod: raw.paymentMethod ?? "virement",
    depositAmount: num(raw.depositAmount),
    quoteId: raw.quoteId ?? (legacy ? (raw.sourceDocumentId ?? null) : null),
    invoiceId: raw.invoiceId ?? null,
    correctsId: raw.correctsId ?? null,
    creditNoteId: raw.creditNoteId ?? null,
    revisionOf: raw.revisionOf ?? null,
    replacedBy: raw.replacedBy ?? null,
    reason: str(raw.reason),
    deductions,
    payments,
    acceptance: raw.acceptance ?? null,
    publicToken: raw.publicToken ?? null,
    fulfillment: {
      productionAt: raw.fulfillment?.productionAt ?? null,
      deliveredAt: raw.fulfillment?.deliveredAt ?? null,
    },
    seller: raw.seller ?? null,
    bank: raw.bank ?? null,
    terms: raw.terms ?? null,
    // Anciennes factures : TVA par ligne ; nouvelles : franchise figée.
    vatExempt: typeof raw.vatExempt === "boolean" ? raw.vatExempt : false,
    issuedAt: raw.issuedAt ?? (legacy && lifecycle !== "brouillon" ? createdAt : null),
    sentAt: raw.sentAt ?? null,
    pdfUrl: raw.pdfUrl ?? null,
    archived: raw.archived === true,
    history: Array.isArray(raw.history) ? raw.history : [],
    createdAt,
    updatedAt: str(raw.updatedAt, createdAt),
  };

  // Ancienne facture « payée » : on matérialise le règlement pour que les
  // statuts et le CA encaissé restent justes.
  if (legacy && raw.status === "payee" && payments.length === 0) {
    doc.payments = [
      {
        id: `legacy-${doc.id}`,
        date,
        amount: documentAmounts(doc).amountDue,
        method: "autre",
        reference: "",
        comment: "Règlement antérieur au module de paiements",
        createdAt,
      },
    ];
  }
  if (legacy && doc.history.length === 0) {
    doc.history = [{ id: `legacy-${doc.id}`, at: createdAt, label: "Document créé (ancien module)" }];
  }
  return doc;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Valeur de la colonne `number` : le numéro, ou un marqueur unique de brouillon. */
function numberColumn(doc: CommercialDocument): string {
  return doc.number ?? `draft:${doc.id}`;
}

export async function listInvoices(): Promise<CommercialDocument[]> {
  let docs: CommercialDocument[];
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_invoices ORDER BY created_at DESC`) as unknown[];
    docs = rows.map((r) => normalizeDocument(parse(r)));
  } else {
    docs = mem.invoices.map((d) => normalizeDocument(structuredClone(d)));
  }
  return docs.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

export async function listDocuments(type: DocumentType | "factures-avoirs"): Promise<CommercialDocument[]> {
  const all = await listInvoices();
  return type === "factures-avoirs"
    ? all.filter((d) => d.type !== "devis")
    : all.filter((d) => d.type === type);
}

export async function getInvoice(id: string): Promise<CommercialDocument | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_invoices WHERE id = ${id} LIMIT 1`) as unknown[];
    return rows.length ? normalizeDocument(parse(rows[0])) : null;
  }
  const d = mem.invoices.find((x) => x.id === id);
  return d ? normalizeDocument(structuredClone(d)) : null;
}
export const getDocument = getInvoice;

export async function getDocumentByToken(token: string): Promise<CommercialDocument | null> {
  if (!token || token.length < 32) return null;
  if (sql) {
    await ensureSchema();
    const rows = (await sql`SELECT data FROM billing_invoices WHERE data->>'publicToken' = ${token} LIMIT 1`) as unknown[];
    return rows.length ? normalizeDocument(parse(rows[0])) : null;
  }
  const d = mem.invoices.find((x) => x.publicToken === token);
  return d ? normalizeDocument(structuredClone(d)) : null;
}

export async function insertDocument(doc: CommercialDocument): Promise<CommercialDocument> {
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_invoices (id, number, data, created_at, updated_at)
      VALUES (${doc.id}, ${numberColumn(doc)}, ${JSON.stringify(doc)}::jsonb, ${doc.createdAt}, ${doc.updatedAt})`;
  } else {
    mem.invoices.unshift(structuredClone(doc));
  }
  return doc;
}

/** Réécrit un document (le numéro ne change que lors de l'émission). */
export async function writeDocument(doc: CommercialDocument): Promise<CommercialDocument> {
  doc.updatedAt = new Date().toISOString();
  if (sql) {
    await ensureSchema();
    await sql`UPDATE billing_invoices
      SET number = ${numberColumn(doc)}, data = ${JSON.stringify(doc)}::jsonb, updated_at = ${doc.updatedAt}
      WHERE id = ${doc.id}`;
  } else {
    const i = mem.invoices.findIndex((x) => x.id === doc.id);
    if (i >= 0) mem.invoices[i] = structuredClone(doc);
  }
  return doc;
}

/** Suppression physique — réservée aux brouillons (voir service.ts). */
export async function removeDocument(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM billing_invoices WHERE id = ${id}`;
  } else {
    mem.invoices = mem.invoices.filter((i) => i.id !== id);
  }
}

export { todayIso };
