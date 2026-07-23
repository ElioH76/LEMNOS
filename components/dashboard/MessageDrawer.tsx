"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Contact } from "@/lib/types";
import { useDashboard } from "./DashboardProvider";

/**
 * Messagerie ouverte par « Demander un ajustement » et « Envoyer un message ».
 * L'envoi est simulé — à brancher sur l'API de messagerie.
 */
export function MessageDrawer({ contact }: { contact: Contact }) {
  const { messaging, closeMessaging } = useDashboard();
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!messaging.open) return;
    setSent(false);
    textareaRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMessaging();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [messaging.open, closeMessaging]);

  return (
    <div aria-hidden={!messaging.open} className={cn(!messaging.open && "pointer-events-none")}>
      <div
        onClick={closeMessaging}
        className={cn(
          "fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200",
          messaging.open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Messagerie"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[420px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-out",
          messaging.open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">
              Messagerie
            </div>
            <h2 className="mt-1 text-lg font-bold tracking-tight">{contact.name}</h2>
            <div className="text-[11px] text-stone">{contact.role}</div>
          </div>
          <button
            onClick={closeMessaging}
            aria-label="Fermer la messagerie"
            className="-mr-1 flex-none rounded-lg p-1.5 text-ash transition-colors hover:bg-paper hover:text-ink"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {messaging.subject && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-caps text-ash">
                Objet
              </label>
              <div className="mt-1.5 rounded-field border border-line bg-paper px-3.5 py-2.5 text-sm">
                {messaging.subject}
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col">
            <label
              htmlFor="message"
              className="text-[11px] font-semibold uppercase tracking-caps text-ash"
            >
              Votre message
            </label>
            <textarea
              id="message"
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Décrivez l'ajustement souhaité…"
              className="mt-1.5 min-h-[180px] flex-1 resize-none rounded-field border-[1.5px] border-line bg-white px-3.5 py-3 text-sm leading-[1.55] outline-none placeholder:text-ash focus:border-green"
            />
          </div>

          {sent && (
            <p className="rounded-field bg-green-soft px-3.5 py-3 text-sm text-green-dark">
              Message envoyé à {contact.name}. Réponse en général sous 2 h.
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-line px-6 py-5">
          <Button
            disabled={!draft.trim()}
            onClick={() => {
              setSent(true);
              setDraft("");
            }}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          >
            Envoyer
          </Button>
          <Button variant="outline" onClick={closeMessaging}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
