import { SettingsTabs } from "@/components/admin/commercial/SettingsTabs";
import { MemoryBanner } from "@/components/admin/commercial/MemoryBanner";
import { PageHeader } from "@/components/admin/commercial/ui";

export default function ParametresLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Paramètres" />
      <MemoryBanner />
      <SettingsTabs />
      <div className="mt-6">{children}</div>
    </main>
  );
}
