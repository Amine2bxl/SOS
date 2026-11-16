-- Les appareils reconnus : après une première vérification (code par e-mail,
-- par SMS, lien ou Google), l'appareil est retenu ; la fois suivante, une
-- touche suffit pour rentrer, sans nouveau code.
--
-- Le navigateur garde un jeton secret dans un cookie httpOnly ; la base ne
-- garde que son empreinte (SHA-256). Un jeton volé dans la base ne sert à rien.
-- Le jeton change à chaque utilisation, expire au bout d'un an, et chaque
-- appareil se retire d'un geste depuis « Mon compte ».

create table if not exists public.appareils_reconnus (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  empreinte   text not null check (char_length(empreinte) = 64),
  libelle     text check (libelle is null or char_length(libelle) <= 80),
  cree_le     timestamptz not null default now(),
  utilise_le  timestamptz not null default now(),
  expire_le   timestamptz not null default now() + interval '365 days',
  revoque_le  timestamptz
);

create index if not exists appareils_reconnus_user_idx on public.appareils_reconnus (user_id);

alter table public.appareils_reconnus enable row level security;

-- Chacun voit ses appareils, et les retire. Créer, utiliser ou faire tourner
-- un jeton passe par le serveur (clé service_role) : aucune politique d'ajout.
drop policy if exists "appareils lisibles par leur proprietaire" on public.appareils_reconnus;
create policy "appareils lisibles par leur proprietaire"
  on public.appareils_reconnus for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "appareils retirables par leur proprietaire" on public.appareils_reconnus;
create policy "appareils retirables par leur proprietaire"
  on public.appareils_reconnus for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Les appareils expirés ou retirés depuis plus d'un mois disparaissent.
create or replace function public.purger_appareils()
returns void
language sql
security definer
set search_path to ''
as $$
  delete from public.appareils_reconnus
  where expire_le < now() - interval '30 days'
     or revoque_le < now() - interval '30 days';
$$;

revoke all on function public.purger_appareils() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.unschedule('purge-appareils')
  where exists (select 1 from cron.job where jobname = 'purge-appareils');
select cron.schedule('purge-appareils', '05 4 * * *', $c$select public.purger_appareils();$c$);
