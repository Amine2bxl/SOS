/**
 * « Comprendre en 1 minute » : la vidéo animée qui explique le système belge.
 *
 * Elle ne se charge qu'au clic (`preload="none"`) : 5 Mo de moins pour ceux qui
 * ne la regardent pas. Sous-titres activés par défaut — beaucoup la regardent
 * sans le son, dans le tram.
 */
export function VideoExplication({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-paper shadow-flotte">
        <video
          controls
          playsInline
          preload="none"
          poster="/video/comprendre-en-1-minute.jpg"
          className="aspect-video w-full"
        >
          <source src="/video/comprendre-en-1-minute.mp4" type="video/mp4" />
          <track kind="captions" src="/video/comprendre-en-1-minute.vtt" srcLang="fr" label="Français" default />
          Votre navigateur ne lit pas la vidéo.{" "}
          <a href="/video/comprendre-en-1-minute.mp4">Télécharger la vidéo</a>.
        </video>
      </div>
      <figcaption className="mt-2 text-sm text-ink-soft">
        1 minute pour tout comprendre : redevance, délai, frais, erreurs fréquentes.
        <span className="ml-1 text-ink-faint">Voix : ElevenLabs.</span>
      </figcaption>
    </figure>
  );
}
