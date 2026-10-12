-- Les fonctions de déclencheur ne doivent pas être appelables par l'API REST.
--
-- Supabase expose automatiquement en `/rest/v1/rpc/<nom>` toute fonction du
-- schéma `public` sur laquelle `anon` ou `authenticated` a le droit EXECUTE —
-- et ce droit est accordé par défaut. Les fonctions de déclencheur s'y
-- retrouvaient donc publiées.
--
-- Appelées de l'extérieur elles échoueraient (pas de contexte de déclencheur,
-- donc pas de `new` ni de `old`), mais le contrôle d'accès ne se fonde pas sur
-- l'espoir qu'une fonction plante avant de faire des dégâts : plusieurs sont
-- `security definer` et tournent avec les droits du propriétaire. L'avertisseur
-- de Supabase les signalait, à juste titre.

revoke all on function public.appliquer_adhesion_payee() from public, anon, authenticated;
revoke all on function public.numeroter_adhesion() from public, anon, authenticated;
revoke all on function public.proteger_colonnes_facturation() from public, anon, authenticated;
revoke all on function public.dater_purge_ocr() from public, anon, authenticated;
revoke all on function public.actualiser_horodatage() from public, anon, authenticated;
revoke all on function public.verifier_quota_dossiers() from public, anon, authenticated;
revoke all on function public.creer_profil_a_l_inscription() from public, anon, authenticated;

-- Celle-ci n'est pas un déclencheur et ne lit rien : elle ne divulguerait rien.
-- Elle sort quand même de l'API, parce qu'une fonction publiée est une fonction
-- qu'il faut justifier, et celle-là ne sert qu'en interne.
revoke all on function public.forger_communication_structuree(bigint) from public, anon, authenticated;

-- `public.limites_debit` reste signalée « RLS activé, aucune politique » par
-- l'avertisseur. C'est exactement l'effet voulu : aucune politique signifie
-- aucun accès depuis un navigateur. La table ne se lit et ne s'écrit qu'à
-- travers `consommer_jeton`, réservée au rôle de service.
