"use server";

import { put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/blob/store";
import { getSettings } from "@/lib/billing/store";
import { designSummaryLines } from "@/lib/configurator/summary";
import type { DesignConfig } from "@/lib/configurator/types";
import { sanitizeDesign } from "@/lib/configurator/validate";
import { createDemand } from "@/lib/demands/store";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";

/**
 * Demande de devis depuis le configurateur 3D. Tout est revalidé ici : le
 * design passe par `sanitizeDesign` (les logos Lemnos n'y figurent pas et ne
 * peuvent pas y être injectés), les aperçus doivent être des images JPEG/PNG
 * de taille raisonnable.
 *
 * Enregistrement : une « demande » dans l'admin (/admin/demandes), avec le
 * design complet. Images stockées dans Vercel Blob (privé) si configuré.
 * Notification email via Resend si RESEND_API_KEY + EMAIL_FROM sont définis
 * (destinataire : CONFIGURATOR_NOTIFY_EMAIL, sinon l'email de l'entreprise).
 */

export type QuoteResult = { ok: true; reference: string; notified: boolean } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREVIEW_RE = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+=*)$/;
const PREVIEW_MAX = 1_800_000;

function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const m = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(dataUrl);
  if (!m) return null;
  return { buffer: Buffer.from(m[3], "base64"), contentType: m[1], ext: m[2] === "jpeg" ? "jpg" : m[2] };
}

async function storeImage(dataUrl: string, path: string): Promise<string> {
  if (!isBlobConfigured()) return dataUrl;
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return dataUrl;
  const blob = await put(`${path}.${decoded.ext}`, decoded.buffer, {
    access: "private",
    contentType: decoded.contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function submitDesignQuote(input: {
  club: string;
  contactName: string;
  email: string;
  phone: string;
  quantity: string;
  comment: string;
  design: unknown;
  previews: { front: string; back: string };
}): Promise<QuoteResult> {
  const club = String(input.club ?? "").trim().slice(0, 160);
  const contactName = String(input.contactName ?? "").trim().slice(0, 160);
  const email = String(input.email ?? "").trim().slice(0, 200);
  const phone = String(input.phone ?? "").trim().slice(0, 40);
  const quantity = String(input.quantity ?? "").replace(/[^\d]/g, "").slice(0, 6);
  const comment = String(input.comment ?? "").trim().slice(0, 3000);

  if (!club) return { ok: false, error: "Indiquez le nom du club." };
  if (!contactName) return { ok: false, error: "Indiquez le nom et prénom du contact." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Indiquez une adresse email valide." };
  if (!quantity || Number(quantity) < 1) return { ok: false, error: "Indiquez une quantité estimée." };

  const front = String(input.previews?.front ?? "");
  const back = String(input.previews?.back ?? "");
  if (!PREVIEW_RE.test(front) || !PREVIEW_RE.test(back) || front.length > PREVIEW_MAX || back.length > PREVIEW_MAX) {
    return { ok: false, error: "Aperçu du maillot invalide. Rechargez le configurateur et réessayez." };
  }

  const { design } = sanitizeDesign(input.design);
  const folder = `configurateur/${design.designId}`;

  let stored: { front: string; back: string; config: DesignConfig };
  try {
    const [frontUrl, backUrl, ...logoUrls] = await Promise.all([
      storeImage(front, `${folder}/apercu-face`),
      storeImage(back, `${folder}/apercu-dos`),
      ...design.customLogos.map((l) => storeImage(l.src, `${folder}/logo-${l.zone}`)),
    ]);
    stored = {
      front: frontUrl,
      back: backUrl,
      config: { ...design, customLogos: design.customLogos.map((l, i) => ({ ...l, src: logoUrls[i] })) },
    };
  } catch (err) {
    console.error("[configurateur] stockage des images impossible :", err);
    return { ok: false, error: "Le stockage des visuels a échoué. Réessayez dans un instant." };
  }

  const summary = designSummaryLines(design);
  const brief = [`Contact : ${contactName}`, ...(comment ? [`Commentaire : ${comment}`] : []), "", ...summary].join("\n");

  try {
    await createDemand({
      structure: club,
      type: "Configurateur 3D",
      sport: "Football",
      quantity,
      email,
      phone,
      brief,
      files: ["Aperçu face", "Aperçu dos", ...design.customLogos.map((l) => l.name)],
      design: { designId: design.designId, contactName, previews: { front: stored.front, back: stored.back }, config: stored.config },
    });
  } catch (err) {
    console.error("[configurateur] enregistrement de la demande impossible :", err);
    return { ok: false, error: "La demande n'a pas pu être enregistrée. Réessayez dans un instant." };
  }

  // Notification interne : n'invalide pas la demande, déjà enregistrée.
  let notified = false;
  if (isEmailConfigured()) {
    try {
      const settings = await getSettings();
      const to = process.env.CONFIGURATOR_NOTIFY_EMAIL || settings.company.email;
      const f = decodeDataUrl(front);
      const b = decodeDataUrl(back);
      const res = await sendEmail({
        to: [to],
        replyTo: email,
        subject: `Configurateur 3D — ${club} (${design.designId})`,
        text: [
          `Nouvelle demande de devis depuis le configurateur 3D.`,
          ``,
          `Club : ${club}`,
          `Contact : ${contactName} — ${email}${phone ? ` — ${phone}` : ""}`,
          `Quantité estimée : ${quantity}`,
          comment ? `Commentaire : ${comment}` : "",
          ``,
          ...summary,
          ``,
          `Design complet et logos : espace admin → Demandes.`,
        ].join("\n"),
        attachments: [
          ...(f ? [{ filename: `${design.designId}-face.${f.ext}`, content: f.buffer }] : []),
          ...(b ? [{ filename: `${design.designId}-dos.${b.ext}`, content: b.buffer }] : []),
        ],
      });
      notified = res.ok;
      if (!res.ok) console.error("[configurateur] notification email :", res.error);
    } catch (err) {
      console.error("[configurateur] notification email impossible :", err);
    }
  }

  return { ok: true, reference: design.designId, notified };
}
