import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { ensureDbInitialized } from "@/lib/db-bootstrap";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await ensureDbInitialized();
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
