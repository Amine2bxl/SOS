# E-mails de vérification — SOS Citizens

Les e-mails envoyés par Supabase Auth se configurent **dans le dashboard Supabase**
(il n&apos;existe aucune API pour les modifier : c&apos;est un copier-coller).

## 1) Activer le code à 6 chiffres

1. Supabase → **Authentication → Sign In / Up → Email** :
   - Active **“Confirm email”** (confirmation d&apos;e-mail).
2. Supabase → **Authentication → URL Configuration** :
   - **Site URL** : remplace `http://localhost:3000` par l&apos;URL réelle du site
     (ex. `https://sos-amine-nq.vercel.app`).
   - **Redirect URLs** : ajoute la même URL réelle. → supprime la page “localhost”.
3. Supabase → **Authentication → Email Templates → “Confirm signup”** :
   - **Subject** : `Votre code de confirmation — SOS Citizens ASBL`
   - **Content (HTML)** : colle tout le contenu du fichier
     [`confirm-signup.html`](./confirm-signup.html).

Le gabarit contient déjà la variable `{{ .Token }}` (le code à 6 chiffres),
le logo SOS Citizens (`/logo-email.png`, servi par le site) et l&apos;identité
de l&apos;association. Clique **Save**.

## 2) Côté site (déjà en place)

- Au dépôt d&apos;un compte, le site ouvre la fenêtre de saisie du code.
- Le code (6 chiffres) est entré, la session s&apos;ouvre, une **animation de
  validation** s&apos;affiche, puis l&apos;utilisateur est envoyé sur le tableau de bord.
- La route `/auth/confirm` gère aussi le cas où quelqu&apos;un clique sur le lien
  reçu dans l&apos;e-mail (une fois la Site URL réglée sur le vrai domaine).

## Test rapide

1. Crée un compte avec une adresse que tu contrôles.
2. Vérifie que l&apos;e-mail arrive avec le code à 6 chiffres.
3. Entre le code : l&apos;animation ✓ s&apos;affiche puis tu atterris sur le tableau de bord.