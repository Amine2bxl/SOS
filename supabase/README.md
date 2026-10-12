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
