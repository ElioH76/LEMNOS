import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";

/**
 * Point d'entrée du client upload Vercel Blob. Le navigateur envoie le fichier
 * en direct vers Blob ; cette route se contente de délivrer un jeton d'upload
 * court, après avoir vérifié la session admin et restreint types + taille.
 *
 * Le jeton Blob (`BLOB_READ_WRITE_TOKEN`) reste côté serveur, jamais exposé.
 */

const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Stockage de fichiers non configuré." }, { status: 501 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const store = await cookies();
        if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) {
          throw new Error("Non autorisé.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      // Webhook appelé par Vercel une fois l'upload terminé (prod/preview). En
      // local il n'est pas joignable : l'URL est déjà renvoyée au client par
      // la fonction `upload()`, donc rien de bloquant ici.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
