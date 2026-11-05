"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { createDemand, deleteDemand, updateDemandStatus } from "@/lib/demands/store";
import { DEMAND_STATUSES, type DemandStatus } from "@/lib/demands/types";
import { isValidContact, splitContact } from "@/lib/demands/contact";

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

/** Envoi public d'une demande depuis le formulaire « La vôtre. » de l'accueil. */
export async function submitDemand(input: {
  structure: string;
  sport: string;
  quantity: string;
  deadline: string;
  contact: string;
}): Promise<SubmitResult> {
  const clip = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
  const structure = clip(input.structure);
  const sport = clip(input.sport);
  const deadline = clip(input.deadline);
  const contact = clip(input.contact);

  if (!structure) return { ok: false, error: "Le nom du club est requis." };
  if (!sport) return { ok: false, error: "Le sport est requis." };
  if (!isValidContact(contact))
    return { ok: false, error: "Un e-mail ou un numéro de téléphone valide est requis." };

  try {
    await createDemand({
      structure,
      type: "Club de sport",
      sport,
      quantity: clip(input.quantity),
      ...splitContact(contact),
      brief: deadline ? `Pour quand : ${deadline}` : "",
      files: [],
    });
    return { ok: true };
  } catch (err) {
    console.error("[demands] createDemand a échoué :", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez dans un instant." };
  }
}

async function assertAdmin() {
  const store = await cookies();
  const ok = await isValidSession(store.get(SESSION_COOKIE)?.value);
  if (!ok) throw new Error("Non autorisé.");
}

export async function setDemandStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as DemandStatus;
  if (id && DEMAND_STATUSES.includes(status)) {
    await updateDemandStatus(id, status);
    revalidatePath("/admin");
  }
}

export async function removeDemand(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteDemand(id);
    revalidatePath("/admin");
  }
}
