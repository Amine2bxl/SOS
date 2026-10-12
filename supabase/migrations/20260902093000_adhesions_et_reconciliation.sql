-- Adhésions : une demande devient un paiement identifiable, puis une formule.
--
-- Jusqu'ici, adhérer posait un simple drapeau `plan_demande` sur le profil.
-- Rien ne reliait un virement reçu sur le compte de l'association à la personne
-- qui l'avait fait : il fallait deviner, à partir du nom du donneur d'ordre. À
-- l'échelle de quelques dizaines d'adhésions c'est pénible ; à quelques
-- milliers, c'est impossible.
--
-- Chaque demande reçoit donc sa **communication structurée** — les
-- +++123/4567/89012+++ que tout Belge connaît. La banque la restitue telle
-- quelle sur l'extrait de compte : le rapprochement devient exact, et non plus
-- approximatif. Et lorsque l'association marque une adhésion payée, la formule
-- s'applique toute seule.

create table if not exists public.adhesions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  formule            text not null check (formule in ('membre', 'independant', 'societe')),
  montant            numeric(10, 2) not null check (montant > 0),
  communication      text not null unique,
  statut             text not null default 'en_attente'
                       check (statut in ('en_attente', 'payee', 'annulee')),
  demandee_le        timestamptz not null default now(),
  payee_le           timestamptz,
  reference_paiement text,
  created_at         timestamptz not null default now()
);

create index if not exists adhesions_user_id_idx on public.adhesions (user_id, demandee_le desc);
create index if not exists adhesions_statut_idx on public.adhesions (statut) where statut = 'en_attente';

alter table public.adhesions enable row level security;

-- Un membre voit ses adhésions et peut en demander une. Il ne peut ni les
-- modifier ni les supprimer : c'est une trace comptable.
drop policy if exists "adhesions lisibles par leur proprietaire" on public.adhesions;
create policy "adhesions lisibles par leur proprietaire"
  on public.adhesions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "adhesions creables par leur proprietaire" on public.adhesions;
create policy "adhesions creables par leur proprietaire"
  on public.adhesions for insert to authenticated
  with check ((select auth.uid()) = user_id and statut = 'en_attente');

/* ------------------------------------------- communication structurée */

create sequence if not exists public.adhesions_communication_seq start with 2026000001;

-- Fabrique une communication structurée belge valide.
--
-- Douze chiffres : dix de numérotation, deux de contrôle égaux au reste de la
-- division par 97 (97 quand le reste est nul). C'est cette clé qui permet à la
-- banque de refuser une communication mal recopiée plutôt que de l'accepter
-- silencieusement.
create or replace function public.forger_communication_structuree(p_numero bigint)
returns text
language plpgsql
immutable
set search_path to ''
as $$
declare
  base bigint;
  controle integer;
  douze text;
begin
  base := p_numero % 10000000000;
  controle := base % 97;
  if controle = 0 then controle := 97; end if;
  douze := lpad(base::text, 10, '0') || lpad(controle::text, 2, '0');
  return '+++' || substr(douze, 1, 3) || '/' || substr(douze, 4, 4)
              || '/' || substr(douze, 8, 5) || '+++';
end;
$$;

create or replace function public.numeroter_adhesion()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.communication is null or new.communication = '' then
    new.communication := public.forger_communication_structuree(
      nextval('public.adhesions_communication_seq')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists numeroter_adhesion on public.adhesions;
create trigger numeroter_adhesion
  before insert on public.adhesions
  for each row execute function public.numeroter_adhesion();

/* ----------------------------------------------- application de la formule */

-- Marquer une adhésion payée applique la formule. Un seul geste côté
-- association, et le compte du membre suit — plafond levé, échéance posée à un
-- an. Sans cela, il faut penser à modifier le profil à la main, et un oubli se
-- traduit par un membre qui a payé et reste bloqué.
create or replace function public.appliquer_adhesion_payee()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.statut = 'payee' and (old.statut is distinct from 'payee') then
    new.payee_le := coalesce(new.payee_le, now());

    update public.profiles
       set plan = new.formule,
           plan_demande = null,
           plan_depuis = now(),
           -- Une adhésion prolonge celle en cours plutôt que de l'écraser.
           plan_expire_le = greatest(coalesce(plan_expire_le, now()), now()) + interval '1 year'
     where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists appliquer_adhesion_payee on public.adhesions;
create trigger appliquer_adhesion_payee
  before update on public.adhesions
  for each row execute function public.appliquer_adhesion_payee();

/* ------------------------------------------------- expiration des formules */

-- Une formule expirée redevient gratuite. Sans elle, une adhésion non
-- renouvelée resterait valable indéfiniment.
create or replace function public.expirer_formules()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  n integer;
begin
  update public.profiles
     set plan = 'gratuit', plan_expire_le = null
   where plan <> 'gratuit'
     and plan_expire_le is not null
     and plan_expire_le < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.expirer_formules() from public, anon, authenticated;

-- Tâche séparée de la purge : l'expiration d'une formule et l'effacement du
-- texte OCR n'ont aucune raison de tomber ensemble, et les séparer évite qu'un
-- échec de l'une emporte l'autre.
select cron.schedule('expiration-formules', '35 3 * * *', $c$select public.expirer_formules();$c$);
