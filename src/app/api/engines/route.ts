import { NextResponse } from "next/server";
import { STREAM_ENGINES } from "@/app/api/stream-resolve/route";

export const dynamic = "force-dynamic";

/**
 * Transparency endpoint: lists every registered streaming engine, its tier
 * (priority order), TMDB-ID URL templates and the blocked engine families.
 * vidsrc is hard-blocked and never registered.
 */
export async function GET() {
  // Derived from the registry so the reported priority can never drift from
  // the actual tier-1 engine.
  const topTier = Math.min(...STREAM_ENGINES.map((e) => e.tier));
  const prioritizedProvider =
    STREAM_ENGINES.find((e) => e.tier === topTier)?.provider ?? "VidLink";

  return NextResponse.json({
    prioritizedProvider,
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
      allowUnverified: Boolean(e.allowUnverified),
      movieTemplate: e.movie ? e.movie("{tmdb_id}") : null,
      tvTemplate: e.tv ? e.tv("{tmdb_id}", 1, 1) : null,
    })).sort((a, b) => a.tier - b.tier),
  });
}
