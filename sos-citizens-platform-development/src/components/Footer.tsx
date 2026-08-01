import Link from "next/link";
import { Logo, HeartIcon } from "@/components/Logo";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "La plateforme",
    links: [
      { href: "/", label: "Accueil" },
      { href: "/comprendre", label: "Comprendre le stationnement" },
      { href: "/communes", label: "Les 19 communes" },
      { href: "/analyser", label: "Analyser mon dossier" },
      { href: "/dossiers", label: "Mes dossiers" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/modeles", label: "Modèles et guides" },
      { href: "/articles", label: "Articles et presse" },
      { href: "/faq", label: "Questions fréquentes" },
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Vos droits & données",
    links: [
      { href: "/a-propos#confidentialite", label: "Politique de confidentialité" },
      { href: "/a-propos#donnees", label: "Gestion des données" },
      { href: "/contact?objet=suppression", label: "Suppression de mes données" },
      { href: "/a-propos#conditions", label: "Conditions d'accès" },
      { href: "/don", label: "Faire un don" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-navy-950 text-navy-100 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <div className="mt-4 space-y-1 text-sm text-navy-100/90">
            <p className="font-semibold text-white">SOS Citizens ASBL</p>
            <p>Président : Mohamed Azouzi</p>
            <p>Téléphone : [numéro officiel à confirmer]</p>
            <p>E-mail : [adresse officielle à confirmer]</p>
            <p>Adresse : [siège ou adresse de correspondance à confirmer]</p>
          </div>
          <Link
            href="/don"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-300"
          >
            <HeartIcon className="h-4 w-4 animate-heartbeat" />
            Faites un don
          </Link>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gold-300">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-navy-100/90 transition hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-navy-800">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs leading-relaxed text-navy-100/70 sm:px-6">
          Outil citoyen d'information, de préparation documentaire et d'orientation. Chaque dossier reste
          soumis à l'examen des faits, des pièces et du droit applicable. La plateforme ne promet aucune
          annulation et ne remplace pas un conseil juridique personnalisé.
        </p>
      </div>
    </footer>
  );
}
