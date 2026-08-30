# Vérification du compte par code à 6 chiffres

Le site n'envoie plus de lien de confirmation : l'utilisateur reçoit un code
à 6 chiffres et le saisit dans une fenêtre qui s'ouvre sur le site.

Le code de l'application est prêt. **Une étape reste à faire dans Supabase**,
car le contenu des e-mails ne se configure pas depuis le dépôt.

## Ce qu'il faut changer dans Supabase

Tableau de bord Supabase → **Authentication** → **Emails** → modèle
**Confirm signup**.

Remplacez le contenu par celui-ci. La variable `{{ .Token }}` produit le code
à 6 chiffres ; `{{ .ConfirmationURL }}` produirait un lien, et c'est
justement ce que l'on retire.

```html
<h2>Votre code de vérification</h2>

<p>Bonjour,</p>

<p>Voici votre code pour activer votre compte SOS Citizens :</p>

<p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0b2545">
  {{ .Token }}
</p>

<p>Ce code est valable une heure. Saisissez-le dans la fenêtre ouverte sur
le site.</p>

<p>Si vous n'avez pas créé de compte chez nous, ignorez ce message.</p>

<p>SOS Citizens ASBL</p>
```

Pensez aussi à adapter l'objet de l'e-mail, par exemple :
`Votre code SOS Citizens : {{ .Token }}`.

## Vérifier que la bascule a fonctionné

1. Créez un compte de test sur le site.
2. L'e-mail reçu doit contenir un code à 6 chiffres, et aucun lien.
3. Le code saisi dans la fenêtre doit ouvrir la session.

Tant que le modèle n'est pas modifié, l'e-mail contiendra encore un lien
alors que le site demande un code : l'inscription ne pourra pas aboutir.

## Durée de validité

Réglable dans **Authentication → Providers → Email → Email OTP Expiration**.
Le texte du site annonce une heure ; alignez ce réglage si vous le changez.

## Limite d'envoi

Supabase limite les renvois d'e-mails à un par minute environ. La fenêtre
en tient compte : le lien « Renvoyer un code » n'apparaît qu'après un compte
à rebours de 60 secondes.
