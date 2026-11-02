"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ALL_GENRES,
  CATALOG_MEDIA,
  CatalogItem,
  PROVIDERS,
} from "@/lib/catalog";
import { useMarquee } from "@/components/MarqueeProvider";
import { MediaCard } from "@/components/MediaCard";
import { Search, X, Loader2, RefreshCw } from "lucide-react";

export function DuloShelfBrowser({
  defaultMedia = "all",
}: {
  defaultMedia?: "all" | "movie" | "tv" | "anime";
}) {
  const searchParams = useSearchParams();
  const { activeProfile, openRandomPicker } = useMarquee();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mediaFilter, setMediaFilter] = useState<string>(
    searchParams.get("media") || defaultMedia
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "popular"
  );
  const [selectedGenre, setSelectedGenre] = useState<string>(
    searchParams.get("genre") || "All"
  );
  const [selectedProvider, setSelectedProvider] = useState<string>(
    searchParams.get("provider") || "all"
  );
  const [onlyMySubs, setOnlyMySubs] = useState(false);

  const [liveItems, setLiveItems] = useState<CatalogItem[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam !== null) setQuery(qParam);
    const mParam = searchParams.get("media");
    if (mParam) setMediaFilter(mParam);
    const sParam = searchParams.get("sort");
    if (sParam) setSortBy(sParam);
    const gParam = searchParams.get("genre");
    if (gParam) setSelectedGenre(gParam);
    const pParam = searchParams.get("provider");
    if (pParam) setSelectedProvider(pParam);
  }, [searchParams]);

  // Hydrate live TMDB catalog & search (100% TMDB Posters)
  useEffect(() => {
    let cancelled = false;
    setLoadingLive(true);

    const q = query.trim();
    const url =
      q.length >= 2
        ? `/api/discover?q=${encodeURIComponent(q)}`
        : "/api/discover?mode=home";

    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch(url);
          if (!res.ok || cancelled) return;
          const data = await res.json();
          if (q.length >= 2) {
            setLiveItems(data.items || []);
          } else {
            const combined = [
              ...(data.popularMovies || []),
              ...(data.popularShows || []),
              ...(data.anime || []),
            ];
            setLiveItems(combined);
          }
        } catch {
          // fallback cleanly
        } finally {
          if (!cancelled) setLoadingLive(false);
        }
      },
      q.length >= 2 ? 250 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const userSubs = useMemo(
    () => activeProfile?.subscribedProviders || [],
    [activeProfile]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const combined: CatalogItem[] = [];

    for (const item of [...liveItems, ...CATALOG_MEDIA]) {
      const key = `${item.tmdbMediaType}-${item.tmdbId}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }

    return combined
      .filter((item) => {
        if (mediaFilter !== "all" && item.type !== mediaFilter) return false;
        if (
          selectedGenre !== "All" &&
          !item.genres.some(
            (g) => g.toLowerCase() === selectedGenre.toLowerCase()
          )
        ) {
          return false;
        }
        if (selectedProvider !== "all") {
          const allP = [
            ...(item.providers.stream || []),
            ...(item.providers.free || []),
            ...(item.providers.rent || []),
          ];
          if (!allP.includes(selectedProvider)) return false;
        }
        if (onlyMySubs) {
          const streamP = [
            ...(item.providers.stream || []),
            ...(item.providers.free || []),
          ];
          if (!streamP.some((p) => userSubs.includes(p))) return false;
        }
        if (q) {
          const hay = [
            item.title,
            item.overview,
            item.year,
            item.studio || "",
            item.director || "",
            ...item.genres,
            ...item.cast.map((c) => c.name),
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "newest") return Number(b.year) - Number(a.year);
        if (sortBy === "az") return a.title.localeCompare(b.title);
        return (a.trendingRank ?? 50) - (b.trendingRank ?? 50);
      });
  }, [
    query,
    liveItems,
    mediaFilter,
    selectedGenre,
    selectedProvider,
    onlyMySubs,
    userSubs,
    sortBy,
  ]);

  const titleHeading =
    mediaFilter === "movie"
      ? "All Movies"
      : mediaFilter === "tv"
        ? "All Shows"
        : mediaFilter === "anime"
          ? "Anime"
          : "Discover";

  return (
    <main className="dulo-rail-px min-h-[100dvh] pb-24 pt-24 lg:pt-28">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* DULO.MOV LEFT SHELF SIDEBAR (D5wYSRv4.js) */}
        <aside className="hidden space-y-7 lg:block">
          <div>
            <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/[0.38]">
              Catalog
            </p>
            <div className="space-y-1">
              {[
                { id: "all", label: "Everything" },
                { id: "movie", label: "Movies" },
                { id: "tv", label: "TV Shows" },
                { id: "anime", label: "Anime" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMediaFilter(m.id)}
                  className={`flex min-h-10 w-full items-center rounded-[13px] px-3 text-left text-[13px] font-semibold transition ${
                    mediaFilter === m.id
                      ? "bg-[#da1b1b]/18 text-white ring-1 ring-[#da1b1b]/45"
                      : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/[0.38]">
              Shelves
            </p>
            <div className="space-y-1">
              {[
                { id: "popular", label: "Popular Now" },
                { id: "rating", label: "Top Rated" },
                { id: "newest", label: "Newest Releases" },
                { id: "az", label: "A–Z Title" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortBy(s.id)}
                  className={`flex min-h-10 w-full items-center rounded-[13px] px-3 text-left text-[13px] font-semibold transition ${
                    sortBy === s.id
                      ? "bg-white/[0.12] text-white"
                      : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/[0.38]">
              Genres
            </p>
            <div className="space-y-1">
              {["All", ...ALL_GENRES].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  className={`flex min-h-9 w-full items-center rounded-[12px] px-3 text-left text-[13px] font-medium transition ${
                    selectedGenre === g
                      ? "bg-[#da1b1b]/18 font-semibold text-white ring-1 ring-[#da1b1b]/45"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT COLUMN */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {titleHeading}
              </h1>
              <p className="mt-1 text-xs font-medium text-white/50">
                {filteredItems.length} titles · TMDB Posters · VidLink 4K
                Priority
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyMySubs((v) => !v)}
                className={`h-10 rounded-full px-4 text-xs font-semibold transition ${
                  onlyMySubs
                    ? "bg-[#da1b1b] text-white"
                    : "bg-white/[0.08] text-white/75 ring-1 ring-white/[0.08] hover:bg-white/[0.14]"
                }`}
              >
                Your Apps ({userSubs.length})
              </button>
              <button
                type="button"
                onClick={openRandomPicker}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-xs font-semibold text-white/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.14]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Shuffle</span>
              </button>
            </div>
          </div>

          {/* Search & Quick Filter Strip */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="beta-search-field flex flex-1 items-center gap-3 px-4 py-2.5">
              <Search className="h-4 w-4 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search TMDB movies, shows, actors..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
              />
              {loadingLive && (
                <Loader2 className="h-4 w-4 animate-spin text-white/50" />
              )}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-white/50 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="h-11 rounded-[16px] border border-white/[0.12] bg-[#171717] px-3.5 text-xs font-semibold text-white outline-none"
            >
              <option value="all">All Channels &amp; Apps</option>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Genre Pills */}
          <div className="scrollbar-hide mt-4 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
            {["All", ...ALL_GENRES].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedGenre === g
                    ? "bg-[#da1b1b] text-white"
                    : "bg-white/[0.07] text-white/65"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Dense TMDB Poster Grid */}
          {filteredItems.length === 0 ? (
            <div className="flex min-h-[38vh] items-center justify-center text-center">
              <div>
                <p className="text-[18px] font-semibold text-white/[0.86]">
                  Nothing here yet.
                </p>
                <p className="mt-1.5 text-sm text-white/50">
                  Try another shelf or clear your filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
              {filteredItems.map((item) => (
                <MediaCard
                  key={`${item.tmdbMediaType}-${item.id}`}
                  item={item}
                  fluid
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <DuloShelfBrowser defaultMedia="all" />
    </Suspense>
  );
}
