# Le savoir de l'association

C'est ici que se déposent les documents qui nourrissent le moteur SOS : dix
ans de recherche sur les redevances de stationnement — règlements, notes,
exemples de courriers, décisions, méthodes.

## Ajouter des documents

1. Copiez les fichiers dans `savoir/sources/` (sous-dossiers autorisés) :
   `.md`, `.txt` ou `.pdf` contenant du texte. Un document Word s'enregistre en
   PDF depuis Word (Fichier → Enregistrer sous → PDF).
2. Lancez, à la racine du projet :

   ```bash
   node scripts/ingerer-savoir.mjs
   ```

3. Le script affiche, document par document, le nombre de passages extraits.
   Il écrit le résultat dans `src/cerveau/corpus/corpus.genere.ts`.
4. Committez ce fichier généré, et déployez.

Les documents originaux de `savoir/sources/` ne sont **pas** versionnés
(voir `.gitignore`) : seul l'extrait textuel produit par le script entre dans
le dépôt.

## Ce qui se passe ensuite

- **La recherche** (« Demandez à SOS ») interroge ces passages avec le même
  algorithme que les fiches du site. Un passage qui répond à la question est
  affiché avec sa source.
- **Le corpus reste sur le serveur.** Il n'est jamais envoyé au navigateur : un
  visiteur ne reçoit que l'extrait qui répond à sa question. Si le dépôt de
  code est public, le fichier généré l'est aussi — gardez le dépôt privé si le
  corpus est confidentiel.

## Pour que le moteur en tire le meilleur

- Un intertitre par sujet : le découpage suit les titres (`# Titre` en
  Markdown, lignes courtes en capitales dans un PDF). Un passage bien titré
  est un passage bien trouvé.
- Une idée par paragraphe : la recherche renvoie un ou deux paragraphes, pas
  un document entier.
- Les PDF scannés (images sans texte) ne sont pas lus : passez-les d'abord par
  un logiciel d'OCR, ou recopiez l'essentiel dans un `.md`.

## Faire évoluer les règles du moteur

Les règles elles-mêmes (moyens de défense, délais par région, questions) ne
sont pas des documents : ce sont des données structurées, dans
`src/cerveau/base/`. Chaque entrée porte un niveau de fiabilité :

- `etablie` : le moteur peut l'affirmer ;
- `a_confirmer` : le moteur s'en sert, mais la lettre la formule avec prudence.

Valider une entrée `a_confirmer` avec le savoir de l'association, c'est la
passer à `etablie` — et le moteur gagne en assurance là où c'est mérité.
