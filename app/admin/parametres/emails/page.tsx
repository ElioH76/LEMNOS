import { EmailForm } from "@/components/admin/commercial/SettingsForms";
import { getSettings } from "@/lib/billing/store";
import { isEmailConfigured } from "@/lib/email/send";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const settings = await getSettings();
  return <EmailForm initial={settings.email} configured={isEmailConfigured()} />;
}
