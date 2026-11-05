"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { createDemand, deleteDemand, updateDemandStatus } from "@/lib/demands/store";
import { DEMAND_STATUSES, type DemandStatus } from "@/lib/demands/types";

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

/** Envoi public d'une demande depuis le formulaire « Démarrer ». */
export async function submitDemand(input: {
  structure: string;
  type: string;
  sport: string;
  quantity: string;
  email: string;
  phone: string;
  brief: string;
  files: string[];
}): Promise<SubmitResult> {
  const structure = input.structure?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const brief = input.brief?.trim() ?? "";

  if (!structure) return { ok: false, error: "Le nom de la structure est requis." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Une adresse email valide est requise." };
  if (brief.length < 10) return { ok: false, error: "Décrivez votre projet en quelques mots." };

  try {
    await createDemand({
      structure,
      type: input.type?.trim() || "—",
      sport: input.sport?.trim() ?? "",
      quantity: input.quantity?.trim() ?? "",
      email,
      phone: input.phone?.trim() ?? "",
      brief,
      files: (input.files ?? []).slice(0, 20).map((f) => String(f).slice(0, 200)),
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
