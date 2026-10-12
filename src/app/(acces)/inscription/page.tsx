import { redirect } from "next/navigation";

/**
 * Il n'y a plus de page d'inscription distincte : le même écran crée le
 * compte la première fois et l'ouvre les fois suivantes. L'adresse reste
 * valable pour les anciens liens et les favoris.
 */
export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  redirect(suite ? `/connexion?suite=${encodeURIComponent(suite)}` : "/connexion");
}
