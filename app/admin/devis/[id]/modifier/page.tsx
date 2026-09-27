import { notFound, redirect } from "next/navigation";
import { DocumentForm } from "@/components/admin/commercial/DocumentForm";
import { FormPage } from "@/components/admin/commercial/FormPage";
import { isEditable } from "@/lib/billing/calc";
import { formDefaults } from "@/lib/billing/settings";
import { getDocument, getSettings, listClients, listProductTemplates } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function ModifierDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, clients, templates, settings] = await Promise.all([getDocument(id), listClients({ includeArchived: true }), listProductTemplates(), getSettings()]);
  if (!doc || doc.type !== "devis") notFound();
  // Verrou : un devis envoyé / accepté ne se modifie pas (nouvelle version).
  if (!isEditable(doc)) redirect(`/admin/devis/${id}`);
  return (
    <FormPage back={`/admin/devis/${id}`} backLabel="Retour au devis" title={`Modifier ${doc.number}`}>
      <DocumentForm type="devis" initial={doc} clients={clients} templates={templates} defaults={formDefaults(settings)} />
    </FormPage>
  );
}
