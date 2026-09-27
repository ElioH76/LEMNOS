"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Download, Eye, FilePlus2, Search } from "lucide-react";
import { generateDepositAction, generateFinalAction } from "@/app/actions/commercial";
import { formatEuro, frDate, invoiceStatus, quoteStatus } from "@/lib/billing/calc";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABEL,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABEL,
  displayNumber,
  type CommercialDocument,
} from "@/lib/billing/types";
import { cn } from "@/lib/cn";
import { DocKindBadge, DocStatusBadge } from "./StatusBadge";

export interface DocumentRow {
  doc: CommercialDocument;
  /** Montant affiché : total du devis ou montant facturé. */
  amount: number;
  /** Reste à encaisser (factures). */
  outstanding: number;
  /** Prochaine facture à générer depuis un devis accepté. */
  next: "acompte" | "finale" | null;
  quoteNumber: string | null;
}

type Filter = "tous" | string;

export function DocumentsTable({ rows, kind }: { rows: DocumentRow[]; kind: "devis" | "factures" }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Filter>("tous");
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isQuotes = kind === "devis";
  const base = isQuotes ? "/admin/devis" : "/admin/factures";

  const statusOf = (d: CommercialDocument): string =>
    d.type === "devis" ? quoteStatus(d) : d.type === "avoir" ? (d.lifecycle === "brouillon" ? "brouillon" : "avoir") : invoiceStatus(d);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ doc, quoteNumber }) => {
      if (doc.archived !== showArchived) return false;
      if (status !== "tous" && statusOf(doc) !== status) return false;
      if (!q) return true;
      return `${doc.number ?? "brouillon"} ${doc.client.club} ${doc.subject} ${quoteNumber ?? ""}`.toLowerCase().includes(q);
    });
  }, [rows, search, status, showArchived]);

  const archivedCount = rows.filter((r) => r.doc.archived).length;

  const createInvoice = async (row: DocumentRow) => {
    setBusy(row.doc.id);
    setError(null);
    const res = row.next === "acompte" ? await generateDepositAction(row.doc.id) : await generateFinalAction(row.doc.id);
    setBusy(null);
    if (res.ok && res.id) router.push(`/admin/factures/${res.id}`);
    else setError(res.error ?? "Création impossible.");
  };

  const statusOptions = isQuotes
    ? QUOTE_STATUSES.map((s) => [s, QUOTE_STATUS_LABEL[s]] as const)
    : [...INVOICE_STATUSES.map((s) => [s, INVOICE_STATUS_LABEL[s]] as const), ["avoir", "Avoirs"] as const];

  const actions = (row: DocumentRow, compact = false) => (
    <div className={cn("flex items-center gap-1", compact ? "flex-wrap" : "justify-end")}>
      <Link href={`${base}/${row.doc.id}`} className={ACTION} title="Voir">
        <Eye size={15} /> <span className={compact ? "" : "sr-only"}>Voir</span>
      </Link>
      <a href={`/admin/documents/${row.doc.id}/pdf`} className={ACTION} title="Télécharger le PDF">
        <Download size={15} /> <span className={compact ? "" : "sr-only"}>PDF</span>
      </a>
      {row.next && (
        <button type="button" onClick={() => createInvoice(row)} disabled={busy === row.doc.id} className={cn(ACTION, "text-green")} title="Créer la facture">
          <FilePlus2 size={15} />
          <span>{busy === row.doc.id ? "…" : row.next === "acompte" ? "Facture d'acompte" : "Facture finale"}</span>
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-green">
          <Search size={16} className="flex-none text-ash" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numéro, client, objet…"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ash"
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px]">
          <option value="tous">Tous les statuts</option>
          {statusOptions.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-field border-[1.5px] px-3 py-2.5 text-[13px] font-semibold transition-colors",
            showArchived ? "border-green bg-green-soft text-green" : "border-line bg-white text-slate hover:border-green",
          )}
        >
          <Archive size={15} /> Archives{archivedCount ? ` (${archivedCount})` : ""}
        </button>
      </div>

      {error && <p className="mt-3 rounded-field border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{error}</p>}

      {/* Tableau — tablette et ordinateur */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
        <table className="w-full border-collapse text-[13.5px]">
          <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-caps text-ash">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Numéro</th>
              <th className="px-4 py-3 text-left font-semibold">Client</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">{isQuotes ? "Validité" : "Échéance"}</th>
              <th className="px-4 py-3 text-right font-semibold">Montant</th>
              <th className="px-4 py-3 text-left font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[14px] text-ash">
                  {showArchived ? "Aucun document archivé." : isQuotes ? "Aucun devis." : "Aucune facture."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.doc.id} className="border-b border-line-soft last:border-0 hover:bg-paper/60">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`${base}/${row.doc.id}`} className="font-mono font-semibold tracking-tight hover:text-green">
                      {displayNumber(row.doc)}
                    </Link>
                    {!isQuotes && (
                      <div className="mt-1">
                        <DocKindBadge doc={row.doc} />
                      </div>
                    )}
                  </td>
                  <td className="max-w-[240px] px-4 py-3">
                    <div className="truncate font-semibold">{row.doc.client.club || "—"}</div>
                    <div className="truncate text-[11.5px] text-ash">{row.quoteNumber ? `Devis ${row.quoteNumber}` : row.doc.subject}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate">{frDate(row.doc.date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate">{frDate(isQuotes ? row.doc.validUntil : row.doc.dueDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    <div className="font-semibold">{formatEuro(row.amount)}</div>
                    {!isQuotes && row.outstanding > 0 && row.outstanding < row.amount && (
                      <div className="text-[11.5px] text-ash">reste {formatEuro(row.outstanding)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DocStatusBadge doc={row.doc} />
                  </td>
                  <td className="px-4 py-3">{actions(row)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cartes — mobile */}
      <div className="mt-5 flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-10 text-center text-[14px] text-ash">
            {showArchived ? "Aucun document archivé." : isQuotes ? "Aucun devis." : "Aucune facture."}
          </p>
        ) : (
          filtered.map((row) => (
            <div key={row.doc.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`${base}/${row.doc.id}`} className="font-mono text-[14px] font-bold">
                    {displayNumber(row.doc)}
                  </Link>
                  <div className="truncate text-[13.5px] font-semibold">{row.doc.client.club}</div>
                  <div className="text-[12px] text-ash">{frDate(row.doc.date)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-extrabold tabular-nums">{formatEuro(row.amount)}</div>
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    {!isQuotes && <DocKindBadge doc={row.doc} />}
                    <DocStatusBadge doc={row.doc} />
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-line-soft pt-2">{actions(row, true)}</div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[13px] text-ash">
        {filtered.length} document{filtered.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}

const ACTION =
  "inline-flex h-8 items-center gap-1.5 rounded-sharp px-2 text-[12.5px] font-semibold text-ash transition-colors hover:bg-paper hover:text-ink disabled:opacity-50";
