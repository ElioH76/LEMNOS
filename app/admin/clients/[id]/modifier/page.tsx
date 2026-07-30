import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/admin/ClientForm";
import { getClient } from "@/lib/billing/store";
import { isBlobConfigured } from "@/lib/blob/store";

export const dynamic = "force-dynamic";

export default async function ModifierClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/admin/clients/${client.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour à la fiche
        </Link>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">Modifier {client.club}</h1>
        <ClientForm mode="edit" initial={client} blobEnabled={isBlobConfigured()} />
      </main>
    </>
  );
}
