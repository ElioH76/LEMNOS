"use client";

import Link from "next/link";
import { FilePlus, PackagePlus, Pencil, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { deleteClientAction } from "@/app/actions/clients";

export function ClientActionsBar({ id, club }: { id: string; club: string }) {
  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer la fiche « ${club} » ? Les factures ne sont pas supprimées.`))
      e.preventDefault();
  };

  const btn =
    "inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/commandes/nouvelle?client=${id}`} className={btn}>
        <PackagePlus size={15} /> Nouvelle commande
      </Link>
      <Link href={`/admin/factures/nouvelle?client=${id}`} className={btn}>
        <FilePlus size={15} /> Nouvelle facture
      </Link>
      <Link href={`/admin/clients/${id}/modifier`} className={btn}>
        <Pencil size={15} /> Modifier
      </Link>
      <form action={deleteClientAction} onSubmit={confirmDelete} className="ml-auto">
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
