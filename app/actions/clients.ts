"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { createClient, deleteClient, updateClient } from "@/lib/billing/store";
import type { ClientProfileInput } from "@/lib/billing/types";

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface ClientSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function validate(input: ClientProfileInput): string | null {
  if (!input.club?.trim()) return "Le nom du club ou de l'entreprise est requis.";
  return null;
}

export async function createClientProfileAction(input: ClientProfileInput): Promise<ClientSaveResult> {
  await assertAdmin();
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const client = await createClient(input);
    revalidatePath("/admin/clients");
    return { ok: true, id: client.id };
  } catch (e) {
    console.error("[clients] create", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function updateClientAction(
  id: string,
  input: ClientProfileInput,
): Promise<ClientSaveResult> {
  await assertAdmin();
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const client = await updateClient(id, input);
    if (!client) return { ok: false, error: "Client introuvable." };
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    return { ok: true, id };
  } catch (e) {
    console.error("[clients] update", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function deleteClientAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteClient(id);
    revalidatePath("/admin/clients");
  }
  redirect("/admin/clients");
}
