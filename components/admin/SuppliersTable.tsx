"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, Globe, Mail, Pencil, Phone, Search, Trash2 } from "lucide-react";
import { deleteSupplierAction } from "@/app/actions/suppliers";
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABEL,
  type Supplier,
  type SupplierCategory,
} from "@/lib/suppliers/types";
import { SupplierCategoryBadge } from "./SupplierCategoryBadge";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"toutes" | SupplierCategory>("toutes");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (category !== "toutes" && s.category !== category) return false;
      if (!q) return true;
      return `${s.name} ${s.contact} ${s.email} ${s.city} ${s.products.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [suppliers, search, category]);

  const confirmDelete = (name: string) => (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer le fournisseur « ${name} » ?`)) e.preventDefault();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-green">
          <Search size={16} className="flex-none text-ash" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur, un produit…"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ash"
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          className="rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px]"
        >
          <option value="toutes">Toutes catégories</option>
          {SUPPLIER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SUPPLIER_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-[13.5px]">
          <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-caps text-ash">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Fournisseur</th>
              <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">Produits</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[14px] text-ash">
                  Aucun fournisseur.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-line-soft last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/fournisseurs/${s.id}`} className="font-semibold hover:text-green">
                      {s.name}
                    </Link>
                    {(s.city || s.country) && (
                      <div className="text-[11px] text-ash">
                        {[s.city, s.country].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SupplierCategoryBadge category={s.category} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate">{s.contact || "—"}</div>
                    <div className="flex flex-wrap gap-x-3 text-[11px] text-ash">
                      {s.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {s.email}
                        </span>
                      )}
                      {s.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} /> {s.phone}
                        </span>
                      )}
                      {s.website && (
                        <span className="flex items-center gap-1">
                          <Globe size={11} /> site
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.products.length === 0 ? (
                      <span className="text-ash">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {s.products.slice(0, 3).map((p) => (
                          <span key={p} className="rounded-pill bg-paper px-2 py-0.5 text-[11px] text-slate">
                            {p}
                          </span>
                        ))}
                        {s.products.length > 3 && (
                          <span className="text-[11px] text-ash">+{s.products.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconLink href={`/admin/fournisseurs/${s.id}`} title="Voir">
                        <Eye size={15} />
                      </IconLink>
                      <IconLink href={`/admin/fournisseurs/${s.id}/modifier`} title="Modifier">
                        <Pencil size={15} />
                      </IconLink>
                      <form action={deleteSupplierAction} onSubmit={confirmDelete(s.name)}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          title="Supprimer"
                          className="flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[13px] text-ash">
        {filtered.length} fournisseur{filtered.length > 1 ? "s" : ""}
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
