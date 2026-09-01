import { LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";

/**
 * Affiché à la place des pages de compte lorsque la base n'est pas configurée.
 * L'objectif est qu'une variable d'environnement manquante n'empêche jamais un
 * visiteur d'obtenir de l'aide : le contact (WhatsApp, e-mail) reste en évidence.
 */
export function ServiceIndisponible() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h2 className="font-display text-2xl font-bold text-navy-900">
        Cet espace est en cours d&apos;installation
      </h2>
      <p className="mt-4 leading-relaxed text-ink-soft">
        La création de compte et le suivi en ligne arrivent bientôt. Le reste du site fonctionne, et
        nous restons joignables pour vous aider.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <BoutonContact variante="gold" />
        <LinkBtn href="/comprendre" variant="secondary">
          Comprendre mon courrier
        </LinkBtn>
      </div>
    </div>
  );
}
