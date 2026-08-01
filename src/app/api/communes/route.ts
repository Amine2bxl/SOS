import { NextResponse } from "next/server";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(communes).orderBy(asc(communes.nom));
  return NextResponse.json(rows);
}
