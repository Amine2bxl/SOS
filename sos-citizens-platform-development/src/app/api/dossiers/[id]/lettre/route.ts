import { NextResponse } from "next/server";
import { db } from "@/db";
import { dossiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { computeAudit } from "@/lib/audit";
import { generateLetter } from "@/lib/letter";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(dossiers).where(eq(dossiers.id, Number(id)));
  if (!row) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  const audit = computeAudit(row);
  return NextResponse.json(generateLetter(row, audit));
}
