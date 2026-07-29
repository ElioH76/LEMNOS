import "server-only";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import type {
  Client,
  ClientInput,
  ClientProfileInput,
  Invoice,
  InvoiceInput,
  ProductTemplate,
} from "./types";

/**
 * Stockage facturation — même double implémentation que lib/demands/store.ts :
 * Postgres (Vercel/Neon) si une chaîne de connexion existe, repli mémoire sinon.
 * Chaque entité est stockée avec son objet complet en jsonb (`data`), ce qui
 * garde le schéma stable même quand les types évoluent (devis, avoirs…).
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

type Store = { invoices: Invoice[]; clients: Client[]; templates: ProductTemplate[] };
const mem: Store = ((globalThis as Record<string, unknown>).__lemnosBilling ??= {
  invoices: [],
  clients: [],
  templates: [],
}) as Store;

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
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function data<T>(row: any): T {
  return (typeof row.data === "string" ? JSON.parse(row.data) : row.data) as T;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Clients ───────────────────────────────────────────────────────────────
/** Complète les fiches anciennes (avant les champs CRM) avec des valeurs sûres. */
function normalizeClient(c: Client): Client {
  return {
    ...c,
    colors: Array.isArray(c.colors) ? c.colors : [],
    notes: typeof c.notes === "string" ? c.notes : "",
    logoUrl: typeof c.logoUrl === "string" ? c.logoUrl : "",
  };
}

export async function listClients(): Promise<Client[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM billing_clients ORDER BY created_at DESC`;
    return (rows as unknown[]).map((r) => normalizeClient(data<Client>(r)));
  }
  return mem.clients.map(normalizeClient);
}

export async function getClient(id: string): Promise<Client | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM billing_clients WHERE id = ${id} LIMIT 1`;
    const list = rows as unknown[];
    return list.length ? normalizeClient(data<Client>(list[0])) : null;
  }
  const c = mem.clients.find((x) => x.id === id);
  return c ? normalizeClient(c) : null;
}

export async function createClient(input: ClientInput & Partial<ClientProfileInput>): Promise<Client> {
  const client: Client = normalizeClient({
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  } as Client);
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_clients (id, data, created_at) VALUES (${client.id}, ${JSON.stringify(client)}::jsonb, ${client.createdAt})`;
  } else {
    mem.clients.unshift(client);
  }
  return client;
}

export async function updateClient(id: string, input: ClientProfileInput): Promise<Client | null> {
  const existing = await getClient(id);
  if (!existing) return null;
  const updated = normalizeClient({ ...existing, ...input, id: existing.id, createdAt: existing.createdAt });
  if (sql) {
    await ensureSchema();
    await sql`UPDATE billing_clients SET data = ${JSON.stringify(updated)}::jsonb WHERE id = ${id}`;
  } else {
    const i = mem.clients.findIndex((x) => x.id === id);
    if (i >= 0) mem.clients[i] = updated;
  }
  return updated;
}

export async function deleteClient(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM billing_clients WHERE id = ${id}`;
  } else {
    mem.clients = mem.clients.filter((x) => x.id !== id);
  }
}

/** Factures d'un client : par lien direct (clientId) ou, à défaut, par nom de club. */
export async function invoicesForClient(client: Client): Promise<Invoice[]> {
  const all = await listInvoices();
  const club = client.club.trim().toLowerCase();
  return all.filter(
    (i) => i.clientId === client.id || (!i.clientId && i.client.club.trim().toLowerCase() === club),
  );
}

// ── Modèles produits ────────────────────────────────────────────────────────
export async function listProductTemplates(): Promise<ProductTemplate[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM billing_templates ORDER BY created_at DESC`;
    return (rows as unknown[]).map((r) => data<ProductTemplate>(r));
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

// ── Factures ────────────────────────────────────────────────────────────────
export async function listInvoices(): Promise<Invoice[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM billing_invoices ORDER BY number DESC`;
    return (rows as unknown[]).map((r) => data<Invoice>(r));
  }
  return [...mem.invoices].sort((a, b) => b.number.localeCompare(a.number));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM billing_invoices WHERE id = ${id} LIMIT 1`;
    const list = rows as unknown[];
    return list.length ? data<Invoice>(list[0]) : null;
  }
  return mem.invoices.find((i) => i.id === id) ?? null;
}

/** Prochain numéro séquentiel de l'année : LEM-2026-0001, 0002… */
export async function nextInvoiceNumber(year = new Date().getFullYear()): Promise<string> {
  const prefix = `LEM-${year}-`;
  let numbers: string[];
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT number FROM billing_invoices WHERE number LIKE ${prefix + "%"}`;
    numbers = (rows as { number: string }[]).map((r) => r.number);
  } else {
    numbers = mem.invoices.map((i) => i.number).filter((n) => n.startsWith(prefix));
  }
  const max = numbers.reduce((m, n) => {
    const seq = parseInt(n.slice(prefix.length), 10);
    return Number.isFinite(seq) && seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function createInvoice(
  input: InvoiceInput,
  extra?: { sourceDocumentId?: string },
): Promise<Invoice> {
  const now = new Date().toISOString();
  const invoice: Invoice = {
    ...input,
    ...extra,
    id: randomUUID(),
    number: await nextInvoiceNumber(new Date(input.date || now).getFullYear()),
    createdAt: now,
    updatedAt: now,
  };
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO billing_invoices (id, number, data, created_at, updated_at)
      VALUES (${invoice.id}, ${invoice.number}, ${JSON.stringify(invoice)}::jsonb, ${now}, ${now})`;
  } else {
    mem.invoices.unshift(invoice);
  }
  return invoice;
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<Invoice | null> {
  const existing = await getInvoice(id);
  if (!existing) return null;
  const updated: Invoice = {
    ...existing,
    ...input,
    id: existing.id,
    number: existing.number,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  if (sql) {
    await ensureSchema();
    await sql`UPDATE billing_invoices SET data = ${JSON.stringify(updated)}::jsonb, updated_at = ${updated.updatedAt} WHERE id = ${id}`;
  } else {
    const i = mem.invoices.findIndex((x) => x.id === id);
    if (i >= 0) mem.invoices[i] = updated;
  }
  return updated;
}

export async function duplicateInvoice(id: string): Promise<Invoice | null> {
  const source = await getInvoice(id);
  if (!source) return null;
  const { id: _id, number: _n, createdAt: _c, updatedAt: _u, ...input } = source;
  void _id;
  void _n;
  void _c;
  void _u;
  return createInvoice({ ...input, status: "brouillon" });
}

/**
 * Transforme un devis en facture (numéro de facture neuf, statut brouillon,
 * lien vers le devis d'origine). Prête pour un futur bouton « Convertir ».
 */
export async function convertQuoteToInvoice(quoteId: string): Promise<Invoice | null> {
  const src = await getInvoice(quoteId);
  if (!src || src.documentType !== "devis") return null;
  const { id, number, createdAt, updatedAt, sourceDocumentId, ...input } = src;
  void id;
  void number;
  void createdAt;
  void updatedAt;
  void sourceDocumentId;
  return createInvoice(
    { ...input, documentType: "facture", status: "brouillon" },
    { sourceDocumentId: quoteId },
  );
}

export async function deleteInvoice(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM billing_invoices WHERE id = ${id}`;
  } else {
    mem.invoices = mem.invoices.filter((i) => i.id !== id);
  }
}
