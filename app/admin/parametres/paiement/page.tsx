import { BankForm } from "@/components/admin/commercial/SettingsForms";
import { getSettings } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function PaiementPage() {
  const settings = await getSettings();
  return <BankForm initial={settings.bank} />;
}
