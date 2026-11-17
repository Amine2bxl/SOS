-- Deux courriers de plus : le plan de paiement et l'annulation à titre gracieux.
alter table public.lettres drop constraint if exists lettres_type_check;
alter table public.lettres add constraint lettres_type_check
  check (type in ('contestation', 'relance', 'reponse_huissier', 'demande_preuves', 'remboursement', 'echelonnement', 'bonne_foi'));
