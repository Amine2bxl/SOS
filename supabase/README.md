# Schéma de la base

Ce dossier est la **source de vérité du schéma**. Jusqu'ici la base n'existait
que dans le projet Supabase hébergé : rien dans le dépôt ne disait à quoi elle
ressemblait, ni pourquoi. Un schéma qui ne vit que dans une console est un
schéma que personne ne peut relire, revoir en PR, ou reconstruire.

## Ordre d'application

Les fichiers de `migrations/` s'appliquent dans l'ordre de leur nom. Ils sont
écrits pour pouvoir être rejoués sans dégât (`if not exists`,
`create or replace`, `drop … if exists` avant chaque `create`) — à une exception
près, signalée plus bas.

| Fichier | Ce qu'il fait |
| --- | --- |
| `…_verrou_facturation_et_integrite.sql` | Empêche un membre de s'attribuer lui-même une formule payante ; intégrité des événements ; valeurs de statut contraintes |
| `…_limitation_de_debit.sql` | Compteur partagé pour la limitation de débit des Server Actions |
| `…_duree_de_vie_texte_ocr.sql` | Effacement automatique du texte brut lu sur les courriers (RGPD) |
| `…_adhesions_et_reconciliation.sql` | Adhésions, communication structurée, application et expiration des formules |
| `…_droit_a_l_effacement.sql` | Politiques permettant à chacun de supprimer ses propres données |
| `…_registre_des_communes.sql` | Registre des communes couvertes (Bruxelles-Capitale), fiches de règles complètes, suivi en direct par la page « Communes » |

Les appels `cron.schedule(...)` échouent si la tâche existe déjà. Pour rejouer
une migration qui en contient un, supprimer d'abord la tâche :

```sql
select cron.unschedule('purge-quotidienne');
select cron.unschedule('expiration-formules');
```

## Ce que la base garantit, et pourquoi c'est là et pas dans le code

La clé anonyme de Supabase est publique — elle est dans le JavaScript envoyé au
navigateur, c'est sa raison d'être. Un membre connecté peut donc interroger
PostgREST directement avec son propre jeton, sans passer par nos écrans. Toute
règle qui n'existe que dans une Server Action est, en pratique, facultative.

Vivent donc en base :

- **Le plafond de la formule gratuite** (`verifier_quota_dossiers`), et
  l'impossibilité de changer soi-même de formule (`proteger_facturation`).
- **L'isolement entre comptes** : les politiques RLS, sur les cinq tables.
- **Les valeurs autorisées** de `statut` et `type_document`, et la plage
  plausible d'un montant.
- **La durée de vie du texte OCR**, posée à l'écriture par un déclencheur et
  appliquée par une tâche quotidienne.

Le code applicatif refait certaines de ces vérifications
(`src/lib/validation.ts`). Ce n'est pas une redondance inutile : il transforme
une valeur inattendue en message compréhensible, au lieu de laisser remonter une
erreur de contrainte Postgres à l'écran de quelqu'un qui vient de scanner son
courrier.

## Tâches planifiées

| Tâche | Quand | Ce qu'elle fait |
| --- | --- | --- |
| `purge-quotidienne` | 03:15 UTC | Efface le texte OCR périmé, les compteurs de débit, les accusés de lecture orphelins |
| `expiration-formules` | 03:35 UTC | Ramène à la formule gratuite les adhésions arrivées à échéance |

Les deux sont séparées à dessein : l'échec de l'une ne doit pas emporter
l'autre.

```sql
-- Vérifier qu'elles tournent
select jobname, schedule, active from cron.job;
select jobname, status, start_time from cron.job_run_details order by start_time desc limit 10;
```

## Encaisser une adhésion

Une demande d'adhésion crée une ligne dans `adhesions` avec sa **communication
structurée**. C'est elle, et elle seule, qui relie un virement à son auteur : le
nom du donneur d'ordre ne suffit pas, puisque c'est souvent le conjoint ou
l'employeur qui paie.

Au vu de l'extrait de compte, marquer l'adhésion payée suffit — la formule
s'applique toute seule, échéance à un an :

```sql
update public.adhesions
   set statut = 'payee', reference_paiement = '<référence de l''extrait>'
 where communication = '+++202/6000/00192+++';
```

À faire avec la clé `service_role` ou depuis l'éditeur SQL : un membre ne peut
pas modifier ses propres adhésions, et c'est voulu.

## Modifier les règles d'une commune

La page **Communes** du site (la carte de Bruxelles) lit trois tables à chaque
visite, et les écoute en direct : une modification enregistrée s'affiche sans
recharger, sur la carte comme dans la fiche.

| Table | Ce qu'on y fait |
| --- | --- |
| `communes_regles` | Corriger une fiche : zones, horaires, gratuité, paiement, cartes de riverain, tarifs, contestation, « à retenir ». Une colonne vide retombe sur le repère du site. |
| `regles_changements` | Annoncer un changement. Avec `commune_slug`, la commune passe en jaune sur la carte pendant un an ; sans, le changement vaut pour toute la Région et s'affiche en bandeau (`important` ou `urgent`). |
| `communes` | Le registre. `ouverte = false` met une commune en « cours de vérification ». C'est aussi là qu'entreront les communes de Flandre et de Wallonie, le jour où ces régions ouvriront. |

Depuis l'éditeur de tables de Supabase, ou en SQL :

```sql
-- Corriger les horaires d'Ixelles : la fiche change aussitôt.
update public.communes_regles
   set horaires = 'Payant du lundi au samedi, de 9 h à 21 h.'
 where commune_slug = 'ixelles' and version = 1;

-- Annoncer un changement : Ixelles passe en jaune sur la carte.
insert into public.regles_changements (commune_slug, titre, resume, importance, publie_le, source_url)
values ('ixelles', 'Nouvelles zones rouges autour de la place Flagey',
        'Le stationnement devient payant jusqu''à 21 h dans les rues autour de la place.',
        'important', current_date, 'https://www.ixelles.be/…');

-- Un nouveau règlement voté : nouvelle version, datée de son entrée en vigueur.
-- La fiche l'annonce, puis bascule toute seule le jour venu.
insert into public.communes_regles (commune_slug, commune_nom, version, en_vigueur_depuis, zones, horaires)
values ('ixelles', 'Ixelles', 2, '2027-01-01', '…', '…');
```

Un lien (`source_url`) doit commencer par `https://`, et `commune_slug` doit
exister dans `communes` : une faute de frappe est refusée tout de suite, au lieu
de ne jamais s'afficher.
