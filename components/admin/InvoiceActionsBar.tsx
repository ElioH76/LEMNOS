"use client";

import Link from "next/link";
import { Copy, Download, Mail, Pencil, Trash2 } from "lucide-react";
import { deleteInvoiceAction, duplicateInvoiceAction } from "@/app/actions/billing";
import type { FormEvent } from "react";

export function InvoiceActionsBar({ id, number }: { id: string; number: string }) {
  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer définitivement la facture ${number} ?`)) e.preventDefault();
  };

  const btn =
    "inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/factures/${id}/modifier`} className={btn}>
        <Pencil size={15} /> Modifier
      </Link>
      <a href={`/admin/factures/${id}/pdf`} className={btn}>
        <Download size={15} /> Télécharger le PDF
      </a>
      <form action={duplicateInvoiceAction}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={btn}>
          <Copy size={15} /> Dupliquer
        </button>
      </form>
      <button
        type="button"
        disabled
        title="Envoi par email — bientôt disponible"
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-ash opacity-60"
      >
        <Mail size={15} /> Envoyer par email
      </button>
      <form action={deleteInvoiceAction} onSubmit={confirmDelete} className="ml-auto">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-sharp px-3.5 py-2.5 text-[13px] font-semibold text-ash transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 size={15} /> Supprimer
        </button>
      </form>
    </div>
  );
}
