"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { createOrder, deleteOrder, setOrderStatus, updateOrder } from "@/lib/orders/store";
import { ORDER_STATUSES, type OrderInput, type OrderStatus } from "@/lib/orders/types";

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface OrderSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function validate(input: OrderInput): string | null {
  if (!input.clientName?.trim()) return "Le nom du client est requis.";
  if (!input.title?.trim()) return "Le libellé de la commande est requis.";
  return null;
}

export async function createOrderAction(input: OrderInput): Promise<OrderSaveResult> {
  await assertAdmin();
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const order = await createOrder(input);
    revalidatePath("/admin/commandes");
    revalidatePath("/admin");
    return { ok: true, id: order.id };
  } catch (e) {
    console.error("[orders] create", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function updateOrderAction(id: string, input: OrderInput): Promise<OrderSaveResult> {
  await assertAdmin();
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const order = await updateOrder(id, input);
    if (!order) return { ok: false, error: "Commande introuvable." };
    revalidatePath("/admin/commandes");
    revalidatePath(`/admin/commandes/${id}`);
    return { ok: true, id };
  } catch (e) {
    console.error("[orders] update", e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function setOrderStatusAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "");
  if (id && ORDER_STATUSES.includes(status)) {
    await setOrderStatus(id, status, note);
    revalidatePath("/admin/commandes");
    revalidatePath(`/admin/commandes/${id}`);
    revalidatePath("/admin");
  }
}

export async function deleteOrderAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteOrder(id);
    revalidatePath("/admin/commandes");
    revalidatePath("/admin");
  }
  redirect("/admin/commandes");
}
