import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Cobalt — the HLS resolver dulo.mov uses.
 *
 * dulo.mov's player ("Cobalt") does not embed a third-party iframe: it asks a
 * Cloudflare Worker for a signed master playlist and plays HLS natively, which
 * is why its player can expose quality / audio / subtitle menus.
 *
 *   GET {zcdn}/cdn?tmdb={id}&type=movie
 *   GET {zcdn}/cdn?tmdb={id}&type=tv&season={s}&episode={e}
 *     → { ready: true,  url: "https://zcdnN.../play/<token>/master.m3u8" }
 *     → { ready: false, status: "queued" | "building" }   (HTTP 202)
 *
 * The title is transcoded on demand the first time it is requested, so we poll
 * briefly. Results are cached (play URLs are stable for a while) and failures
 * are cached too, so we never hammer the upstream service.
 *
 * This is third-party infrastructure we do not control: if it is slow, queued
 * or refuses traffic, the caller falls through to the normal embed engines.
 */

const ZCDN_HOSTS = [
  "https://zcdn1.6azt0hwr-cf9.workers.dev",
  "https://zcdn2.6azt0hwr-cf9.workers.dev",
  "https://zcdn3.6azt0hwr-cf9.workers.dev",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface CacheEntry {
  url: string | null;
  status: string;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const OK_TTL = 10 * 60_000; // a resolved playlist is reused for 10 minutes
const FAIL_TTL = 60_000; // negative results are remembered for 1 minute

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  const tmdbId = (req.nextUrl.searchParams.get("tmdbId") || "").replace(/\D/g, "");
  const type = req.nextUrl.searchParams.get("type") === "tv" ? "tv" : "movie";
  const season = Math.max(1, Number(req.nextUrl.searchParams.get("season") || 1));
  const episode = Math.max(1, Number(req.nextUrl.searchParams.get("episode") || 1));
  const budgetMs = Math.min(
    12_000,
    Math.max(1_500, Number(req.nextUrl.searchParams.get("budget") || 6_000))
  );

  if (!tmdbId) {
    return NextResponse.json({ ready: false, error: "tmdbId required" }, { status: 400 });
  }

  const key = type === "movie" ? `m:${tmdbId}` : `t:${tmdbId}:${season}:${episode}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.url ? OK_TTL : FAIL_TTL)) {
    return NextResponse.json(
      { ready: Boolean(hit.url), url: hit.url ?? undefined, status: hit.status, cached: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const query =
    type === "movie"
      ? `?tmdb=${tmdbId}&type=movie`
      : `?tmdb=${tmdbId}&type=tv&season=${season}&episode=${episode}`;

  const host = ZCDN_HOSTS[Math.floor(Math.random() * ZCDN_HOSTS.length)];
  const endpoint = `${host}/cdn${query}`;
  const deadline = Date.now() + budgetMs;
  let lastStatus = "unavailable";

  while (Date.now() < deadline) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": UA,
          Origin: "https://dulo.mov",
          Referer: "https://dulo.mov/",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(Math.min(8_000, deadline - Date.now() + 1_500)),
        cache: "no-store",
      });

      const body = await res.text();
      let parsed: { ready?: boolean; url?: string; status?: string } | null = null;
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = null;
      }

      if (parsed?.ready && typeof parsed.url === "string" && /^https:\/\//.test(parsed.url)) {
        cache.set(key, { url: parsed.url, status: "ready", at: Date.now() });
        return NextResponse.json(
          { ready: true, url: parsed.url, status: "ready", provider: "Cobalt" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      lastStatus = parsed?.status || (res.status === 202 ? "queued" : `http-${res.status}`);
    } catch {
      lastStatus = "timeout";
    }

    // Still building upstream — wait a little and try once more.
    if (Date.now() + 2_500 >= deadline) break;
    await sleep(2_500);
  }

  cache.set(key, { url: null, status: lastStatus, at: Date.now() });
  return NextResponse.json(
    { ready: false, status: lastStatus, provider: "Cobalt" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
