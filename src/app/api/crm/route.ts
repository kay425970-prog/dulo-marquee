import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dbUnavailable, dbConfigured } from "@/lib/api-guards";
import {
  crmDeals,
  profiles,
  libraryItems,
  mediaReviews,
  watchParties,
} from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!dbConfigured) {
      return dbUnavailable({ deals: [], metrics: null, profiles: [] });
    }
    await ensureDbInitialized();
    const [deals, allProfiles, allLib, allReviews, allParties] =
      await Promise.all([
        db.select().from(crmDeals).orderBy(desc(crmDeals.updatedAt)),
        db.select().from(profiles),
        db.select().from(libraryItems),
        db.select().from(mediaReviews),
        db.select().from(watchParties),
      ]);

    const totalPipelineValue = deals.reduce((acc, d) => acc + d.dealValue, 0);

    return NextResponse.json({
      deals,
      metrics: {
        activeProfiles: allProfiles.length,
        watchlistSaves: allLib.filter((i) => i.inWatchlist).length,
        favoritesCount: allLib.filter((i) => i.isFavorite).length,
        activeStreams: allLib.filter((i) => i.progressPercent > 0).length,
        communityReviews: allReviews.length,
        liveWatchParties: allParties.length,
        totalPipelineValue,
      },
      profiles: allProfiles,
    });
  } catch (error) {
    console.error("GET /api/crm error:", error);
    return NextResponse.json(
      { error: "Failed to load CRM telemetry" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    if (body.action === "createDeal") {
      const [created] = await db
        .insert(crmDeals)
        .values({
          title: String(body.title || "Untitled Licensing Deal").trim(),
          studio: String(body.studio || "Independent Studio").trim(),
          stage: String(body.stage || "scouting"),
          dealValue: Math.max(0, Number(body.dealValue || 250000)),
          priority: String(body.priority || "High"),
          owner: String(body.owner || "Elena Vance"),
          mediaType: String(body.mediaType || "Movie"),
          notes: String(body.notes || "").trim(),
        })
        .returning();
      return NextResponse.json({ deal: created });
    }

    if (body.action === "moveStage") {
      const id = Number(body.id);
      const stage = String(body.stage);
      const [updated] = await db
        .update(crmDeals)
        .set({ stage, updatedAt: new Date() })
        .where(eq(crmDeals.id, id))
        .returning();
      return NextResponse.json({ deal: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/crm error:", error);
    return NextResponse.json(
      { error: "CRM operation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const id = Number(req.nextUrl.searchParams.get("id"));
    await db.delete(crmDeals).where(eq(crmDeals.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/crm error:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
