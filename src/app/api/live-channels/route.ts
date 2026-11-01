import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customLiveChannels } from "@/db/schema";
import { ensureDbInitialized } from "@/lib/db-bootstrap";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parseM3uText(raw: string): Array<{
  name: string;
  category: string;
  streamUrl: string;
}> {
  const trimmed = raw.trim();
  if (/^https?:\/\/\S+/i.test(trimmed) && !trimmed.includes("\n")) {
    return [
      {
        name: "Custom HLS Stream",
        category: "Custom IPTV",
        streamUrl: trimmed,
      },
    ];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: Array<{ name: string; category: string; streamUrl: string }> =
    [];

  let pendingName = "Imported IPTV Channel";
  let pendingGroup = "Custom IPTV";

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      if (groupMatch?.[1]) pendingGroup = groupMatch[1].slice(0, 32);
      const commaIdx = line.lastIndexOf(",");
      if (commaIdx !== -1 && commaIdx < line.length - 1) {
        pendingName = line.slice(commaIdx + 1).trim().slice(0, 60);
      }
    } else if (/^https?:\/\/\S+/i.test(line)) {
      results.push({
        name: pendingName,
        category: pendingGroup,
        streamUrl: line,
      });
      pendingName = `Imported Channel #${results.length + 1}`;
      pendingGroup = "Custom IPTV";
      if (results.length >= 25) break;
    }
  }

  return results;
}

export async function GET() {
  try {
    await ensureDbInitialized();
    const rows = await db
      .select()
      .from(customLiveChannels)
      .orderBy(desc(customLiveChannels.createdAt));
    return NextResponse.json({ channels: rows });
  } catch (error) {
    console.error("GET /api/live-channels error:", error);
    return NextResponse.json(
      { error: "Failed to load custom channels" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    if (body.m3uText) {
      const parsed = parseM3uText(String(body.m3uText));
      if (parsed.length === 0) {
        return NextResponse.json(
          { error: "No valid http(s) stream URLs found in playlist" },
          { status: 400 }
        );
      }

      const inserted = await db
        .insert(customLiveChannels)
        .values(
          parsed.map((c) => ({
            profileId: Number(body.profileId || 1),
            name: body.customName ? String(body.customName) : c.name,
            category: body.customCategory
              ? String(body.customCategory)
              : c.category,
            streamUrl: c.streamUrl,
            logoText: (body.customName ? String(body.customName) : c.name)
              .slice(0, 3)
              .toUpperCase(),
            country: "IPTV",
          }))
        )
        .returning();

      return NextResponse.json({ channels: inserted });
    }

    return NextResponse.json({ error: "Missing playlist data" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/live-channels error:", error);
    return NextResponse.json(
      { error: "Failed to import channels" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const id = Number(req.nextUrl.searchParams.get("id"));
    await db.delete(customLiveChannels).where(eq(customLiveChannels.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/live-channels error:", error);
    return NextResponse.json(
      { error: "Failed to remove channel" },
      { status: 500 }
    );
  }
}
