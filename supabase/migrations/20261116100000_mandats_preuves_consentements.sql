-- Mandats, preuves d'envoi, consentements versionnés, contact, solde reconstruit.
--
-- Cinq ajouts, chacun avec ses garanties EN BASE : la clé anonyme est publique,
-- un membre peut parler à PostgREST sans passer par nos écrans (voir
-- supabase/README.md). Ce qui n'est vérifié que dans le code n'est pas vérifié.
--
-- Rejouable : `if not exists`, `drop … if exists` avant chaque `create`, et
-- la tâche planifiée est désinscrite avant d'être réinscrite.

/* ------------------------------------------------------ dossiers : montants */

-- Le solde reconstruit (« chaque euro expliqué ») a besoin de deux montants que
-- le courrier ne dit pas : celui du premier courrier, et ce qui a déjà été
-- versé. Et le suivi de l'envoi : par quel canal, avec quelle preuve, et quand
-- l'accusé de réception est arrivé.
alter table public.dossiers
  add column if not exists montant_initial numeric(10, 2),
  add column if not exists deja_paye numeric(10, 2),
  add column if not exists mode_envoi text,
  add column if not exists preuve_envoi text,
  add column if not exists accuse_reception_le date;

alter table public.dossiers drop constraint if exists dossiers_montants_plausibles;
alter table public.dossiers add constraint dossiers_montants_plausibles
  check (
    (montant_initial is null or montant_initial between 0 and 100000)
    and (deja_paye is null or deja_paye between 0 and 100000)
  );

alter table public.dossiers drop constraint if exists dossiers_mode_envoi_valide;
alter table public.dossiers add constraint dossiers_mode_envoi_valide
  check (mode_envoi is null or mode_envoi in ('formulaire', 'recommande', 'email', 'depot', 'courrier'));

alter table public.dossiers drop constraint if exists dossiers_preuve_envoi_courte;
alter table public.dossiers add constraint dossiers_preuve_envoi_courte
  check (preuve_envoi is null or char_length(preuve_envoi) <= 80);

/* ------------------------------------------------- profils : type de compte */

alter table public.profiles
  add column if not exists type_compte text not null default 'particulier',
  add column if not exists organisation text,
  add column if not exists langue_interface text not null default 'fr';

alter table public.profiles drop constraint if exists profiles_type_compte_valide;
alter table public.profiles add constraint profiles_type_compte_valide
  check (type_compte in ('particulier', 'organisation'));

alter table public.profiles drop constraint if exists profiles_organisation_courte;
alter table public.profiles add constraint profiles_organisation_courte
  check (organisation is null or char_length(organisation) <= 120);

alter table public.profiles drop constraint if exists profiles_langue_interface_valide;
alter table public.profiles add constraint profiles_langue_interface_valide
  check (langue_interface in ('fr', 'nl', 'en', 'de'));

/* ------------------------------------------------ consentements versionnés */

-- La version acceptée de chaque document, et la date. Une ligne par
-- acceptation : quand les conditions changent, une nouvelle version s'ajoute
-- à côté de l'ancienne, qui reste comme preuve de ce qui avait été accepté.
create table if not exists public.consentements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  document    text not null check (document in ('cgu', 'confidentialite')),
  version     text not null check (char_length(version) <= 40),
  accepte_le  timestamptz not null default now(),
  unique (user_id, document, version)
);

alter table public.consentements enable row level security;

drop policy if exists "consentements lisibles par leur auteur" on public.consentements;
create policy "consentements lisibles par leur auteur"
  on public.consentements for select to authenticated
  using ((select auth.uid()) = user_id);

-- Une acceptation s'ajoute ; elle ne se modifie pas et ne se retire pas par
-- l'API (elle disparaît avec le compte, par la cascade).
drop policy if exists "consentements ajoutes par leur auteur" on public.consentements;
create policy "consentements ajoutes par leur auteur"
  on public.consentements for insert to authenticated
  with check ((select auth.uid()) = user_id and accepte_le <= now() + interval '1 minute');

/* ---------------------------------------------------------- opérateurs */

-- Les bénévoles de l'association qui accompagnent les dossiers. La table n'a
-- aucune politique : personne ne peut s'y inscrire par l'API. On y ajoute un
-- compte à la main, depuis la console :
--   insert into public.operateurs (user_id) values ('…');
create table if not exists public.operateurs (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  ajoute_le  timestamptz not null default now()
);

alter table public.operateurs enable row level security;

create or replace function public.est_operateur()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (select 1 from public.operateurs o where o.user_id = (select auth.uid()));
$$;

revoke all on function public.est_operateur() from public, anon;
grant execute on function public.est_operateur() to authenticated;

/* ---------------------------------------------------------------- mandats */

-- Le mandat : l'autorisation, donnée par un membre, que l'association accède
-- à UN dossier — et, s'il le précise, qu'elle écrive en son nom à l'organisme.
-- Limité dans le temps, révocable à tout moment, et sans lui aucun bénévole
-- ne voit rien.
create table if not exists public.mandats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  dossier_id  uuid not null references public.dossiers(id) on delete cascade,
  portee      text[] not null,
  message     text check (message is null or char_length(message) <= 2000),
  accorde_le  timestamptz not null default now(),
  expire_le   timestamptz not null,
  revoque_le  timestamptz,
  constraint mandats_portee_valide
    check (cardinality(portee) between 1 and 2 and portee <@ array['consulter', 'correspondre']::text[] and 'consulter' = any (portee)),
  constraint mandats_duree_valide
    check (expire_le > accorde_le and expire_le <= accorde_le + interval '366 days')
);

-- Un seul mandat en cours par dossier.
create unique index if not exists mandats_un_seul_actif
  on public.mandats (dossier_id) where revoque_le is null;
create index if not exists mandats_user_idx on public.mandats (user_id);

alter table public.mandats enable row level security;

drop policy if exists "mandats lisibles par le mandant" on public.mandats;
create policy "mandats lisibles par le mandant"
  on public.mandats for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "mandats en cours lisibles par les operateurs" on public.mandats;
create policy "mandats en cours lisibles par les operateurs"
  on public.mandats for select to authenticated
  using (public.est_operateur() and revoque_le is null and expire_le > now());

-- On ne donne mandat que sur un dossier qui est le sien.
drop policy if exists "mandats accordes par le mandant" on public.mandats;
create policy "mandats accordes par le mandant"
  on public.mandats for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and revoque_le is null
    and exists (select 1 from public.dossiers d where d.id = dossier_id and d.user_id = (select auth.uid()))
  );

drop policy if exists "mandats revocables par le mandant" on public.mandats;
create policy "mandats revocables par le mandant"
  on public.mandats for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- La révocation est la seule modification permise : la portée, la durée et le
-- dossier d'un mandat accordé ne bougent plus, et une révocation ne s'annule
-- pas (on en accorde un nouveau).
create or replace function public.figer_mandat()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.user_id <> old.user_id or new.dossier_id <> old.dossier_id or new.portee <> old.portee
     or new.accorde_le <> old.accorde_le or new.expire_le <> old.expire_le
     or new.message is distinct from old.message then
    raise exception 'MANDAT_FIGE';
  end if;
  if old.revoque_le is not null then
    raise exception 'MANDAT_DEJA_REVOQUE';
  end if;
  if new.revoque_le is null then
    raise exception 'MANDAT_REVOCATION_SEULE';
  end if;
  new.revoque_le := now();
  return new;
end;
$$;

drop trigger if exists figer_mandat on public.mandats;
create trigger figer_mandat
  before update on public.mandats
  for each row execute function public.figer_mandat();

/* ------------------------------- accès des opérateurs, sous mandat seulement */

-- Un opérateur ne lit un dossier, sa chronologie et ses lettres que tant qu'un
-- mandat en cours le couvre. Lecture seule : rien ici ne l'autorise à écrire.
create or replace function public.dossier_sous_mandat(p_dossier uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.est_operateur() and exists (
    select 1 from public.mandats m
    where m.dossier_id = p_dossier and m.revoque_le is null and m.expire_le > now()
  );
$$;

revoke all on function public.dossier_sous_mandat(uuid) from public, anon;
grant execute on function public.dossier_sous_mandat(uuid) to authenticated;

drop policy if exists "dossiers lisibles sous mandat" on public.dossiers;
create policy "dossiers lisibles sous mandat"
  on public.dossiers for select to authenticated
  using (public.dossier_sous_mandat(id));

drop policy if exists "evenements lisibles sous mandat" on public.evenements;
create policy "evenements lisibles sous mandat"
  on public.evenements for select to authenticated
  using (public.dossier_sous_mandat(dossier_id));

drop policy if exists "lettres lisibles sous mandat" on public.lettres;
create policy "lettres lisibles sous mandat"
  on public.lettres for select to authenticated
  using (public.dossier_sous_mandat(dossier_id));

/* ------------------------------------------------------ messages de contact */

-- Les messages du formulaire de contact. Aucune politique : seul le serveur
-- (clé service_role) les écrit, et seule la console les lit.
create table if not exists public.messages_contact (
  id       uuid primary key default gen_random_uuid(),
  nom      text not null check (char_length(nom) between 2 and 120),
  email    text not null check (char_length(email) <= 254),
  sujet    text not null check (sujet in ('redevance', 'amende', 'sac', 'administration', 'mediation', 'adhesion', 'presse', 'autre')),
  message  text not null check (char_length(message) between 20 and 4000),
  recu_le  timestamptz not null default now(),
  traite   boolean not null default false
);

create index if not exists messages_contact_recu_idx on public.messages_contact (recu_le);

alter table public.messages_contact enable row level security;

-- Douze mois, pas un de plus : c'est ce que le formulaire annonce.
create or replace function public.purger_messages_contact()
returns void
language sql
security definer
set search_path to ''
as $$
  delete from public.messages_contact where recu_le < now() - interval '12 months';
$$;

revoke all on function public.purger_messages_contact() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.unschedule('purge-messages-contact')
  where exists (select 1 from cron.job where jobname = 'purge-messages-contact');
select cron.schedule('purge-messages-contact', '55 3 * * *', $c$select public.purger_messages_contact();$c$);
