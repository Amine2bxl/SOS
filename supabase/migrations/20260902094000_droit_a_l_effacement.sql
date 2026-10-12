-- Droit à l'effacement : pouvoir supprimer son compte soi-même.
--
-- Les conditions du site promettent « supprimez vos données quand vous
-- voulez », et le RGPD en fait un droit. Jusqu'ici, l'exercer demandait de nous
-- écrire et d'attendre qu'un bénévole trouve le temps de le faire à la main.
--
-- Les liaisons vers `auth.users` sont déjà en cascade : effacer le compte
-- d'authentification emporte profil, dossiers, événements, accusés de lecture
-- et adhésions. Mais seule la clé `service_role` peut toucher à `auth.users`.
-- Ces politiques permettent à l'écran de compte d'effacer les données
-- personnelles même sans cette clé — ce qui est l'essentiel : ce qui reste
-- alors est une ligne d'authentification vide, sans nom, sans adresse, sans
-- courrier.

create policy "profil supprimable par son proprietaire"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create policy "evenements supprimables par leur proprietaire"
  on public.evenements for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "alertes vues supprimables par leur proprietaire"
  on public.alertes_vues for delete to authenticated
  using ((select auth.uid()) = user_id);

-- `adhesions` n'en reçoit pas : une trace de paiement se conserve, et elle ne
-- contient ni nom, ni adresse, ni plaque. Elle part avec le compte
-- d'authentification, en cascade.
