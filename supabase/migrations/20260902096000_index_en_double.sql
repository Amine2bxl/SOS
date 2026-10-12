-- Deux index en double, à supprimer.
--
-- Le lot précédent a ajouté `dossiers_user_created_idx` et
-- `evenements_dossier_date_idx` sans voir que des index identiques existaient
-- déjà sous un autre nom. Un index en double ne sert à rien en lecture — le
-- planificateur n'en utilise qu'un — mais il se paie à chaque écriture, et il
-- occupe de la place. L'avertisseur de performance de Supabase les signale.
--
-- ⚠️ Pas encore appliqué à la base hébergée : la connexion utilisée pour
-- administrer le projet n'a pas laissé passer ces `drop index` (trois essais,
-- aucune contention de verrou visible). À exécuter depuis l'éditeur SQL du
-- tableau de bord Supabase, ou à la prochaine application des migrations.
-- Sans effet fonctionnel : les index conservés sont rigoureusement identiques.

drop index if exists public.dossiers_user_created_idx;
drop index if exists public.evenements_dossier_date_idx;
