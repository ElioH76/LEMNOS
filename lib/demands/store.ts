import "server-only";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { Demand, DemandStatus, NewDemand } from "./types";

/**
 * Stockage des demandes, à double implémentation :
 * - Postgres (Vercel/Neon) dès qu'une chaîne de connexion est présente ;
 * - repli en mémoire sinon (dev local, tant que la base n'est pas branchée).
 *
 * Le jour où les variables Neon sont ajoutées sur Vercel, le code bascule
 * automatiquement sur Postgres, sans changement.
 */

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

const usePostgres = connectionString.length > 0;
const sql = usePostgres ? neon(connectionString) : null;

export function storageBackend(): "postgres" | "memory" {
  return usePostgres ? "postgres" : "memory";
}

// ── Repli mémoire ─────────────────────────────────────────────────────────
// Singleton porté par globalThis pour survivre aux rechargements de modules
// (HMR en dev). Non persistant en production serverless — c'est voulu : la
// vraie persistance passe par Postgres.
const memory: { demands: Demand[] } = ((globalThis as Record<string, unknown>).__lemnosDemands ??= {
  demands: [],
}) as { demands: Demand[] };

// ── Schéma Postgres (créé à la volée, une fois) ───────────────────────────
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS demands (
          id uuid PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT now(),
          structure text NOT NULL,
          type text NOT NULL,
          sport text NOT NULL DEFAULT '',
          quantity text NOT NULL DEFAULT '',
          email text NOT NULL,
          phone text NOT NULL DEFAULT '',
          brief text NOT NULL,
          files jsonb NOT NULL DEFAULT '[]'::jsonb,
          status text NOT NULL DEFAULT 'nouveau'
        )
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/** jsonb peut revenir en tableau déjà parsé ou, selon le driver, en chaîne. */
function parseFiles(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToDemand(row: any): Demand {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    structure: row.structure,
    type: row.type,
    sport: row.sport ?? "",
    quantity: row.quantity ?? "",
    email: row.email,
    phone: row.phone ?? "",
    brief: row.brief,
    files: parseFiles(row.files),
    status: row.status as DemandStatus,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function createDemand(input: NewDemand): Promise<Demand> {
  const demand: Demand = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "nouveau",
    ...input,
  };

  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO demands (id, created_at, structure, type, sport, quantity, email, phone, brief, files, status)
      VALUES (
        ${demand.id}, ${demand.createdAt}, ${demand.structure}, ${demand.type}, ${demand.sport},
        ${demand.quantity}, ${demand.email}, ${demand.phone}, ${demand.brief},
        ${JSON.stringify(demand.files)}::jsonb, ${demand.status}
      )
    `;
  } else {
    memory.demands.unshift(demand);
  }
  return demand;
}

export async function listDemands(): Promise<Demand[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM demands ORDER BY created_at DESC`;
    return (rows as unknown[]).map(rowToDemand);
  }
  return [...memory.demands];
}

export async function getDemand(id: string): Promise<Demand | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM demands WHERE id = ${id} LIMIT 1`;
    const list = rows as unknown[];
    return list.length ? rowToDemand(list[0]) : null;
  }
  return memory.demands.find((d) => d.id === id) ?? null;
}

export async function updateDemandStatus(id: string, status: DemandStatus): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`UPDATE demands SET status = ${status} WHERE id = ${id}`;
  } else {
    const demand = memory.demands.find((d) => d.id === id);
    if (demand) demand.status = status;
  }
}

export async function deleteDemand(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM demands WHERE id = ${id}`;
  } else {
    memory.demands = memory.demands.filter((d) => d.id !== id);
  }
}
