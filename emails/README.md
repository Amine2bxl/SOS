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

## Option recommandée : la boîte Gmail de l'association (10 minutes)

Aucun nom de domaine n'est nécessaire. Le serveur fabrique le code avec
`auth.admin.generateLink`, puis l'envoie depuis la boîte Gmail avec le modèle
de `src/lib/mail/gabarits.ts` : le code est dans l'objet, le HTML et la version
texte, sans aucun lien à ouvrir. Les rappels d'échéance partent par le même
chemin. Aucun modèle n'est à recopier dans Supabase, et le plafond d'envoi de
Supabase ne s'applique plus.

1. **Google** — sur le compte Gmail qui enverra les codes (idéalement une
   adresse dédiée à l'association) : activer la
   [validation en deux étapes](https://myaccount.google.com/signinoptions/twosv),
   puis créer un [mot de passe d'application](https://myaccount.google.com/apppasswords)
   nommé « SOS Citizens ». Google affiche 16 lettres : les copier.
2. **Supabase** — copier une clé secrète dans
   [API Keys](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/settings/api-keys),
   onglet « Publishable and secret API keys » : la clé `sb_secret_…` (la créer
   si le bouton « Create new API keys » apparaît). L'ancienne clé `service_role`
   fonctionne aussi, mais Supabase l'arrête fin 2026. Cette clé ne doit jamais
   être publiée ni préfixée `NEXT_PUBLIC_`.
3. **Vercel** — dans
   [Environment Variables](https://vercel.com/amine-nq/sos/settings/environment-variables),
   ajouter pour Production et Preview, en « Sensitive » :

   | Variable | Valeur |
   | --- | --- |
   | `SUPABASE_SERVICE_ROLE_KEY` | la clé de l'étape 2 |
   | `SMTP_USER` | l'adresse Gmail complète |
   | `SMTP_PASSWORD` | le mot de passe d'application de l'étape 1 |
   | `CRON_SECRET` | une longue chaîne aléatoire (rappels quotidiens) |

4. **Redéployer** (Deployments → ⋯ → Redeploy), ou fusionner une PR.

Gmail accepte quelques centaines d'envois par jour : de quoi démarrer.
Un autre fournisseur SMTP (Brevo, OVH…) fonctionne aussi avec `SMTP_HOST` et
`SMTP_PORT`. Avec un nom de domaine vérifié, `RESEND_API_KEY` et
`EMAIL_EXPEDITEUR` prennent le relais (Resend passe avant le SMTP).

## Autre option : le SMTP de Supabase

Sans clé serveur dans Vercel, l'application demande à Supabase d'envoyer
lui-même l'e-mail (`signInWithOtp`). Son expéditeur par défaut ne convient pas
à un site public : quelques envois par heure, réservés à l'équipe du projet, et
un modèle qui ne contient qu'un lien. Pour l'utiliser quand même :

1. Dans [SMTP Supabase](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/smtp),
   activer un SMTP personnalisé (Gmail : `smtp.gmail.com`, port 465, l'adresse
   Gmail et le mot de passe d'application ci-dessus). Désactiver le suivi des
   clics pour les e-mails d'authentification.
2. Dans [Email Templates](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/templates),
   installer **les deux** modèles du dépôt :

   | Modèle Supabase | Fichier | Objet |
   | --- | --- | --- |
   | Confirm signup | `confirm-signup.html` | `{{ .Token }} — votre code SOS Citizens` |
   | Magic Link | `magic-link.html` | `{{ .Token }} — votre code de connexion SOS Citizens` |

   `signInWithOtp` utilise le modèle **Magic Link** pour les personnes déjà
   inscrites. Modifier seulement Confirm signup laisse ces personnes sans code.
3. Dans [Rate Limits](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/rate-limits),
   relever le nombre d'e-mails par heure.
4. Dans [URL Configuration](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/url-configuration),
   définir Site URL sur `https://soscitizens.vercel.app` et autoriser
   `https://soscitizens.vercel.app/auth/confirm`.

Le formulaire accepte les codes de 6 à 10 chiffres et suit la longueur réelle
du code envoyé. Pour des codes à 6 chiffres, régler « Email OTP Length » sur 6
dans [Sign In / Providers → Email](https://supabase.com/dashboard/project/vlbmkzuffnbgktqspdvp/auth/providers).

Documentation : [OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[modèles](https://supabase.com/docs/guides/auth/auth-email-templates),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Validation du parcours

- Demander un code : l'étape change seulement après un envoi réussi.
- Copier le code : la vérification automatique n'est déclenchée qu'une
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
code. Un vrai test de réception demande la boîte Gmail (ou Resend) configurée.
