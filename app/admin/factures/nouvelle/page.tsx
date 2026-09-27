import { DocumentForm } from "@/components/admin/commercial/DocumentForm";
import { FormPage } from "@/components/admin/commercial/FormPage";
import { formDefaults } from "@/lib/billing/settings";
import { getSettings, listClients, listProductTemplates } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function NouvelleFacturePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const [clients, templates, settings] = await Promise.all([listClients(), listProductTemplates(), getSettings()]);
  return (
    <FormPage back="/admin/factures" backLabel="Retour aux factures" title="Nouvelle facture">
      <DocumentForm type="facture" clients={clients} templates={templates} defaults={formDefaults(settings)} preselectClientId={client} />
    </FormPage>
  );
}
