"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Check, FileText, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { submitDemand } from "@/app/actions/demands";
import { promises, structureTypes } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";
import { MythPattern } from "./MythPattern";
import { Reveal } from "./Reveal";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";
// Variante d'erreur : bordure rouge, sans border-line pour éviter tout conflit d'ordre CSS.
const FIELD_ERR =
  "w-full rounded-field border-[1.5px] border-danger bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ash focus:border-danger";
const LABEL = "mb-2 block text-[12px] font-semibold text-ink";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  structure?: string;
  email?: string;
  brief?: string;
}

export function ProjectForm() {
  const [structure, setStructure] = useState("");
  const [type, setType] = useState(structureTypes[0]);
  const [sport, setSport] = useState("");
  const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [brief, setBrief] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles((current) => [...current, ...Array.from(list).map((f) => f.name)]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const next: Errors = {};
    if (!structure.trim()) next.structure = "Indiquez le nom de votre structure.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Une adresse email valide est requise.";
    if (brief.trim().length < 10) next.brief = "Décrivez votre projet en quelques mots.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await submitDemand({
      structure,
      type,
      sport,
      quantity,
      email,
      phone,
      brief,
      files,
    });
    setSubmitting(false);

    if (result.ok) setSent(true);
    else setFormError(result.error ?? "Une erreur est survenue.");
  };

  return (
    <section id="projet" className="relative scroll-mt-24 overflow-hidden bg-ink py-24 text-white md:py-28">
      {/* écailles antiques — motif commun à toutes les sections sombres */}
      <MythPattern
        variant="scales"
        id="scales-projet"
        className="text-white/[0.06] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_15%_0%,rgba(30,91,60,0.22),transparent_60%)]"
      />
      <Shell className="relative">
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow tone="dark">Démarrer</Eyebrow>
            <h2 className="mt-5 max-w-[15ch] text-balance text-[34px] font-extrabold leading-[1.02] tracking-tight md:text-h1">
              Racontez-nous votre projet.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.65] text-fog">
              Déposez votre design ou décrivez votre idée. On revient vers vous sous 24 h avec une
              première proposition — sans engagement.
            </p>
            <ul className="mt-10 flex flex-col gap-4">
              {promises.map((promise) => (
                <li key={promise} className="flex items-center gap-3.5">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-sm bg-green text-white"
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className="text-[15px] text-white">{promise}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="rounded-2xl border border-line bg-white p-6 md:p-9">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-md bg-green text-white">
                  <Check size={26} strokeWidth={2.5} aria-hidden />
                </span>
                <h3 className="mt-6 text-[22px] font-bold tracking-tight">Projet bien reçu</h3>
                <p className="mt-3 max-w-[34ch] text-[14px] leading-[1.6] text-stone">
                  Merci {structure.trim()} — nous revenons vers vous sous 24 h avec une première
                  proposition.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 text-[12px] font-semibold uppercase tracking-caps text-green underline underline-offset-4 transition-colors hover:text-green-dark"
                >
                  Envoyer un autre projet
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
                <div>
                  <label htmlFor="structure" className={LABEL}>
                    Nom du club / structure
                  </label>
                  <input
                    id="structure"
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    placeholder="AS Montcerf"
                    aria-invalid={!!errors.structure}
                    aria-describedby={errors.structure ? "structure-error" : undefined}
                    className={errors.structure ? FIELD_ERR : FIELD}
                  />
                  {errors.structure && (
                    <p id="structure-error" className="mt-2 text-[13px] font-medium text-danger">
                      {errors.structure}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="type" className={LABEL}>
                      Type
                    </label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className={FIELD}
                    >
                      {structureTypes.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="quantity" className={LABEL}>
                      Quantité
                    </label>
                    <input
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="~ 30 pièces"
                      className={FIELD}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className={LABEL}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@club.fr"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={errors.email ? FIELD_ERR : FIELD}
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-2 text-[13px] font-medium text-danger">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className={LABEL}>
                      Téléphone <span className="font-normal text-ash">(optionnel)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className={FIELD}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sport" className={LABEL}>
                    Sport / discipline
                  </label>
                  <input
                    id="sport"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    placeholder="Football, rugby, running…"
                    className={FIELD}
                  />
                </div>

                <div>
                  <label htmlFor="brief" className={LABEL}>
                    Votre projet
                  </label>
                  <textarea
                    id="brief"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Maillots domicile + extérieur, nos couleurs sont le bordeaux et l'or, blason fourni…"
                    aria-invalid={!!errors.brief}
                    aria-describedby={errors.brief ? "brief-error" : undefined}
                    className={cn(errors.brief ? FIELD_ERR : FIELD, "min-h-24 resize-y")}
                  />
                  {errors.brief && (
                    <p id="brief-error" className="mt-2 text-[13px] font-medium text-danger">
                      {errors.brief}
                    </p>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "cursor-pointer rounded-field border-[1.5px] border-dashed p-5 text-center transition-colors",
                    dragging ? "border-green bg-green-soft" : "border-line bg-white",
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf,.ai"
                    onChange={(e) => addFiles(e.target.files)}
                    className="hidden"
                  />
                  <div className="text-[13px] font-medium text-stone">
                    Glissez votre design ou blason ici
                  </div>
                  <div className="mt-1 text-[11.5px] text-ash">PNG · JPG · PDF · AI — optionnel</div>
                </div>

                {files.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {files.map((name, index) => (
                      <li
                        key={`${name}-${index}`}
                        className="flex items-center gap-2.5 rounded-field bg-white px-3 py-2.5"
                      >
                        <FileText size={14} aria-hidden className="flex-none text-green" />
                        <span className="min-w-0 flex-1 truncate text-[12px] text-slate">{name}</span>
                        <button
                          type="button"
                          aria-label={`Retirer ${name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles((current) => current.filter((_, i) => i !== index));
                          }}
                          className="flex-none text-ash transition-colors hover:text-ink"
                        >
                          <X size={14} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {formError && (
                  <p className="rounded-field border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sharp bg-green py-4 text-[14px] font-semibold uppercase tracking-caps text-white transition-colors duration-150 hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Envoi…" : "Envoyer mon projet"}
                </button>
                <p className="text-center text-[11.5px] text-ash">
                  Réponse sous 24 h · sans engagement
                </p>
              </form>
            )}
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
