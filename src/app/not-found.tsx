import { LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-5xl font-black text-gold-400">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-navy-900">
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Le lien est peut-être ancien. Reprenez depuis l&apos;accueil, ou écrivez-nous si vous avez besoin
        d&apos;aide pour votre amende.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkBtn href="/" variant="gold">
          Retour à l&apos;accueil
        </LinkBtn>
        <BoutonContact variante="secondaire" />
      </div>
    </div>
  );
}