"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { quoteStatus } from "@/lib/billing/calc";
import { DomainError, acceptQuote } from "@/lib/billing/service";
import { getDocumentByToken } from "@/lib/billing/store";

/**
 * Acceptation d'un devis EN LIGNE par le client, via le lien secret
 * /devis/[jeton]. Aucune session : l'autorisation est le jeton lui-même
 * (192 bits aléatoires), qui ne donne accès qu'à CE devis, en lecture et
 * acceptation seulement.
 *
 * Deux niveaux clairement distincts :
 * - case « Bon pour accord » obligatoire (méthode `en_ligne_case`) ;
 * - signature manuscrite dessinée facultative (méthode `en_ligne_signature`).
 *   Ce n'est pas une signature électronique qualifiée (eIDAS).
 */
export async function acceptQuoteOnlineAction(
  token: string,
  form: { name: string; role: string; email: string; agree: boolean; signature: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const doc = await getDocumentByToken(String(token ?? ""));
  if (!doc || doc.type !== "devis") return { ok: false, error: "Lien invalide ou expiré." };
  if (quoteStatus(doc) === "accepte") return { ok: true };

  const name = String(form.name ?? "").trim().slice(0, 200);
  const role = String(form.role ?? "").trim().slice(0, 200);
  const email = String(form.email ?? "").trim().slice(0, 200);
  if (!form.agree) return { ok: false, error: "Cochez la case « Bon pour accord » pour accepter le devis." };
  if (!name) return { ok: false, error: "Indiquez votre nom." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Indiquez une adresse email valide." };

  let signature: string | undefined;
  if (form.signature) {
    if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(form.signature) || form.signature.length > 300_000) {
      return { ok: false, error: "Signature illisible, effacez-la et recommencez." };
    }
    signature = form.signature;
  }

  const h = await headers();
  try {
    await acceptQuote(
      doc.id,
      {
        date: new Date().toISOString().slice(0, 10),
        name,
        role,
        email,
        method: signature ? "en_ligne_signature" : "en_ligne_case",
        signature,
        ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined,
        userAgent: (h.get("user-agent") ?? "").slice(0, 300) || undefined,
      },
      { online: true },
    );
  } catch (err) {
    if (err instanceof DomainError) return { ok: false, error: err.message };
    console.error("[devis en ligne]", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez ou contactez-nous." };
  }
  revalidatePath(`/devis/${token}`);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
