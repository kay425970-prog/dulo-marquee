import { NextResponse } from "next/server";
import { STREAM_ENGINES } from "@/app/api/stream-resolve/route";

export const dynamic = "force-dynamic";

/**
 * Transparency endpoint: lists every registered streaming engine, its tier
 * (priority order), TMDB-ID URL templates and the blocked engine families.
 * vidsrc is hard-blocked and never registered.
 */
export async function GET() {
  return NextResponse.json({
    prioritizedProvider: "VidCore",
    blockedFamilies: ["vidsrc"],
    engineCount: STREAM_ENGINES.length,
    engines: STREAM_ENGINES.map((e) => ({
      id: e.id,
      provider: e.provider,
      label: e.label,
      host: e.host,
      tier: e.tier,
      supportsMovies: Boolean(e.movie),
      supportsSeries: Boolean(e.tv),
      qualityTag: e.qualityTag,
      movieTemplate: e.movie ? e.movie("{tmdb_id}") : null,
      tvTemplate: e.tv ? e.tv("{tmdb_id}", 1, 1) : null,
    })).sort((a, b) => a.tier - b.tier),
  });
}
