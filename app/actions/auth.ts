"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, adminPasswordConfigured, sessionToken } from "@/lib/auth/session";

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  if (!adminPasswordConfigured()) {
    return { error: "L'accès admin n'est pas configuré (variable ADMIN_PASSWORD manquante)." };
  }

  const password = String(formData.get("password") ?? "");
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Mot de passe incorrect." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
