"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Les langues de l'interface. Pas de drapeaux : en Belgique, le néerlandais
 * n'est pas « la langue des Pays-Bas », ni le français celle de la France.
 * Le code suffit, et ne froisse personne.
 */
export const LANGUES = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
] as const;

export type Langue = (typeof LANGUES)[number]["code"];

const FR = {
  "nav.commentCaMarche": "Comment ça marche",
  "commun.analyser": "Analyser mon courrier",
  "nav.comprendre": "Comprendre",
  "nav.communes": "Communes",
  "nav.tarifs": "Tarifs",
  "nav.contact": "Contact",
  "commun.creerCompte": "Créer mon compte gratuit",
  "commun.creerCompteCourt": "Créer un compte",
  "commun.monEspace": "Mon espace",
  "commun.ouvrirContestation": "Ouvrir une contestation",
  "commun.contacter": "Nous contacter",
  "commun.voirSite": "Voir le site",
  "commun.devenirMembre": "Devenir membre",
  "commun.membre": "Membre",
  "commun.seConnecter": "Connexion",
  "commun.seDeconnecter": "Se déconnecter",
  "menu.mesDossiers": "Mes dossiers",
  "menu.nouvelleContestation": "Nouvelle contestation",
  "menu.monAbonnement": "Mon abonnement",
  "menu.mesParametres": "Mes paramètres",
  "menu.nousEcrire": "Nous écrire",
  "footer.decouvrir": "Découvrir",
  "footer.espaceMembre": "Espace membre",
  "footer.legal": "Légal",
  "footer.mentionsLegales": "Mentions légales",
  "footer.confidentialite": "Confidentialité",
  "footer.conditions": "Conditions d'utilisation",
  "footer.tagline":
    "Association citoyenne qui aide à comprendre et contester les redevances de stationnement, partout en Belgique.",
  "footer.identite": "Association d'information et d'accompagnement citoyen, non un cabinet d'avocats : aucune annulation n'est garantie.",
};

const EN: Record<string, string> = {
  "nav.commentCaMarche": "How it works",
  "commun.analyser": "Analyse my letter",
  "nav.comprendre": "Understand",
  "nav.communes": "Municipalities",
  "nav.tarifs": "Pricing",
  "nav.contact": "Contact",
  "commun.creerCompte": "Create my free account",
  "commun.creerCompteCourt": "Create an account",
  "commun.monEspace": "My area",
  "commun.ouvrirContestation": "Open a dispute",
  "commun.contacter": "Contact us",
  "commun.voirSite": "View the site",
  "commun.devenirMembre": "Become a member",
  "commun.membre": "Member",
  "commun.seConnecter": "Sign in",
  "commun.seDeconnecter": "Sign out",
  "menu.mesDossiers": "My cases",
  "menu.nouvelleContestation": "New dispute",
  "menu.monAbonnement": "My membership",
  "menu.mesParametres": "My settings",
  "menu.nousEcrire": "Email us",
  "footer.decouvrir": "Discover",
  "footer.espaceMembre": "Member area",
  "footer.legal": "Legal",
  "footer.mentionsLegales": "Legal notice",
  "footer.confidentialite": "Privacy",
  "footer.conditions": "Terms of use",
  "footer.tagline":
    "A citizens' association helping people understand and contest parking charges, everywhere in Belgium.",
  "footer.identite":
    "An information and support association, not a law firm: no annulment is guaranteed.",
};

const NL: Record<string, string> = {
  "nav.commentCaMarche": "Hoe het werkt",
  "commun.analyser": "Mijn brief analyseren",
  "nav.comprendre": "Begrijpen",
  "nav.communes": "Gemeenten",
  "nav.tarifs": "Tarieven",
  "nav.contact": "Contact",
  "commun.creerCompte": "Gratis account aanmaken",
  "commun.creerCompteCourt": "Account aanmaken",
  "commun.monEspace": "Mijn ruimte",
  "commun.ouvrirContestation": "Bezwaar indienen",
  "commun.contacter": "Contacteer ons",
  "commun.voirSite": "Bekijk de site",
  "commun.devenirMembre": "Word lid",
  "commun.membre": "Lid",
  "commun.seConnecter": "Inloggen",
  "commun.seDeconnecter": "Uitloggen",
  "menu.mesDossiers": "Mijn dossiers",
  "menu.nouvelleContestation": "Nieuw bezwaar",
  "menu.monAbonnement": "Mijn lidmaatschap",
  "menu.mesParametres": "Mijn instellingen",
  "menu.nousEcrire": "Schrijf ons",
  "footer.decouvrir": "Ontdekken",
  "footer.espaceMembre": "Ledenruimte",
  "footer.legal": "Juridisch",
  "footer.mentionsLegales": "Wettelijke vermeldingen",
  "footer.confidentialite": "Privacy",
  "footer.conditions": "Gebruiksvoorwaarden",
  "footer.tagline":
    "Een burgervereniging die helpt parkeerretributies te begrijpen en te betwisten, overal in België.",
  "footer.identite":
    "Een vereniging voor informatie en begeleiding, geen advocatenkantoor: geen annulering wordt gegarandeerd.",
};

const DE: Record<string, string> = {
  "nav.commentCaMarche": "So funktioniert's",
  "commun.analyser": "Meinen Brief analysieren",
  "nav.comprendre": "Verstehen",
  "nav.communes": "Gemeinden",
  "nav.tarifs": "Preise",
  "nav.contact": "Kontakt",
  "commun.creerCompte": "Kostenloses Konto erstellen",
  "commun.creerCompteCourt": "Konto erstellen",
  "commun.monEspace": "Mein Bereich",
  "commun.ouvrirContestation": "Einspruch erheben",
  "commun.contacter": "Kontaktieren Sie uns",
  "commun.voirSite": "Website ansehen",
  "commun.devenirMembre": "Mitglied werden",
  "commun.membre": "Mitglied",
  "commun.seConnecter": "Anmelden",
  "commun.seDeconnecter": "Abmelden",
  "menu.mesDossiers": "Meine Fälle",
  "menu.nouvelleContestation": "Neuer Einspruch",
  "menu.monAbonnement": "Meine Mitgliedschaft",
  "menu.mesParametres": "Meine Einstellungen",
  "menu.nousEcrire": "Schreiben Sie uns",
  "footer.decouvrir": "Entdecken",
  "footer.espaceMembre": "Mitgliederbereich",
  "footer.legal": "Rechtliches",
  "footer.mentionsLegales": "Impressum",
  "footer.confidentialite": "Datenschutz",
  "footer.conditions": "Nutzungsbedingungen",
  "footer.tagline":
    "Ein Bürgerverein, der hilft, Parkgebühren zu verstehen und anzufechten, überall in Belgien.",
  "footer.identite":
    "Ein Informations- und Begleitverein, keine Anwaltskanzlei: keine Annullierung wird garantiert.",
};

const DICTIONNAIRES: Record<Langue, Record<string, string>> = { fr: FR, en: EN, nl: NL, de: DE };

export function t(langue: Langue, cle: string): string {
  return DICTIONNAIRES[langue][cle] ?? DICTIONNAIRES.fr[cle] ?? cle;
}

type EtatLangue = { langue: Langue; changer: (l: Langue) => void };
const ContexteLangue = createContext<EtatLangue>({ langue: "fr", changer: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>("fr");

  useEffect(() => {
    // Application de la langue mémorisée, légèrement différée pour ne pas
    // contredire le premier rendu serveur.
    let actif = true;
    const minuteur = setTimeout(() => {
      const stockee = localStorage.getItem("sos.langue") as Langue | null;
      if (actif && stockee && DICTIONNAIRES[stockee]) setLangue(stockee);
    }, 0);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = langue;
  }, [langue]);

  const changer = (l: Langue) => {
    setLangue(l);
    try {
      localStorage.setItem("sos.langue", l);
    } catch {
      // Stockage indisponible : la langue vaut pour la session.
    }
  };

  return (
    <ContexteLangue.Provider value={{ langue, changer }}>{children}</ContexteLangue.Provider>
  );
}

export function useLangue(): EtatLangue {
  return useContext(ContexteLangue);
}

/** Sélecteur de langue : le code de la langue, dépliant sous une pastille. */
export function ChoixLangue() {
  const { langue, changer } = useLangue();
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label="Langue"
        className={`flex h-10 items-center rounded-full border px-3 text-[13px] font-bold uppercase tracking-wide transition ${
          ouvert ? "border-white/40 bg-white/10 text-white" : "border-white/15 text-navy-100 hover:bg-white/10"
        }`}
      >
        {langue}
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOuvert(false)} />
          <div
            role="listbox"
            aria-label="Choisir la langue"
            className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-navy-950 p-1 shadow-flotte"
          >
            {LANGUES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === langue}
                onClick={() => {
                  changer(l.code);
                  setOuvert(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  l.code === langue ? "bg-white/10 font-bold text-gold-300" : "text-navy-100 hover:bg-white/5"
                }`}
              >
                <span className="w-6 text-xs font-bold uppercase text-navy-200">{l.code}</span>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
