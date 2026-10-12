import Link from "next/link";
import { Logo } from "@/components/Logo";
import { IconeCadenas, IconeCerveau, IconeLettre } from "@/components/icones";

/**
 * Le sas entre le site et l'application.
 *
 * Sur grand écran, deux moitiés : à gauche la marque et trois promesses, à
 * droite le formulaire. Sur téléphone, la marque se réduit à un bandeau et le
 * formulaire prend toute la place — on est venu pour entrer, pas pour lire.
 */
const PROMESSES = [
  { Icone: IconeCerveau, texte: "Le moteur SOS lit votre courrier et trouve vos arguments." },
  { Icone: IconeLettre, texte: "Votre lettre de contestation, prête en quelques minutes." },
  { Icone: IconeCadenas, texte: "Votre document reste sur votre téléphone. Pas de mot de passe à retenir." },
];

export default function AccesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-paper lg:flex-row">
      <aside className="relative overflow-hidden bg-navy-900 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
        <div className="motif-points absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="relative flex items-center justify-between px-5 py-4 lg:px-12 lg:pt-10">
          <Link href="/" aria-label="SOS Citizens — accueil">
            <Logo />
          </Link>
          <Link href="/" className="text-sm font-semibold text-navy-200 transition hover:text-white lg:hidden">
            Retour
          </Link>
        </div>

        <div className="relative hidden px-12 pb-6 lg:block">
          <h2 className="max-w-md font-display text-[2.4rem] font-extrabold leading-[1.05]">
            Contestez votre redevance. <span className="text-gold-400">Sans vous perdre.</span>
          </h2>
          <ul className="mt-10 space-y-5">
            {PROMESSES.map(({ Icone, texte }) => (
              <li key={texte} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/15">
                  <Icone className="h-7 w-7 text-white" />
                </span>
                <span className="pt-2.5 text-[0.95rem] leading-relaxed text-navy-100">{texte}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden lg:block">
          <div className="motif-marquage h-3 w-full" aria-hidden="true" />
          <p className="px-12 py-5 text-xs text-navy-200">
            SOS Citizens ASBL — association sans but lucratif. Aucune annulation n&apos;est garantie ;
            vos droits, eux, le sont.
          </p>
        </div>
      </aside>

      <main id="contenu" className="flex flex-1 flex-col">
        <div className="flex flex-1 items-start justify-center px-5 py-10 sm:items-center sm:py-16">
          {children}
        </div>
        <footer className="px-5 py-5 text-center text-xs text-ink-soft">
          <Link href="/confidentialite" className="underline hover:text-ink">
            Confidentialité
          </Link>{" "}
          ·{" "}
          <Link href="/conditions-utilisation" className="underline hover:text-ink">
            Conditions d&apos;utilisation
          </Link>{" "}
          ·{" "}
          <Link href="/" className="underline hover:text-ink">
            Retour au site
          </Link>
        </footer>
      </main>
    </div>
  );
}
