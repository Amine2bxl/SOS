/**
 * Ce qui s'affiche le temps qu'une page de l'espace membre arrive.
 *
 * La coquille (barre latérale, en-tête) reste en place : seule la page change.
 * Sans cet écran, un clic ne produisait rien de visible jusqu'à la réponse du
 * serveur — l'impression d'un site qui accroche. Le contour de la page vient
 * tout de suite ; le contenu le remplace dès qu'il est prêt.
 */
export default function Chargement() {
  return (
    <div role="status" aria-label="Chargement de la page" className="animate-pulse-doux">
      <div className="h-8 w-56 rounded-xl bg-navy-100" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-lg bg-navy-50" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-[var(--radius-carte)] border border-line/80 bg-card" />
        ))}
      </div>
    </div>
  );
}
