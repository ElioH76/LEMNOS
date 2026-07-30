"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { deleteSupplierAction } from "@/app/actions/suppliers";

export function SupplierActionsBar({ id, name }: { id: string; name: string }) {
  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer le fournisseur « ${name} » ?`)) e.preventDefault();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/fournisseurs/${id}/modifier`}
        className="inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
      >
        <Pencil size={15} /> Modifier
      </Link>
      <form action={deleteSupplierAction} onSubmit={confirmDelete}>
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
