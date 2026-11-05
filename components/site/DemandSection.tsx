"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { submitDemand } from "@/app/actions/demands";
import { isValidContact } from "@/lib/demands/contact";
import { Eyebrow, Shell } from "./Shell";

const FIELD =
  "w-full border bg-transparent px-4 py-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-mute-ink focus:border-white";
const FIELD_OK = "border-field-line";
const FIELD_ERR = "border-danger-light";

type Field = "structure" | "sport" | "quantity" | "deadline" | "contact";
type Status = "idle" | "sending" | "success" | "error";

const REQUIRED: Partial<Record<Field, string>> = {
  structure: "Indiquez le nom du club.",
  sport: "Indiquez le sport.",
};

/** Section « La vôtre. » — CTA et formulaire court de demande de maillot. */
export function DemandSection() {
  const [values, setValues] = useState<Record<Field, string>>({
    structure: "",
    sport: "",
    quantity: "",
    deadline: "",
    contact: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const next: Partial<Record<Field, string>> = {};
    for (const [field, message] of Object.entries(REQUIRED) as [Field, string][])
      if (!values[field].trim()) next[field] = message;
    if (!isValidContact(values.contact))
      next.contact = "Indiquez un e-mail ou un numéro de téléphone valide.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    const result = await submitDemand(values);
    if (result.ok) setStatus("success");
    else {
      setStatus("error");
      setFormError(result.error ?? "Une erreur est survenue.");
    }
  };

  const input = (field: Field, placeholder: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`demand-${field}`} className="sr-only">
        {placeholder}
      </label>
      <input
        id={`demand-${field}`}
        value={values[field]}
        onChange={set(field)}
        placeholder={placeholder}
        aria-invalid={!!errors[field]}
        aria-describedby={errors[field] ? `demand-${field}-error` : undefined}
        className={cn(FIELD, errors[field] ? FIELD_ERR : FIELD_OK)}
        {...props}
      />
      {errors[field] && (
        <p id={`demand-${field}-error`} className="text-[12.5px] font-medium text-danger-light">
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <section id="demande" className="scroll-mt-20">
      <Shell className="grid grid-cols-1 items-center gap-12 py-20 md:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>Prochaine collection</Eyebrow>
          <h2 className="font-serif text-[40px] font-bold leading-none text-white md:text-[52px]">La vôtre.</h2>
          <p className="max-w-[44ch] text-[16px] leading-[1.6] text-fog">
            Un seul interlocuteur, du croquis à la livraison. Vous validez le design, le prototype,
            puis la production.
          </p>
        </div>

        <div className="border border-night-line bg-ink p-6 md:p-8">
          {status === "success" ? (
            <div role="status" className="flex flex-col items-start gap-4 py-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-sharp bg-green text-white">
                <Check size={22} strokeWidth={2.5} aria-hidden />
              </span>
              <p className="font-serif text-[26px] font-bold leading-tight text-white">Demande bien reçue.</p>
              <p className="text-[15px] leading-[1.6] text-fog">Merci, on revient vers vous sous 48 h.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {input("structure", "Nom du club", { autoComplete: "organization" })}
                {input("sport", "Sport")}
                {input("quantity", "Nombre de pièces", { inputMode: "numeric" })}
                {input("deadline", "Pour quand ?")}
              </div>
              {input("contact", "E-mail ou téléphone", { autoComplete: "email" })}

              {formError && (
                <p role="alert" className="border border-danger-light/40 px-4 py-3 text-[13px] font-medium text-danger-light">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-1 w-full rounded-sharp bg-green p-4 text-[15px] font-bold text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Envoi…" : "Envoyer ma demande"}
              </button>
            </form>
          )}
        </div>
      </Shell>
    </section>
  );
}
