import { redirect } from "next/navigation";

/**
 * L'inscription vit sur l'écran de connexion, onglet « Créer un compte ».
 * L'adresse reste valable pour les anciens liens et les favoris.
 */
export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  redirect(suite ? `/connexion?compte=nouveau&suite=${encodeURIComponent(suite)}` : "/connexion?compte=nouveau");
}
