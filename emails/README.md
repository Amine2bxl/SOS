# Vérification par code — SOS Citizens

Le parcours reste sur `/connexion` : adresse → code → confirmation. Le bouton
« Continuer vers mon espace » ouvre ensuite la destination demandée. Aucun
nouvel onglet n'est nécessaire. Un ancien lien reste accepté : son retour
revient au formulaire confirmé ; l'onglet initial reconnaît aussi sa session
quand l'utilisateur y revient, à condition que l'adresse soit la même.

## Pourquoi les e-mails n'arrivaient pas

Le mailer de test Supabase a un quota très bas et ne convient pas à un site
public. Un retour `429 / email rate limit exceeded` signifie qu'aucun nouveau
code n'a été envoyé. Modifier le formulaire ou redéployer ne lève pas cette
limite. Il faut configurer un expéditeur de production.

## Option recommandée : SMTP Supabase

Cette option utilise `signInWithOtp` et ne nécessite ni clé de service Supabase
ni clé Resend dans l'application.

1. Dans [SMTP Supabase](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/smtp),
   activer un fournisseur SMTP avec ses identifiants et une adresse d'envoi
   sur un domaine vérifié. Le fournisseur peut être Resend ou un autre service.
   Désactiver le suivi des clics pour les e-mails d'authentification.
2. Dans [Email Templates](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/templates),
   installer **les deux** modèles du dépôt :

   | Modèle Supabase | Fichier | Objet |
   | --- | --- | --- |
   | Confirm signup | `confirm-signup.html` | `{{ .Token }} — votre code SOS Citizens` |
   | Magic Link | `magic-link.html` | `{{ .Token }} — votre code de connexion SOS Citizens` |

   `signInWithOtp` utilise le modèle **Magic Link** pour les personnes déjà
   inscrites. Modifier seulement Confirm signup laisse ces personnes sans code.
   Les fichiers du dépôt ne sont pas appliqués automatiquement au projet hébergé.
3. Dans [URL Configuration](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/url-configuration),
   définir Site URL sur `https://soscitizens.vercel.app` et autoriser
   `https://soscitizens.vercel.app/auth/confirm` ainsi que les domaines effectivement
   utilisés. Pour les previews, autoriser seulement les previews de ce projet.
4. Dans les réglages Email, conserver la confirmation activée et les codes
   sur **6 chiffres**. Régler leur durée de validité selon le besoin du service.
5. Tester avec une adresse de première inscription et une adresse déjà inscrite.

Documentation : [OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[modèles](https://supabase.com/docs/guides/auth/auth-email-templates),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Alternative : envoi direct via Resend

Le serveur produit le code avec `auth.admin.generateLink`, puis envoie les
modèles de `src/lib/mail/gabarits.ts`. Le code est visible dans l'objet, le HTML
et la version texte. Aucun lien de connexion n'est inclus dans cet envoi.

Configurer dans Vercel, pour chaque environnement concerné :

| Variable | Valeur |
| --- | --- |
| `RESEND_API_KEY` | Clé API du compte Resend de l'association |
| `EMAIL_EXPEDITEUR` | Adresse sur un domaine vérifié dans Resend |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur Supabase, jamais `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_SITE_URL` | `https://soscitizens.vercel.app` en production |

Redéployer ensuite. Sans les deux clés, l'application utilise le mailer
Supabase : cela fonctionne pour le public seulement si le SMTP est configuré.
L'adresse `onboarding@resend.dev` sert uniquement aux tests autorisés par Resend.

## Validation du parcours

- Demander un code : l'étape change seulement après un envoi réussi.
- Copier les six chiffres : la vérification automatique n'est déclenchée qu'une
  fois ; une erreur laisse la saisie disponible.
- Vérifier : la confirmation apparaît sur la même page, avec un bouton pour
  continuer. Le paramètre `confirme=1` seul ne valide jamais une session.
- Renvoyer : attendre 60 secondes ; un échec conserve l'étape et l'adresse.
- Recharger pendant l'attente : le formulaire restaure l'adresse et le délai,
  sans stocker de code ou de jeton. Si Turnstile est actif, un nouveau jeton est
  obtenu à chaque envoi.
- Ancien lien : revenir à l'onglet initial reconnaît la session, sans reconnaître
  celle d'un autre compte. Un autre navigateur exige une nouvelle vérification.

`npm test`, `npm run typecheck`, `npm run lint` et `npm run build` contrôlent le
code. Un vrai test de réception demande l'expéditeur SMTP ou Resend configuré.
