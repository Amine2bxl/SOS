import { NextResponse } from "next/server";
import { db } from "@/db";
import { dossiers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { SUIVI_TEMPLATE } from "@/lib/constants";

export async function GET() {
  const rows = await db.select().from(dossiers).orderBy(desc(dossiers.updatedAt));
  return NextResponse.json(rows);
}

export async function POST() {
  const now = new Date();
  const ref = `SC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
  const [row] = await db
    .insert(dossiers)
    .values({
      ref,
      suivi: SUIVI_TEMPLATE.map((t) => ({ key: t.key, date: "", fait: false })),
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
