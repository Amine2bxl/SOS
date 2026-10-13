/**
 * Par où partent les e-mails de l'association — décidé par les variables
 * d'environnement, sans toucher au code.
 *
 *  - **Resend** (`RESEND_API_KEY`) : l'API d'envoi, la bonne voie le jour où
 *    l'association aura son propre nom de domaine vérifié.
 *  - **SMTP** (`SMTP_USER` + `SMTP_PASSWORD`) : une boîte d'envoi classique,
 *    Gmail par défaut. C'est la voie qui marche dès aujourd'hui, sans nom de
 *    domaine : l'adresse Gmail de l'association et un « mot de passe
 *    d'application » Google suffisent.
 *
 * Sans l'un ni l'autre, `null` : l'appelant le sait et retombe sur l'envoi de
 * Supabase. Module pur, sans `server-only`, pour être testé tel quel.
 *
 * Import relatif volontaire (`../data`) : ce fichier est compilé par les
 * tests, sans le résolveur d'alias de Next.
 */

import { ASSO } from "../data";

export type CanalEnvoi =
  | { type: "resend"; cle: string; expediteur: string }
  | {
      type: "smtp";
      hote: string;
      port: number;
      /** TLS dès la connexion (port 465) ; sinon STARTTLS, exigé. */
      securise: boolean;
      utilisateur: string;
      motDePasse: string;
      expediteur: string | { name: string; address: string };
    };

type Env = Record<string, string | undefined>;

const valeur = (v: string | undefined) => v?.trim() || undefined;

export function canalEnvoi(env: Env = process.env): CanalEnvoi | null {
  const cle = valeur(env.RESEND_API_KEY);
  if (cle) {
    return { type: "resend", cle, expediteur: valeur(env.EMAIL_EXPEDITEUR) ?? `${ASSO.nom} <onboarding@resend.dev>` };
  }

  const utilisateur = valeur(env.SMTP_USER);
  const brut = valeur(env.SMTP_PASSWORD);
  if (!utilisateur || !brut) return null;

  const hote = valeur(env.SMTP_HOST)?.toLowerCase() ?? "smtp.gmail.com";
  const demande = Number(valeur(env.SMTP_PORT) ?? 465);
  const port = Number.isInteger(demande) && demande > 0 && demande < 65536 ? demande : 465;

  // Google affiche le mot de passe d'application par groupes de quatre
  // lettres (« abcd efgh ijkl mnop ») : les espaces n'en font pas partie.
  const gmail = /(^|\.)(gmail|googlemail)\.com$/.test(hote);
  const motDePasse = gmail ? brut.replace(/\s+/g, "") : brut;

  return {
    type: "smtp",
    hote,
    port,
    securise: port === 465,
    utilisateur,
    motDePasse,
    // Gmail réécrit toute autre adresse d'expédition que celle du compte :
    // par défaut, on envoie donc au nom de l'association depuis ce compte.
    expediteur: valeur(env.EMAIL_EXPEDITEUR) ?? { name: ASSO.nom, address: utilisateur },
  };
}
