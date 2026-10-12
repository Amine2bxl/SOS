-- Le moteur SOS en base : ce qu'il a conclu, les lettres qu'il a rédigées, et
-- une adresse e-mail par personne.

/* ------------------------------------------------------------ dossiers */

-- Ce que le moteur sait du dossier au-delà des champs lus sur le courrier :
-- la région (qui décide du délai), les réponses aux questions, les moyens
-- retenus, et l'instantané de l'analyse au moment de la création. L'instantané
-- est conservé tel quel : si la base de savoir évolue, on sait toujours ce qui
-- avait été conseillé, et pourquoi.
alter table public.dossiers
  add column if not exists region text,
  add column if not exists crediteur text,
  add column if not exists langue text not null default 'fr',
  add column if not exists reponses jsonb not null default '{}'::jsonb,
  add column if not exists moyens_retenus text[] not null default '{}',
  add column if not exists analyse_moteur jsonb,
  add column if not exists date_envoi_contestation date,
  add column if not exists pieces_reunies text[] not null default '{}';

alter table public.dossiers drop constraint if exists dossiers_region_valide;
alter table public.dossiers add constraint dossiers_region_valide
  check (region is null or region in ('bruxelles', 'wallonie', 'flandre'));

alter table public.dossiers drop constraint if exists dossiers_langue_valide;
alter table public.dossiers add constraint dossiers_langue_valide
  check (langue in ('fr', 'nl'));

/* -------------------------------------------------------------- lettres */

-- Un dossier compte souvent plusieurs courriers : la contestation, puis la
-- relance, puis la réponse à l'huissier. Chacun est gardé, daté, dans l'ordre.
create table if not exists public.lettres (
  id          uuid primary key default gen_random_uuid(),
  dossier_id  uuid not null references public.dossiers(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('contestation', 'relance', 'reponse_huissier', 'demande_preuves', 'remboursement')),
  langue      text not null default 'fr' check (langue in ('fr', 'nl')),
  contenu     text not null check (char_length(contenu) <= 30000),
  created_at  timestamptz not null default now()
);

create index if not exists lettres_dossier_idx on public.lettres (dossier_id, created_at desc);
create index if not exists lettres_user_idx on public.lettres (user_id);

alter table public.lettres enable row level security;

create policy "lettres lisibles par leur proprietaire"
  on public.lettres for select to authenticated
  using ((select auth.uid()) = user_id);

-- On ne range une lettre que dans un dossier qui est le sien.
create policy "lettres creables par leur proprietaire"
  on public.lettres for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.dossiers d where d.id = dossier_id and d.user_id = (select auth.uid()))
  );

create policy "lettres supprimables par leur proprietaire"
  on public.lettres for delete to authenticated
  using ((select auth.uid()) = user_id);

/* ------------------------------------------- une adresse, une personne */

-- « jean.dupont@gmail.com », « jeandupont@gmail.com » et
-- « jean.dupont+sos@gmail.com » arrivent dans la même boîte. Sans forme
-- canonique, chacune ouvrait un compte — et deux contestations gratuites de
-- plus. La forme canonique retire le suffixe « +… » (partout) et les points
-- (chez Gmail, qui les ignore).
create or replace function public.canoniser_email(p_email text)
returns text
language sql
immutable
set search_path to ''
as $$
  select case
    when p_email is null or position('@' in p_email) = 0 then lower(p_email)
    when split_part(lower(p_email), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(p_email), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else split_part(split_part(lower(p_email), '@', 1), '+', 1) || '@' || split_part(lower(p_email), '@', 2)
  end
$$;

alter table public.profiles add column if not exists email_canonique text;

update public.profiles set email_canonique = public.canoniser_email(email) where email is not null;

create unique index if not exists profiles_email_canonique_unique
  on public.profiles (email_canonique)
  where email_canonique is not null;

create or replace function public.poser_email_canonique()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.email_canonique := public.canoniser_email(new.email);
  return new;
end;
$$;

drop trigger if exists poser_email_canonique on public.profiles;
create trigger poser_email_canonique
  before insert or update of email on public.profiles
  for each row execute function public.poser_email_canonique();

revoke all on function public.poser_email_canonique() from public, anon, authenticated;

-- Vérification avant création de compte, appelée par le serveur seulement :
-- elle dit si une variante de l'adresse a déjà un compte.
create or replace function public.email_canonique_pris(p_email text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.profiles where email_canonique = public.canoniser_email(p_email)
  )
$$;

revoke all on function public.email_canonique_pris(text) from public, anon, authenticated;
grant execute on function public.email_canonique_pris(text) to service_role;
