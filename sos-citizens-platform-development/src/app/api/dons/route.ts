import { NextResponse } from "next/server";
import { db } from "@/db";
import { dons } from "@/db/schema";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const [row] = await db
    .insert(dons)
    .values({
      prenom: body.prenom ?? null,
      nom: body.nom ?? null,
      email: body.email ?? null,
      montant: body.montant ?? null,
      frequence: body.frequence ?? "ponctuel",
      message: body.message ?? null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
