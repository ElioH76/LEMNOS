"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { deleteOrderAction } from "@/app/actions/orders";

export function OrderActionsBar({ id, number }: { id: string; number: string }) {
  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer définitivement la commande ${number} ?`)) e.preventDefault();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/commandes/${id}/modifier`}
        className="inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
      >
        <Pencil size={15} /> Modifier
      </Link>
      <form action={deleteOrderAction} onSubmit={confirmDelete}>
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
