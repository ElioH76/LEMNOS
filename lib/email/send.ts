import "server-only";

/**
 * Envoi d'emails transactionnels via l'API HTTP de Resend (aucune dépendance :
 * un simple fetch). Activé par deux variables d'environnement :
 *
 *   RESEND_API_KEY   clé API Resend
 *   EMAIL_FROM       expéditeur vérifié, ex. « LEMNOS <contact@lemnos-sportswear.fr> »
 *
 * Sans configuration, l'admin propose un repli (ouverture du logiciel de
 * messagerie + téléchargement du PDF), sans rien bloquer.
 */

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export interface OutgoingEmail {
  to: string[];
  cc?: string[];
  replyTo?: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendEmail(mail: OutgoingEmail): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isEmailConfigured()) return { ok: false, error: "L'envoi d'emails n'est pas configuré." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: mail.to,
        cc: mail.cc?.length ? mail.cc : undefined,
        reply_to: mail.replyTo || undefined,
        subject: mail.subject,
        text: mail.text,
        attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: body.message || `Erreur d'envoi (${res.status}).` };
    return { ok: true, id: body.id ?? "" };
  } catch (err) {
    console.error("[email] envoi impossible :", err);
    return { ok: false, error: "Le service d'envoi est injoignable. Réessayez." };
  }
}
