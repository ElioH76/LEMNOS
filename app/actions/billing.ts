"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import {
  createClient,
  createInvoice,
  createProductTemplate,
  deleteInvoice,
  deleteProductTemplate,
  duplicateInvoice,
  updateInvoice,
} from "@/lib/billing/store";
import type { Client, ClientInput, InvoiceInput, ProductTemplate } from "@/lib/billing/types";

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface SaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createInvoiceAction(input: InvoiceInput): Promise<SaveResult> {
  await assertAdmin();
  try {
    const invoice = await createInvoice(input);
    revalidatePath("/admin/factures");
    return { ok: true, id: invoice.id };
  } catch (err) {
    console.error("[billing] createInvoice", err);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function updateInvoiceAction(id: string, input: InvoiceInput): Promise<SaveResult> {
  await assertAdmin();
  try {
    const invoice = await updateInvoice(id, input);
    if (!invoice) return { ok: false, error: "Facture introuvable." };
    revalidatePath("/admin/factures");
    revalidatePath(`/admin/factures/${id}`);
    return { ok: true, id };
  } catch (err) {
    console.error("[billing] updateInvoice", err);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function deleteInvoiceAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteInvoice(id);
    revalidatePath("/admin/factures");
  }
  redirect("/admin/factures");
}

export async function duplicateInvoiceAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const copy = await duplicateInvoice(id);
  revalidatePath("/admin/factures");
  if (copy) redirect(`/admin/factures/${copy.id}/modifier`);
}

export async function createClientAction(input: ClientInput): Promise<Client> {
  await assertAdmin();
  return createClient(input);
}

export async function saveProductTemplateAction(input: {
  label: string;
  unitPriceHt: number;
  vatRate: number;
}): Promise<ProductTemplate> {
  await assertAdmin();
  return createProductTemplate(input);
}

export async function deleteProductTemplateAction(id: string): Promise<void> {
  await assertAdmin();
  await deleteProductTemplate(id);
}
