import "server-only";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { Supplier, SupplierCategory, SupplierInput } from "./types";

/**
 * Stockage des fournisseurs — même double implémentation que les autres modules :
 * Postgres (Vercel/Neon) si une chaîne de connexion existe, repli mémoire sinon.
 * Objet complet en jsonb.
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

type Store = { suppliers: Supplier[] };
const mem: Store = ((globalThis as Record<string, unknown>).__lemnosSuppliers ??= {
  suppliers: [],
}) as Store;

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS suppliers (
        id uuid PRIMARY KEY,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function data(row: any): Supplier {
  return normalize((typeof row.data === "string" ? JSON.parse(row.data) : row.data) as Supplier);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Sécurise les champs susceptibles de manquer sur d'anciens enregistrements. */
function normalize(s: Supplier): Supplier {
  return {
    ...s,
    products: Array.isArray(s.products) ? s.products : [],
    category: (s.category ?? "autre") as SupplierCategory,
    contact: s.contact ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    website: s.website ?? "",
    address: s.address ?? "",
    city: s.city ?? "",
    zip: s.zip ?? "",
    country: s.country ?? "",
    notes: s.notes ?? "",
  };
}

export async function listSuppliers(): Promise<Supplier[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM suppliers ORDER BY created_at DESC`;
    return (rows as unknown[]).map(data);
  }
  return mem.suppliers.map(normalize);
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM suppliers WHERE id = ${id} LIMIT 1`;
    const list = rows as unknown[];
    return list.length ? data(list[0]) : null;
  }
  const s = mem.suppliers.find((x) => x.id === id);
  return s ? normalize(s) : null;
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const supplier: Supplier = normalize({
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  } as Supplier);
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO suppliers (id, data, created_at)
      VALUES (${supplier.id}, ${JSON.stringify(supplier)}::jsonb, ${supplier.createdAt})`;
  } else {
    mem.suppliers.unshift(supplier);
  }
  return supplier;
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<Supplier | null> {
  const existing = await getSupplier(id);
  if (!existing) return null;
  const updated = normalize({ ...existing, ...input, id: existing.id, createdAt: existing.createdAt });
  if (sql) {
    await ensureSchema();
    await sql`UPDATE suppliers SET data = ${JSON.stringify(updated)}::jsonb WHERE id = ${id}`;
  } else {
    const i = mem.suppliers.findIndex((x) => x.id === id);
    if (i >= 0) mem.suppliers[i] = updated;
  }
  return updated;
}

export async function deleteSupplier(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM suppliers WHERE id = ${id}`;
  } else {
    mem.suppliers = mem.suppliers.filter((x) => x.id !== id);
  }
}
