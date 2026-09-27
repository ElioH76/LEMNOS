import { notFound } from "next/navigation";
import { DocumentDetail } from "@/components/admin/commercial/DocumentDetail";
import { getDocument } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc || doc.type === "devis") notFound();
  return <DocumentDetail doc={doc} />;
}
