import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaReviews } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const mediaId = req.nextUrl.searchParams.get("mediaId");

    const rows = mediaId
      ? await db
          .select()
          .from(mediaReviews)
          .where(eq(mediaReviews.mediaId, mediaId))
          .orderBy(desc(mediaReviews.createdAt))
      : await db
          .select()
          .from(mediaReviews)
          .orderBy(desc(mediaReviews.createdAt))
          .limit(20);

    return NextResponse.json({ reviews: rows });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    if (body.action === "like") {
      const reviewId = Number(body.reviewId);
      const [existing] = await db
        .select()
        .from(mediaReviews)
        .where(eq(mediaReviews.id, reviewId))
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const [updated] = await db
        .update(mediaReviews)
        .set({ likesCount: existing.likesCount + 1 })
        .where(eq(mediaReviews.id, reviewId))
        .returning();

      return NextResponse.json({ review: updated });
    }

    const [created] = await db
      .insert(mediaReviews)
      .values({
        mediaId: String(body.mediaId),
        mediaType: String(body.mediaType || "movie"),
        profileName: String(body.profileName || "Cinema Guest"),
        avatarGradient: String(
          body.avatarGradient || "from-violet-500 to-fuchsia-500"
        ),
        rating: Math.max(1, Math.min(10, Number(body.rating || 9))),
        headline: String(body.headline || "Must-watch cinema").slice(0, 120),
        comment: String(body.comment || "").slice(0, 800),
        spoiler: Boolean(body.spoiler),
        likesCount: 1,
      })
      .returning();

    return NextResponse.json({ review: created });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
