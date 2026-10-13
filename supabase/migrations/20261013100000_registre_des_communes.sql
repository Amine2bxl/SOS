-- Le registre des communes, et des fiches de règles complètes.
--
-- La plateforme avance région par région : Bruxelles-Capitale d'abord, la
-- Flandre ensuite, la Wallonie après. Chaque région est un module : ses
-- communes entrent au registre, puis s'ouvrent au public (`ouverte`) quand
-- leurs règles sont prêtes. Aujourd'hui : les 19 communes bruxelloises.
--
-- La page « Communes » du site lit ces tables à chaque visite : une règle
-- corrigée ici, ou un changement ajouté dans `regles_changements`, s'affiche
-- aussitôt sur la carte et dans la fiche de la commune.

/* ------------------------------------------------------------ registre */

create table if not exists public.communes (
  slug           text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom            text not null,
  nom_nl         text not null,
  region         text not null check (region in ('bruxelles', 'flandre', 'wallonie')),
  code_ins       text not null unique check (code_ins ~ '^[0-9]{5}$'),
  codes_postaux  text[] not null default '{}',
  site_officiel  text check (site_officiel ~ '^https://'),
  page_parking   text check (page_parking ~ '^https://'),
  ouverte        boolean not null default false,
  created_at     timestamptz not null default now()
);

comment on table public.communes is
  'Les communes couvertes par la plateforme. Une région s''ouvre en ajoutant ses communes puis en passant « ouverte » à vrai.';
comment on column public.communes.code_ins is 'Code INS (Statbel) de la commune.';
comment on column public.communes.codes_postaux is 'Codes postaux principaux (bpost).';
comment on column public.communes.page_parking is 'Page des tarifs et zones de la commune sur parking.brussels.';
comment on column public.communes.ouverte is 'Visible sur le site. Faux tant que les règles de la commune ne sont pas prêtes.';

alter table public.communes enable row level security;

drop policy if exists "registre des communes public" on public.communes;
create policy "registre des communes public"
  on public.communes for select to anon, authenticated
  using (true);

insert into public.communes (slug, nom, nom_nl, region, code_ins, codes_postaux, site_officiel, page_parking, ouverte) values
  ('anderlecht', 'Anderlecht', 'Anderlecht', 'bruxelles', '21001', '{1070}', 'https://www.anderlecht.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/anderlecht', true),
  ('auderghem', 'Auderghem', 'Oudergem', 'bruxelles', '21002', '{1160}', 'https://auderghem.be', 'https://www.parking.brussels/fr/reglementations/par-commune', true),
  ('berchem-sainte-agathe', 'Berchem-Sainte-Agathe', 'Sint-Agatha-Berchem', 'bruxelles', '21003', '{1082}', 'https://www.berchem-sainte-agathe.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/berchem-sainte-agathe', true),
  ('bruxelles-ville', 'Bruxelles-Ville', 'Brussel', 'bruxelles', '21004', '{1000,1020,1120,1130}', 'https://www.bruxelles.be', 'https://www.parking.brussels/fr/reglementations/par-commune', true),
  ('etterbeek', 'Etterbeek', 'Etterbeek', 'bruxelles', '21005', '{1040}', 'https://etterbeek.be', 'https://www.parking.brussels/fr/reglementations/par-commune', true),
  ('evere', 'Evere', 'Evere', 'bruxelles', '21006', '{1140}', 'https://evere.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/evere', true),
  ('forest', 'Forest', 'Vorst', 'bruxelles', '21007', '{1190}', 'https://forest.brussels', 'https://www.parking.brussels/fr/stationner-sa-voiture/forest', true),
  ('ganshoren', 'Ganshoren', 'Ganshoren', 'bruxelles', '21008', '{1083}', 'https://www.ganshoren.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/ganshoren', true),
  ('ixelles', 'Ixelles', 'Elsene', 'bruxelles', '21009', '{1050}', 'https://www.ixelles.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/ixelles', true),
  ('jette', 'Jette', 'Jette', 'bruxelles', '21010', '{1090}', 'https://www.jette.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/jette', true),
  ('koekelberg', 'Koekelberg', 'Koekelberg', 'bruxelles', '21011', '{1081}', 'https://www.koekelberg.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/koekelberg', true),
  ('molenbeek-saint-jean', 'Molenbeek-Saint-Jean', 'Sint-Jans-Molenbeek', 'bruxelles', '21012', '{1080}', 'https://www.molenbeek.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/molenbeek-saint-jean', true),
  ('saint-gilles', 'Saint-Gilles', 'Sint-Gillis', 'bruxelles', '21013', '{1060}', 'https://stgilles.brussels', 'https://www.parking.brussels/fr/stationner-sa-voiture/saint-gilles', true),
  ('saint-josse-ten-noode', 'Saint-Josse-ten-Noode', 'Sint-Joost-ten-Node', 'bruxelles', '21014', '{1210}', 'https://www.saint-josse.irisnet.be', 'https://www.parking.brussels/fr/reglementations/par-commune', true),
  ('schaerbeek', 'Schaerbeek', 'Schaarbeek', 'bruxelles', '21015', '{1030}', 'https://www.schaerbeek.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/schaerbeek', true),
  ('uccle', 'Uccle', 'Ukkel', 'bruxelles', '21016', '{1180}', 'https://www.uccle.be', 'https://www.parking.brussels/fr/reglementations/par-commune', true),
  ('watermael-boitsfort', 'Watermael-Boitsfort', 'Watermaal-Bosvoorde', 'bruxelles', '21017', '{1170}', 'https://www.watermael-boitsfort.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/watermael-boitsfort', true),
  ('woluwe-saint-lambert', 'Woluwe-Saint-Lambert', 'Sint-Lambrechts-Woluwe', 'bruxelles', '21018', '{1200}', 'https://www.woluwe1200.be', 'https://www.parking.brussels/fr/reglementations/par-commune', true),
  ('woluwe-saint-pierre', 'Woluwe-Saint-Pierre', 'Sint-Pieters-Woluwe', 'bruxelles', '21019', '{1150}', 'https://www.woluwe1150.be', 'https://www.parking.brussels/fr/stationner-sa-voiture/woluwe-saint-pierre', true)
on conflict (slug) do update set
  nom = excluded.nom,
  nom_nl = excluded.nom_nl,
  region = excluded.region,
  code_ins = excluded.code_ins,
  codes_postaux = excluded.codes_postaux;

/* ------------------------------------------------------- fiches de règles */

-- Les repères qu'affiche la fiche d'une commune. `cartes` porte le régime des
-- cartes de riverain ; `tarifs` reste vide tant qu'un montant n'a pas été
-- vérifié dans le règlement : la fiche renvoie alors vers parking.brussels.
alter table public.communes_regles
  add column if not exists horaires text,
  add column if not exists gratuite text,
  add column if not exists paiement text,
  add column if not exists mis_a_jour_le timestamptz not null default now();

comment on column public.communes_regles.zones is 'Zones (rouge, verte, bleue) et leur répartition.';
comment on column public.communes_regles.horaires is 'Plages horaires de paiement.';
comment on column public.communes_regles.gratuite is 'Périodes où le stationnement est libre.';
comment on column public.communes_regles.paiement is 'Moyens de paiement acceptés.';
comment on column public.communes_regles.cartes is 'Régime des cartes de riverain.';
comment on column public.communes_regles.tarifs is 'Tarifs vérifiés dans le règlement. Vide : la fiche renvoie vers parking.brussels.';
comment on column public.communes_regles.contestation is 'Comment contester dans cette commune.';
comment on column public.communes_regles.a_savoir is 'Le point de vigilance affiché en évidence.';
comment on column public.communes_regles.version is 'Une nouvelle version par nouveau règlement. La plus récente déjà en vigueur est affichée.';
comment on column public.communes_regles.en_vigueur_depuis is 'Date d''entrée en vigueur. Une date future annonce le règlement à venir.';

alter table public.communes_regles drop constraint if exists communes_regles_source_https;
alter table public.communes_regles add constraint communes_regles_source_https
  check (source_url is null or source_url ~ '^https://');

alter table public.regles_changements drop constraint if exists regles_changements_source_https;
alter table public.regles_changements add constraint regles_changements_source_https
  check (source_url is null or source_url ~ '^https://');

-- Une règle ou un changement rattaché à une commune inconnue est refusé tout
-- de suite, au lieu de ne jamais s'afficher.
alter table public.communes_regles drop constraint if exists communes_regles_commune_fkey;
alter table public.communes_regles add constraint communes_regles_commune_fkey
  foreign key (commune_slug) references public.communes (slug) on update cascade;

alter table public.regles_changements drop constraint if exists regles_changements_commune_fkey;
alter table public.regles_changements add constraint regles_changements_commune_fkey
  foreign key (commune_slug) references public.communes (slug) on update cascade;

create index if not exists regles_changements_commune_idx
  on public.regles_changements (commune_slug, publie_le desc);

comment on column public.regles_changements.commune_slug is 'La commune concernée. Vide : le changement vaut pour toute la Région.';

-- La date de mise à jour suit chaque modification de la fiche.
create or replace function public.communes_regles_horodater()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.mis_a_jour_le := now();
  return new;
end;
$$;

revoke execute on function public.communes_regles_horodater() from public, anon, authenticated;

drop trigger if exists communes_regles_horodatage on public.communes_regles;
create trigger communes_regles_horodatage
  before update on public.communes_regles
  for each row execute function public.communes_regles_horodater();

-- Les repères de la première version, complétés : ceux du site, plus détaillés
-- que la première saisie.
update public.communes_regles r
   set zones = v.zones,
       horaires = v.horaires,
       gratuite = v.gratuite,
       paiement = v.paiement,
       cartes = v.cartes,
       a_savoir = v.a_savoir
  from (values
  ('anderlecht',
   'Zones vertes et rouges, avec des poches de stationnement mixte autour des marchés et des commerces.',
   'Payant selon la zone, généralement en journée en semaine et le samedi ; grille exacte dans le règlement communal.',
   'Souvent libre la nuit et le dimanche et les jours fériés, selon la zone.',
   'Application parking.brussels, SMS 4411 et horodateurs. Certaines zones sont en paiement uniquement numérique.',
   'Cartes de riverain délivrées par la commune, avec enregistrement de la plaque.',
   'Vérifiez les rues en zone mixte et les horaires de marché : le régime peut changer à quelques rues près.'),
  ('auderghem',
   'Zones vertes, et zones rouges à proximité des gares et des métros (Herrmann-Debroux notamment).',
   'Payant en journée en semaine ; le samedi peut être soumis à paiement près des pôles de transport.',
   'Couramment libre la nuit, le dimanche et les jours fériés en zone verte.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de cartes de riverain propre à la commune, soumis à enregistrement de la plaque.',
   'Abords de métro : contrôles ScanCar fréquents. Conservez la preuve de votre session de paiement.'),
  ('berchem-sainte-agathe',
   'Zones vertes majoritaires, avec des poches rouges le long des axes commerciaux.',
   'Paiement en journée en semaine dans les zones concernées ; détail dans le règlement communal.',
   'Souvent gratuit la nuit, le dimanche et les jours fériés hors zones rouges.',
   'Application parking.brussels, SMS et horodateurs.',
   'Cartes de riverain délivrées par la commune pour les résidents.',
   'Règlement communal propre : vérifiez toujours la version applicable à la date du constat.'),
  ('bruxelles-ville',
   'Zones rouges, vertes et bleues ; le Pentagone est en zone rouge stricte et dense.',
   'Stationnement payant sur de larges plages : en journée et souvent le samedi ; certaines zones en soirée.',
   'La gratuité (nuit, dimanche, jours fériés) varie fort selon la zone — à vérifier impérativement.',
   'Application parking.brussels, SMS, horodateurs ; paiement numérique souvent seul accepté en zone rouge.',
   'Cartes riverains par secteur du Pentagone : la correspondance plaque/secteur doit être vérifiée.',
   'Centre-ville à forte pression : une session active mais mal enregistrée justifie souvent de contester avec la capture d''écran.'),
  ('etterbeek',
   'Zones vertes et rouges, avec un régime particulier autour du quartier des institutions européennes.',
   'Payant en journée en semaine et souvent le samedi dans les zones rouges.',
   'Nuit, dimanche et jours fériés généralement libres en zones vertes.',
   'Application parking.brussels, SMS et horodateurs.',
   'Cartes de riverain communales, avec règles propres près des institutions européennes.',
   'Régimes particuliers près des institutions européennes : vérifiez le statut exact de la rue.'),
  ('evere',
   'Zones vertes et rouges, concentrées autour des pôles commerciaux et des nœuds de transport.',
   'Paiement en journée en semaine ; le samedi selon les zones.',
   'Libre la nuit et le dimanche en général.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain propre à la commune.',
   'Attention aux rues à la frontière avec Schaerbeek : la commune du constat peut être l''une ou l''autre.'),
  ('forest',
   'Zones vertes et rouges, renforcées autour de la gare de Forest-Midi.',
   'Payant en journée en semaine et près de la gare.',
   'Nuit, dimanche et jours fériés généralement libres.',
   'Application parking.brussels, SMS et horodateurs.',
   'Cartes de riverain délivrées par la commune.',
   'Contrôles renforcés autour des salles de spectacle (Forest National) lors des événements.'),
  ('ganshoren',
   'Zones vertes, avec des poches rouges près de l''hôpital et du Basilix.',
   'Paiement en journée en semaine dans les zones concernées.',
   'Libre la nuit et le dimanche en général.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain de la commune.',
   'Zones hospitalières à régime spécifique : vérifiez les panneaux et le règlement.'),
  ('ixelles',
   'Zones rouges et vertes denses, zones bleues résiduelles.',
   'Payant sur de larges plages, en semaine et souvent le samedi ; proximité des campus et commerces.',
   'Nuit, dimanche et jours fériés généralement libres, selon zone.',
   'Application parking.brussels, SMS, horodateurs ; paiement numérique souvent privilégié.',
   'Réseau dense de cartes de riverain, avec secteurs précis.',
   'Très forte densité de ScanCars : conservez vos preuves de session et demandez les photos du contrôle.'),
  ('jette',
   'Zones vertes et rouges, avec un régime propre autour de l''hôpital universitaire.',
   'Payant en journée en semaine ; le samedi selon les zones.',
   'Libre la nuit, le dimanche et les jours fériés hors zones rouges.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain communal.',
   'Zones hospitalières : vérifiez le statut particulier de la rue et des panneaux.'),
  ('koekelberg',
   'Zones vertes, avec une poche rouge autour de la Basilique et du pôle touristique.',
   'Payant en journée en semaine dans les zones concernées.',
   'Libre la nuit et le dimanche en général.',
   'Application parking.brussels, SMS et horodateurs.',
   'Cartes de riverain délivrées par la commune.',
   'Signalisation ponctuelle lors des événements à la Basilique : photographiez le cadre du stationnement.'),
  ('molenbeek-saint-jean',
   'Zones vertes et rouges, avec des zones denses autour des métros et axes commerçants.',
   'Payant en journée en semaine et souvent le samedi dans les zones rouges.',
   'Nuit, dimanche et jours fériés généralement libres.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain propre à la commune.',
   'Vérifiez les rues en transition de zone : une frontière mal posée peut fonder une contestation.'),
  ('saint-gilles',
   'Zones rouges et vertes denses ; le Quartier Louise est en zone rouge.',
   'Payant sur de larges plages en semaine et le samedi.',
   'Nuit, dimanche et jours fériés généralement libres, selon zone.',
   'Application parking.brussels, SMS, horodateurs.',
   'Cartes de riverain par secteur, avec enregistrement de plaque.',
   'Stationnement très tendu et contrôles fréquents. Siège de notre association.'),
  ('saint-josse-ten-noode',
   'Zone rouge quasi généralisée, très dense.',
   'Paiement quasi permanent en journée, y compris souvent le samedi.',
   'Plages de gratuité limitées : vérifiez impérativement le règlement.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain strict dû à la densité.',
   'Zone rouge stricte : vérifiez les dérogations et cartes applicables avant de contester.'),
  ('schaerbeek',
   'Zones vertes, rouges et bleues sur un territoire étendu et hétérogène.',
   'Payant en journée en semaine, selon la zone ; grand axe commerçant sous paiement élargi.',
   'Nuit, dimanche et jours fériés généralement libres hors zones rouges.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain avec secteurs précis.',
   'Commune très étendue : vérifiez précisément la zone de la rue exacte du constat.'),
  ('uccle',
   'Zones vertes majoritaires, poches rouges commerciales (Chaussée d''Alsemberg, place Saint-Job).',
   'Payant en journée en semaine dans les zones concernées.',
   'Libre la nuit et le dimanche en général.',
   'Application parking.brussels, SMS et horodateurs.',
   'Cartes de riverain selon secteurs.',
   'Certaines voiries sont régionales : le gestionnaire (commune ou Région) peut différer et importe pour la contestation.'),
  ('watermael-boitsfort',
   'Zones vertes, et un régime particulier autour des étangs et des bois.',
   'Payant en journée en semaine dans les zones concernées.',
   'Régime spécifique le week-end près des étangs et des bois : à vérifier.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain communal.',
   'Le week-end près des étangs change le régime : photographiez la signalisation du jour du constat.'),
  ('woluwe-saint-lambert',
   'Zones vertes, poches rouges sur les pôles shopping et métro (Tomberg, Roodebeek).',
   'Payant en journée en semaine et souvent le samedi dans les zones rouges.',
   'Nuit, dimanche et jours fériés généralement libres.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain par secteur.',
   'Zones commerciales à durée limitée : une session validée mais hors plage exacte mérite vérification.'),
  ('woluwe-saint-pierre',
   'Zones vertes, poches rouges sur les avenues commerçantes.',
   'Payant en journée en semaine dans les zones concernées.',
   'Libre la nuit, le dimanche et les jours fériés en général.',
   'Application parking.brussels, SMS et horodateurs.',
   'Régime de riverain communal.',
   'Vérifiez les avenues à régime mixte : la règle peut changer d''un côté à l''autre de la rue.')
  ) as v (slug, zones, horaires, gratuite, paiement, cartes, a_savoir)
 where r.commune_slug = v.slug
   and r.version = 1;

/* ------------------------------------------------------------ en direct */

-- La page « Communes » écoute ces trois tables : une modification s'y affiche
-- sans recharger. Données publiques (lecture ouverte à tous par RLS) : rien
-- de privé ne transite par ce canal.
do $$
declare
  t text;
begin
  foreach t in array array['communes', 'communes_regles', 'regles_changements'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
