import { NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const [row] = await db
    .insert(contacts)
    .values({
      type: body.type === "accompagnement" ? "accompagnement" : body.type === "suppression" ? "suppression" : "contact",
      nom: body.nom ?? null,
      email: body.email ?? null,
      sujet: body.sujet ?? null,
      message: body.message ?? null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
