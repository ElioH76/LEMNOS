"use client";

import { Button } from "@/components/ui/Button";
import type { Contact } from "@/lib/types";
import { useDashboard } from "./DashboardProvider";

export function ContactCard({ contact }: { contact: Contact }) {
  const { openMessaging } = useDashboard();

  return (
    <div className="rounded-2xl bg-ink p-6 text-white">
      <div className="text-[11px] font-semibold uppercase tracking-caps text-mute-ink">
        Votre contact dédié
      </div>

      <div className="mt-5 flex items-center gap-3.5">
        <div className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-lg bg-[linear-gradient(145deg,rgb(var(--color-green-light)),rgb(var(--color-green)),rgb(var(--color-green-dark)))] text-[18px] font-extrabold text-white">
          {contact.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-bold">{contact.name}</div>
          <div className="text-[11px] text-mute-ink">{contact.role}</div>
        </div>
      </div>

      <p className="mb-5 mt-5 text-[14px] leading-[1.55] text-fog">{contact.blurb}</p>

      <Button
        variant="light"
        className="w-full"
        onClick={() => openMessaging(`Message à ${contact.name}`)}
      >
        Envoyer un message
      </Button>
    </div>
  );
}
