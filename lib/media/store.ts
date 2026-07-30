import "server-only";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { Client } from "@/lib/billing/types";
import { deleteBlob } from "@/lib/blob/store";
import type { MediaAsset, MediaInput, MediaMeta } from "./types";

/**
 * Stockage des médias — même double implémentation que les autres modules :
 * Postgres (Vercel/Neon) si une chaîne de connexion existe, repli mémoire sinon.
 * Objet complet en jsonb. Le fichier binaire vit dans Vercel Blob ; on ne garde
 * ici que les métadonnées + l'URL Blob.
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

type Store = { media: MediaAsset[] };
const mem: Store = ((globalThis as Record<string, unknown>).__lemnosMedia ??= {
  media: [],
}) as Store;

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS media_assets (
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
function data(row: any): MediaAsset {
  return (typeof row.data === "string" ? JSON.parse(row.data) : row.data) as MediaAsset;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listMedia(): Promise<MediaAsset[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM media_assets ORDER BY created_at DESC`;
    return (rows as unknown[]).map(data);
  }
  return [...mem.media];
}

export async function getMedia(id: string): Promise<MediaAsset | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT data FROM media_assets WHERE id = ${id} LIMIT 1`;
    const list = rows as unknown[];
    return list.length ? data(list[0]) : null;
  }
  return mem.media.find((m) => m.id === id) ?? null;
}

export async function createMedia(input: MediaInput): Promise<MediaAsset> {
  const asset: MediaAsset = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO media_assets (id, data, created_at)
      VALUES (${asset.id}, ${JSON.stringify(asset)}::jsonb, ${asset.createdAt})`;
  } else {
    mem.media.unshift(asset);
  }
  return asset;
}

/** Met à jour les métadonnées (le fichier et l'URL Blob ne changent pas). */
export async function updateMedia(id: string, meta: MediaMeta): Promise<MediaAsset | null> {
  const existing = await getMedia(id);
  if (!existing) return null;
  const updated: MediaAsset = { ...existing, ...meta, id: existing.id, createdAt: existing.createdAt };
  if (sql) {
    await ensureSchema();
    await sql`UPDATE media_assets SET data = ${JSON.stringify(updated)}::jsonb WHERE id = ${id}`;
  } else {
    const i = mem.media.findIndex((m) => m.id === id);
    if (i >= 0) mem.media[i] = updated;
  }
  return updated;
}

/** Supprime le média ET le fichier Blob associé (best-effort sur le blob). */
export async function deleteMedia(id: string): Promise<void> {
  const existing = await getMedia(id);
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM media_assets WHERE id = ${id}`;
  } else {
    mem.media = mem.media.filter((m) => m.id !== id);
  }
  if (existing?.url) await deleteBlob(existing.url);
}

/** Médias d'un client : par lien direct (clientId) ou, à défaut, par nom. */
export async function mediaForClient(client: Client): Promise<MediaAsset[]> {
  const all = await listMedia();
  const name = client.club.trim().toLowerCase();
  return all.filter(
    (m) => m.clientId === client.id || (!m.clientId && m.clientName.trim().toLowerCase() === name),
  );
}

export async function mediaForOrder(orderId: string): Promise<MediaAsset[]> {
  const all = await listMedia();
  return all.filter((m) => m.orderId === orderId);
}
