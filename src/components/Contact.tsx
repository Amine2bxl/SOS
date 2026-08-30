"use client";

import { useState } from "react";
import { ASSO } from "@/lib/data";
import { MailIcon } from "@/components/Logo";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 7 12.7c-1 1.5-2.4 2.6-4.1 3.2a8.2 8.2 0 0 1-8.8-2 8.2 8.2 0 0 1-1.3-9l.3-.6 2.3-.6.4.7c.5 1 .8 2 .9 3.1l-1.5 1.5a9 9 0 0 0 4 3.5l1.6-1.5a9 9 0 0 0 3.4.9l2.3 2.3-.5 2.4-.7.3a10 10 0 0 1-5.2-.1l-1.7-.9A8.2 8.2 0 0 1 12 3.8Z" />
    </svg>
  );
}

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

type Variante = "gold" | "secondaire" | "outline" | "fantome" | "lien";

const STYLES: Record<Variante, string> = {
  gold:
    "bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-lg shadow-gold-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold-400/40 font-bold",
  secondaire: "border border-line bg-white text-navy-900 hover:border-navy-600/50 hover:bg-navy-50",
  outline: "border border-navy-600 bg-transparent text-white hover:bg-navy-800",
  fantome: "text-navy-700 hover:bg-navy-50",
  lien: "font-semibold text-navy-700 underline decoration-navy-700/30 underline-offset-2 hover:text-navy-900",
};

/**
 * Popup de contact unique, ouvert par BoutonContact. Jamais d'appel direct :
 * trop d'appels tueraient la disponibilité de l'association. On propose
 * WhatsApp (au numéro actuel) et l'e-mail — seuls canaux écrits.
 */
export function BoutonContact({
  variante = "gold",
  className = "",
  children,
}: {
  variante?: Variante;
  className?: string;
  children?: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          STYLES[variante]
        } ${className}`}
      >
        {children ?? (
          <>
            <WhatsAppIcon className="h-4 w-4" />
            Nous contacter
          </>
        )}
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-contact"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
        >
          <div
            className="w-full max-w-sm animate-rise rounded-xl border border-line bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="titre-contact" className="font-display text-xl font-bold text-navy-900">
                Nous contacter
              </h2>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="rounded-md p-1.5 text-navy-600 transition hover:bg-navy-50 hover:text-navy-900"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Nous répondons par écrit, comme vous préférez : c&apos;est le plus simple pour garder
              une trace de votre dossier.
            </p>

            <div className="mt-5 space-y-3">
              <a
                href={LIEN_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 transition hover:border-[#25d366]/60 hover:shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25d366]/15 text-[#1da851]">
                    <WhatsAppIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-navy-900">WhatsApp</span>
                    <span className="block text-xs text-ink-soft">Réponse en général rapide</span>
                  </span>
                </span>
                <span className="text-xl text-navy-700">→</span>
              </a>

              <a
                href={`mailto:${ASSO.email}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 transition hover:border-navy-600/50 hover:shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-navy-800">
                    <MailIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-navy-900">Par e-mail</span>
                    <span className="block text-xs text-ink-soft">{ASSO.email}</span>
                  </span>
                </span>
                <span className="text-xl text-navy-700">→</span>
              </a>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft">
              Pas d&apos;appel direct : nous répondons surtout par écrit. Si c&apos;est urgent,
              précisez-le, nous vous rappelons si nécessaire.
            </p>
          </div>
        </div>
      )}
    </>
  );
}