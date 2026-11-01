import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchParties, WatchPartyMessage } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const roomCode = req.nextUrl.searchParams.get("roomCode");

    if (roomCode) {
      const [party] = await db
        .select()
        .from(watchParties)
        .where(eq(watchParties.roomCode, roomCode.toUpperCase()))
        .limit(1);
      return NextResponse.json({ party: party || null });
    }

    const list = await db
      .select()
      .from(watchParties)
      .orderBy(desc(watchParties.createdAt))
      .limit(15);

    return NextResponse.json({ parties: list });
  } catch (error) {
    console.error("GET /api/watch-party error:", error);
    return NextResponse.json(
      { error: "Failed to load watch parties" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    if (body.action === "create") {
      const code =
        "MQ-" + String(Math.floor(1000 + Math.random() * 9000));
      const hostName = String(body.hostName || "Alex Mercer");
      const initialMsg: WatchPartyMessage = {
        id: `m-${Date.now()}`,
        sender: hostName,
        avatarGradient: String(
          body.avatarGradient || "from-violet-500 to-fuchsia-500"
        ),
        text: `Opened live screening room ${code} for ${body.mediaTitle}! Grab your popcorn 🍿`,
        reaction: "🎬",
        timestamp: "Just now",
      };

      const [party] = await db
        .insert(watchParties)
        .values({
          roomCode: code,
          hostName,
          mediaId: String(body.mediaId),
          mediaType: String(body.mediaType || "movie"),
          mediaTitle: String(body.mediaTitle || "Feature Presentation"),
          posterUrl: String(body.posterUrl || ""),
          currentServer: String(body.currentServer || "marquee-direct"),
          season: Number(body.season || 1),
          episode: Number(body.episode || 1),
          status: "live",
          viewerCount: 1,
          messages: [initialMsg],
        })
        .returning();

      return NextResponse.json({ party });
    }

    if (body.action === "message") {
      const roomCode = String(body.roomCode || "").toUpperCase();
      const [party] = await db
        .select()
        .from(watchParties)
        .where(eq(watchParties.roomCode, roomCode))
        .limit(1);

      if (!party) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      const msg: WatchPartyMessage = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: String(body.sender || "Guest"),
        avatarGradient: String(
          body.avatarGradient || "from-violet-500 to-fuchsia-500"
        ),
        text: String(body.text || "").slice(0, 400),
        reaction: body.reaction ? String(body.reaction) : undefined,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const nextMessages = [...party.messages.slice(-49), msg];
      const [updated] = await db
        .update(watchParties)
        .set({ messages: nextMessages })
        .where(eq(watchParties.id, party.id))
        .returning();

      return NextResponse.json({ party: updated });
    }

    if (body.action === "join") {
      const roomCode = String(body.roomCode || "").toUpperCase();
      const [party] = await db
        .select()
        .from(watchParties)
        .where(eq(watchParties.roomCode, roomCode))
        .limit(1);

      if (!party) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      const [updated] = await db
        .update(watchParties)
        .set({ viewerCount: party.viewerCount + 1 })
        .where(eq(watchParties.id, party.id))
        .returning();

      return NextResponse.json({ party: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/watch-party error:", error);
    return NextResponse.json(
      { error: "Watch party operation failed" },
      { status: 500 }
    );
  }
}
