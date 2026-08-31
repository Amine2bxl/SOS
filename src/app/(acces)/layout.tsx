import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ASSO } from "@/lib/data";

/**
 * Coquille des écrans d'accès (connexion, création de compte).
 *
 * Volontairement dépouillée : c'est le sas entre le site public et
 * l'application. Aucune navigation, rien qui détourne — juste le logo, le
 * formulaire, et de quoi revenir en arrière.
 */
export default function AccesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="SOS Citizens ASBL — accueil">
            <Logo surClair />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-navy-700 underline decoration-navy-700/30 underline-offset-2 transition hover:text-navy-900"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <main id="contenu" className="flex flex-1 items-start justify-center">
        {children}
      </main>

      <footer className="border-t border-line px-4 py-5 text-center">
        <p className="text-xs leading-relaxed text-ink-soft">
          {ASSO.nom} — {ASSO.formeJuridique} bruxelloise.{" "}
          <Link href="/confidentialite" className="underline hover:text-ink">
            Confidentialité
          </Link>{" "}
          ·{" "}
          <Link href="/conditions-utilisation" className="underline hover:text-ink">
            Conditions d&apos;utilisation
          </Link>
        </p>
      </footer>
    </div>
  );
}
