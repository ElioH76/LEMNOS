import "server-only";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { Client } from "@/lib/billing/types";
import type { Order, OrderEvent, OrderInput, OrderStatus } from "./types";

/**
 * Stockage des commandes — même double implémentation que lib/billing/store.ts :
 * Postgres (Vercel/Neon) si une chaîne de connexion existe, repli mémoire sinon.
 * L'objet complet est stocké en jsonb (`data`), ce qui garde le schéma stable
 * quand le modèle évolue (nouveaux champs, étapes…).
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

type Store = { orders: Order[] };
const mem: Store = ((globalThis as Record<string, unknown>).__lemnosOrders ??= {
  orders: [],
}) as Store;

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS orders (
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
function data(row: any): Order {
  const parsed = (typeof row.data === "string" ? JSON.parse(row.data) : row.data) as Order;
  return normalize(parsed);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Sécurise les champs susceptibles de manquer sur d'anciens enregistrements. */
function normalize(o: Order): Order {
  return {
    ...o,
    clientId: o.clientId ?? null,
    invoiceId: o.invoiceId ?? null,
    events: Array.isArray(o.events) ? o.events : [],
    sport: o.sport ?? "",
    quantity: o.quantity ?? "",
    dueDate: o.dueDate ?? "",
    notes: o.notes ?? "",
  };
}

/** Prochain numéro séquentiel de l'année : CMD-2026-0001, 0002… */
export async function nextOrderNumber(year = new Date().getFullYear()): Promise<string> {
  const prefix = `CMD-${year}-`;
  let numbers: string[];
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT number FROM orders WHERE number LIKE ${prefix + "%"}`;
    numbers = (rows as { number: string }[]).map((r) => r.number);
  } else {
    numbers = mem.orders.map((o) => o.number).filter((n) => n.startsWith(prefix));
  }
  const max = numbers.reduce((m, n) => {
    const seq = parseInt(n.slice(prefix.length), 10);
    return Number.isFinite(seq) && seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function listOrders(): Promise<Order[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM orders ORDER BY number DESC`;
    return (rows as unknown[]).map(data);
  }
  return [...mem.orders].sort((a, b) => b.number.localeCompare(a.number));
}

export async function getOrder(id: string): Promise<Order | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM orders WHERE id = ${id} LIMIT 1`;
    const list = rows as unknown[];
    return list.length ? data(list[0]) : null;
  }
  const o = mem.orders.find((x) => x.id === id);
  return o ? normalize(o) : null;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const now = new Date().toISOString();
  const status: OrderStatus = "design";
  const order: Order = normalize({
    ...input,
    id: randomUUID(),
    number: await nextOrderNumber(new Date().getFullYear()),
    status,
    // Premier jalon de la timeline : création de la commande.
    events: [{ id: randomUUID(), status, at: now }],
    createdAt: now,
    updatedAt: now,
  } as Order);

  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO orders (id, number, data, created_at, updated_at)
      VALUES (${order.id}, ${order.number}, ${JSON.stringify(order)}::jsonb, ${now}, ${now})`;
  } else {
    mem.orders.unshift(order);
  }
  return order;
}

/** Met à jour les champs éditables ; préserve numéro, statut et timeline. */
export async function updateOrder(id: string, input: OrderInput): Promise<Order | null> {
  const existing = await getOrder(id);
  if (!existing) return null;
  const updated: Order = normalize({
    ...existing,
    ...input,
    id: existing.id,
    number: existing.number,
    status: existing.status,
    events: existing.events,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  });
  await persist(id, updated);
  return updated;
}

/**
 * Fait passer la commande à un nouvel état et ajoute un jalon à la timeline.
 * Une note optionnelle permet de documenter l'étape (n° de suivi, remarque…).
 */
export async function setOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<Order | null> {
  const existing = await getOrder(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const event: OrderEvent = {
    id: randomUUID(),
    status,
    at: now,
    ...(note && note.trim() ? { note: note.trim() } : {}),
  };
  const updated: Order = normalize({
    ...existing,
    status,
    events: [...existing.events, event],
    updatedAt: now,
  });
  await persist(id, updated);
  return updated;
}

async function persist(id: string, order: Order): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`UPDATE orders SET data = ${JSON.stringify(order)}::jsonb, updated_at = ${order.updatedAt} WHERE id = ${id}`;
  } else {
    const i = mem.orders.findIndex((x) => x.id === id);
    if (i >= 0) mem.orders[i] = order;
  }
}

export async function deleteOrder(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM orders WHERE id = ${id}`;
  } else {
    mem.orders = mem.orders.filter((o) => o.id !== id);
  }
}

/** Commandes d'un client : par lien direct (clientId) ou, à défaut, par nom. */
export async function ordersForClient(client: Client): Promise<Order[]> {
  const all = await listOrders();
  const name = client.club.trim().toLowerCase();
  return all.filter(
    (o) => o.clientId === client.id || (!o.clientId && o.clientName.trim().toLowerCase() === name),
  );
}
