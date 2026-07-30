"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { createSupplier, deleteSupplier, updateSupplier } from "@/lib/suppliers/store";
import { SUPPLIER_CATEGORIES, type SupplierCategory, type SupplierInput } from "@/lib/suppliers/types";

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface SupplierSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function clean(input: SupplierInput): SupplierInput {
  const category: SupplierCategory = SUPPLIER_CATEGORIES.includes(input.category)
    ? input.category
    : "autre";
  return {
    ...input,
    name: input.name?.trim() ?? "",
    category,
    products: (input.products ?? []).map((p) => p.trim()).filter(Boolean).slice(0, 30),
  };
}

export async function createSupplierAction(input: SupplierInput): Promise<SupplierSaveResult> {
  await assertAdmin();
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Le nom du fournisseur est requis." };
  try {
    const supplier = await createSupplier(data);
    revalidatePath("/admin/fournisseurs");
    return { ok: true, id: supplier.id };
  } catch (e) {
    console.error("[suppliers] create", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function updateSupplierAction(id: string, input: SupplierInput): Promise<SupplierSaveResult> {
  await assertAdmin();
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Le nom du fournisseur est requis." };
  try {
    const supplier = await updateSupplier(id, data);
    if (!supplier) return { ok: false, error: "Fournisseur introuvable." };
    revalidatePath("/admin/fournisseurs");
    revalidatePath(`/admin/fournisseurs/${id}`);
    return { ok: true, id };
  } catch (e) {
    console.error("[suppliers] update", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function deleteSupplierAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteSupplier(id);
    revalidatePath("/admin/fournisseurs");
  }
  redirect("/admin/fournisseurs");
}
