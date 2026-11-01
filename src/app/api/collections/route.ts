import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customCollections, CollectionMediaEntry } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();
    const list = await db
      .select()
      .from(customCollections)
      .orderBy(desc(customCollections.createdAt));
    return NextResponse.json({ collections: list });
  } catch (error) {
    console.error("GET /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to load collections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    if (body.action === "create") {
      const [created] = await db
        .insert(customCollections)
        .values({
          profileId: Number(body.profileId || 1),
          name: String(body.name || "Untitled Collection").trim(),
          description: String(body.description || "").trim(),
          accentColor: String(body.accentColor || "violet"),
          items: Array.isArray(body.items) ? body.items : [],
          isPublic: true,
          likesCount: 1,
        })
        .returning();
      return NextResponse.json({ collection: created });
    }

    if (body.action === "addItem") {
      const collectionId = Number(body.collectionId);
      const entry = body.entry as CollectionMediaEntry;
      const [col] = await db
        .select()
        .from(customCollections)
        .where(eq(customCollections.id, collectionId))
        .limit(1);

      if (!col) {
        return NextResponse.json(
          { error: "Collection not found" },
          { status: 404 }
        );
      }

      const exists = col.items.some((i) => i.mediaId === entry.mediaId);
      const nextItems = exists ? col.items : [...col.items, entry];

      const [updated] = await db
        .update(customCollections)
        .set({ items: nextItems })
        .where(eq(customCollections.id, collectionId))
        .returning();

      return NextResponse.json({ collection: updated });
    }

    if (body.action === "like") {
      const collectionId = Number(body.collectionId);
      const [col] = await db
        .select()
        .from(customCollections)
        .where(eq(customCollections.id, collectionId))
        .limit(1);
      if (!col) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const [updated] = await db
        .update(customCollections)
        .set({ likesCount: col.likesCount + 1 })
        .where(eq(customCollections.id, collectionId))
        .returning();
      return NextResponse.json({ collection: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const id = Number(req.nextUrl.searchParams.get("id"));
    await db.delete(customCollections).where(eq(customCollections.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
