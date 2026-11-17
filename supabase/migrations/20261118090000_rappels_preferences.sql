-- Les rappels : par e-mail (par défaut) et par SMS (sur demande). Chacun
-- choisit dans « Mon compte ». Le SMS part de la passerelle de l'association,
-- seulement vers le numéro du compte.
alter table public.profiles
  add column if not exists rappels_email boolean not null default true,
  add column if not exists rappels_sms boolean not null default false;
