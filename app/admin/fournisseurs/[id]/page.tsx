import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Mail, MapPin, Package, Phone, ScrollText, User } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SupplierActionsBar } from "@/components/admin/SupplierActionsBar";
import { SupplierCategoryBadge } from "@/components/admin/SupplierCategoryBadge";
import { cn } from "@/lib/cn";
import { getSupplier } from "@/lib/suppliers/store";

export const dynamic = "force-dynamic";

export default async function FournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const websiteHref = supplier.website
    ? supplier.website.startsWith("http")
      ? supplier.website
      : `https://${supplier.website}`
    : undefined;

  return (
    <>
      <AdminHeader active="fournisseurs" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/admin/fournisseurs"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour aux fournisseurs
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-extrabold tracking-tight">{supplier.name}</h1>
            <SupplierCategoryBadge category={supplier.category} />
          </div>
          <SupplierActionsBar id={supplier.id} name={supplier.name} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-6">
            <Card title="Coordonnées">
              <ul className="flex flex-col gap-2.5 text-[13.5px]">
                <InfoRow icon={User} value={supplier.contact} />
                <InfoRow icon={Mail} value={supplier.email} href={supplier.email ? `mailto:${supplier.email}` : undefined} />
                <InfoRow
                  icon={Phone}
                  value={supplier.phone}
                  href={supplier.phone ? `tel:${supplier.phone.replace(/\s+/g, "")}` : undefined}
                />
                <InfoRow icon={Globe} value={supplier.website} href={websiteHref} external />
                <InfoRow
                  icon={MapPin}
                  value={[supplier.address, [supplier.zip, supplier.city].filter(Boolean).join(" "), supplier.country]
                    .filter(Boolean)
                    .join(", ")}
                />
              </ul>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card title="Produits & prestations" icon={Package}>
              {supplier.products.length === 0 ? (
                <p className="py-2 text-[13.5px] text-ash">Aucun produit renseigné.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {supplier.products.map((p) => (
                    <span key={p} className="rounded-pill border border-line px-3 py-1 text-[12.5px] text-slate">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {supplier.notes && (
              <Card title="Notes internes" icon={ScrollText}>
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.6] text-slate">{supplier.notes}</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold tracking-tight">
        {Icon && <Icon size={14} className="text-green" aria-hidden />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  value,
  href,
  external,
}: {
  icon: typeof User;
  value: string;
  href?: string;
  external?: boolean;
}) {
  if (!value) return null;
  const content = (
    <span className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 flex-none text-ash" aria-hidden />
      <span className={cn(href ? "break-all text-green" : "text-slate")}>{value}</span>
    </span>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          className="hover:underline"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}
