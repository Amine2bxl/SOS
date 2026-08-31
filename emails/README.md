# E-mails — SOS Citizens

Les e-mails de l'association sont **écrits dans le code**, pas dans un tableau
de bord : `src/lib/mail/gabarits.ts` (contenu et mise en page) et
`src/lib/mail/envoyer.ts` (envoi). Ils se relisent, se testent et se
versionnent comme le reste du projet.

## Comment ça marche

1. À la création d'un compte, le serveur appelle
   `auth.admin.generateLink()` : le compte est créé **et** le code à 6 chiffres
   nous est rendu, sans que Supabase envoie quoi que ce soit.
2. Le site envoie alors **son** e-mail — bandeau SOS Citizens, code bien
   visible, ton personnalisé — via l'API de [Resend](https://resend.com).
3. L'utilisateur saisit le code, la session s'ouvre, direction son espace.

## Mise en service (une seule fois)

1. Créer un compte sur **resend.com** (offre gratuite : 3 000 e-mails/mois).
2. **Domains → Add domain** : ajouter le domaine d'envoi et publier les
   enregistrements DNS proposés (SPF, DKIM). Sans domaine vérifié, Resend
   n'accepte d'envoyer qu'à votre propre adresse — suffisant pour tester.
3. **API Keys → Create** : copier la clé (`re_…`).
4. Dans Vercel → Settings → Environment Variables, ajouter :

   | Variable | Où la trouver |
   | --- | --- |
   | `RESEND_API_KEY` | Resend → API Keys |
   | `EMAIL_EXPEDITEUR` | ex. `SOS Citizens ASBL <bonjour@sos-citizens.be>` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (**secret**) |
   | `NEXT_PUBLIC_SITE_URL` | l'URL réelle du site |

5. Redéployer.

## Repli automatique

Tant que `RESEND_API_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` manquent, le site
retombe sur le mailer intégré de Supabase : rien ne casse, mais l'e-mail est
générique et limité (~2 envois par heure). Pour rendre ce repli présentable, on
peut coller [`confirm-signup.html`](./confirm-signup.html) dans
Supabase → Authentication → Email Templates → *Confirm signup*, avec l'objet
`Votre code de confirmation — SOS Citizens ASBL`. Ce n'est **pas** nécessaire
une fois Resend branché.

## Réglages Supabase à vérifier

- **Authentication → Sign In / Up → Email** : « Confirm email » activé.
- **Authentication → URL Configuration** : *Site URL* et *Redirect URLs* sur
  l'URL réelle du site (sinon les liens de secours pointent sur `localhost`).

## Test

1. Créer un compte avec une adresse que vous contrôlez.
2. L'e-mail arrive : objet `123456 — votre code de confirmation SOS Citizens`.
3. Saisir le code : l'animation de validation s'affiche, puis l'espace membre.
4. Le bouton « me le renvoyer » produit un second code, valable lui aussi.
