import { db, dbConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Build & healthcheck must never hard-crash when DATABASE_URL isn't set yet.
  if (!dbConfigured) {
    return Response.json({
      ok: true,
      database: false,
      warning: "DATABASE_URL not set — persistence disabled. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: true });
  } catch {
    return Response.json({ ok: false, database: false }, { status: 500 });
  }
}
