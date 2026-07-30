import { get } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { isVercelBlobUrl } from "@/lib/blob/url";

/**
 * Proxy de lecture pour les blobs **privés**. Le store étant en accès privé, les
 * URL Blob ne sont pas publiques : cette route vérifie la session admin puis
 * streame le fichier depuis le store. On restreint aux hôtes Blob Vercel pour
 * éviter tout usage en proxy ouvert (SSRF).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) {
    return new NextResponse("Non autorisé.", { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url") ?? "";
  if (!isVercelBlobUrl(url)) {
    return new NextResponse("URL invalide.", { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Stockage non configuré.", { status: 501 });
  }

  try {
    const result = await get(url, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new NextResponse("Introuvable.", { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[blob] lecture proxy a échoué :", err);
    return new NextResponse("Introuvable.", { status: 404 });
  }
}
