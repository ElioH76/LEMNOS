import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SupplierForm } from "@/components/admin/SupplierForm";
import { getSupplier } from "@/lib/suppliers/store";

export const dynamic = "force-dynamic";

export default async function ModifierFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/admin/fournisseurs/${supplier.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour à la fiche
        </Link>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">Modifier {supplier.name}</h1>
        <SupplierForm mode="edit" initial={supplier} />
      </main>
    </>
  );
}
