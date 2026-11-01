import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, libraryItems, customCollections } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { getSessionUser } from "@/lib/auth";
import { desc, eq, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const user = await getSessionUser();
    const profileIdParam = req.nextUrl.searchParams.get("profileId");

    let userProfiles = await db
      .select()
      .from(profiles)
      .where(user ? eq(profiles.userId, user.id) : isNull(profiles.userId))
      .orderBy(profiles.id);

    // A signed-in user with no profiles yet gets one created automatically
    if (user && userProfiles.length === 0) {
      const [created] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          name: user.name,
          handle:
            "@" + user.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18),
          avatarGradient: "from-red-600 to-rose-700",
          avatarEmoji: "🎬",
          bio: "Movies, shows & anime",
          subscribedProviders: ["netflix", "prime", "max"],
          preferredGenres: ["Action", "Drama", "Science Fiction"],
          isKids: false,
        })
        .returning();
      userProfiles = [created];
    }

    const activeProfile =
      userProfiles.find((p) => String(p.id) === profileIdParam) ||
      userProfiles[0];

    const items = activeProfile
      ? await db
          .select()
          .from(libraryItems)
          .where(eq(libraryItems.profileId, activeProfile.id))
          .orderBy(desc(libraryItems.updatedAt))
      : [];

    const collections = await db
      .select()
      .from(customCollections)
      .orderBy(desc(customCollections.createdAt));

    return NextResponse.json({
      user,
      profiles: userProfiles,
      activeProfile,
      library: items,
      collections,
    });
  } catch (error) {
    console.error("GET /api/state error:", error);
    return NextResponse.json({ error: "Failed to load state" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const user = await getSessionUser();
    const body = await req.json();

    if (body.action === "createProfile") {
      const name = String(body.name || "Viewer").trim().slice(0, 40);
      const handle =
        "@" + name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18);
      const [created] = await db
        .insert(profiles)
        .values({
          userId: user?.id ?? null,
          name,
          handle: handle === "@" ? "@viewer" : handle,
          avatarGradient: body.avatarGradient || "from-red-600 to-rose-700",
          avatarEmoji: body.avatarEmoji || "🎬",
          bio: body.bio || "Movies, shows & anime",
          subscribedProviders: Array.isArray(body.subscribedProviders)
            ? body.subscribedProviders
            : ["netflix", "prime"],
          preferredGenres: Array.isArray(body.preferredGenres)
            ? body.preferredGenres
            : ["Action", "Drama"],
          isKids: Boolean(body.isKids),
        })
        .returning();

      return NextResponse.json({ profile: created });
    }

    if (body.action === "updateSubscriptions") {
      const profileId = Number(body.profileId);
      const subscribedProviders: string[] = Array.isArray(
        body.subscribedProviders
      )
        ? body.subscribedProviders
        : [];

      const [updated] = await db
        .update(profiles)
        .set({ subscribedProviders })
        .where(eq(profiles.id, profileId))
        .returning();

      return NextResponse.json({ profile: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/state error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
