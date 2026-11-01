import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || email.split("@")[0];

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists. Sign in instead." },
        { status: 409 }
      );
    }

    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash: hashPassword(password) })
      .returning();

    // Create the user's first profile
    const [profile] = await db
      .insert(profiles)
      .values({
        userId: user.id,
        name,
        handle: "@" + name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18),
        avatarGradient: "from-red-600 to-rose-700",
        avatarEmoji: "🎬",
        bio: "Movies, shows & anime",
        subscribedProviders: ["netflix", "prime", "max"],
        preferredGenres: ["Action", "Drama", "Science Fiction"],
        isKids: false,
      })
      .returning();

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      profile,
    });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
