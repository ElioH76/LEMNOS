"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, Mail, Pencil, Phone, Search, Trash2 } from "lucide-react";
import { deleteClientAction } from "@/app/actions/clients";
import { formatEuro } from "@/lib/billing/calc";
import { blobDisplaySrc } from "@/lib/blob/url";
import type { Client } from "@/lib/billing/types";

export interface ClientRow {
  client: Client;
  invoiceCount: number;
  ca: number;
}

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ client }) =>
      `${client.club} ${client.contact} ${client.email} ${client.city}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const confirmDelete = (club: string) => (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer la fiche client « ${club} » ? Les factures ne sont pas supprimées.`))
      e.preventDefault();
  };

  return (
    <div>
      <label className="flex max-w-md items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-green">
        <Search size={16} className="flex-none text-ash" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client…"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-ash"
        />
      </label>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
          <thead className="border-b border-line bg-paper text-[11px] uppercase tracking-caps text-ash">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Client</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-right font-semibold">Factures</th>
              <th className="px-4 py-3 text-right font-semibold">CA encaissé</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[14px] text-ash">
                  Aucun client.
                </td>
              </tr>
            ) : (
              filtered.map(({ client, invoiceCount, ca }) => (
                <tr key={client.id} className="border-b border-line-soft last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ClientAvatar client={client} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="font-semibold hover:text-green"
                        >
                          {client.club}
                        </Link>
                        {(client.city || client.country) && (
                          <div className="text-[11px] text-ash">
                            {[client.city, client.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate">{client.contact || "—"}</div>
                    <div className="flex flex-wrap gap-x-3 text-[11px] text-ash">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} /> {client.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{invoiceCount}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatEuro(ca)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconLink href={`/admin/clients/${client.id}`} title="Voir">
                        <Eye size={15} />
                      </IconLink>
                      <IconLink href={`/admin/clients/${client.id}/modifier`} title="Modifier">
                        <Pencil size={15} />
                      </IconLink>
                      <form action={deleteClientAction} onSubmit={confirmDelete(client.club)}>
                        <input type="hidden" name="id" value={client.id} />
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
        {filtered.length} client{filtered.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}

export function ClientAvatar({ client, size = 34 }: { client: Client; size?: number }) {
  const initials = client.club
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex flex-none items-center justify-center overflow-hidden rounded-md bg-paper text-[12px] font-bold text-green"
      style={{ width: size, height: size }}
    >
      {client.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={blobDisplaySrc(client.logoUrl)} alt="" className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
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
