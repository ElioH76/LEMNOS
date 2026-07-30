"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { createMedia, deleteMedia, updateMedia } from "@/lib/media/store";
import {
  MEDIA_KINDS,
  type MediaInput,
  type MediaKind,
  type MediaMeta,
} from "@/lib/media/types";

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface MediaSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function cleanKind(kind: string): MediaKind {
  return (MEDIA_KINDS as string[]).includes(kind) ? (kind as MediaKind) : "autre";
}

/** Enregistre un média après son upload dans Blob (URL déjà obtenue côté client). */
export async function createMediaAssetAction(input: MediaInput): Promise<MediaSaveResult> {
  await assertAdmin();
  if (!input.url || !input.pathname) return { ok: false, error: "Fichier manquant." };
  try {
    const asset = await createMedia({
      ...input,
      kind: cleanKind(input.kind),
      title: input.title?.trim() || input.filename,
      clientId: input.clientId || null,
      clientName: input.clientName?.trim() ?? "",
      orderId: input.orderId || null,
      notes: input.notes?.trim() ?? "",
    });
    revalidatePath("/admin/mediatheque");
    return { ok: true, id: asset.id };
  } catch (e) {
    console.error("[media] create", e);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

export async function updateMediaAssetAction(id: string, meta: MediaMeta): Promise<MediaSaveResult> {
  await assertAdmin();
  try {
    const asset = await updateMedia(id, { ...meta, kind: cleanKind(meta.kind) });
    if (!asset) return { ok: false, error: "Média introuvable." };
    revalidatePath("/admin/mediatheque");
    return { ok: true, id };
  } catch (e) {
    console.error("[media] update", e);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

export async function deleteMediaAssetAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteMedia(id);
    revalidatePath("/admin/mediatheque");
  }
}
