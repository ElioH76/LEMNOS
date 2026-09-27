import { TermsForm } from "@/components/admin/commercial/SettingsForms";
import { getSettings } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function ConditionsPage() {
  const settings = await getSettings();
  return <TermsForm initial={settings.terms} />;
}
