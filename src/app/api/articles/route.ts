import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(articles);
  return NextResponse.json(rows);
}
