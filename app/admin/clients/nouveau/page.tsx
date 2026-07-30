import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/admin/ClientForm";
import { isBlobConfigured } from "@/lib/blob/store";

export const dynamic = "force-dynamic";

export default function NouveauClientPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/admin/clients"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour aux clients
        </Link>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">Nouveau client</h1>
        <ClientForm mode="create" blobEnabled={isBlobConfigured()} />
      </main>
    </>
  );
}
