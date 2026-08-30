import { LinkBtn } from "@/components/ui";
import { PhoneIcon } from "@/components/Logo";
import { ASSO } from "@/lib/data";

/**
 * Affiché à la place des pages de compte lorsque la base n'est pas configurée.
 * L'objectif est qu'une variable d'environnement manquante n'empêche jamais un
 * visiteur d'obtenir de l'aide : le téléphone reste en évidence.
 */
export function ServiceIndisponible() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Cet espace est en cours d&apos;installation
      </h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        La création de compte et le suivi en ligne arrivent bientôt. Le reste du site fonctionne, et
        nous restons joignables pour vous aider.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkBtn href={`tel:${ASSO.telephoneLien}`} variant="gold">
          <PhoneIcon className="h-4 w-4" />
          {ASSO.telephone}
        </LinkBtn>
        <LinkBtn href="/contester" variant="secondary">
          Préparer ma lettre sans compte
        </LinkBtn>
      </div>
    </div>
  );
}
