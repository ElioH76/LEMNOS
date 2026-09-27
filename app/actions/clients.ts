"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import {
  createClient,
  deleteClient,
  getClient,
  invoicesForClient,
  setClientArchived,
  updateClient,
} from "@/lib/billing/store";
import { CLIENT_TYPES, type ClientProfileInput } from "@/lib/billing/types";

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface ClientSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function clean(input: ClientProfileInput): ClientProfileInput {
  const t = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  return {
    type: CLIENT_TYPES.includes(input.type) ? input.type : "association",
    club: t(input.club),
    contact: t(input.contact),
    contactRole: t(input.contactRole),
    address: t(input.address),
    city: t(input.city),
    zip: t(input.zip, 20),
    country: t(input.country, 80) || "France",
    phone: t(input.phone, 40),
    email: t(input.email),
    siren: t(input.siren, 20),
    siret: t(input.siret, 20),
    rna: t(input.rna, 20),
    colors: Array.isArray(input.colors) ? input.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 12) : [],
    notes: t(input.notes, 5000),
    logoUrl: t(input.logoUrl, 1000),
  };
}

export async function createClientProfileAction(input: ClientProfileInput): Promise<ClientSaveResult> {
  await assertAdmin();
  const data = clean(input);
  if (!data.club) return { ok: false, error: "Le nom du client est requis." };
  try {
    const client = await createClient(data);
    revalidatePath("/admin/clients");
    return { ok: true, id: client.id };
  } catch (e) {
    console.error("[clients] create", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function updateClientAction(id: string, input: ClientProfileInput): Promise<ClientSaveResult> {
  await assertAdmin();
  const data = clean(input);
  if (!data.club) return { ok: false, error: "Le nom du client est requis." };
  try {
    const client = await updateClient(id, data);
    if (!client) return { ok: false, error: "Client introuvable." };
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    return { ok: true, id };
  } catch (e) {
    console.error("[clients] update", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

/** Archive / désarchive : la fiche reste consultable, ses documents intacts. */
export async function archiveClientAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  if (id) {
    await setClientArchived(id, archived);
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
  }
}

/**
 * Suppression définitive — uniquement pour une fiche SANS aucun document.
 * Sinon on archive : les devis et factures doivent rester rattachés.
 */
export async function deleteClientAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const client = id ? await getClient(id) : null;
  if (client) {
    const docs = await invoicesForClient(client);
    if (docs.length > 0) {
      await setClientArchived(id, true);
      revalidatePath("/admin/clients");
      redirect(`/admin/clients/${id}`);
    }
    await deleteClient(id);
    revalidatePath("/admin/clients");
  }
  redirect("/admin/clients");
}
