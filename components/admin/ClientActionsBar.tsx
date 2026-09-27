"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, FilePlus, FileSignature, PackagePlus, Pencil, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { archiveClientAction, deleteClientAction } from "@/app/actions/clients";

export function ClientActionsBar({
  id,
  club,
  archived,
  documentCount,
}: {
  id: string;
  club: string;
  archived: boolean;
  documentCount: number;
}) {
  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer définitivement la fiche « ${club} » ?`)) e.preventDefault();
  };

  const btn =
    "inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green";
  const primary =
    "inline-flex items-center gap-2 rounded-sharp bg-green px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-green-dark";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!archived && (
        <>
          <Link href={`/admin/devis/nouveau?client=${id}`} className={primary}>
            <FileSignature size={15} /> Nouveau devis
          </Link>
          <Link href={`/admin/factures/nouvelle?client=${id}`} className={btn}>
            <FilePlus size={15} /> Nouvelle facture
          </Link>
          <Link href={`/admin/commandes/nouvelle?client=${id}`} className={btn}>
            <PackagePlus size={15} /> Nouvelle commande
          </Link>
        </>
      )}
      <Link href={`/admin/clients/${id}/modifier`} className={btn}>
        <Pencil size={15} /> Modifier
      </Link>
      <form action={archiveClientAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="archived" value={archived ? "false" : "true"} />
        <button type="submit" className={btn}>
          {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />} {archived ? "Désarchiver" : "Archiver"}
        </button>
      </form>
      {documentCount === 0 && (
        <form action={deleteClientAction} onSubmit={confirmDelete} className="ml-auto">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-sharp px-3.5 py-2.5 text-[13px] font-semibold text-ash transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={15} /> Supprimer
          </button>
        </form>
      )}
    </div>
  );
}
