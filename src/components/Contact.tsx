"use client";

import { useState } from "react";
import { Modale, EnTeteModale } from "@/components/Modale";
import { ASSO } from "@/lib/data";
import { MailIcon } from "@/components/Logo";
import { useLangue, t } from "@/lib/i18n";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
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
  const { langue } = useLangue();

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
            {t(langue, "commun.contacter")}
          </>
        )}
      </button>

      <Modale ouverte={ouvert} onFermer={() => setOuvert(false)} titre="Nous contacter">
        <EnTeteModale titre="Nous contacter" onFermer={() => setOuvert(false)} />

        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Nous répondons par écrit, comme vous préférez : c&apos;est le plus simple pour garder une
          trace de votre dossier.
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
      </Modale>
    </>
  );
}