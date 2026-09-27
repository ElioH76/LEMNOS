import { notFound, redirect } from "next/navigation";
import { DocumentForm } from "@/components/admin/commercial/DocumentForm";
import { FormPage } from "@/components/admin/commercial/FormPage";
import { isEditable } from "@/lib/billing/calc";
import { formDefaults } from "@/lib/billing/settings";
import { isBlobConfigured } from "@/lib/blob/store";
import { listImageMediaOptions } from "@/lib/media/store";
import { getDocument, getSettings, listClients, listProductTemplates } from "@/lib/billing/store";
import { documentTitle } from "@/lib/billing/types";

export const dynamic = "force-dynamic";

export default async function ModifierFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, clients, templates, settings, media] = await Promise.all([getDocument(id), listClients({ includeArchived: true }), listProductTemplates(), getSettings(), listImageMediaOptions()]);
  if (!doc || doc.type === "devis") notFound();
  // Verrou : une facture émise ne se modifie jamais (avoir + rectificative).
  if (!isEditable(doc)) redirect(`/admin/factures/${id}`);
  return (
    <FormPage back={`/admin/factures/${id}`} backLabel="Retour au document" title={`Modifier — ${documentTitle(doc)} (brouillon)`}>
      <DocumentForm type="facture" initial={doc} clients={clients} templates={templates} defaults={formDefaults(settings)} media={media} blobEnabled={isBlobConfigured()} />
    </FormPage>
  );
}
