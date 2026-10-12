-- Durée de vie du texte lu sur les documents (RGPD).
--
-- `dossiers.ocr_texte` contient le courrier tel qu'il a été lu : nom, adresse
-- du domicile, plaque, parfois numéro national. C'est la donnée la plus
-- sensible du projet, et jusqu'ici elle était conservée sans terme. Le RGPD
-- demande une durée de conservation justifiée par l'usage.
--
-- L'usage, ici, est de permettre à quelqu'un de revérifier ce qui avait été lu
-- si un champ paraît faux. Passé le délai de recours et de traitement, cet
-- usage disparaît : les champs extraits, eux, restent. On efface donc le texte
-- brut, jamais le dossier.

alter table public.dossiers
  add column if not exists ocr_purge_le timestamptz;

comment on column public.dossiers.ocr_purge_le is
  'Date d''effacement du texte brut lu sur le document. Le dossier, lui, est conserve.';

-- Les dossiers déjà en base reçoivent une échéance à partir de leur création.
update public.dossiers
   set ocr_purge_le = created_at + interval '180 days'
 where ocr_texte is not null and ocr_purge_le is null;

create or replace function public.dater_purge_ocr()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.ocr_texte is null then
    new.ocr_purge_le := null;
  elsif new.ocr_purge_le is null
     or (tg_op = 'UPDATE' and new.ocr_texte is distinct from old.ocr_texte) then
    new.ocr_purge_le := now() + interval '180 days';
  end if;
  return new;
end;
$$;

drop trigger if exists dater_purge_ocr on public.dossiers;
create trigger dater_purge_ocr
  before insert or update of ocr_texte on public.dossiers
  for each row execute function public.dater_purge_ocr();

-- Ménage quotidien. Trois choses, toutes sans effet visible pour l'utilisateur :
-- le texte brut périmé, les compteurs de débit, les accusés de lecture dont
-- l'alerte n'existe plus.
create or replace function public.purger_donnees_expirees()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  efface integer;
begin
  update public.dossiers
     set ocr_texte = null, ocr_purge_le = null
   where ocr_texte is not null
     and ocr_purge_le is not null
     and ocr_purge_le < now();
  get diagnostics efface = row_count;

  delete from public.limites_debit where fenetre < now() - interval '1 day';

  delete from public.alertes_vues a
   where not exists (select 1 from public.regles_changements r where r.id = a.changement_id);

  return efface;
end;
$$;

revoke all on function public.purger_donnees_expirees() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('purge-quotidienne', '15 3 * * *', $c$select public.purger_donnees_expirees();$c$);

-- Index de purge : sans lui, le ménage quotidien lit toute la table.
create index if not exists dossiers_ocr_purge_le_idx
  on public.dossiers (ocr_purge_le)
  where ocr_texte is not null;
