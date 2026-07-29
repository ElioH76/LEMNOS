import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Mail, MapPin, Package, Phone, ScrollText, User } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ClientActionsBar } from "@/components/admin/ClientActionsBar";
import { ClientAvatar } from "@/components/admin/ClientsTable";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";
import { computeTotals, formatEuro } from "@/lib/billing/calc";
import { getClient, invoicesForClient } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

function frDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const invoices = await invoicesForClient(client);
  const factures = invoices.filter((i) => i.documentType === "facture");
  const devis = invoices.filter((i) => i.documentType === "devis");
  const caEncaisse = factures
    .filter((i) => i.status === "payee")
    .reduce((s, i) => s + computeTotals(i).totalTtc, 0);

  return (
    <>
      <AdminHeader active="clients" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/admin/clients"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour aux clients
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ClientAvatar client={client} size={52} />
            <div>
              <h1 className="text-[24px] font-extrabold tracking-tight">{client.club}</h1>
              {client.contact && <div className="text-[13px] text-ash">{client.contact}</div>}
            </div>
          </div>
          <ClientActionsBar id={client.id} club={client.club} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Colonne infos */}
          <div className="flex flex-col gap-6">
            <Card title="Coordonnées">
              <ul className="flex flex-col gap-2.5 text-[13.5px]">
                <InfoRow icon={User} value={client.contact} />
                <InfoRow icon={Mail} value={client.email} href={client.email ? `mailto:${client.email}` : undefined} />
                <InfoRow icon={Phone} value={client.phone} href={client.phone ? `tel:${client.phone.replace(/\s+/g, "")}` : undefined} />
                <InfoRow
                  icon={MapPin}
                  value={[client.address, [client.zip, client.city].filter(Boolean).join(" "), client.country]
                    .filter(Boolean)
                    .join(", ")}
                />
              </ul>
            </Card>

            {client.colors.length > 0 && (
              <Card title="Couleurs">
                <div className="flex flex-wrap gap-2">
                  {client.colors.map((c) => (
                    <span key={c} className="flex items-center gap-1.5 rounded-pill border border-line py-1 pl-1.5 pr-2.5">
                      <span className="h-5 w-5 rounded-full border border-line" style={{ background: c }} />
                      <span className="font-mono text-[11px] uppercase">{c}</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Factures" value={String(factures.length)} />
              <MiniStat label="CA encaissé" value={formatEuro(caEncaisse)} green />
            </div>

            {client.notes && (
              <Card title="Notes internes" icon={ScrollText}>
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.6] text-slate">{client.notes}</p>
              </Card>
            )}
          </div>

          {/* Colonne historique */}
          <div className="flex flex-col gap-6">
            <HistorySection title="Historique des factures" icon={FileText}>
              {factures.length === 0 ? (
                <Empty>Aucune facture pour ce client.</Empty>
              ) : (
                <div className="flex flex-col divide-y divide-line-soft">
                  {factures.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/admin/factures/${inv.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-paper/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[13px] font-semibold">{inv.number}</span>
                        <span className="text-[12px] text-ash">{frDate(inv.date)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[13.5px] font-semibold tabular-nums">
                          {formatEuro(computeTotals(inv).totalTtc)}
                        </span>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </HistorySection>

            <HistorySection title="Historique des devis" icon={ScrollText}>
              {devis.length === 0 ? (
                <Empty>Aucun devis. Le module devis arrive prochainement.</Empty>
              ) : (
                <div className="flex flex-col divide-y divide-line-soft">
                  {devis.map((d) => (
                    <div key={d.id} className="py-3 text-[13.5px]">
                      {d.number}
                    </div>
                  ))}
                </div>
              )}
            </HistorySection>

            <HistorySection title="Historique des commandes" icon={Package}>
              <Empty>Le module de commandes arrive prochainement.</Empty>
            </HistorySection>
          </div>
        </div>
      </main>
    </>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold tracking-tight">
        {Icon && <Icon size={14} className="text-green" aria-hidden />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, value, href }: { icon: typeof User; value: string; href?: string }) {
  if (!value) return null;
  const content = (
    <span className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 flex-none text-ash" aria-hidden />
      <span className={href ? "text-green" : "text-slate"}>{value}</span>
    </span>
  );
  return <li>{href ? <a href={href} className="hover:underline">{content}</a> : content}</li>;
}

function MiniStat({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-caps text-ash">{label}</div>
      <div className={`mt-1 text-[18px] font-extrabold tabular-nums ${green ? "text-green" : ""}`}>{value}</div>
    </div>
  );
}

function HistorySection({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold tracking-tight">
        <Icon size={16} className="text-green" aria-hidden />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-[13.5px] text-ash">{children}</p>;
}
