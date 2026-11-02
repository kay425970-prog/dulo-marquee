import { NextRequest, NextResponse } from "next/server";
import { findCatalogItem } from "@/lib/catalog";

export const dynamic = "force-dynamic";
// Probes every engine in parallel (slowest timeout is ~5.2s) plus cold start.
export const maxDuration = 30;

export interface ResolvedStreamOption {
  id: string;
  provider: string;
  label: string;
  url: string;
  latencyMs: number;
  qualityTag: string;
}

export interface EngineReport {
  id: string;
  provider: string;
  tier: number;
  healthy: boolean;
  latencyMs: number;
  blockedReason?: string;
}

/**
 * Hard blocklist: these embed families are never used, even if reachable.
 * vidsrc is excluded by product decision (popunder/redirect abuse).
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /(^|\.)vidsrc\./i,
  /vidsrc/i,
  /vidsrc\.to/i,
  /vidsrc\.me/i,
  /vidsrc\.cc/i,
  /vidsrc\.xyz/i,
  /vidsrc\.icu/i,
  /vidsrc\.pro/i,
  /vidsrc\.sbs/i,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((re) => re.test(hostname));
}

interface EngineDef {
  id: string;
  provider: string;
  label: string;
  host: string;
  tier: number;
  timeoutMs: number;
  qualityTag: string;
  /** Keep engine in the failover list even when server-side DNS/egress can't reach it (browser may still resolve it). */
  allowUnverified?: boolean;
  movie?: (tmdbId: string) => string;
  tv?: (tmdbId: string, season: number, episode: number) => string;
  /**
   * Anime-only engines keyed by AniList id. `dub` selects the English-dub
   * stream, which is a genuinely separate HLS source (not a label).
   */
  anime?: (anilistId: number, episode: number, lang: "sub" | "dub") => string;
}

/**
 * Streaming engine registry — ordered by tier (1 = highest priority).
 * Every engine is TMDB-ID keyed and verified iframe-embeddable.
 * NO vidsrc-family engine is registered.
 */
export const STREAM_ENGINES: EngineDef[] = [
  {
    id: "megavid-sub",
    provider: "Anime · Sub",
    label: "Anime (Japanese audio + subs)",
    host: "megavid.buzz",
    tier: 0,
    timeoutMs: 5000,
    qualityTag: "Anime · Japanese Audio + Multi-Sub",
    // megavid throttles datacenter IPs, so the server probe often times out
    // even though a real browser loads it fine. Keep it in the chain.
    allowUnverified: true,
    anime: (alId, ep) => `https://megavid.buzz/ani/${alId}/${ep}/sub`,
  },
  {
    id: "megavid-dub",
    provider: "Anime · Dub",
    label: "Anime (English dub)",
    host: "megavid.buzz",
    tier: 1,
    timeoutMs: 5000,
    qualityTag: "Anime · English Dub",
    allowUnverified: true,
    anime: (alId, ep) => `https://megavid.buzz/ani/${alId}/${ep}/dub`,
  },
  {
    id: "vidpro",
    provider: "VidPro",
    label: "VidPro 4K",
    host: "vidpro.io",
    tier: 2,
    timeoutMs: 4000,
    qualityTag: "VidPro · 4K Multi-Audio + Subtitles",
    // vidpro.io sits behind Cloudflare bot protection, so a server-side probe
    // always sees 403. Keep it in the chain for the real browser, where the
    // challenge is solved normally.
    allowUnverified: true,
    movie: (id) => `https://vidpro.io/embed/movie/${id}?autoplay=1`,
    tv: (id, s, e) =>
      `https://vidpro.io/embed/tv/${id}/${s}/${e}?autoplay=1&nextEpisode=true&episodeSelector=true`,
  },
  {
    id: "vidcore-primary",
    provider: "VidCore",
    label: "VidCore 4K Edge",
    host: "vidcore.org",
    tier: 3,
    timeoutMs: 5200,
    qualityTag: "VidCore · 4K Ad-Free Edge CDN",
    movie: (id) =>
      `https://vidcore.org/embed/movie/${id}?autoplay=true&theme=da1b1b`,
    tv: (id, s, e) =>
      `https://vidcore.org/embed/tv/${id}/${s}/${e}?autoplay=true&theme=da1b1b`,
  },
  {
    id: "vidlink",
    provider: "VidLink",
    label: "VidLink 4K",
    host: "vidlink.pro",
    tier: 2,
    timeoutMs: 4400,
    qualityTag: "VidLink · 4K Primary · Multi-Audio",
    movie: (id) =>
      `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=da1b1b&secondaryColor=171717&iconColor=fafafa`,
    tv: (id, s, e) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=da1b1b&secondaryColor=171717&iconColor=fafafa&nextbutton=true`,
  },
  {
    id: "videasy",
    provider: "Videasy",
    label: "Videasy Ultra",
    host: "player.videasy.to",
    tier: 4,
    timeoutMs: 4400,
    qualityTag: "Videasy · 1080p/4K Ultra",
    movie: (id) => `https://player.videasy.to/movie/${id}?color=DA1B1B`,
    tv: (id, s, e) =>
      `https://player.videasy.to/tv/${id}/${s}/${e}?color=DA1B1B&nextEpisode=true&autoplayNextEpisode=true`,
  },
  {
    id: "vidfast",
    provider: "VidFast",
    label: "VidFast Rapid",
    host: "vidfast.vc",
    tier: 5,
    timeoutMs: 4400,
    qualityTag: "VidFast · Rapid 1080p",
    movie: (id) => `https://vidfast.vc/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidfast.vc/tv/${id}/${s}/${e}?autoPlay=true`,
  },
  {
    id: "vidcore-mirror",
    provider: "VidCore",
    label: "VidCore Mirror",
    host: "vidcore.io",
    tier: 6,
    timeoutMs: 4600,
    qualityTag: "VidCore Mirror · 1080p",
    movie: (id) => `https://vidcore.io/embed/movie/${id}?autoplay=true`,
    tv: (id, s, e) => `https://vidcore.io/embed/tv/${id}/${s}/${e}?autoplay=true`,
  },
  {
    id: "vidbolt",
    provider: "VidBolt",
    label: "VidBolt HD",
    host: "vidbolt.pro",
    tier: 1,
    timeoutMs: 4200,
    qualityTag: "VidBolt · HD Primary · Multi-Sub",
    movie: (id) => `https://vidbolt.pro/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidbolt.pro/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "cinesrc",
    provider: "CineSrc",
    label: "CineSrc Cinema",
    host: "cinesrc.st",
    tier: 8,
    timeoutMs: 3800,
    qualityTag: "CineSrc · Cinema HD",
    movie: (id) => `https://cinesrc.st/embed/movie/${id}?autoplay=1`,
    // CineSrc has no per-episode TV route; skipped for series.
  },
  {
    id: "2embed",
    provider: "2Embed",
    label: "2Embed Cloud",
    host: "www.2embed.cc",
    tier: 9,
    timeoutMs: 3800,
    qualityTag: "2Embed · HD Cloud",
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "vidspark",
    provider: "VidSpark",
    label: "VidSpark Relay",
    host: "vidspark.to",
    tier: 10,
    timeoutMs: 3800,
    qualityTag: "VidSpark · HD Relay",
    movie: (id) => `https://vidspark.to/movie/${id}`,
    tv: (id, s, e) => `https://vidspark.to/tv/${id}/${s}/${e}`,
  },
];

interface HostHealth {
  ok: boolean;
  latencyMs: number;
  checkedAt: number;
  reason?: string;
}

const HEALTH_TTL_MS = 45_000;
const hostHealth = new Map<string, HostHealth>();

async function probeEngine(
  engine: EngineDef,
  url: string
): Promise<{ report: EngineReport; option?: ResolvedStreamOption }> {
  const host = new URL(url).hostname;

  // Policy gate: never allow blocklisted families (vidsrc etc.)
  if (isBlockedHost(host)) {
    return {
      report: {
        id: engine.id,
        provider: engine.provider,
        tier: engine.tier,
        healthy: false,
        latencyMs: 0,
        blockedReason: "policy-blocked",
      },
    };
  }

  const cached = hostHealth.get(host);
  const now = Date.now();
  if (cached && now - cached.checkedAt < HEALTH_TTL_MS) {
    if (cached.ok) {
      return {
        report: {
          id: engine.id,
          provider: engine.provider,
          tier: engine.tier,
          healthy: true,
          latencyMs: cached.latencyMs,
        },
        option: {
          id: engine.id,
          provider: engine.provider,
          label: engine.label,
          url,
          latencyMs: cached.latencyMs,
          qualityTag: engine.qualityTag,
        },
      };
    }
    return {
      report: {
        id: engine.id,
        provider: engine.provider,
        tier: engine.tier,
        healthy: false,
        latencyMs: cached.latencyMs,
        blockedReason: cached.reason || "unreachable",
      },
    };
  }

  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(engine.timeoutMs),
    });

    const latencyMs = Date.now() - started;
    const xfo = (res.headers.get("x-frame-options") || "").toUpperCase();
    const csp = (res.headers.get("content-security-policy") || "").toLowerCase();

    const blocksFraming =
      xfo.includes("DENY") ||
      xfo.includes("SAMEORIGIN") ||
      (csp.includes("frame-ancestors") &&
        (csp.includes("'none'") || csp.includes("'self'")));

    const ok = res.status >= 200 && res.status < 300 && !blocksFraming;
    const reason = !ok
      ? blocksFraming
        ? `frame-blocked:${xfo || "csp"}`
        : `http-${res.status}`
      : undefined;

    hostHealth.set(host, { ok, latencyMs, checkedAt: now, reason });

    if (!ok) {
      return {
        report: {
          id: engine.id,
          provider: engine.provider,
          tier: engine.tier,
          healthy: false,
          latencyMs,
          blockedReason: reason,
        },
      };
    }

    return {
      report: {
        id: engine.id,
        provider: engine.provider,
        tier: engine.tier,
        healthy: true,
        latencyMs,
      },
      option: {
        id: engine.id,
        provider: engine.provider,
        label: engine.label,
        url,
        latencyMs,
        qualityTag: engine.qualityTag,
      },
    };
  } catch {
    const latencyMs = Date.now() - started;
    hostHealth.set(host, {
      ok: false,
      latencyMs,
      checkedAt: now,
      reason: "timeout-or-dns",
    });
    return {
      report: {
        id: engine.id,
        provider: engine.provider,
        tier: engine.tier,
        healthy: false,
        latencyMs,
        blockedReason: "timeout-or-dns",
      },
    };
  }
}

export async function GET(req: NextRequest) {
  const mediaId = req.nextUrl.searchParams.get("mediaId") || "";
  const typeParam = req.nextUrl.searchParams.get("type") || "movie";
  const season = Math.max(
    1,
    Number(req.nextUrl.searchParams.get("season") || 1) || 1
  );
  const episode = Math.max(
    1,
    Number(req.nextUrl.searchParams.get("episode") || 1) || 1
  );
  const isEpisodicParam = req.nextUrl.searchParams.get("episodic");

  const catalogMatch = findCatalogItem(mediaId, typeParam);

  const tmdbId = (
    req.nextUrl.searchParams.get("tmdbId") ||
    catalogMatch?.tmdbId ||
    mediaId.replace(/\D/g, "") ||
    "693134"
  ).trim();

  const isEpisodic =
    isEpisodicParam !== null
      ? isEpisodicParam === "true"
      : catalogMatch
        ? catalogMatch.tmdbMediaType === "tv" ||
          Boolean(catalogMatch.seasons && catalogMatch.seasons.length > 0)
        : typeParam !== "movie";

  // Build the candidate list for this title kind, in tier order.
  const anilistId = Number(
    req.nextUrl.searchParams.get("anilistId") || catalogMatch?.anilistId || 0
  );
  const isAnime = typeParam === "anime" || catalogMatch?.type === "anime";
  const useAnimeEngines = isAnime && Number.isFinite(anilistId) && anilistId > 0;

  const candidates = STREAM_ENGINES.filter((engine) => {
    if (useAnimeEngines && engine.anime) return true;
    return isEpisodic ? Boolean(engine.tv) : Boolean(engine.movie);
  }).map((engine) => ({
    engine,
    url: engine.anime && useAnimeEngines
      ? engine.anime(
          anilistId,
          episode,
          engine.id.endsWith("-dub") ? "dub" : "sub"
        )
      : isEpisodic
        ? engine.tv!(tmdbId, season, episode)
        : engine.movie!(tmdbId),
  }));

  const probed = await Promise.all(
    candidates.map(({ engine, url }) => probeEngine(engine, url))
  );

  // Rank healthy engines: tier first (product priority), then latency.
  const healthy = probed
    .map((p, idx) => ({ ...p, engine: candidates[idx].engine }))
    .filter((p) => p.report.healthy && p.option)
    .sort((a, b) => {
      if (a.engine.tier !== b.engine.tier) return a.engine.tier - b.engine.tier;
      return (a.option?.latencyMs ?? 0) - (b.option?.latencyMs ?? 0);
    })
    .map((p) => p.option as ResolvedStreamOption);

  // Engines the sandbox/server cannot reach (e.g. DNS-blocked VidKing) are kept
  // as unverified backups so the browser can still attempt them, then the
  // fullscreen watchdog auto-fails over to the next verified engine.
  const unverified = candidates
    .filter((c, idx) => {
      const p = probed[idx];
      return (
        c.engine.allowUnverified &&
        !p.report.healthy &&
        (p.report.blockedReason === "timeout-or-dns" ||
          p.report.blockedReason === "unreachable")
      );
    })
    .map(({ engine, url }) => ({
      id: engine.id,
      provider: engine.provider,
      label: engine.label,
      url,
      latencyMs: 6000,
      qualityTag: engine.qualityTag + " · browser fallback",
    }));

  const fallbackOrdered = candidates.map(({ engine, url }) => ({
    id: engine.id,
    provider: engine.provider,
    label: engine.label,
    url,
    latencyMs: engine.tier * 40,
    qualityTag: engine.qualityTag,
  }));

  // Anime sub/dub providers lead anime playback.
  const animeFirst = (list: ResolvedStreamOption[]) =>
    useAnimeEngines
      ? [
          ...list.filter((s) => s.id.startsWith("megavid-")),
          ...list.filter((s) => !s.id.startsWith("megavid-")),
        ]
      : list;

  const ordered: ResolvedStreamOption[] =
    healthy.length > 0
      ? [
          ...healthy,
          ...unverified,
          ...fallbackOrdered.filter(
            (f) =>
              !healthy.some((h) => h.id === f.id) &&
              !unverified.some((u) => u.id === f.id)
          ),
        ]
      : fallbackOrdered;

  const finalOrdered = animeFirst(ordered);

  const engines: EngineReport[] = probed
    .map((p, idx) => ({
      id: p.report.id,
      provider: p.report.provider,
      tier: candidates[idx].engine.tier,
      healthy: p.report.healthy,
      latencyMs: p.report.latencyMs,
      blockedReason: p.report.blockedReason,
    }))
    .sort((a, b) => a.tier - b.tier);

  const primary = finalOrdered[0];

  return NextResponse.json({
    primary:
      primary ?? {
        id: "vidbolt",
        provider: "VidBolt",
        label: "VidBolt HD",
        url: `https://vidbolt.pro/embed/movie/${tmdbId}`,
        latencyMs: 320,
        qualityTag: "VidBolt · HD Primary · Multi-Sub",
      },
    backups: finalOrdered.slice(1),
    engines,
    prioritizedProvider: primary?.provider ?? "VidBolt",
    engineCount: finalOrdered.length,
    blockedFamilies: ["vidsrc"],
    autoResolved: true,
    tmdbId,
    isEpisodic,
    season: isEpisodic ? season : undefined,
    episode: isEpisodic ? episode : undefined,
  });
}
