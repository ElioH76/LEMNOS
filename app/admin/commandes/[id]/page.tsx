import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  History,
  Image as ImageIcon,
  ListChecks,
  Package,
  Shirt,
  User,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MediaCard } from "@/components/admin/MediaCard";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { OrderActionsBar } from "@/components/admin/OrderActionsBar";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderStatusControls } from "@/components/admin/OrderStatusControls";
import { OrderStepper } from "@/components/admin/OrderStepper";
import { OrderTimeline } from "@/components/admin/OrderTimeline";
import { computeTotals, formatEuro } from "@/lib/billing/calc";
import { isBlobConfigured } from "@/lib/blob/store";
import { getClient, getInvoice } from "@/lib/billing/store";
import { mediaForOrder } from "@/lib/media/store";
import { getOrder } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

function frDate(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export default async function CommandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const [client, invoice, media] = await Promise.all([
    order.clientId ? getClient(order.clientId) : Promise.resolve(null),
    order.invoiceId ? getInvoice(order.invoiceId) : Promise.resolve(null),
    mediaForOrder(order.id),
  ]);

  return (
    <>
      <AdminHeader active="commandes" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/admin/commandes"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour aux commandes
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-[24px] font-extrabold tracking-tight">{order.number}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-[15px] font-semibold text-slate">{order.title}</p>
          </div>
          <OrderActionsBar id={order.id} number={order.number} />
        </div>

        {/* Frise d'avancement */}
        <div className="rounded-2xl border border-line bg-white px-4 py-6 md:px-8">
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <OrderStepper status={order.status} events={order.events} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Colonne principale */}
          <div className="flex flex-col gap-6">
            <Card title="Détails" icon={ListChecks}>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
                <Row icon={User} label="Client">
                  {client ? (
                    <Link href={`/admin/clients/${client.id}`} className="text-green hover:underline">
                      {order.clientName}
                    </Link>
                  ) : (
                    order.clientName || "—"
                  )}
                </Row>
                <Row icon={Shirt} label="Sport">
                  {order.sport || "—"}
                </Row>
                <Row icon={Package} label="Quantité">
                  {order.quantity || "—"}
                </Row>
                <Row icon={CalendarClock} label="Livraison prévue">
                  {frDate(order.dueDate)}
                </Row>
                <Row icon={FileText} label="Facture liée">
                  {invoice ? (
                    <Link href={`/admin/factures/${invoice.id}`} className="text-green hover:underline">
                      {invoice.number} · {formatEuro(computeTotals(invoice).totalTtc)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Row>
              </dl>

              {order.notes && (
                <div className="mt-5 border-t border-line-soft pt-4">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-caps text-ash">
                    Notes internes
                  </div>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-[1.6] text-slate">{order.notes}</p>
                </div>
              )}
            </Card>

            <Card title="Designs & médias" icon={ImageIcon}>
              {isBlobConfigured() && (
                <div className="mb-4">
                  <MediaUploader
                    fixedOrderId={order.id}
                    fixedClientId={order.clientId ?? undefined}
                    fixedClientName={order.clientName}
                    defaultKind="design"
                  />
                </div>
              )}
              {media.length === 0 ? (
                <p className="py-3 text-center text-[13.5px] text-ash">Aucun média pour cette commande.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {media.map((asset) => (
                    <MediaCard key={asset.id} asset={asset} showClient={false} />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Timeline" icon={History}>
              <OrderTimeline events={order.events} />
            </Card>
          </div>

          {/* Colonne pilotage */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card title="Faire avancer" icon={ListChecks}>
              <OrderStatusControls id={order.id} status={order.status} />
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold tracking-tight">
        <Icon size={16} className="text-green" aria-hidden />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 flex-none text-ash" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-caps text-ash">{label}</dt>
        <dd className="mt-0.5 text-[13.5px] text-ink">{children}</dd>
      </div>
    </div>
  );
}
