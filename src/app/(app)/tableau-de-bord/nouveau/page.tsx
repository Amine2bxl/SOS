import type { Metadata } from "next";
import { Suspense } from "react";
import { listerDossiers, lireProfil } from "@/lib/dossiers";
import { quotaAtteint } from "@/lib/plans";
import { LinkBtn } from "@/components/ui";
import { AssistantScan } from "@/components/scan/AssistantScan";
import { IconeSceau } from "@/components/icones";

export const metadata: Metadata = { title: "Nouveau courrier" };
export const dynamic = "force-dynamic";

export default async function NouveauCourrier() {
  const [dossiers, profil] = await Promise.all([listerDossiers(), lireProfil()]);

  // Le plafond est aussi appliqué en base ; on l'annonce ici, avant que
  // l'utilisateur ne prenne la peine de scanner son courrier.
  if (quotaAtteint(profil?.plan, dossiers.length)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:py-20">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-navy-900 p-7 text-center text-white shadow-flotte">
          <div className="motif-points absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-navy-900">
              <IconeSceau className="h-10 w-10" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold">Vos 2 dossiers offerts sont utilisés</h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-100">
              Vos dossiers restent ouverts et suivis. Pour en ouvrir un nouveau, devenez membre de
              l&apos;association : dossiers illimités toute l&apos;année.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <LinkBtn href="/adherer" variant="gold" taille="lg">
                Adhérer — 70 € / an
              </LinkBtn>
              <LinkBtn href="/tableau-de-bord/dossiers" variant="outline" taille="lg">
                Mes dossiers
              </LinkBtn>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:py-10">
      <Suspense>
        <AssistantScan mode="membre" />
      </Suspense>
    </div>
  );
}
