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
            <div className="max-w-[36rem]">
              {/* Eyebrow: red "A." + FILM / SERIES */}
              <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.22em] text-white/70">
                <span className="text-[15px] font-black tracking-normal text-[#e02020]">
                  A.
                </span>
                <span className="tracking-[0.3em]">
                  {currentHero.type === "tv" || currentHero.type === "anime"
                    ? "Series"
                    : "Film"}
                </span>
              </p>

              {/* Clear logo when TMDB has one, otherwise huge uppercase title */}
              <div className="mt-2">
                {currentHero.logoUrl ? (
                  <Link href={`/title/${currentHero.type}/${currentHero.id}`}>
                    <img
                      src={currentHero.logoUrl}
                      alt={currentHero.title}
                      className="beta-hero-logo max-h-24 w-auto max-w-[80%] object-contain object-left sm:max-h-36"
                    />
                  </Link>
                ) : (
                  <Link href={`/title/${currentHero.type}/${currentHero.id}`}>
                    <h1 className="max-w-3xl text-[2.6rem] font-black uppercase leading-[0.92] tracking-[-0.02em] text-white text-shadow-hero sm:text-6xl md:text-7xl">
                      {currentHero.title}
                    </h1>
                  </Link>
                )}
              </div>

              {/* Meta: rating · date · HD · genres */}
              <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] font-semibold text-white/85 sm:text-[15px]">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                  <span className="text-emerald-300">
                    {currentHero.rating.toFixed(1)}
                  </span>
                </span>
                <span className="text-white/75">{currentHero.releaseDate || currentHero.year}</span>
                <span className="rounded border border-white/35 px-1.5 py-0.5 text-[11px] font-bold uppercase text-white/80">
                  {currentHero.quality === "4K" ? "4K" : "HD"}
                </span>
                {currentHero.runtime && (
                  <span className="text-white/70">{currentHero.runtime}</span>
                )}
                <span className="text-white/70">
                  {currentHero.genres.slice(0, 3).join(" · ")}
                </span>
              </div>

              {currentHero.tagline && (
                <p className="mt-3 text-[13px] italic text-white/60">
                  {currentHero.tagline}
                </p>
              )}

              <p className="mt-3 max-w-lg line-clamp-3 text-[13.5px] leading-[1.55] text-white/85 text-shadow-hero sm:text-[15px]">
                {currentHero.overview}
              </p>

              {currentHero.cast.length > 0 && (
                <p className="mt-2.5 line-clamp-1 text-[12.5px] text-white/55">
                  Starring{" "}
                  {currentHero.cast.slice(0, 4).map((c) => c.name).join(", ")}
                </p>
              )}

              {/* Buttons: filled primary + frosted secondary */}
              <div
                data-tv-row="hero-actions"
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                <Link
                  href={`/title/${currentHero.type}/${currentHero.id}?play=1`}
                  data-tv-autofocus
                  className="inline-flex h-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-white px-7 text-[15px] font-bold text-black transition hover:bg-white/90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Watch Now</span>
                </Link>

                <Link
                  href={`/title/${currentHero.type}/${currentHero.id}`}
                  className="inline-flex h-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-white/[0.14] px-6 text-[15px] font-bold text-white ring-1 ring-white/[0.1] backdrop-blur transition hover:bg-white/[0.22]"
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

            <div data-tv-rail className="scrollbar-hide arkaflix-rail-px flex gap-5 overflow-x-auto pb-4 pt-1">
              {continueWatching.map((entry) => {
                const catalog = findCatalogItem(entry.mediaId, entry.mediaType);
                const isSeries = entry.mediaType !== "movie";
                const left = Math.max(
                  1,
                  Math.round((100 - entry.progressPercent) * 0.24)
                );
                return (
                  <div key={entry.id} className="group relative shrink-0">
                    <div className="flex items-stretch gap-3">
                      {/* landscape thumb with Enter/Open chip */}
                      <Link
                        href={`/title/${entry.mediaType}/${entry.mediaId}`}
                        className="relative block w-[286px] shrink-0 overflow-hidden rounded-[10px] ring-1 ring-white/[0.12] transition group-hover:ring-white/70"
                      >
                        <div className="relative aspect-video bg-white/[0.05]">
                          <img
                            src={entry.backdropUrl || entry.posterUrl}
                            alt={entry.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/75 py-1 pl-1 pr-2.5 backdrop-blur">
                            <kbd className="grid h-4 min-w-5 place-items-center rounded border border-white/40 px-1 text-[9px] font-bold text-white/85">
                              Enter
                            </kbd>
                            <span className="text-[11px] font-semibold text-white">
                              Open
                            </span>
                          </span>
                          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                            <span
                              className="block h-full bg-[#e02020]"
                              style={{ width: `${entry.progressPercent}%` }}
                            />
                          </span>
                        </div>
                      </Link>

                      {/* info card, revealed on hover/focus like dulo */}
                      <div className="w-0 overflow-hidden transition-all duration-200 group-hover:w-[300px] group-focus-within:w-[300px]">
                        <div className="flex h-full w-[300px] flex-col justify-between rounded-[10px] border border-white/[0.1] bg-[#17171b] p-4">
                          <div>
                            <h3 className="text-[17px] font-bold leading-tight text-white">
                              {entry.title}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 text-[11.5px] text-white/55">
                              <span className="rounded border border-white/30 px-1 py-px text-[9px] font-bold uppercase">
                                {catalog?.quality === "4K" ? "4K" : "HD"}
                              </span>
                              <span>{isSeries ? "Series" : "Film"}</span>
                              {isSeries && (
                                <span>
                                  {catalog?.seasons?.length
                                    ? `${catalog.seasons.length} Season${catalog.seasons.length > 1 ? "s" : ""}`
                                    : "1 Season"}
                                </span>
                              )}
                            </div>
                            <div className="mt-2.5 h-[3px] w-full rounded-full bg-white/15">
                              <div
                                className="h-full rounded-full bg-[#e02020]"
                                style={{ width: `${entry.progressPercent}%` }}
                              />
                            </div>
                            <p className="mt-2 text-[11.5px] font-medium text-white/60">
                              {isSeries
                                ? `S${entry.lastSeason} E${entry.lastEpisode} · ${left} min left`
                                : `${left} min left`}
                            </p>
                            {catalog && catalog.cast.length > 0 && (
                              <p className="mt-1.5 line-clamp-1 text-[11px] text-white/40">
                                Starring{" "}
                                {catalog.cast.slice(0, 3).map((c) => c.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link
                              href={`/title/${entry.mediaType}/${entry.mediaId}?play=1`}
                              className="flex-1 rounded-lg bg-white py-1.5 text-center text-[11px] font-bold text-black"
                            >
                              Resume
                            </Link>
                            <button
                              type="button"
                              onClick={() => clearProgress(entry.mediaId)}
                              className="rounded-lg bg-white/[0.1] px-2.5 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/[0.18] hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          landscape
        />

        {/* ARKAFLIX.MOV TOP 10 MOVIES */}
        <MediaRail
          title="Top 10 Movies"
          href="/movies"
          items={top10Movies}
          ranked
          landscape
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
