/**
 * Écran plein affiché pendant une bascule (connexion, ouverture de l'espace
 * membre). Il rend la transition volontaire au lieu de saccadée : l'ancienne
 * page ne reste pas figée pendant le chargement de la nouvelle.
 */
export function EcranTransition({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-navy-950 text-white"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 font-display text-xl font-black text-navy-950">
        SC
      </span>
      <p className="font-display text-lg font-bold">{message}</p>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-navy-800">
        <div className="barre-avance h-full rounded-full bg-gold-400" />
      </div>
    </div>
  );
}
