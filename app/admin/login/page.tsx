"use client";

import { useActionState } from "react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { login } from "@/app/actions/auth";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <LogoLockup markClassName="w-[30px] text-white" wordmarkClassName="text-[20px] text-white" />
        </div>

        <div className="rounded-2xl border border-line-dark bg-surface-dark p-8">
          <h1 className="text-[20px] font-extrabold tracking-tight text-white">Espace admin</h1>
          <p className="mt-2 text-[13px] text-mute-ink">
            Accès réservé à la gestion des demandes.
          </p>

          <form action={formAction} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="password" className="mb-2 block text-[12px] font-semibold text-fog">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                className="w-full rounded-field border-[1.5px] border-line-dark bg-ink px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-mute-ink focus:border-green"
              />
            </div>

            {state?.error && <p className="text-[13px] text-green-light">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="rounded-sharp bg-green py-3.5 text-[14px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-60"
            >
              {pending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
