"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpDown, Copy, Download, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { deleteInvoiceAction, duplicateInvoiceAction } from "@/app/actions/billing";
import { computeTotals, formatEuro } from "@/lib/billing/calc";
import { INVOICE_STATUSES, INVOICE_STATUS_LABEL, type Invoice, type InvoiceStatus } from "@/lib/billing/types";
import { cn } from "@/lib/cn";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

type SortKey = "number" | "client" | "date" | "dueDate" | "total" | "status";
const PAGE_SIZE = 12;

function frDate(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"tous" | InvoiceStatus>("tous");
  const [client, setClient] = useState("tous");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "number", dir: -1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(
    () =>
      invoices.map((inv) => ({
        inv,
        total: computeTotals(inv).totalTtc,
      })),
    [invoices],
  );

  const clients = useMemo(
    () => Array.from(new Set(invoices.map((i) => i.client.club).filter(Boolean))).sort(),
    [invoices],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = rows.filter(({ inv }) => {
      if (status !== "tous" && inv.status !== status) return false;
      if (client !== "tous" && inv.client.club !== client) return false;
      if (from && inv.date < from) return false;
      if (to && inv.date > to) return false;
      if (q) {
        const hay = `${inv.number} ${inv.client.club} ${inv.internalRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const dir = sort.dir;
      switch (sort.key) {
        case "client":
          return a.inv.client.club.localeCompare(b.inv.client.club) * dir;
        case "date":
          return a.inv.date.localeCompare(b.inv.date) * dir;
        case "dueDate":
          return (a.inv.dueDate || "").localeCompare(b.inv.dueDate || "") * dir;
        case "total":
          return (a.total - b.total) * dir;
        case "status":
          return a.inv.status.localeCompare(b.inv.status) * dir;
        default:
          return a.inv.number.localeCompare(b.inv.number) * dir;
      }
    });
    return result;
  }, [rows, search, status, client, from, to, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

  const confirmDelete = (number: string) => (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer définitivement la facture ${number} ?`)) e.preventDefault();
  };

  const Th = ({ label, k, className }: { label: string; k?: SortKey; className?: string }) => (
    <th className={cn("px-4 py-3 text-left font-semibold", className)}>
      {k ? (
        <button
          onClick={() => toggleSort(k)}
          className="inline-flex items-center gap-1 transition-colors hover:text-ink"
        >
          {label}
          <ArrowUpDown size={12} className={cn(sort.key === k ? "text-green" : "text-line")} />
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-green">
          <Search size={16} className="flex-none text-ash" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Rechercher un numéro, un client…"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ash"
          />
        </label>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(0);
          }}
          className="rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px]"
        >
          <option value="tous">Tous les statuts</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INVOICE_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <select
          value={client}
          onChange={(e) => {
            setClient(e.target.value);
            setPage(0);
          }}
          className="max-w-[180px] rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px]"
        >
          <option value="tous">Tous les clients</option>
          {clients.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-[13px] text-ash">
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            aria-label="Date de début"
            className="rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink"
          />
          <span>→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            aria-label="Date de fin"
            className="rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[860px] border-collapse text-[13.5px]">
          <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-caps text-ash">
            <tr>
              <Th label="Numéro" k="number" />
              <Th label="Client" k="client" />
              <Th label="Date" k="date" />
              <Th label="Échéance" k="dueDate" />
              <Th label="Total TTC" k="total" className="text-right" />
              <Th label="Statut" k="status" />
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[14px] text-ash">
                  Aucune facture.
                </td>
              </tr>
            ) : (
              pageRows.map(({ inv, total }) => (
                <tr key={inv.id} className="border-b border-line-soft last:border-0 hover:bg-paper/60">
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold tracking-tight">
                    {inv.number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{inv.client.club || "—"}</div>
                    {inv.internalRef && (
                      <div className="text-[11px] text-ash">réf. {inv.internalRef}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate">{frDate(inv.date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate">{frDate(inv.dueDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                    {formatEuro(total)}
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconLink href={`/admin/factures/${inv.id}`} title="Voir">
                        <Eye size={15} />
                      </IconLink>
                      <IconLink href={`/admin/factures/${inv.id}/modifier`} title="Modifier">
                        <Pencil size={15} />
                      </IconLink>
                      <a
                        href={`/admin/factures/${inv.id}/pdf`}
                        title="Télécharger le PDF"
                        className="flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors hover:bg-paper hover:text-ink"
                      >
                        <Download size={15} />
                      </a>
                      <form action={duplicateInvoiceAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <IconButton title="Dupliquer">
                          <Copy size={15} />
                        </IconButton>
                      </form>
                      <form action={deleteInvoiceAction} onSubmit={confirmDelete(inv.number)}>
                        <input type="hidden" name="id" value={inv.id} />
                        <IconButton title="Supprimer" danger>
                          <Trash2 size={15} />
                        </IconButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-[13px] text-ash">
        <span>
          {filtered.length} facture{filtered.length > 1 ? "s" : ""}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="rounded-sharp border border-line px-3 py-1.5 font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={current >= pageCount - 1}
              className="rounded-sharp border border-line px-3 py-1.5 font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IconLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors hover:bg-paper hover:text-ink"
    >
      {children}
    </Link>
  );
}

function IconButton({
  title,
  danger,
  children,
}: {
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors",
        danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-paper hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
