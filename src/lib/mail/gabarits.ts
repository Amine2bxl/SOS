/**
 * Gabarits des e-mails envoyés par l'association.
 *
 * Ils vivent ici, dans le dépôt, et non dans un tableau de bord : on les relit,
 * on les teste et on les fait évoluer comme le reste du code. Chaque gabarit
 * renvoie une version HTML (mise en page) et une version texte (délivrabilité,
 * clients qui refusent le HTML).
 *
 * Import relatif volontaire (`../data`) : ce fichier est compilé tel quel par
 * les tests, sans le résolveur d'alias de Next.
 */

import { ASSO, ADRESSE_COMPLETE } from "../data";

export type Gabarit = { sujet: string; html: string; texte: string };

const COULEURS = {
  fond: "#f6f4ee",
  carte: "#ffffff",
  navy: "#0b2545",
  or: "#f2b705",
  encre: "#1b2a36",
  encreDouce: "#4c5b66",
  piedFond: "#eef3fa",
};

/** Échappe le texte inséré dans le HTML (un prénom peut contenir n'importe quoi). */
function echapper(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Coquille commune à tous nos e-mails : bandeau de l'association, carte
 * blanche, pied de page avec l'identité légale. Tables et styles en ligne,
 * parce que c'est la seule chose que les clients de messagerie respectent.
 */
function coquille({
  titre,
  preheader,
  corps,
  urlSite,
}: {
  titre: string;
  preheader: string;
  corps: string;
  urlSite: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(titre)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COULEURS.fond};font-family:Arial,Helvetica,sans-serif;color:${COULEURS.encre};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COULEURS.fond};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:${COULEURS.navy};border-radius:12px 12px 0 0;padding:22px 28px;">
              <img src="${urlSite}/logo-email.png" alt="" width="44" height="48" style="display:inline-block;vertical-align:middle;margin-right:10px;">
              <span style="font-size:20px;font-weight:bold;color:${COULEURS.or};letter-spacing:0.5px;vertical-align:middle;">SOS&nbsp;CITIZENS&nbsp;<span style="color:#ffffff;">ASBL</span></span>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COULEURS.carte};padding:32px 28px;border-radius:0 0 12px 12px;">
${corps}
            </td>
          </tr>
          <tr>
            <td style="background-color:${COULEURS.piedFond};border-radius:12px;padding:18px 28px;margin-top:12px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${COULEURS.encreDouce};">
                <strong style="color:${COULEURS.navy};">${ASSO.nom}</strong> — ${ASSO.formeJuridique} bruxelloise.<br>
                ${ADRESSE_COMPLETE}, ${ASSO.pays}.<br>
                <a href="${urlSite}" style="color:${COULEURS.navy};">${urlSite.replace(/^https?:\/\//, "")}</a>
                &nbsp;·&nbsp;<a href="mailto:${ASSO.email}" style="color:${COULEURS.navy};">${ASSO.email}</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:${COULEURS.encreDouce};">
                Nous sommes une association d&rsquo;information et d&rsquo;accompagnement citoyen, et non un
                cabinet d&rsquo;avocats. Nous ne garantissons aucune annulation.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Ce que le compte débloque : c'est la raison pour laquelle on confirme. */
const CE_QUI_ATTEND = [
  "Scanner votre courrier : nous en extrayons la référence, le montant et surtout la date limite.",
  "Générer votre lettre de contestation, prête à copier ou à imprimer.",
  "Suivre vos dossiers et être prévenu avant chaque échéance.",
];

/**
 * E-mail de confirmation d'adresse, avec le code à 6 chiffres.
 *
 * Le code figure aussi dans l'objet : sur téléphone, la notification suffit
 * alors à le lire sans même ouvrir le message.
 */
export function emailConfirmation({
  prenom,
  code,
  lienConfirmation,
  urlSite,
}: {
  prenom?: string | null;
  code: string;
  lienConfirmation?: string | null;
  urlSite: string;
}): Gabarit {
  const bonjour = prenom?.trim() ? `Bonjour ${prenom.trim()}` : "Bonjour";
  const sujet = `${code} — votre code de confirmation SOS Citizens`;

  const lienHtml = lienConfirmation
    ? `              <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${COULEURS.encreDouce};">
                Vous préférez un simple clic&nbsp;?
                <a href="${lienConfirmation}" style="color:${COULEURS.navy};font-weight:bold;">Confirmer mon adresse e-mail</a>.
              </p>`
    : "";

  const corps = `              <h1 style="margin:0 0 12px;font-size:23px;line-height:1.3;color:${COULEURS.navy};">${echapper(bonjour)}, bienvenue chez SOS&nbsp;Citizens.</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${COULEURS.encreDouce};">
                Vous venez de créer votre compte, et nous en sommes ravis. Une amende de stationnement,
                ça se conteste rarement seul&nbsp;: à partir de maintenant, vous ne l&rsquo;êtes plus.
                Il reste une étape, une seule&nbsp;— confirmer que cette adresse est bien la vôtre.
              </p>

              <div style="background-color:${COULEURS.fond};border:2px dashed ${COULEURS.or};border-radius:12px;padding:22px;text-align:center;">
                <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${COULEURS.encreDouce};">Votre code de confirmation</p>
                <p style="margin:0;font-size:38px;font-weight:bold;letter-spacing:10px;color:${COULEURS.navy};">${echapper(code)}</p>
                <p style="margin:12px 0 0;font-size:12px;color:#92580a;">Valable une heure — ce code est personnel, ne le partagez avec personne.</p>
              </div>

              <p style="margin:22px 0 10px;font-size:15px;line-height:1.6;color:${COULEURS.encre};">
                Saisissez-le sur le site, et votre espace s&rsquo;ouvre&nbsp;:
              </p>
              <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:${COULEURS.encreDouce};">
${CE_QUI_ATTEND.map((x) => `                <li>${x}</li>`).join("\n")}
              </ul>
${lienHtml}
              <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${COULEURS.encreDouce};">
                Une question, un doute sur votre dossier&nbsp;? Répondez simplement à cet e-mail&nbsp;:
                c&rsquo;est une vraie personne de l&rsquo;association qui vous lira.
              </p>
              <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${COULEURS.encre};">
                À très vite,<br>
                <strong style="color:${COULEURS.navy};">L&rsquo;équipe de ${ASSO.nom}</strong>
              </p>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${COULEURS.encreDouce};">
                Vous n&rsquo;avez pas créé de compte&nbsp;? <strong>Ignorez cet e-mail</strong>, rien ne sera activé.
              </p>`;

  const texte = [
    `${bonjour}, bienvenue chez SOS Citizens.`,
    "",
    "Vous venez de créer votre compte. Il reste une étape : confirmer que cette adresse est bien la vôtre.",
    "",
    `Votre code de confirmation : ${code}`,
    "Valable une heure. Ce code est personnel, ne le partagez avec personne.",
    "",
    "Saisissez-le sur le site, et votre espace s'ouvre :",
    ...CE_QUI_ATTEND.map((x) => `- ${x}`),
    ...(lienConfirmation ? ["", `Vous préférez un simple clic : ${lienConfirmation}`] : []),
    "",
    "Une question ? Répondez simplement à cet e-mail : c'est une vraie personne de l'association qui vous lira.",
    "",
    `À très vite,`,
    `L'équipe de ${ASSO.nom}`,
    `${ADRESSE_COMPLETE}, ${ASSO.pays}`,
    "",
    "Vous n'avez pas créé de compte ? Ignorez cet e-mail, rien ne sera activé.",
  ].join("\n");

  return {
    sujet,
    html: coquille({
      titre: sujet,
      preheader: `Votre code : ${code}. Il active votre espace SOS Citizens.`,
      corps,
      urlSite,
    }),
    texte,
  };
}
