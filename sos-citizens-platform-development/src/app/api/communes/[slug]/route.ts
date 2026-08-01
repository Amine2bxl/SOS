import { NextResponse } from "next/server";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await ensureSeeded();
  const { slug } = await ctx.params;
  const [row] = await db.select().from(communes).where(eq(communes.slug, slug));
  if (!row) return NextResponse.json({ error: "Commune introuvable" }, { status: 404 });
  return NextResponse.json(row);
}
