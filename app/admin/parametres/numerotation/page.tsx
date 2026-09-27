import { NumberingForm } from "@/components/admin/commercial/SettingsForms";
import { currentSequence, getSettings } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function NumerotationPage() {
  const settings = await getSettings();
  const n = settings.numbering;
  const year = new Date().getFullYear();
  const [devis, facture, avoir] = await Promise.all([
    currentSequence(n.quotePrefix, year),
    currentSequence(n.invoicePrefix, year),
    currentSequence(n.creditPrefix, year),
  ]);
  return <NumberingForm initial={n} next={{ devis: devis + 1, facture: facture + 1, avoir: avoir + 1 }} />;
}
