import { NextResponse } from "next/server";
import { dbConfigured } from "@/db";

/**
 * Graceful guard for API routes: when DATABASE_URL isn't configured (e.g. a
 * fresh Vercel deploy before env vars are added), return empty/fallback data
 * instead of throwing so pages and builds keep working.
 */
export function dbUnavailable(payload: Record<string, unknown> = {}) {
  return NextResponse.json({
    ...payload,
    dbUnavailable: true,
    warning:
      "Database not configured. Set DATABASE_URL (or POSTGRES_URL) in Vercel → Settings → Environment Variables.",
  });
}

export { dbConfigured };
