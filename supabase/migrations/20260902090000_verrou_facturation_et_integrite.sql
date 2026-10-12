-- Durcissement : formule payante, intégrité des événements, valeurs de statut.
--
-- Contexte. La clé anonyme de Supabase est publique — elle est dans le
-- JavaScript envoyé au navigateur, c'est sa raison d'être. Un membre connecté
-- peut donc parler directement à PostgREST avec son propre jeton, sans passer
-- par nos écrans. Tout ce qui n'est vérifié que dans le code de l'application
-- n'est, en pratique, pas vérifié du tout : seule la base fait foi.

/* ---------------------------------------------------------------- formule */

-- La politique RLS de `profiles` autorise chacun à modifier SON profil. Elle ne
-- distingue pas les colonnes : `plan` en fait partie. Une requête d'une ligne
-- suffisait donc à s'attribuer la formule « Société » et à lever le plafond de
-- contestations. Les colonnes de facturation redeviennent ici la propriété
-- exclusive du serveur.
-- Sans `security definer`, volontairement. Dans une fonction `security
-- definer`, `current_user` vaut le PROPRIÉTAIRE de la fonction et jamais
-- l'appelant : le verrou ne se refermait alors sur personne. Un essai avec
-- `set local role authenticated` l'a montré — l'élévation passait. Cette
-- fonction ne touche qu'à NEW, elle n'a besoin d'aucun privilège.
create or replace function public.proteger_colonnes_facturation()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  -- `current_user` vaut « authenticated » ou « anon » quand la requête vient
  -- d'un navigateur, et « service_role » ou « postgres » quand elle vient de
  -- nous. Seuls les deux premiers sont bridés.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  new.plan           := old.plan;
  new.plan_depuis    := old.plan_depuis;
  new.plan_expire_le := old.plan_expire_le;

  -- La demande d'adhésion, elle, appartient bien au membre — mais elle ne peut
  -- désigner qu'une formule qui existe.
  if new.plan_demande is not null
     and new.plan_demande not in ('membre', 'independant', 'societe') then
    raise exception 'FORMULE_INCONNUE';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_facturation on public.profiles;
create trigger proteger_facturation
  before update on public.profiles
  for each row execute function public.proteger_colonnes_facturation();

/* ------------------------------------------------------------ événements */

-- L'ancienne politique vérifiait le propriétaire de l'événement, jamais celui
-- du dossier visé : on pouvait écrire dans la chronologie d'un dossier qui
-- n'était pas le sien.
drop policy if exists "evenements creables par leur proprietaire" on public.evenements;
create policy "evenements creables par leur proprietaire"
  on public.evenements
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dossiers d
      where d.id = dossier_id and d.user_id = (select auth.uid())
    )
  );

/* --------------------------------------------------------------- valeurs */

-- Un statut hors liste casse silencieusement l'affichage du tableau de bord et
-- le calcul de la prochaine action. La base refuse désormais l'inattendu.
alter table public.dossiers drop constraint if exists dossiers_statut_valide;
alter table public.dossiers add constraint dossiers_statut_valide
  check (statut in (
    'nouveau', 'a_contester', 'contestation_envoyee', 'en_attente_reponse',
    'accepte', 'rejete', 'clos'
  ));

alter table public.dossiers drop constraint if exists dossiers_type_document_valide;
alter table public.dossiers add constraint dossiers_type_document_valide
  check (type_document in (
    'notification', 'premier_rappel', 'deuxieme_rappel', 'mise_en_demeure',
    'contrainte', 'courrier_huissier'
  ));

-- Un montant négatif n'existe pas sur un courrier de redevance, et le plafond
-- écarte les lectures OCR aberrantes.
alter table public.dossiers drop constraint if exists dossiers_montant_plausible;
alter table public.dossiers add constraint dossiers_montant_plausible
  check (montant is null or (montant >= 0 and montant <= 100000));
