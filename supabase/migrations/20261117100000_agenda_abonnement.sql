-- L'abonnement à l'agenda : une adresse secrète par membre, que l'agenda du
-- téléphone (Google, Apple, Outlook) relit tout seul. Chaque nouvelle échéance
-- y apparaît sans rien faire.
--
-- Le jeton est fabriqué par le serveur (gen_random_uuid côté application) ;
-- le changer rend l'ancienne adresse inutilisable.

alter table public.profiles add column if not exists agenda_jeton uuid;

create unique index if not exists profiles_agenda_jeton_unique
  on public.profiles (agenda_jeton) where agenda_jeton is not null;
