import { CompanyForm } from "@/components/admin/commercial/SettingsForms";
import { isBlobConfigured } from "@/lib/blob/store";
import { getSettings } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function EntreprisePage() {
  const settings = await getSettings();
  return <CompanyForm initial={settings.company} blobEnabled={isBlobConfigured()} />;
}
