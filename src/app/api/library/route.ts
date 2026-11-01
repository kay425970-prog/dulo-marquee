import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { libraryItems } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    const profileId = Number(body.profileId || 1);
    const mediaId = String(body.mediaId);
    const mediaType = String(body.mediaType || "movie");

    const existingList = await db
      .select()
      .from(libraryItems)
      .where(
        and(
          eq(libraryItems.profileId, profileId),
          eq(libraryItems.mediaId, mediaId)
        )
      )
      .limit(1);

    const existing = existingList[0];

    if (existing) {
      const nextWatchlist =
        typeof body.inWatchlist === "boolean"
          ? body.inWatchlist
          : body.toggle === "watchlist"
            ? !existing.inWatchlist
            : existing.inWatchlist;

      const nextFavorite =
        typeof body.isFavorite === "boolean"
          ? body.isFavorite
          : body.toggle === "favorite"
            ? !existing.isFavorite
            : existing.isFavorite;

      const nextProgress =
        typeof body.progressPercent === "number"
          ? Math.max(0, Math.min(100, Math.round(body.progressPercent)))
          : existing.progressPercent;

      const nextSeconds =
        typeof body.progressSeconds === "number"
          ? Math.max(0, Math.round(body.progressSeconds))
          : existing.progressSeconds;

      const [updated] = await db
        .update(libraryItems)
        .set({
          inWatchlist: nextWatchlist,
          isFavorite: nextFavorite,
          progressPercent: nextProgress,
          progressSeconds: nextSeconds,
          lastSeason:
            typeof body.lastSeason === "number"
              ? body.lastSeason
              : existing.lastSeason,
          lastEpisode:
            typeof body.lastEpisode === "number"
              ? body.lastEpisode
              : existing.lastEpisode,
          updatedAt: new Date(),
        })
        .where(eq(libraryItems.id, existing.id))
        .returning();

      return NextResponse.json({ item: updated });
    } else {
      const [created] = await db
        .insert(libraryItems)
        .values({
          profileId,
          mediaId,
          mediaType,
          title: String(body.title || "Untitled"),
          posterUrl: String(body.posterUrl || ""),
          backdropUrl: String(body.backdropUrl || ""),
          year: String(body.year || "2026"),
          rating: String(body.rating ?? "8.5"),
          genres: Array.isArray(body.genres) ? body.genres : [],
          inWatchlist:
            body.toggle === "watchlist"
              ? true
              : Boolean(body.inWatchlist ?? false),
          isFavorite:
            body.toggle === "favorite"
              ? true
              : Boolean(body.isFavorite ?? false),
          progressPercent:
            typeof body.progressPercent === "number"
              ? Math.max(0, Math.min(100, Math.round(body.progressPercent)))
              : 0,
          progressSeconds:
            typeof body.progressSeconds === "number"
              ? Math.max(0, Math.round(body.progressSeconds))
              : 0,
          lastSeason: Number(body.lastSeason || 1),
          lastEpisode: Number(body.lastEpisode || 1),
        })
        .returning();

      return NextResponse.json({ item: created });
    }
  } catch (error) {
    console.error("POST /api/library error:", error);
    return NextResponse.json(
      { error: "Failed to update library item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const profileId = Number(req.nextUrl.searchParams.get("profileId") || 1);
    const mediaId = String(req.nextUrl.searchParams.get("mediaId") || "");
    const clearProgressOnly =
      req.nextUrl.searchParams.get("clearProgress") === "true";

    if (clearProgressOnly) {
      await db
        .update(libraryItems)
        .set({ progressPercent: 0, progressSeconds: 0, updatedAt: new Date() })
        .where(
          and(
            eq(libraryItems.profileId, profileId),
            eq(libraryItems.mediaId, mediaId)
          )
        );
    } else {
      await db
        .delete(libraryItems)
        .where(
          and(
            eq(libraryItems.profileId, profileId),
            eq(libraryItems.mediaId, mediaId)
          )
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/library error:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
