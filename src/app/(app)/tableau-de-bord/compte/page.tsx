import type { Metadata } from "next";
import { lireUtilisateur } from "@/lib/supabase/server";
import { lireProfil } from "@/lib/dossiers";
import { Card, LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { ASSO } from "@/lib/data";
import { FormulaireProfil } from "./FormulaireProfil";
import { FormulaireSecurite } from "./FormulaireSecurite";

export const metadata: Metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const [utilisateur, profil] = await Promise.all([lireUtilisateur(), lireProfil()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy-900">Mon compte</h1>
      <p className="mt-1 text-ink-soft">
        Vos informations, votre sécurité et la gestion de votre compte, au même endroit.
      </p>

      <Card title="Informations personnelles" subtitle="Elles servent à personnaliser vos lettres de contestation." className="mt-6">
        <FormulaireProfil
          prenom={profil?.prenom ?? ""}
          nom={profil?.nom ?? ""}
          adresse={profil?.adresse ?? ""}
          codePostal={profil?.code_postal ?? ""}
          commune={profil?.commune ?? ""}
        />
      </Card>

      <Card title="Sécurité" subtitle="Votre adresse de connexion et votre mot de passe." className="mt-6">
        <FormulaireSecurite email={utilisateur?.email ?? null} />
      </Card>

      <Card title="Gérer mon compte" className="mt-6">
        <div className="space-y-3 text-sm text-ink-soft">
          <p>
            Vos données ne servent qu&apos;au suivi de vos dossiers. Vous pouvez les faire effacer à
            tout moment : adressez-nous votre demande par e-mail, et votre compte, vos dossiers et
            leur historique seront supprimés.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <LinkBtn
              href={`mailto:${ASSO.email}?subject=${encodeURIComponent("Supprimer mon compte")}`}
              variant="secondary"
            >
              Demander la suppression de mon compte
            </LinkBtn>
            <LinkBtn href="/tableau-de-bord" variant="ghost">
              Retour à mes dossiers
            </LinkBtn>
          </div>
        </div>
      </Card>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Un souci de compte ?{" "}
        <BoutonContact variante="lien">Écrivez-nous</BoutonContact>.
      </p>
    </div>
  );
}