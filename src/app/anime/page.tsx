"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATALOG_MEDIA, CatalogItem } from "@/lib/catalog";
import { MediaCard } from "@/components/MediaCard";
import { Play, Info, Star, Search, Loader2 } from "lucide-react";

const ANIME_GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Mystery",
  "Romance",
  "Science Fiction",
];

export default function AnimePage() {
  const localAnime = useMemo(
    () => CATALOG_MEDIA.filter((m) => m.type === "anime"),
    []
  );

  const [liveAnime, setLiveAnime] = useState<CatalogItem[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [tab, setTab] = useState<"season" | "top" | "movies">("season");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [heroId, setHeroId] = useState("1429");

  useEffect(() => {
    let cancelled = false;
    setLoadingLive(true);
    const qParam = search.trim()
      ? `&q=${encodeURIComponent(search.trim())}`
      : "";
    fetch(`/api/discover?mode=anime&sort=${tab}${qParam}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (!cancelled) {
          setLiveAnime(data.items || []);
          setLoadingLive(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, search]);

  const combinedAnime = useMemo(() => {
    const seen = new Set<string>();
    const out: CatalogItem[] = [];
    for (const item of [...liveAnime, ...localAnime]) {
      const key = `${item.tmdbMediaType}-${item.tmdbId}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    return out;
  }, [liveAnime, localAnime]);

  const heroAnime =
    localAnime.find((a) => a.id === heroId) ||
    combinedAnime[0] ||
    CATALOG_MEDIA[0];

  const filteredAnime = useMemo(() => {
    return combinedAnime.filter((a) => {
      if (
        selectedGenre !== "All" &&
        !a.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [combinedAnime, selectedGenre]);

  return (
    <main className="pb-20">
      {/* DULO.MOV ANIME HERO STAGE */}
      <div className="beta-hero-stage relative isolate">
        <div
          aria-hidden="true"
          className="beta-hero-ambient pointer-events-none absolute inset-x-0"
          style={{
            backgroundImage: `url("${heroAnime.backdropUrl || heroAnime.posterUrl}")`,
          }}
        />

        <section className="beta-hero relative z-10 min-h-[max(500px,65svh)] w-full overflow-hidden">
          <img
            src={heroAnime.backdropUrl || heroAnime.posterUrl}
            alt={heroAnime.title}
            className="beta-hero-image absolute inset-0 h-full w-full object-cover"
          />
          <div className="beta-hero-shade absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

          <div className="dulo-rail-px relative z-10 flex min-h-[max(500px,65svh)] flex-col justify-end pb-14 pt-24 sm:pb-18">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/75">
                  DULO · ANIME
                </p>
                <Link href={`/title/anime/${heroAnime.id}`}>
                  <h1 className="mt-2 text-3xl font-black uppercase leading-[0.96] tracking-tight text-white text-shadow-hero sm:text-5xl">
                    {heroAnime.title}
                  </h1>
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-white/90 sm:text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {heroAnime.rating.toFixed(1)}
                  </span>
                  <span>{heroAnime.year}</span>
                  <span className="text-white/65">
                    {heroAnime.genres.slice(0, 3).join(" · ")}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-white/80">
                  {heroAnime.overview}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/title/anime/${heroAnime.id}?play=1`}
                    className="beta-action inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Watch Now</span>
                  </Link>
                  <Link
                    href={`/title/anime/${heroAnime.id}`}
                    className="beta-action inline-flex h-12 items-center gap-2 rounded-full bg-white/15 px-7 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
                  >
                    <Info className="h-4 w-4" />
                    <span>More Info</span>
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {localAnime.slice(0, 5).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setHeroId(a.id)}
                    className={`overflow-hidden rounded-[12px] ring-1 transition ${
                      heroAnime.id === a.id
                        ? "h-24 w-16 ring-2 ring-white"
                        : "h-20 w-14 opacity-55 ring-white/15 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={a.posterUrl}
                      alt={a.title}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FILTER CONTROLS & TMDB POSTER GRID */}
      <section className="dulo-rail-px relative z-10 pt-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "season" as const, label: "Popular Simulcasts" },
              { id: "top" as const, label: "Top Rated Anime" },
              { id: "movies" as const, label: "Anime Movies" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`h-10 rounded-full px-4 text-xs font-semibold transition ${
                  tab === t.id
                    ? "bg-white text-black"
                    : "bg-white/[0.07] text-white/75 hover:bg-white/[0.14]"
                }`}
              >
                {t.label}
              </button>
            ))}
            {loadingLive && (
              <Loader2 className="ml-1 h-4 w-4 animate-spin text-white/50" />
            )}
          </div>

          <div className="beta-search-field flex w-full items-center gap-2.5 px-4 py-2 sm:w-72">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TMDB anime..."
              className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="scrollbar-hide mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {ANIME_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(g)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedGenre === g
                  ? "bg-[#da1b1b] text-white"
                  : "bg-white/[0.06] text-white/65 hover:bg-white/[0.12] hover:text-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
          {filteredAnime.map((item) => (
            <MediaCard
              key={`${item.tmdbMediaType}-${item.id}`}
              item={item}
              fluid
            />
          ))}
        </div>
      </section>
    </main>
  );
}
