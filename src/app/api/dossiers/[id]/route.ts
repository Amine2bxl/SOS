import { NextResponse } from "next/server";
import { db } from "@/db";
import { dossiers } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED = [
  "etape",
  "natureDossier",
  "documentRecu",
  "destinataireType",
  "conducteur",
  "prenom",
  "nom",
  "adresse",
  "codePostal",
  "communeResidence",
  "email",
  "telephone",
  "representeSos",
  "documentsRepresentation",
  "refRedevance",
  "refContestation",
  "refHuissier",
  "plaque",
  "autorite",
  "communeConstat",
  "montantReclame",
  "documentFileName",
  "chronologie",
  "motifPrincipal",
  "reponsesMotif",
  "faits",
  "pieces",
  "auditDoc",
  "statut",
  "letterType",
  "letterGeneratedAt",
  "letterSentAt",
  "suivi",
  "reponseAdministration",
] as const;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(dossiers).where(eq(dossiers.id, Number(id)));
  if (!row) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key];
  }
  const [row] = await db
    .update(dossiers)
    .set(patch as Partial<typeof dossiers.$inferInsert>)
    .where(eq(dossiers.id, Number(id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await db.delete(dossiers).where(eq(dossiers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
