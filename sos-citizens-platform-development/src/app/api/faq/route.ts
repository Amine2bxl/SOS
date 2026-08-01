import { NextResponse } from "next/server";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(faqs).orderBy(asc(faqs.ordre));
  return NextResponse.json(rows);
}
