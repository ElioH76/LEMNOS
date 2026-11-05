"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Check, FileText, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { submitDemand } from "@/app/actions/demands";
import { structureTypes } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

const FIELD =
  "w-full border bg-transparent px-4 py-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-mute-ink focus:border-white";
const FIELD_OK = "border-field-line";
const FIELD_ERR = "border-danger-light";
const LABEL = "mb-2 block text-[12px] font-bold uppercase tracking-label text-mint";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  structure?: string;
  email?: string;
  brief?: string;
}

/** Section « La vôtre. » — CTA et formulaire de demande (mêmes champs que l'action submitDemand). */
export function DemandSection() {
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
    const result = await submitDemand({ structure, type, sport, quantity, email, phone, brief, files });
    setSubmitting(false);

    if (result.ok) setSent(true);
    else setFormError(result.error ?? "Une erreur est survenue.");
  };

  const errorText = (id: string, message?: string) =>
    message && (
      <p id={id} className="mt-2 text-[12.5px] font-medium text-danger-light">
        {message}
      </p>
    );

  return (
    <section id="demande" className="scroll-mt-20">
      <Shell className="grid grid-cols-1 items-start gap-12 py-20 md:py-24 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="flex flex-col gap-[18px] lg:sticky lg:top-28">
          <Eyebrow>Prochaine collection</Eyebrow>
          <h2 className="font-serif text-[40px] font-bold leading-none text-white md:text-[52px]">La vôtre.</h2>
          <p className="max-w-[44ch] text-[16px] leading-[1.6] text-fog">
            Déposez votre design ou décrivez votre idée. On revient vers vous sous 48 h avec une
            première proposition — sans engagement.
          </p>
        </div>

        <div className="border border-night-line bg-ink p-6 md:p-8">
          {sent ? (
            <div role="status" className="flex flex-col items-start gap-4 py-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-sharp bg-green text-white">
                <Check size={22} strokeWidth={2.5} aria-hidden />
              </span>
              <p className="font-serif text-[26px] font-bold leading-tight text-white">Projet bien reçu.</p>
              <p className="text-[15px] leading-[1.6] text-fog">
                Merci {structure.trim()} — on revient vers vous sous 48 h avec une première proposition.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-[12px] font-bold uppercase tracking-caps text-mint underline underline-offset-4 hover:text-white"
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
                  autoComplete="organization"
                  aria-invalid={!!errors.structure}
                  aria-describedby={errors.structure ? "structure-error" : undefined}
                  className={cn(FIELD, errors.structure ? FIELD_ERR : FIELD_OK)}
                />
                {errorText("structure-error", errors.structure)}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="type" className={LABEL}>
                    Type
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={cn(FIELD, FIELD_OK, "bg-ink")}
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
                    className={cn(FIELD, FIELD_OK)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={cn(FIELD, errors.email ? FIELD_ERR : FIELD_OK)}
                  />
                  {errorText("email-error", errors.email)}
                </div>
                <div>
                  <label htmlFor="phone" className={LABEL}>
                    Téléphone <span className="font-medium normal-case tracking-normal text-mute-ink">(optionnel)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                    className={cn(FIELD, FIELD_OK)}
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
                  className={cn(FIELD, FIELD_OK)}
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
                  className={cn(FIELD, errors.brief ? FIELD_ERR : FIELD_OK, "min-h-28 resize-y")}
                />
                {errorText("brief-error", errors.brief)}
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
                  "cursor-pointer border border-dashed p-5 text-center transition-colors",
                  dragging ? "border-mint bg-green/20" : "border-field-line hover:border-mute-ink",
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
                <div className="text-[13px] font-medium text-pearl">Glissez votre design ou blason ici</div>
                <div className="mt-1 text-[11.5px] text-mute-ink">PNG · JPG · PDF · AI — optionnel</div>
              </div>

              {files.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {files.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className="flex items-center gap-2.5 border border-night-line px-3 py-2.5"
                    >
                      <FileText size={14} aria-hidden className="flex-none text-mint" />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-pearl">{name}</span>
                      <button
                        type="button"
                        aria-label={`Retirer ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((current) => current.filter((_, i) => i !== index));
                        }}
                        className="flex-none text-mute-ink transition-colors hover:text-white"
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {formError && (
                <p role="alert" className="border border-danger-light/40 px-4 py-3 text-[13px] font-medium text-danger-light">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-sharp bg-green p-4 text-[15px] font-bold text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Envoi…" : "Envoyer mon projet"}
              </button>
              <p className="text-center text-[11.5px] text-mute-ink">Réponse sous 48 h · sans engagement</p>
            </form>
          )}
        </div>
      </Shell>
    </section>
  );
}
