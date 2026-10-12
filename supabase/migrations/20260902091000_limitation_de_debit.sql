-- Limitation de débit partagée entre toutes les instances du site.
--
-- Le compte à rebours de 60 secondes affiché sur « renvoyer le code » est une
-- courtoisie d'interface, pas une protection : il vit dans le navigateur et
-- s'enlève en une ligne de console. Sans compteur côté serveur, rien n'empêche
-- d'appeler l'inscription dix mille fois — ce qui épuiserait le quota d'envoi
-- Resend, et transformerait le site en machine à envoyer des e-mails non
-- sollicités à des adresses qui ne nous ont rien demandé.
--
-- Le compteur vit en base et non en mémoire, parce que le site tourne sur des
-- fonctions sans état : deux appels successifs n'atterrissent presque jamais
-- sur la même instance.

create table if not exists public.limites_debit (
  cle      text        not null,
  fenetre  timestamptz not null,
  compte   integer     not null default 0,
  primary key (cle, fenetre)
);

alter table public.limites_debit enable row level security;
-- Aucune politique, donc aucun accès depuis un navigateur : cette table ne se
-- lit et ne s'écrit qu'à travers la fonction ci-dessous, appelée par le serveur.

comment on table public.limites_debit is
  'Compteurs de limitation de debit. Purges au fil de l''eau ; aucune donnee personnelle.';

-- Consomme un jeton et dit si l'appel est autorisé.
--
-- Fenêtre fixe plutôt que glissante : c'est une écriture au lieu de trois, et
-- l'imprécision aux bords (jusqu'à deux fois le quota à cheval sur deux
-- fenêtres) est sans conséquence pour l'usage visé.
create or replace function public.consommer_jeton(
  p_cle text,
  p_max integer,
  p_fenetre_secondes integer
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  debut timestamptz;
  n integer;
begin
  if p_cle is null or p_cle = '' or p_max < 1 or p_fenetre_secondes < 1 then
    return true;
  end if;

  debut := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_fenetre_secondes) * p_fenetre_secondes
  );

  insert into public.limites_debit as l (cle, fenetre, compte)
  values (left(p_cle, 200), debut, 1)
  on conflict (cle, fenetre) do update set compte = l.compte + 1
  returning l.compte into n;

  -- Ménage opportuniste : un appel sur cent balaie les fenêtres périmées, ce
  -- qui évite d'avoir à programmer une tâche pour trois lignes.
  if random() < 0.01 then
    delete from public.limites_debit where fenetre < clock_timestamp() - interval '1 day';
  end if;

  return n <= p_max;
end;
$$;

-- Le nom des compteurs est prévisible (« inscription:adresse »). S'il était
-- appelable depuis un navigateur, n'importe qui pourrait épuiser le quota d'une
-- personne précise et l'empêcher de créer son compte. Seul le serveur appelle.
revoke all on function public.consommer_jeton(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consommer_jeton(text, integer, integer) to service_role;
