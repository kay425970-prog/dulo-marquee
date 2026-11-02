"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CATALOG_MEDIA,
  CatalogItem,
  PROVIDERS,
  findCatalogItem,
  getHeroItems,
  getTopTenItems,
} from "@/lib/catalog";
import { useMarquee } from "@/components/MarqueeProvider";
import { MediaRail } from "@/components/MediaCard";
import { Play, Info, Star, X } from "lucide-react";

export default function HomePage() {
  const { library, clearProgress } = useMarquee();

  const [heroList, setHeroList] = useState<CatalogItem[]>(() => getHeroItems());
  const [top10Movies, setTop10Movies] = useState<CatalogItem[]>(() =>
    getTopTenItems()
  );
  const [top10Shows, setTop10Shows] = useState<CatalogItem[]>(() =>
    CATALOG_MEDIA.filter((m) => m.type === "tv").slice(0, 10)
  );
  const [popularMovies, setPopularMovies] = useState<CatalogItem[]>(() =>
    CATALOG_MEDIA.filter((m) => m.type === "movie")
  );
  const [popularShows, setPopularShows] = useState<CatalogItem[]>(() =>
    CATALOG_MEDIA.filter((m) => m.type === "tv")
  );
  const [animeItems, setAnimeItems] = useState<CatalogItem[]>(() =>
    CATALOG_MEDIA.filter((m) => m.type === "anime")
  );

  const [heroIdx, setHeroIdx] = useState(0);

  // Hydrate live TMDB rails & official ClearLogos on mount (100% TMDB posters & backdrops)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/discover?mode=home")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.hero?.length) setHeroList(data.hero);
        if (data.top10Movies?.length) setTop10Movies(data.top10Movies);
        if (data.top10Shows?.length) setTop10Shows(data.top10Shows);
        if (data.popularMovies?.length) setPopularMovies(data.popularMovies);
        if (data.popularShows?.length) setPopularShows(data.popularShows);
        if (data.anime?.length) setAnimeItems(data.anime);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (heroList.length <= 1) return;
    const t = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroList.length);
    }, 9500);
    return () => clearInterval(t);
  }, [heroList.length]);

  const currentHero = heroList[heroIdx % heroList.length] || CATALOG_MEDIA[0];

  const continueWatching = useMemo(() => {
    return library.filter((entry) => entry.progressPercent > 0);
  }, [library]);

  const myListItems = useMemo(() => {
    return library
      .filter((entry) => entry.inWatchlist)
      .map((entry) => {
        const local = findCatalogItem(entry.mediaId, entry.mediaType);
        if (local) return local;
        return {
          id: entry.mediaId,
          tmdbId: entry.mediaId,
          tmdbMediaType:
            entry.mediaType === "movie" ? ("movie" as const) : ("tv" as const),
          type: (entry.mediaType as "movie" | "tv" | "anime") || "movie",
          title: entry.title,
          tagline: "",
          overview: "",
          year: entry.year,
          releaseDate: entry.year,
          rating: Number(entry.rating) || 8.0,
          runtime: "",
          maturity: "PG-13",
          quality: "4K" as const,
          status: "Released",
          posterUrl: entry.posterUrl,
          backdropUrl: entry.backdropUrl || entry.posterUrl,
          genres: entry.genres || [],
          moods: [],
          providers: { stream: [], rent: [], buy: [] },
          cast: [],
        };
      });
  }, [library]);

  const madeForTonight = useMemo(() => {
    const merged = [...heroList.slice(1), ...popularMovies.slice(0, 8)];
    const seen = new Set<string>();
    return merged.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [heroList, popularMovies]);

  return (
    <main className="pb-16">
      {/* ARKAFLIX.MOV EXACT HERO STAGE (.beta-hero-stage) */}
      <div className="beta-hero-stage relative isolate">
        <div
          aria-hidden="true"
          className="beta-hero-ambient pointer-events-none absolute inset-x-0 transition-all duration-700"
          style={{
            backgroundImage: `url("${currentHero.backdropUrl || currentHero.posterUrl}")`,
          }}
        />

        <section className="beta-hero relative z-10 min-h-[max(520px,68svh)] w-full overflow-hidden sm:min-h-[max(560px,74svh)]">
          <img
            key={currentHero.id}
            src={currentHero.backdropUrl || currentHero.posterUrl}
            alt={currentHero.title}
            fetchPriority="high"
            className="beta-hero-image absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          />

          <div className="beta-hero-shade absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/25 sm:via-black/60 sm:to-transparent" />

          <div className="arkaflix-rail-px relative z-10 mx-auto flex min-h-[max(520px,68svh)] w-full flex-col justify-end pb-14 pt-24 sm:min-h-[max(560px,74svh)] sm:pb-20">
            <div className="max-w-2xl">
              <p className="text-[10px] font-light italic tracking-[0.25em] text-white/80 text-shadow-hero sm:text-[11px] sm:tracking-[0.3em]">
                <span className="font-semibold not-italic tracking-[0.35em] sm:tracking-[0.4em]">
                  ARKAFLIX
                </span>
              </p>

              {/* TMDB Official ClearLogo or Bold Uppercase Display Title */}
              <div className="mt-2 flex min-h-20 items-end sm:min-h-36">
                {currentHero.logoUrl ? (
                  <Link href={`/title/${currentHero.type}/${currentHero.id}`}>
                    <img
                      src={currentHero.logoUrl}
                      alt={currentHero.title}
                      className="beta-hero-logo max-h-24 w-auto max-w-[78%] object-contain object-left sm:max-h-36 sm:max-w-md"
                    />
                  </Link>
                ) : (
                  <Link href={`/title/${currentHero.type}/${currentHero.id}`}>
                    <h1 className="max-w-3xl text-3xl font-black uppercase leading-[0.95] tracking-tight text-white text-shadow-hero sm:text-5xl md:text-6xl">
                      {currentHero.title}
                    </h1>
                  </Link>
                )}
              </div>

              {/* Metadata Row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-white/90 text-shadow-hero sm:mt-4 sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{currentHero.rating.toFixed(1)}</span>
                </span>
                <span>{currentHero.year}</span>
                {currentHero.genres.length > 0 && (
                  <span className="hidden text-white/70 sm:inline">
                    {currentHero.genres.slice(0, 3).join(" · ")}
                  </span>
                )}
              </div>

              <p className="mt-3 max-w-xl line-clamp-2 text-sm leading-[1.5] text-white/85 text-shadow-hero sm:mt-4 md:text-base">
                {currentHero.overview}
              </p>

              {/* arkaflix.app Hero Action Buttons */}
              <div data-tv-row="hero-actions" className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
                <Link
                  href={`/title/${currentHero.type}/${currentHero.id}?play=1`}
                  data-tv-autofocus
                  className="beta-action inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-7 text-sm font-semibold text-black transition-all hover:bg-white/90 sm:text-base"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Watch Now</span>
                </Link>

                <Link
                  href={`/title/${currentHero.type}/${currentHero.id}`}
                  className="beta-action inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white/15 px-7 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/25 sm:text-base"
                >
                  <Info className="h-4 w-4" />
                  <span>More Info</span>
                </Link>
              </div>
            </div>
          </div>

          {/* arkaflix.app Bottom Centered Slide Tab Dots (Crimson active glow) */}
          {heroList.length > 1 && (
            <div
              role="tablist"
              aria-label="Featured titles"
              className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-1 sm:bottom-6 lg:gap-2"
            >
              {heroList.map((h, idx) => {
                const selected = idx === heroIdx % heroList.length;
                return (
                  <button
                    key={h.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`Featured title ${idx + 1}`}
                    onClick={() => setHeroIdx(idx)}
                    className="group/dot flex h-8 w-7 items-center justify-center sm:w-9"
                  >
                    <span
                      className={`block h-1 rounded-full transition-all duration-300 lg:h-1.5 ${
                        selected
                          ? "w-5 bg-[#da1b1b] shadow-[0_0_12px_rgba(218,27,27,0.55)] lg:w-7"
                          : "w-1.5 bg-white/40 group-hover/dot:bg-white/75"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ARKAFLIX.MOV RAILS STACK */}
      <div className="relative z-10 space-y-9 pt-4 sm:space-y-11">
        {/* CONTINUE WATCHING RAIL */}
        {continueWatching.length > 0 && (
          <section aria-label="Continue watching" data-tv-row="continue-watching">
            <div className="arkaflix-rail-px mb-3 flex items-end justify-between">
              <h2 className="text-[17px] font-semibold leading-none text-white/[0.92] sm:text-[19px]">
                Continue Watching
              </h2>
              <Link
                href="/my"
                className="text-xs font-semibold text-white/55 hover:text-white"
              >
                Your Arkaflix
              </Link>
            </div>

            <div data-tv-rail className="scrollbar-hide arkaflix-rail-px flex gap-4 overflow-x-auto pb-4 pt-1">
              {continueWatching.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative w-[240px] shrink-0 sm:w-[272px]"
                >
                  <Link
                    href={`/title/${entry.mediaType}/${entry.mediaId}`}
                    className="block"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-[14px] bg-white/[0.05] shadow-[0_10px_28px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.07] transition duration-300 group-hover:scale-[1.02] group-hover:ring-white/[0.45]">
                      <img
                        src={entry.backdropUrl || entry.posterUrl}
                        alt={entry.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-white">
                          {entry.title}
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-white/70">
                          {entry.mediaType === "movie"
                            ? `${entry.progressPercent}%`
                            : `S${entry.lastSeason} · E${entry.lastEpisode}`}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-[#da1b1b]"
                          style={{ width: `${entry.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => clearProgress(entry.mediaId)}
                    aria-label="Remove from Continue Watching"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/75 opacity-0 backdrop-blur transition hover:bg-[#da1b1b] hover:text-white group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ARKAFLIX.MOV CHANNELS & APPS RAIL (.beta-provider-rail + .beta-service-card) */}
        <section
          aria-labelledby="channels-apps-heading"
          data-tv-row="channels-apps"
          className="beta-provider-rail relative min-w-0"
        >
          <div className="arkaflix-rail-px mb-3 flex items-end justify-between gap-4">
            <div>
              <h2
                id="channels-apps-heading"
                className="text-[17px] font-semibold leading-none text-white/[0.92] sm:text-[19px]"
              >
                Channels &amp; Apps
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-none text-white/[0.55]">
                US catalog · Stream directly via VidBolt
              </p>
            </div>
            <Link
              href="/providers"
              className="text-xs font-semibold text-white/55 hover:text-white"
            >
              All services
            </Link>
          </div>

          <div data-tv-rail className="scrollbar-hide arkaflix-rail-px flex snap-x snap-proximity gap-3 overflow-x-auto pb-5 pt-1.5">
            {PROVIDERS.filter((p) => p.type !== "store").map((prov) => (
              <Link
                key={prov.id}
                href={`/providers?selected=${prov.id}`}
                style={
                  { "--service-tint": prov.accent } as React.CSSProperties
                }
                className="beta-service-card group relative flex h-[104px] w-[142px] shrink-0 snap-start flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] px-2 sm:h-[112px] sm:w-[158px] xl:h-[120px] xl:w-[170px]"
              >
                <span className="beta-service-logo grid h-14 w-14 place-items-center rounded-[14px] sm:h-[60px] sm:w-[60px]">
                  <img
                    src={prov.logoUrl}
                    alt={prov.name}
                    loading="lazy"
                    className="h-11 w-11 rounded-[11px] object-cover sm:h-12 sm:w-12"
                  />
                </span>
                <span className="max-w-full truncate text-[12px] font-semibold leading-none text-white/80 transition-colors group-hover:text-white">
                  {prov.shortName}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* MY LIST RAIL */}
        {myListItems.length > 0 && (
          <MediaRail
            title="My List"
            href="/my"
            items={myListItems}
          />
        )}

        {/* MADE FOR TONIGHT WIDESCREEN RAIL */}
        <MediaRail
          eyebrow="Curated"
          title="Made for tonight"
          items={madeForTonight}
          landscape
        />

        {/* ARKAFLIX.MOV TOP 10 TV SHOWS */}
        <MediaRail
          title="Top 10 TV Shows"
          href="/shows"
          items={top10Shows}
          ranked
        />

        {/* ARKAFLIX.MOV TOP 10 MOVIES */}
        <MediaRail
          title="Top 10 Movies"
          href="/movies"
          items={top10Movies}
          ranked
        />

        {/* POPULAR MOVIES */}
        <MediaRail
          title="Popular Movies"
          href="/movies"
          items={popularMovies}
        />

        {/* POPULAR SHOWS */}
        <MediaRail
          title="Popular Shows"
          href="/shows"
          items={popularShows}
        />

        {/* ANIME RAIL */}
        <MediaRail
          title="Anime"
          href="/anime"
          items={animeItems}
        />
      </div>
    </main>
  );
}
