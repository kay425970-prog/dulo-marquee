"use client";

import React, {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATALOG_MEDIA,
  CatalogItem,
  PROVIDER_MAP,
  findCatalogItem,
} from "@/lib/catalog";
import { useMarquee } from "@/components/MarqueeProvider";
import { MediaRail } from "@/components/MediaCard";
import {
  FullscreenCinemaPlayer,
  ActiveWatchPartyRoom,
} from "@/components/FullscreenCinemaPlayer";
import type { ResolvedStreamOption } from "@/app/api/stream-resolve/route";
import {
  ArrowLeft,
  Play,
  Plus,
  Check,
  Star,
  FolderPlus,
  Users,
  EyeOff,
  Eye,
  ThumbsUp,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

interface ReviewRow {
  id: number;
  mediaId: string;
  profileName: string;
  avatarGradient: string;
  rating: number;
  headline: string;
  comment: string;
  spoiler: boolean;
  likesCount: number;
  createdAt: string;
}

export function ArkaflixTitleInfoView({ type, id }: { type: string; id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activeProfile,
    collections,
    isInWatchlist,
    getProgress,
    toggleWatchlist,
    saveProgress,
    clearProgress,
    refreshState,
    notify,
  } = useMarquee();

  const localFallback = useMemo(() => findCatalogItem(id, type), [id, type]);
  const [item, setItem] = useState<CatalogItem | null>(localFallback || null);
  const [loadingTitle, setLoadingTitle] = useState(!localFallback);

  const savedEntry = getProgress(id);

  const [season, setSeason] = useState(savedEntry?.lastSeason || 1);
  const [episode, setEpisode] = useState(savedEntry?.lastEpisode || 1);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [spoilerShield, setSpoilerShield] = useState(false);
  const [revealedEpisodes, setRevealedEpisodes] = useState<Set<number>>(
    () => new Set()
  );

  const [playerOpen, setPlayerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"none" | "collect" | "rate">(
    "none"
  );

  // Automatic background stream resolution (VidBolt first)
  const [resolvedStreams, setResolvedStreams] = useState<
    ResolvedStreamOption[]
  >([]);
  const [resolvingStreams, setResolvingStreams] = useState(true);
  const [engineCount, setEngineCount] = useState(0);

  // PostgreSQL Reviews & Rating Panel
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [userScore, setUserScore] = useState<number>(9);
  const [ratingNote, setRatingNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fullscreen Watch Party
  const [activeParty, setActiveParty] = useState<ActiveWatchPartyRoom | null>(
    null
  );

  useEffect(() => {
    if (savedEntry) {
      setSeason(savedEntry.lastSeason || 1);
      setEpisode(savedEntry.lastEpisode || 1);
    }
  }, [savedEntry?.lastSeason, savedEntry?.lastEpisode]);

  useEffect(() => {
    if (searchParams.get("play") === "1") {
      setPlayerOpen(true);
    }
  }, [searchParams]);

  // Fetch full live TMDB metadata (ClearLogo, Cast w185, Season 1 w300 Stills, US Providers, Reviews, Recommendations)
  useEffect(() => {
    let cancelled = false;
    if (!localFallback) setLoadingTitle(true);

    fetch(
      `/api/discover?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}&season=${savedEntry?.lastSeason || 1}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.item) setItem(data.item);
        setLoadingTitle(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingTitle(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, type]);

  // Fetch real TMDB episodes & w300 stills whenever user changes season in dropdown
  const handleChangeSeason = async (nextSeason: number) => {
    setSeason(nextSeason);
    setEpisode(1);
    if (!item || item.tmdbMediaType !== "tv") return;

    setLoadingSeason(true);
    try {
      const res = await fetch(
        `/api/discover?id=${encodeURIComponent(item.tmdbId)}&type=tv&season=${nextSeason}&seasonOnly=true`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.episodes?.length) {
          setItem((prev) => {
            if (!prev || !prev.seasons) return prev;
            return {
              ...prev,
              seasons: prev.seasons.map((s) =>
                s.seasonNumber === nextSeason
                  ? { ...s, episodes: data.episodes }
                  : s
              ),
            };
          });
        }
      }
    } finally {
      setLoadingSeason(false);
    }
  };

  // Pre-resolve the top engine (VidBolt) automatically in background
  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    setResolvingStreams(true);

    const isEpisodic =
      item.tmdbMediaType === "tv" ||
      Boolean(item.seasons && item.seasons.length > 0);

    const qs = new URLSearchParams({
      mediaId: item.id,
      tmdbId: item.tmdbId,
      type: item.type,
      episodic: String(isEpisodic),
      season: String(season),
      episode: String(episode),
    });
    // Anime has its own sub/dub provider keyed by AniList id.
    if (item.anilistId) qs.set("anilistId", String(item.anilistId));

    fetch(`/api/stream-resolve?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.primary) {
          setResolvedStreams([data.primary, ...(data.backups || [])]);
          setEngineCount(data.engineCount || (data.backups?.length || 0) + 1);
        }
        setResolvingStreams(false);
      })
      .catch(() => {
        if (!cancelled) setResolvingStreams(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.tmdbId, item?.tmdbMediaType, item?.anilistId, season, episode]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?mediaId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const activeSeasonObj = useMemo(() => {
    if (!item?.seasons?.length) return null;
    return (
      item.seasons.find((s) => s.seasonNumber === season) || item.seasons[0]
    );
  }, [item, season]);

  const moreLikeThis = useMemo(() => {
    if (item?.recommendations?.length) return item.recommendations;
    if (!item) return CATALOG_MEDIA.slice(0, 12);
    return CATALOG_MEDIA.filter((m) => m.id !== item.id)
      .sort((a, b) => {
        const aMatch = a.genres.filter((g) => item.genres.includes(g)).length;
        const bMatch = b.genres.filter((g) => item.genres.includes(g)).length;
        return bMatch - aMatch;
      })
      .slice(0, 12);
  }, [item]);

  const launchFullscreenPlayer = useCallback(
    (targetSeason = season, targetEpisode = episode) => {
      if (!item) return;
      setSeason(targetSeason);
      setEpisode(targetEpisode);
      setPlayerOpen(true);

      const nextPct = Math.max(10, savedEntry?.progressPercent || 10);
      saveProgress(
        item,
        nextPct,
        savedEntry?.progressSeconds || 0,
        targetSeason,
        targetEpisode
      );
    },
    [item, season, episode, savedEntry, saveProgress]
  );

  const handleStartWatchParty = useCallback(async () => {
    if (!item) return;
    const res = await fetch("/api/watch-party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        hostName: activeProfile?.name || "Alex Mercer",
        avatarGradient:
          activeProfile?.avatarGradient || "from-red-600 to-rose-700",
        mediaId: item.id,
        mediaType: item.type,
        mediaTitle: item.title,
        posterUrl: item.posterUrl,
        currentServer: "vidcore",
        season,
        episode,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setActiveParty(data.party);
      setPlayerOpen(true);
      notify(`Watch Party ${data.party.roomCode} started on VidBolt!`);
    }
  }, [item, activeProfile, season, episode, notify]);

  const handleSendPartyMessage = useCallback(
    async (text: string, reaction?: string) => {
      if (!activeParty || !text.trim()) return;
      const res = await fetch("/api/watch-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          roomCode: activeParty.roomCode,
          sender: activeProfile?.name || "Viewer",
          avatarGradient:
            activeProfile?.avatarGradient || "from-red-600 to-rose-700",
          text,
          reaction,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveParty(data.party);
      }
    },
    [activeParty, activeProfile]
  );

  const handleAddToCollection = async (collectionId: number, colName: string) => {
    if (!item) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addItem",
        collectionId,
        entry: {
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          rating: item.rating,
        },
      }),
    });
    if (res.ok) {
      await refreshState();
      setActivePanel("none");
      notify(`Added to ${colName}`);
    }
  };

  const handleSaveRating = async () => {
    if (!item) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.id,
          mediaType: item.type,
          profileName: activeProfile?.name || "arkaflix Member",
          avatarGradient:
            activeProfile?.avatarGradient || "from-red-600 to-rose-700",
          rating: userScore,
          headline: `Rated ${userScore}/10`,
          comment:
            ratingNote.trim() ||
            `Rated ${item.title} ${userScore}/10 on arkaflix.`,
        }),
      });
      if (res.ok) {
        setRatingNote("");
        setActivePanel("none");
        await loadReviews();
        notify(`Saved ${userScore}/10 rating`);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewId: number) => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", reviewId }),
    });
    if (res.ok) {
      const data = await res.json();
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? data.review : r))
      );
    }
  };

  if (loadingTitle) {
    return (
      <section className="relative flex h-[min(78svh,760px)] min-h-[560px] items-center justify-center overflow-hidden bg-[#070707]">
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_68%_12%,rgba(255,255,255,0.12),transparent_36%),linear-gradient(180deg,#171717,#070707)]" />
        <div className="relative z-10 flex items-center gap-2.5 text-sm font-medium text-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-[#da1b1b]" />
          <span>Loading movie info…</span>
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6 text-center">
        <div>
          <p className="text-[18px] font-semibold text-white/[0.86]">
            Title couldn&apos;t be loaded.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 rounded-full bg-white/10 px-5 py-2 text-[13px] font-semibold text-white/85 transition hover:bg-white/20"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(item.id);
  const isEpisodic =
    item.tmdbMediaType === "tv" ||
    Boolean(item.seasons && item.seasons.length > 0);
  const primaryStream = resolvedStreams[0];

  // Build availability groups from live TMDB providers or local catalog fallback
  const availabilityGroups = (() => {
    if (
      item.liveProviders &&
      (item.liveProviders.stream.length ||
        item.liveProviders.rent.length ||
        item.liveProviders.buy.length)
    ) {
      return [
        { label: "Stream", items: item.liveProviders.stream },
        { label: "Rent", items: item.liveProviders.rent },
        { label: "Buy", items: item.liveProviders.buy },
      ].filter((g) => g.items.length > 0);
    }

    const mapFallback = (ids: string[] = []) =>
      ids
        .map((pid) => PROVIDER_MAP[pid])
        .filter(Boolean)
        .map((p) => ({
          id: p.tmdbProviderId,
          name: p.name,
          logoUrl: p.logoUrl,
          slug: p.id,
        }));

    return [
      {
        label: "Stream",
        items: mapFallback([
          ...(item.providers.stream || []),
          ...(item.providers.free || []),
        ]),
      },
      { label: "Rent", items: mapFallback(item.providers.rent) },
      { label: "Buy", items: mapFallback(item.providers.buy) },
    ].filter((g) => g.items.length > 0);
  })();

  return (
    <div className="min-h-screen pb-20">
      {/* FULL-SCREEN PLAYER (Launches on Play or Episode click, prioritized to VidBolt) */}
      <FullscreenCinemaPlayer
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        item={item}
        streams={resolvedStreams}
        resolvingStreams={resolvingStreams}
        season={season}
        episode={episode}
        onSelectEpisode={(nextS, nextE) => {
          if (nextS !== season) {
            handleChangeSeason(nextS);
          }
          setSeason(nextS);
          setEpisode(nextE);
          saveProgress(
            item,
            Math.max(12, savedEntry?.progressPercent || 12),
            0,
            nextS,
            nextE
          );
        }}
        onProgress={(pct, secs) =>
          saveProgress(item, pct, secs, season, episode)
        }
        activeParty={activeParty}
        onStartParty={handleStartWatchParty}
        onSendPartyMessage={handleSendPartyMessage}
        onCopyPartyCode={(code) => {
          navigator.clipboard?.writeText(code);
          notify(`Copied room code ${code}`);
        }}
      />

      {/* ARKAFLIX.MOV EXACT TITLE HERO SECTION (node 23) */}
      <section className="relative flex min-h-[560px] w-full flex-col justify-end overflow-hidden bg-[#070707] sm:h-[min(78svh,750px)]">
        <img
          src={item.backdropUrl || item.posterUrl}
          alt={item.title}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[65%_18%] opacity-80"
        />

        {/* arkaflix.app exact layered gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/[0.86] via-black/[0.45] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_72%_52%_at_52%_-8%,rgba(255,193,106,0.18),transparent_58%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/25 to-transparent" />

        {/* Floating Back Pill */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="absolute left-5 top-20 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0d0d0d]/65 text-white/85 ring-1 ring-white/[0.1] backdrop-blur-2xl transition hover:bg-white/[0.15] sm:left-8 lg:top-24"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Hero Foreground Content */}
        <div className="arkaflix-rail-px relative z-10 pb-10 pt-32 sm:pb-14">
          <div className="max-w-[640px]">
            {item.logoUrl ? (
              <>
                <img
                  src={item.logoUrl}
                  alt={item.title}
                  className="mb-5 max-h-[104px] max-w-[min(430px,78vw)] object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.72)]"
                />
                <h1 className="sr-only">{item.title}</h1>
              </>
            ) : (
              <h1 className="mb-4 text-3xl font-black tracking-tight text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.72)] sm:text-5xl">
                {item.title}
              </h1>
            )}

            {/* Metadata Pills Row */}
            <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-medium text-white/[0.82]">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.12] px-2 py-0.5 font-semibold tabular-nums text-white">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {item.rating.toFixed(1)}
              </span>
              <span className="tabular-nums">{item.year}</span>
              <span>·</span>
              <span className="tabular-nums">{item.runtime}</span>
              {item.genres.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-white/60">
                    {item.genres.slice(0, 3).join(", ")}
                  </span>
                </>
              )}
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
                <CheckCircle2 className="h-3 w-3" />
                {resolvingStreams
                  ? "Routing VidBolt…"
                  : primaryStream?.qualityTag || "VidBolt HD"}
              </span>
              {!resolvingStreams && engineCount > 1 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold text-white/70">
                  {engineCount} engines ready · auto-failover
                </span>
              )}
            </div>

            {/* Overview */}
            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-white/[0.78] sm:text-[15px]">
              {item.overview}
            </p>

            {item.director && (
              <p className="mt-2.5 text-xs font-medium text-white/50">
                {item.tmdbMediaType === "movie" ? "Directed by " : "Created by "}
                <span className="text-white/80">{item.director}</span>
                {item.studio ? ` · ${item.studio}` : ""}
              </p>
            )}

            {/* ARKAFLIX.MOV ACTION BAR: PLAY OPENS FULLSCREEN PLAYER */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => launchFullscreenPlayer()}
                className="beta-action inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[#111111] transition hover:bg-white/90 sm:text-[15px]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>
                  {isEpisodic
                    ? savedEntry && savedEntry.progressPercent > 0
                      ? `Resume S${season} · E${episode}`
                      : `Play S${season} · E${episode}`
                    : savedEntry && savedEntry.progressPercent > 0
                      ? `Resume (${savedEntry.progressPercent}%)`
                      : "Play"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleWatchlist(item)}
                className={`beta-action inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold backdrop-blur-xl transition ${
                  inWatchlist
                    ? "bg-[#da1b1b]/25 text-white ring-1 ring-[#da1b1b]/60"
                    : "bg-white/[0.12] text-white hover:bg-white/[0.2]"
                }`}
              >
                {inWatchlist ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>{inWatchlist ? "In My List" : "My List"}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActivePanel((p) => (p === "collect" ? "none" : "collect"))
                }
                className={`beta-action inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold backdrop-blur-xl transition ${
                  activePanel === "collect"
                    ? "bg-white/25 text-white"
                    : "bg-white/[0.12] text-white hover:bg-white/[0.2]"
                }`}
              >
                <FolderPlus className="h-4 w-4" />
                <span>Collect</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActivePanel((p) => (p === "rate" ? "none" : "rate"))
                }
                className={`beta-action inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold backdrop-blur-xl transition ${
                  activePanel === "rate"
                    ? "bg-white/25 text-white"
                    : "bg-white/[0.12] text-white hover:bg-white/[0.2]"
                }`}
              >
                <Star className="h-4 w-4" />
                <span>Rate</span>
              </button>

              <button
                type="button"
                onClick={handleStartWatchParty}
                className="beta-action inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.12] px-4 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.2]"
              >
                <Users className="h-4 w-4" />
                <span>Watch Party</span>
              </button>

              {savedEntry && savedEntry.progressPercent > 0 && (
                <button
                  type="button"
                  onClick={() => clearProgress(item.id)}
                  className="px-2 text-xs font-semibold text-white/50 hover:text-white"
                >
                  Remove progress
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BELOW-HERO SECTIONS (arkaflix.app exact spacing & components) */}
      <div className="relative z-10 space-y-12 pt-4">
        {/* INLINE COLLECTION OR RATING PANEL (arkaflix.app exact glass card) */}
        {activePanel !== "none" && (
          <section className="arkaflix-rail-px">
            <div className="max-w-3xl rounded-[22px] border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl backdrop-blur-xl">
              {activePanel === "collect" ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Add to a collection
                      </h2>
                      <p className="mt-1 text-xs text-white/45">
                        Keep personal shelves beyond My List.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel("none")}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {collections.map((col) => {
                      const exists = col.items.some(
                        (i) => i.mediaId === item.id
                      );
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleAddToCollection(col.id, col.name)}
                          className="flex min-h-14 items-center justify-between rounded-xl bg-white/[0.05] px-4 text-left ring-1 ring-white/[0.07] transition hover:bg-white/[0.09]"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-white">
                              {col.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-white/40">
                              {col.items.length} titles
                            </span>
                          </span>
                          {exists ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Plus className="h-4 w-4 text-white/45" />
                          )}
                        </button>
                      );
                    })}
                    <Link
                      href="/my?tab=collections"
                      className="col-span-full flex min-h-12 items-center justify-center rounded-xl border border-dashed border-white/[0.14] text-xs font-semibold text-white/60 hover:text-white"
                    >
                      + Create a new collection
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Your rating
                      </h2>
                      <p className="mt-1 text-xs text-white/45">
                        Saved to your profile &amp; community verdicts.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel("none")}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setUserScore(num)}
                        className={`h-10 rounded-xl text-sm font-bold transition ${
                          userScore === num
                            ? "bg-[#da1b1b] text-white"
                            : "bg-white/[0.06] text-white/75 hover:bg-white/[0.12]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    maxLength={500}
                    value={ratingNote}
                    onChange={(e) => setRatingNote(e.target.value)}
                    placeholder="Optional note — what worked for you?"
                    className="mt-3 w-full resize-none rounded-xl border border-white/[0.1] bg-black/35 p-3 text-xs text-white placeholder-white/40 focus:border-[#da1b1b] focus:outline-none"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={handleSaveRating}
                      className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                    >
                      {submittingReview ? "Saving…" : "Save rating"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ARKAFLIX.MOV "AVAILABLE ON THESE" PROVIDER PILLS */}
        {availabilityGroups.length > 0 && (
          <section
            aria-labelledby="availability-heading"
            className="arkaflix-rail-px"
          >
            <div>
              <h2
                id="availability-heading"
                className="text-[16px] font-semibold text-white/[0.92] sm:text-[17px]"
              >
                Available on these
              </h2>
              <p className="mt-1 text-[12px] font-medium text-white/50">
                US availability · Select a service to browse its arkaflix catalog
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {availabilityGroups.map((group) => (
                <div
                  key={group.label}
                  className="flex flex-wrap items-center gap-2.5"
                >
                  <span className="w-16 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                    {group.label}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {group.items.map((prov) =>
                      prov.slug ? (
                        <Link
                          key={`${group.label}-${prov.id}`}
                          href={`/providers?selected=${prov.slug}`}
                          className="flex min-h-11 items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 ring-1 ring-white/[0.07] transition hover:bg-white/[0.12]"
                        >
                          <img
                            src={prov.logoUrl}
                            alt={prov.name}
                            loading="lazy"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="text-[12px] font-semibold text-white/80">
                            {prov.name}
                          </span>
                        </Link>
                      ) : (
                        <div
                          key={`${group.label}-${prov.id}`}
                          className="flex min-h-11 items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 ring-1 ring-white/[0.07]"
                        >
                          <img
                            src={prov.logoUrl}
                            alt={prov.name}
                            loading="lazy"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="text-[12px] font-semibold text-white/75">
                            {prov.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ARKAFLIX.MOV EPISODES GRID WITH TMDB w300 STILLS & SPOILER SHIELD */}
        {isEpisodic && item.seasons && activeSeasonObj && (
          <section className="arkaflix-rail-px">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[16px] font-semibold leading-none text-white/[0.92] sm:text-[17px]">
                    Episodes
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSpoilerShield((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      spoilerShield
                        ? "bg-[#da1b1b]/20 text-[#ff8585] ring-1 ring-[#da1b1b]/40"
                        : "bg-white/[0.07] text-white/55 hover:text-white"
                    }`}
                  >
                    {spoilerShield ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    <span>Spoiler Shield</span>
                  </button>
                </div>
                <p className="mt-1 text-[11px] font-medium text-white/40">
                  {activeSeasonObj.episodes.length} episodes · Select any
                  episode to launch fullscreen stream
                </p>
              </div>

              <select
                value={season}
                onChange={(e) => handleChangeSeason(Number(e.target.value))}
                aria-label="Season"
                className="h-9 rounded-[12px] border-0 bg-white/[0.08] px-3 pr-8 text-[13px] font-semibold text-white/[0.9] ring-1 ring-white/[0.08] outline-none focus:ring-white/30"
              >
                {item.seasons.map((s) => (
                  <option
                    key={s.seasonNumber}
                    value={s.seasonNumber}
                    className="bg-[#1c1c1e]"
                  >
                    {s.name || `Season ${s.seasonNumber}`}
                  </option>
                ))}
              </select>
            </div>

            {loadingSeason ? (
              <div data-tv-row="episodes" data-tv-grid className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-[96px] animate-pulse rounded-[18px] bg-white/[0.045]"
                  />
                ))}
              </div>
            ) : (
              <div data-tv-row="episodes" data-tv-grid className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeSeasonObj.episodes.map((ep) => {
                  const hiddenByShield =
                    spoilerShield && !revealedEpisodes.has(ep.number);
                  const isCurrentSaved =
                    savedEntry?.lastSeason === season &&
                    savedEntry?.lastEpisode === ep.number &&
                    (savedEntry?.progressPercent || 0) > 0;

                  return (
                    <button
                      key={ep.number}
                      type="button"
                      onClick={() => {
                        if (hiddenByShield) {
                          setRevealedEpisodes((prev) => {
                            const next = new Set(prev);
                            next.add(ep.number);
                            return next;
                          });
                          return;
                        }
                        launchFullscreenPlayer(season, ep.number);
                      }}
                      className="group flex w-full min-w-0 gap-3 rounded-[18px] bg-white/[0.04] p-3 text-left ring-1 ring-white/[0.06] transition hover:bg-white/[0.08] hover:ring-white/[0.14] sm:gap-4"
                    >
                      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.05] sm:w-40">
                        {hiddenByShield ? (
                          <span className="grid h-full place-items-center bg-white/[0.035] px-2 text-center text-[11px] font-semibold text-white/45">
                            Select to reveal
                          </span>
                        ) : (
                          <img
                            src={
                              ep.stillUrl || item.backdropUrl || item.posterUrl
                            }
                            alt={ep.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}

                        <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                          <Play className="h-6 w-6 fill-current text-white" />
                        </span>

                        {isCurrentSaved && (
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                            <div
                              className="h-full bg-[#da1b1b]"
                              style={{
                                width: `${savedEntry?.progressPercent || 20}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="truncate text-[13px] font-semibold text-white/[0.92]">
                          {ep.number}.{" "}
                          {hiddenByShield
                            ? "Episode details hidden"
                            : ep.title}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-white/45">
                          {[ep.duration, ep.airDate, `★ ${ep.rating}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {!hiddenByShield && ep.overview && (
                          <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-white/[0.6]">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ARKAFLIX.MOV CIRCULAR CAST ROW */}
        {item.cast.length > 0 && (
          <section className="arkaflix-rail-px">
            <h2 className="mb-3 text-[16px] font-semibold text-white/[0.92] sm:text-[17px]">
              Cast
            </h2>
            <div data-tv-row="cast" className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pt-1">
              {item.cast.map((actor) => (
                <Link
                  key={`${actor.name}-${actor.character}`}
                  href={`/browse?q=${encodeURIComponent(actor.name)}`}
                  className="group/person w-[92px] shrink-0 text-center outline-none sm:w-[104px]"
                >
                  <div className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-white/[0.08]">
                    {actor.photoUrl ? (
                      <img
                        src={actor.photoUrl}
                        alt={actor.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover/person:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl font-semibold text-white/30">
                        {actor.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 truncate text-[12px] font-semibold text-white/[0.86] group-hover/person:text-white">
                    {actor.name}
                  </p>
                  <p className="truncate text-[11px] text-white/[0.5]">
                    {actor.character}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ARKAFLIX.MOV AUDIENCE REVIEWS (PostgreSQL + TMDB Excerpts) */}
        {(reviews.length > 0 || (item.tmdbReviews?.length || 0) > 0) && (
          <section
            aria-labelledby="reviews-heading"
            className="arkaflix-rail-px"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2
                  id="reviews-heading"
                  className="text-[16px] font-semibold text-white/[0.92] sm:text-[17px]"
                >
                  Audience reviews
                </h2>
                <p className="mt-1 text-[12px] font-medium text-white/45">
                  Community verdicts &amp; TMDB member excerpts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel("rate")}
                className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/[0.14] hover:text-white"
              >
                + Add review
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {reviews.map((rev) => (
                <article
                  key={`db-${rev.id}`}
                  className="min-w-0 rounded-[18px] bg-white/[0.035] p-5 ring-1 ring-white/[0.065]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold text-white/85">
                      {rev.profileName}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-white/65">
                      <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                      {rev.rating}/10
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-5 text-[12px] leading-6 text-white/60">
                    {rev.comment}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-white/35">
                      arkaflix Member
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLikeReview(rev.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/60 hover:text-white"
                    >
                      <ThumbsUp className="h-3 w-3" /> {rev.likesCount}
                    </button>
                  </div>
                </article>
              ))}

              {(item.tmdbReviews || []).map((tr) => (
                <article
                  key={`tmdb-${tr.id}`}
                  className="min-w-0 rounded-[18px] bg-white/[0.035] p-5 ring-1 ring-white/[0.065]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold text-white/85">
                      {tr.author}
                    </p>
                    {tr.rating && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-white/65">
                        <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                        {tr.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-5 whitespace-pre-line text-[12px] leading-6 text-white/58">
                    {tr.content}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-white/35">
                      TMDB Review
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* MORE LIKE THIS */}
        <MediaRail title="More like this" items={moreLikeThis} />
      </div>
    </div>
  );
}

export default function MediaDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[75vh] items-center justify-center bg-[#070707]">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <ArkaflixTitleInfoView type={type} id={id} />
    </Suspense>
  );
}
