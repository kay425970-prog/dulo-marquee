import { NextRequest, NextResponse } from "next/server";
import {
  CATALOG_MEDIA,
  CatalogItem,
  EpisodeInfo,
  SeasonInfo,
  TMDB_PROVIDER_SLUG_MAP,
  findCatalogItem,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";
// TMDB detail + season episodes + logos can chain several upstream requests.
export const maxDuration = 25;

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";
const DEFAULT_TMDB_KEY = "1865f43a0549ca50d341dd9ab8b29f49";

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action",
  10762: "Family",
  10765: "Science Fiction",
  10768: "Drama",
};

interface CacheRecord {
  expiresAt: number;
  data: unknown;
}

const tmdbCache = new Map<string, CacheRecord>();

async function tmdbFetch<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  ttlMs = 600_000
): Promise<T | null> {
  const apiKey = process.env.TMDB_API_KEY || DEFAULT_TMDB_KEY;
  const search = new URLSearchParams({ api_key: apiKey });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const url = `${TMDB_BASE}${path}?${search.toString()}`;
  const now = Date.now();
  const hit = tmdbCache.get(url);
  if (hit && hit.expiresAt > now) {
    return hit.data as T;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return null;
    const json = (await res.json()) as T;
    tmdbCache.set(url, { expiresAt: now + ttlMs, data: json });
    return json;
  } catch {
    return null;
  }
}

export function tmdbImg(
  path: string | null | undefined,
  size: "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" = "w500"
): string {
  if (!path) return "";
  if (path.startsWith("https://image.tmdb.org/")) return path;
  return `${TMDB_IMG}/${size}${path.startsWith("/") ? path : `/${path}`}`;
}

interface RawTmdbListItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
}

function mapRawTmdbCard(
  raw: RawTmdbListItem,
  forcedMediaType?: "movie" | "tv",
  forceAnime = false
): CatalogItem | null {
  if (!raw.poster_path) return null;
  const tmdbMediaType: "movie" | "tv" =
    forcedMediaType ||
    (raw.media_type === "tv" || (!raw.title && Boolean(raw.name))
      ? "tv"
      : "movie");

  const isAnime =
    forceAnime ||
    ((raw.genre_ids || []).includes(16) &&
      (raw.original_language === "ja" ||
        (raw.origin_country || []).includes("JP")));

  const title = raw.title || raw.name || "Untitled";
  const dateStr = raw.release_date || raw.first_air_date || "";
  const year = dateStr.slice(0, 4) || "2024";
  const rating = raw.vote_average
    ? Number(Math.max(1, raw.vote_average).toFixed(1))
    : 7.8;

  const genres = Array.from(
    new Set(
      (raw.genre_ids || [])
        .map((gid) => GENRE_MAP[gid])
        .filter((g): g is string => Boolean(g))
    )
  );

  return {
    id: String(raw.id),
    tmdbId: String(raw.id),
    tmdbMediaType,
    type: isAnime ? "anime" : tmdbMediaType,
    title,
    tagline: "",
    overview: raw.overview || "",
    year,
    releaseDate: dateStr || year,
    rating,
    runtime: tmdbMediaType === "movie" ? "Feature" : "Series",
    maturity: tmdbMediaType === "movie" ? "PG-13" : "TV-14",
    quality: rating >= 8.0 ? "4K" : "HD",
    status: "Released",
    posterUrl: tmdbImg(raw.poster_path, "w500"),
    backdropUrl: tmdbImg(raw.backdrop_path || raw.poster_path, "w1280"),
    genres: genres.length ? genres : [tmdbMediaType === "movie" ? "Drama" : "Drama"],
    moods: [],
    providers: { stream: [], rent: [], buy: [] },
    cast: [],
  };
}

function isReleasedDate(dateStr?: string): boolean {
  if (!dateStr) return true;
  const ts = Date.parse(dateStr);
  if (Number.isNaN(ts)) return true;
  return ts <= Date.now() + 86_400_000;
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") || "search";
  const id = req.nextUrl.searchParams.get("id");
  const typeParam = req.nextUrl.searchParams.get("type") || "movie";
  const seasonParam = Number(req.nextUrl.searchParams.get("season") || 1);
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  // 1. FULL SINGLE TITLE DETAIL + SEASON EPISODES + CLEARLOGO + PROVIDERS (100% TMDB)
  if (id) {
    const localFallback = findCatalogItem(id, typeParam);
    const numericId = id.replace(/^(al-|tvm-)/, "");
    const resolvedTmdbId = localFallback?.tmdbId || numericId;

    const tmdbMediaType: "movie" | "tv" =
      typeParam === "tv"
        ? "tv"
        : typeParam === "movie"
          ? "movie"
          : localFallback?.tmdbMediaType || "tv";

    if (!/^\d+$/.test(resolvedTmdbId)) {
      return localFallback
        ? NextResponse.json({ item: localFallback })
        : NextResponse.json({ item: null }, { status: 404 });
    }

    // Season-only fetch for fast season dropdown switching
    if (req.nextUrl.searchParams.get("seasonOnly") === "true" && tmdbMediaType === "tv") {
      const seasonJson = await tmdbFetch<{
        season_number: number;
        name: string;
        air_date?: string;
        episodes?: Array<{
          episode_number: number;
          name: string;
          runtime?: number | null;
          overview?: string;
          air_date?: string;
          vote_average?: number;
          still_path?: string | null;
        }>;
      }>(`/tv/${resolvedTmdbId}/season/${seasonParam}`);

      if (seasonJson?.episodes) {
        const episodes: EpisodeInfo[] = seasonJson.episodes.map((ep) => ({
          number: ep.episode_number,
          title: ep.name || `Episode ${ep.episode_number}`,
          duration: ep.runtime ? `${ep.runtime}m` : "45m",
          overview: ep.overview || "",
          airDate: ep.air_date || "",
          rating: ep.vote_average
            ? Number(ep.vote_average.toFixed(1))
            : 8.2,
          stillUrl: ep.still_path ? tmdbImg(ep.still_path, "w300") : undefined,
        }));
        return NextResponse.json({ episodes });
      }
      return NextResponse.json({ episodes: [] });
    }

    const detail = await tmdbFetch<Record<string, unknown>>(
      `/${tmdbMediaType}/${resolvedTmdbId}`,
      {
        append_to_response:
          "credits,images,recommendations,similar,reviews,watch/providers",
        include_image_language: "en,null",
      }
    );

    if (!detail) {
      return localFallback
        ? NextResponse.json({ item: localFallback })
        : NextResponse.json({ item: null }, { status: 404 });
    }

    const rawPoster = detail.poster_path as string | undefined;
    const rawBackdrop = detail.backdrop_path as string | undefined;
    const posterUrl = rawPoster
      ? tmdbImg(rawPoster, "w500")
      : localFallback?.posterUrl || "";
    const backdropUrl = rawBackdrop
      ? tmdbImg(rawBackdrop, "w1280")
      : posterUrl;

    // Official TMDB ClearLogo
    const imagesObj = detail.images as
      | { logos?: Array<{ file_path?: string; vote_count?: number; iso_639_1?: string }> }
      | undefined;
    const sortedLogos = [...(imagesObj?.logos || [])].sort(
      (a, b) =>
        (b.iso_639_1 === "en" ? 1000 : 0) +
        (b.vote_count || 0) -
        ((a.iso_639_1 === "en" ? 1000 : 0) + (a.vote_count || 0))
    );
    const logoUrl = sortedLogos[0]?.file_path
      ? tmdbImg(sortedLogos[0].file_path, "w500")
      : undefined;

    const genresList = (
      (detail.genres as Array<{ id: number; name: string }> | undefined) || []
    ).map((g) => g.name);

    const isAnime =
      typeParam === "anime" ||
      localFallback?.type === "anime" ||
      (genresList.includes("Animation") &&
        (detail.original_language === "ja" ||
          ((detail.origin_country as string[] | undefined) || []).includes("JP")));

    const dateStr =
      (detail.release_date as string | undefined) ||
      (detail.first_air_date as string | undefined) ||
      localFallback?.releaseDate ||
      "2024";
    const year = dateStr.slice(0, 4) || "2024";

    const runtimeMinutes = Number(detail.runtime || 0);
    const numSeasons = Number(detail.number_of_seasons || 0);
    const runtime =
      tmdbMediaType === "movie"
        ? runtimeMinutes > 0
          ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
          : localFallback?.runtime || "2h 05m"
        : `${Math.max(1, numSeasons)} Season${numSeasons === 1 ? "" : "s"}`;

    const credits = detail.credits as
      | {
          cast?: Array<{
            id: number;
            name: string;
            character?: string;
            profile_path?: string | null;
          }>;
          crew?: Array<{ name: string; job?: string }>;
        }
      | undefined;

    const director =
      credits?.crew?.find((c) => c.job === "Director")?.name ||
      (
        (detail.created_by as Array<{ name: string }> | undefined) || []
      )
        .map((c) => c.name)
        .slice(0, 2)
        .join(" · ") ||
      localFallback?.director;

    const cast = (credits?.cast || []).slice(0, 14).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || "",
      photoUrl: c.profile_path ? tmdbImg(c.profile_path, "w185") : undefined,
    }));

    // TMDB US Watch Providers
    const wpRoot = detail["watch/providers"] as
      | {
          results?: Record<
            string,
            {
              flatrate?: Array<{
                provider_id: number;
                provider_name: string;
                logo_path?: string;
              }>;
              free?: Array<{
                provider_id: number;
                provider_name: string;
                logo_path?: string;
              }>;
              ads?: Array<{
                provider_id: number;
                provider_name: string;
                logo_path?: string;
              }>;
              rent?: Array<{
                provider_id: number;
                provider_name: string;
                logo_path?: string;
              }>;
              buy?: Array<{
                provider_id: number;
                provider_name: string;
                logo_path?: string;
              }>;
            }
          >;
        }
      | undefined;
    const usProviders = wpRoot?.results?.US;
    const mapProvList = (
      arr:
        | Array<{
            provider_id: number;
            provider_name: string;
            logo_path?: string;
          }>
        | undefined
    ) => {
      const seen = new Set<number>();
      const out: Array<{
        id: number;
        name: string;
        logoUrl: string;
        slug?: string;
      }> = [];
      for (const p of arr || []) {
        if (!p.logo_path || seen.has(p.provider_id)) continue;
        seen.add(p.provider_id);
        out.push({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: tmdbImg(p.logo_path, "w185"),
          slug: TMDB_PROVIDER_SLUG_MAP[p.provider_id],
        });
      }
      return out.slice(0, 10);
    };

    const liveProviders = {
      stream: mapProvList([
        ...(usProviders?.flatrate || []),
        ...(usProviders?.free || []),
        ...(usProviders?.ads || []),
      ]),
      rent: mapProvList(usProviders?.rent),
      buy: mapProvList(usProviders?.buy),
    };

    // Real TV Seasons & Season 1 Episodes with TMDB w300 Stills
    let seasons: SeasonInfo[] | undefined = localFallback?.seasons;
    if (tmdbMediaType === "tv") {
      const rawSeasons = (
        (detail.seasons as
          | Array<{
              season_number: number;
              name: string;
              episode_count: number;
              air_date?: string;
            }>
          | undefined) || []
      ).filter((s) => s.season_number > 0 && s.episode_count > 0);

      if (rawSeasons.length > 0) {
        const activeSeasonNum =
          rawSeasons.find((s) => s.season_number === seasonParam)
            ?.season_number || rawSeasons[0].season_number;

        const firstSeasonData = await tmdbFetch<{
          episodes?: Array<{
            episode_number: number;
            name: string;
            runtime?: number | null;
            overview?: string;
            air_date?: string;
            vote_average?: number;
            still_path?: string | null;
          }>;
        }>(`/tv/${resolvedTmdbId}/season/${activeSeasonNum}`);

        seasons = rawSeasons.map((s) => {
          const eps: EpisodeInfo[] =
            s.season_number === activeSeasonNum && firstSeasonData?.episodes
              ? firstSeasonData.episodes.map((ep) => ({
                  number: ep.episode_number,
                  title: ep.name || `Episode ${ep.episode_number}`,
                  duration: ep.runtime ? `${ep.runtime}m` : "45m",
                  overview: ep.overview || "",
                  airDate: ep.air_date || "",
                  rating: ep.vote_average
                    ? Number(ep.vote_average.toFixed(1))
                    : 8.2,
                  stillUrl: ep.still_path
                    ? tmdbImg(ep.still_path, "w300")
                    : backdropUrl,
                }))
              : Array.from(
                  { length: Math.min(s.episode_count, 24) },
                  (_, idx) => ({
                    number: idx + 1,
                    title: `Episode ${idx + 1}`,
                    duration: "45m",
                    overview: `${(detail.name as string) || "Series"} — Season ${s.season_number}, Episode ${idx + 1}.`,
                    airDate: s.air_date || year,
                    rating: 8.3,
                    stillUrl: backdropUrl,
                  })
                );

          return {
            seasonNumber: s.season_number,
            name: s.name || `Season ${s.season_number}`,
            episodeCount: s.episode_count,
            year: (s.air_date || year).slice(0, 4),
            episodes: eps,
          };
        });
      }
    }

    // TMDB Audience Reviews
    const rawReviews = (
      (
        detail.reviews as
          | {
              results?: Array<{
                id: string;
                author?: string;
                content?: string;
                created_at?: string;
                url?: string;
                author_details?: { rating?: number | null };
              }>;
            }
          | undefined
      )?.results || []
    )
      .filter((r) => Boolean(r.content))
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        author: r.author || "TMDB Member",
        rating: r.author_details?.rating ?? null,
        content: r.content || "",
        createdAt: r.created_at,
        url: r.url,
      }));

    // TMDB Recommendations / Similar (100% TMDB Posters)
    const recRaw =
      (
        detail.recommendations as
          | { results?: RawTmdbListItem[] }
          | undefined
      )?.results ||
      (detail.similar as { results?: RawTmdbListItem[] } | undefined)
        ?.results ||
      [];

    const recommendations = recRaw
      .filter((r) => Boolean(r.poster_path) && isReleasedDate(r.release_date || r.first_air_date))
      .map((r) => mapRawTmdbCard(r, tmdbMediaType))
      .filter((r): r is CatalogItem => Boolean(r))
      .slice(0, 14);

    const fullItem: CatalogItem = {
      id: resolvedTmdbId,
      tmdbId: resolvedTmdbId,
      tmdbMediaType,
      type: isAnime ? "anime" : tmdbMediaType,
      title:
        (detail.title as string) ||
        (detail.name as string) ||
        localFallback?.title ||
        "Untitled",
      tagline: (detail.tagline as string) || localFallback?.tagline || "",
      overview: (detail.overview as string) || localFallback?.overview || "",
      year,
      releaseDate: dateStr,
      rating: detail.vote_average
        ? Number(Number(detail.vote_average).toFixed(1))
        : localFallback?.rating || 8.0,
      runtime,
      maturity: tmdbMediaType === "movie" ? "PG-13" : "TV-MA",
      quality: "4K",
      status: (detail.status as string) || "Released",
      country:
        (
          (detail.production_countries as
            | Array<{ name: string }>
            | undefined) || []
        )
          .map((c) => c.name)
          .slice(0, 2)
          .join(", ") || "United States",
      director,
      posterUrl,
      backdropUrl,
      logoUrl,
      genres: genresList.length ? genresList : localFallback?.genres || ["Drama"],
      moods: localFallback?.moods || [],
      studio:
        (
          (detail.production_companies as
            | Array<{ name: string }>
            | undefined) || []
        )[0]?.name || localFallback?.studio,
      audioBadge: isAnime ? "SUB · DUB" : undefined,
      providers: localFallback?.providers || {
        stream: liveProviders.stream
          .map((p) => p.slug)
          .filter((s): s is string => Boolean(s)),
        rent: liveProviders.rent
          .map((p) => p.slug)
          .filter((s): s is string => Boolean(s)),
        buy: liveProviders.buy
          .map((p) => p.slug)
          .filter((s): s is string => Boolean(s)),
      },
      liveProviders,
      cast: cast.length ? cast : localFallback?.cast || [],
      seasons,
      tmdbReviews: rawReviews,
      recommendations,
    };

    return NextResponse.json({ item: fullItem });
  }

  // 2. HOMEPAGE LIVE TMDB RAILS (dulo.mov exact rails, filtered to released streamable titles with TMDB posters)
  if (mode === "home") {
    const today = new Date().toISOString().slice(0, 10);
    const [trendMovies, trendTv, popMovies, popTv, animeTv] = await Promise.all([
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/trending/movie/week"),
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/trending/tv/week"),
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/discover/movie", {
        sort_by: "popularity.desc",
        "primary_release_date.lte": today,
        "vote_count.gte": 120,
      }),
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/discover/tv", {
        sort_by: "popularity.desc",
        "first_air_date.lte": today,
        "vote_count.gte": 80,
      }),
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/discover/tv", {
        with_genres: 16,
        with_origin_country: "JP",
        sort_by: "popularity.desc",
        "first_air_date.lte": today,
      }),
    ]);

    const mapList = (
      arr: RawTmdbListItem[] | undefined,
      mt: "movie" | "tv",
      isAni = false
    ) =>
      (arr || [])
        .filter(
          (x) =>
            Boolean(x.poster_path) &&
            isReleasedDate(x.release_date || x.first_air_date)
        )
        .map((x) => mapRawTmdbCard(x, mt, isAni))
        .filter((x): x is CatalogItem => Boolean(x));

    const liveTrendMovies = mapList(trendMovies?.results, "movie");
    const liveTrendTv = mapList(trendTv?.results, "tv");
    const livePopMovies = mapList(popMovies?.results, "movie");
    const livePopTv = mapList(popTv?.results, "tv");
    const liveAnime = mapList(animeTv?.results, "tv", true);

    // Enrich top 6 hero items with official TMDB ClearLogos
    const heroCandidates = (
      livePopMovies.length >= 6
        ? livePopMovies
        : CATALOG_MEDIA.filter((m) => m.featuredHero)
    ).slice(0, 7);

    const heroWithLogos = await Promise.all(
      heroCandidates.map(async (item) => {
        const imgs = await tmdbFetch<{
          logos?: Array<{
            file_path?: string;
            vote_count?: number;
            iso_639_1?: string;
          }>;
        }>(`/${item.tmdbMediaType}/${item.tmdbId}/images`, {
          include_image_language: "en,null",
        });
        const bestLogo = [...(imgs?.logos || [])].sort(
          (a, b) =>
            (b.iso_639_1 === "en" ? 1000 : 0) +
            (b.vote_count || 0) -
            ((a.iso_639_1 === "en" ? 1000 : 0) + (a.vote_count || 0))
        )[0];
        return bestLogo?.file_path
          ? { ...item, logoUrl: tmdbImg(bestLogo.file_path, "w500") }
          : item;
      })
    );

    return NextResponse.json({
      hero: heroWithLogos,
      top10Movies: (liveTrendMovies.length
        ? liveTrendMovies
        : CATALOG_MEDIA.filter((m) => m.type === "movie")
      ).slice(0, 10),
      top10Shows: (liveTrendTv.length
        ? liveTrendTv
        : CATALOG_MEDIA.filter((m) => m.type === "tv")
      ).slice(0, 10),
      popularMovies: livePopMovies.length
        ? livePopMovies.slice(0, 16)
        : CATALOG_MEDIA.filter((m) => m.type === "movie"),
      popularShows: livePopTv.length
        ? livePopTv.slice(0, 16)
        : CATALOG_MEDIA.filter((m) => m.type === "tv"),
      anime: liveAnime.length
        ? liveAnime.slice(0, 16)
        : CATALOG_MEDIA.filter((m) => m.type === "anime"),
    });
  }

  // 3. ANIME DISCOVERY VIA TMDB ONLY (100% TMDB Posters & TMDB IDs for VidCore!)
  if (mode === "anime") {
    const today = new Date().toISOString().slice(0, 10);
    const sort = req.nextUrl.searchParams.get("sort");

    if (q) {
      const searchRes = await tmdbFetch<{ results?: RawTmdbListItem[] }>(
        "/search/multi",
        { query: q, include_adult: "false" },
        60_000
      );
      const items = (searchRes?.results || [])
        .filter(
          (r) =>
            (r.media_type === "tv" || r.media_type === "movie") &&
            Boolean(r.poster_path) &&
            ((r.genre_ids || []).includes(16) || r.original_language === "ja")
        )
        .map((r) =>
          mapRawTmdbCard(
            r,
            r.media_type === "movie" ? "movie" : "tv",
            true
          )
        )
        .filter((x): x is CatalogItem => Boolean(x));
      return NextResponse.json({ items });
    }

    const endpoint = sort === "movies" ? "/discover/movie" : "/discover/tv";
    const data = await tmdbFetch<{ results?: RawTmdbListItem[] }>(endpoint, {
      with_genres: 16,
      with_origin_country: "JP",
      sort_by:
        sort === "top"
          ? "vote_average.desc"
          : "popularity.desc",
      "vote_count.gte": sort === "top" ? 300 : 40,
      ...(sort === "movies"
        ? { "primary_release_date.lte": today }
        : { "first_air_date.lte": today }),
    });

    const items = (data?.results || [])
      .map((r) =>
        mapRawTmdbCard(r, sort === "movies" ? "movie" : "tv", true)
      )
      .filter((x): x is CatalogItem => Boolean(x));

    return NextResponse.json({ items });
  }

  // 4. PROVIDER / STREAMING SERVICE CATALOG VIA TMDB
  if (mode === "service") {
    const providerId = req.nextUrl.searchParams.get("providerId");
    if (!providerId) return NextResponse.json({ items: [] });
    const today = new Date().toISOString().slice(0, 10);

    const [mRes, tvRes] = await Promise.all([
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/discover/movie", {
        with_watch_providers: providerId,
        watch_region: "US",
        sort_by: "popularity.desc",
        "primary_release_date.lte": today,
      }),
      tmdbFetch<{ results?: RawTmdbListItem[] }>("/discover/tv", {
        with_watch_providers: providerId,
        watch_region: "US",
        sort_by: "popularity.desc",
        "first_air_date.lte": today,
      }),
    ]);

    const movies = (mRes?.results || [])
      .map((r) => mapRawTmdbCard(r, "movie"))
      .filter((x): x is CatalogItem => Boolean(x))
      .slice(0, 12);
    const shows = (tvRes?.results || [])
      .map((r) => mapRawTmdbCard(r, "tv"))
      .filter((x): x is CatalogItem => Boolean(x))
      .slice(0, 12);

    return NextResponse.json({ items: [...movies, ...shows] });
  }

  // 5. LIVE TMDB MULTI-SEARCH (100% TMDB Posters ONLY!)
  if (q.length >= 2) {
    const searchRes = await tmdbFetch<{ results?: RawTmdbListItem[] }>(
      "/search/multi",
      { query: q, include_adult: "false" },
      60_000
    );

    const items = (searchRes?.results || [])
      .filter(
        (r) =>
          (r.media_type === "movie" || r.media_type === "tv") &&
          Boolean(r.poster_path) &&
          isReleasedDate(r.release_date || r.first_air_date)
      )
      .map((r) =>
        mapRawTmdbCard(r, r.media_type === "tv" ? "tv" : "movie")
      )
      .filter((x): x is CatalogItem => Boolean(x))
      .slice(0, 20);

    return NextResponse.json({ items });
  }

  return NextResponse.json({ items: [] });
}
