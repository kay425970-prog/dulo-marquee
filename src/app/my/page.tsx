"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATALOG_MEDIA, CatalogItem, findCatalogItem } from "@/lib/catalog";
import { LibraryEntry, useMarquee } from "@/components/MarqueeProvider";
import { MediaCard } from "@/components/MediaCard";
import {
  Bookmark,
  Heart,
  Play,
  FolderPlus,
  Users,
  Sparkles,
  Download,
  Copy,
  Plus,
  Send,
  ThumbsUp,
  Trash2,
  Loader2,
} from "lucide-react";

interface WatchPartyRoom {
  id: number;
  roomCode: string;
  hostName: string;
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
  posterUrl: string;
  viewerCount: number;
  messages: Array<{
    id: string;
    sender: string;
    avatarGradient: string;
    text: string;
    reaction?: string;
    timestamp: string;
  }>;
}

function entryToCatalogItem(entry: LibraryEntry): CatalogItem {
  const found = findCatalogItem(entry.mediaId, entry.mediaType);
  if (found) return found;
  return {
    id: entry.mediaId,
    tmdbId: entry.mediaId,
    tmdbMediaType: entry.mediaType === "movie" ? "movie" : "tv",
    type: (entry.mediaType as "movie" | "tv" | "anime") || "movie",
    title: entry.title,
    tagline: "",
    overview: "",
    year: entry.year,
    releaseDate: entry.year,
    rating: Number(entry.rating) || 8.2,
    runtime: entry.mediaType === "movie" ? "Feature" : "Series",
    maturity: "PG-13",
    quality: "4K",
    status: "Released",
    posterUrl: entry.posterUrl,
    backdropUrl: entry.backdropUrl || entry.posterUrl,
    genres: entry.genres || [],
    moods: [],
    providers: { stream: [], rent: [], buy: [] },
    cast: [],
  };
}

function MyLibraryContent() {
  const searchParams = useSearchParams();
  const {
    activeProfile,
    library,
    collections,
    clearProgress,
    openProfileModal,
    refreshState,
    notify,
  } = useMarquee();

  const [tab, setTab] = useState<string>(
    searchParams.get("tab") || "watchlist"
  );

  const [colName, setColName] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([
    "693134",
    "533535",
  ]);

  const [parties, setParties] = useState<WatchPartyRoom[]>([]);
  const [selectedParty, setSelectedParty] = useState<WatchPartyRoom | null>(
    null
  );
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [newPartyMediaId, setNewPartyMediaId] = useState(CATALOG_MEDIA[0].id);
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t);
  }, [searchParams]);

  const loadParties = useCallback(async () => {
    try {
      const res = await fetch("/api/watch-party");
      if (res.ok) {
        const data = await res.json();
        const list: WatchPartyRoom[] = data.parties || [];
        setParties(list);
        setSelectedParty((prev) => {
          if (prev) {
            return list.find((p) => p.roomCode === prev.roomCode) || prev;
          }
          return list[0] || null;
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  const watchlistEntries = useMemo(
    () => library.filter((i) => i.inWatchlist),
    [library]
  );
  const favoriteEntries = useMemo(
    () => library.filter((i) => i.isFavorite),
    [library]
  );
  const progressEntries = useMemo(
    () => library.filter((i) => i.progressPercent > 0),
    [library]
  );

  const genreBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of activeProfile?.preferredGenres || []) {
      counts[g] = (counts[g] || 0) + 2;
    }
    for (const item of library) {
      const weight = (item.isFavorite ? 3 : 1) + (item.inWatchlist ? 2 : 0);
      for (const g of item.genres || []) {
        counts[g] = (counts[g] || 0) + weight;
      }
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;
    return entries.slice(0, 6).map(([genre, score]) => ({
      genre,
      pct: Math.round((score / max) * 100),
    }));
  }, [activeProfile, library]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;
    const chosenItems = CATALOG_MEDIA.filter((m) =>
      selectedMediaIds.includes(m.id)
    ).map((m) => ({
      mediaId: m.id,
      mediaType: m.type,
      title: m.title,
      posterUrl: m.posterUrl,
      year: m.year,
      rating: m.rating,
    }));

    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        profileId: activeProfile?.id || 1,
        name: colName.trim(),
        description: colDesc.trim(),
        items: chosenItems,
      }),
    });
    if (res.ok) {
      setColName("");
      setColDesc("");
      await refreshState();
      notify("Collection saved");
    }
  };

  const handleLikeCollection = async (collectionId: number) => {
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", collectionId }),
    });
    await refreshState();
  };

  const handleDeleteCollection = async (collectionId: number) => {
    await fetch(`/api/collections?id=${collectionId}`, { method: "DELETE" });
    await refreshState();
    notify("Collection deleted");
  };

  const handleCreateWatchParty = async () => {
    const media =
      CATALOG_MEDIA.find((m) => m.id === newPartyMediaId) || CATALOG_MEDIA[0];
    const res = await fetch("/api/watch-party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        hostName: activeProfile?.name || "Alex Mercer",
        avatarGradient:
          activeProfile?.avatarGradient || "from-red-600 to-rose-700",
        mediaId: media.id,
        mediaType: media.type,
        mediaTitle: media.title,
        posterUrl: media.posterUrl,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      await loadParties();
      setSelectedParty(data.party);
      notify(`Created Watch Party ${data.party.roomCode}`);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const res = await fetch("/api/watch-party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join",
        roomCode: joinCodeInput.trim().toUpperCase(),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedParty(data.party);
      setJoinCodeInput("");
      await loadParties();
      notify(`Joined room ${data.party.roomCode}`);
    } else {
      notify("Room code not found");
    }
  };

  const handleSendPartyChat = async (reaction?: string) => {
    if (!selectedParty) return;
    const text = reaction ? `Reacted ${reaction}` : chatText.trim();
    if (!text) return;

    const res = await fetch("/api/watch-party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "message",
        roomCode: selectedParty.roomCode,
        sender: activeProfile?.name || "Viewer",
        avatarGradient:
          activeProfile?.avatarGradient || "from-red-600 to-rose-700",
        text,
        reaction,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedParty(data.party);
      setParties((prev) =>
        prev.map((p) => (p.id === data.party.id ? data.party : p))
      );
      if (!reaction) setChatText("");
    }
  };

  const handleExportWatchlist = (format: "json" | "markdown") => {
    if (format === "markdown") {
      const lines = [
        `# ${activeProfile?.name || "arkaflix"} — My List`,
        "",
        ...library.map(
          (i) =>
            `- [${i.progressPercent >= 90 ? "x" : " "}] **${i.title}** (${i.year}) · ★ ${i.rating}`
        ),
      ].join("\n");
      navigator.clipboard?.writeText(lines);
      notify("Copied Markdown watchlist");
      return;
    }

    const payload = JSON.stringify(
      {
        format: "OpenWatchlist-1.0",
        exportedAt: new Date().toISOString(),
        profile: activeProfile?.name,
        items: library,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arkaflix-mylist-${activeProfile?.handle || "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Downloaded OpenWatchlist JSON");
  };

  return (
    <main className="arkaflix-rail-px min-h-[100dvh] pb-24 pt-24 lg:pt-28">
      {/* Profile Header */}
      <div className="beta-panel flex flex-col justify-between gap-5 p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#da1b1b]/25 text-2xl ring-1 ring-[#da1b1b]/45">
            {activeProfile?.avatarEmoji || "🎬"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeProfile?.name || "Your Arkaflix"}
            </h1>
            <p className="text-xs text-white/55">
              {activeProfile?.bio ||
                "Your saved titles, watch history, collections & synchronized watch parties."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openProfileModal}
          className="h-10 self-start rounded-full bg-white/[0.08] px-4 text-xs font-semibold text-white ring-1 ring-white/[0.09] hover:bg-white/[0.14] md:self-auto"
        >
          Switch profile
        </button>
      </div>

      {/* Tabs */}
      <div className="scrollbar-hide mt-6 flex gap-2 overflow-x-auto pb-1">
        {[
          {
            id: "watchlist",
            label: `My List (${watchlistEntries.length})`,
            icon: Bookmark,
          },
          {
            id: "continue",
            label: `Continue Watching (${progressEntries.length})`,
            icon: Play,
          },
          {
            id: "favorites",
            label: `Favorites (${favoriteEntries.length})`,
            icon: Heart,
          },
          {
            id: "collections",
            label: `Collections (${collections.length})`,
            icon: FolderPlus,
          },
          {
            id: "parties",
            label: `Watch Parties (${parties.length})`,
            icon: Users,
          },
          {
            id: "genome",
            label: "Taste & Export",
            icon: Sparkles,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition ${
                active
                  ? "bg-white text-black"
                  : "bg-white/[0.07] text-white/75 hover:bg-white/[0.14]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: MY LIST */}
      {tab === "watchlist" && (
        <section className="mt-6">
          {watchlistEntries.length === 0 ? (
            <div className="beta-panel p-12 text-center">
              <p className="text-base font-semibold text-white">
                Nothing in My List yet
              </p>
              <p className="mt-1 text-xs text-white/50">
                Save any movie, show, or anime to keep it here.
              </p>
              <Link
                href="/movies"
                className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-5 text-xs font-semibold text-black"
              >
                Explore Movies
              </Link>
            </div>
          ) : (
            <div data-tv-row="my-grid" data-tv-grid
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
              {watchlistEntries.map((entry) => (
                <MediaCard
                  key={entry.id}
                  item={entryToCatalogItem(entry)}
                  fluid
                  progressPercent={entry.progressPercent}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: FAVORITES */}
      {tab === "favorites" && (
        <section className="mt-6">
          {favoriteEntries.length === 0 ? (
            <div className="beta-panel p-12 text-center">
              <p className="text-base font-semibold text-white">
                No favorites yet
              </p>
            </div>
          ) : (
            <div data-tv-row="my-grid" data-tv-grid
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
              {favoriteEntries.map((entry) => (
                <MediaCard
                  key={entry.id}
                  item={entryToCatalogItem(entry)}
                  fluid
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: CONTINUE WATCHING */}
      {tab === "continue" && (
        <section className="mt-6">
          {progressEntries.length === 0 ? (
            <div className="beta-panel p-12 text-center">
              <p className="text-base font-semibold text-white">
                No titles in progress
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {progressEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="beta-panel flex items-center justify-between gap-4 p-4"
                >
                  <Link
                    href={`/title/${entry.mediaType}/${entry.mediaId}`}
                    className="flex min-w-0 flex-1 items-center gap-3.5"
                  >
                    <img
                      src={entry.posterUrl}
                      alt={entry.title}
                      className="h-20 w-14 shrink-0 rounded-[10px] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {entry.title}
                      </div>
                      <div className="mt-0.5 text-xs text-white/55">
                        {entry.mediaType === "movie"
                          ? `${entry.progressPercent}% watched`
                          : `S${entry.lastSeason} · E${entry.lastEpisode} (${entry.progressPercent}%)`}
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
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
                    aria-label="Clear progress"
                    className="grid h-9 w-9 place-items-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: COLLECTIONS */}
      {tab === "collections" && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {collections.map((col) => (
              <div key={col.id} className="beta-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {col.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/50">
                      {col.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLikeCollection(col.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/[0.14]"
                    >
                      <ThumbsUp className="h-3 w-3" /> {col.likesCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(col.id)}
                      className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto pb-1">
                  {col.items.map((entry) => (
                    <Link
                      key={entry.mediaId}
                      href={`/title/${entry.mediaType}/${entry.mediaId}`}
                      className="group w-28 shrink-0"
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-[12px] bg-white/[0.04] ring-1 ring-white/[0.07]">
                        <img
                          src={entry.posterUrl}
                          alt={entry.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-1.5 truncate text-xs font-semibold text-white/80 group-hover:text-white">
                        {entry.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <form
              onSubmit={handleCreateCollection}
              className="beta-panel p-5"
            >
              <h3 className="text-base font-bold text-white">
                New Collection
              </h3>
              <div className="mt-3">
                <input
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
                />
              </div>
              <div className="mt-3">
                <textarea
                  rows={2}
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
                />
              </div>
              <div className="mt-3 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
                {CATALOG_MEDIA.slice(0, 14).map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/[0.06]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMediaIds.includes(m.id)}
                      onChange={() =>
                        setSelectedMediaIds((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((x) => x !== m.id)
                            : [...prev, m.id]
                        )
                      }
                      className="accent-[#da1b1b]"
                    />
                    <span className="truncate">{m.title}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-xs font-semibold text-black hover:bg-white/90"
              >
                <Plus className="h-4 w-4" /> Create collection
              </button>
            </form>
          </div>
        </section>
      )}

      {/* TAB: WATCH PARTIES */}
      {tab === "parties" && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="beta-panel p-5">
              <h3 className="text-base font-bold text-white">
                Host Watch Party
              </h3>
              <div className="mt-3 flex gap-2">
                <select
                  value={newPartyMediaId}
                  onChange={(e) => setNewPartyMediaId(e.target.value)}
                  className="flex-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white"
                >
                  {CATALOG_MEDIA.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#171717]">
                      {m.title} ({m.year})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCreateWatchParty}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
                >
                  Create
                </button>
              </div>

              <form
                onSubmit={handleJoinRoom}
                className="mt-4 flex gap-2 border-t border-white/[0.08] pt-4"
              >
                <input
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="Enter Room Code (e.g. DL-8842)"
                  className="flex-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs uppercase text-white placeholder-white/35 focus:border-[#da1b1b] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white/[0.1] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.16]"
                >
                  Join
                </button>
              </form>
            </div>

            <div className="space-y-2">
              {parties.map((p) => {
                const active = selectedParty?.roomCode === p.roomCode;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedParty(p)}
                    className={`flex w-full items-center gap-3 rounded-[18px] p-3.5 text-left transition ${
                      active
                        ? "bg-[#da1b1b]/18 ring-1 ring-[#da1b1b]/55"
                        : "bg-[#171717] ring-1 ring-white/[0.08] hover:bg-white/[0.06]"
                    }`}
                  >
                    <img
                      src={p.posterUrl}
                      alt={p.mediaTitle}
                      className="h-14 w-10 rounded-[8px] object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#da1b1b] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {p.roomCode}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {p.mediaTitle}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/50">
                        Host: {p.hostName} · {p.viewerCount} watching
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            {selectedParty && (
              <div className="beta-panel flex h-full flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div>
                      <span className="text-xs font-bold text-[#ff8585]">
                        ● Room {selectedParty.roomCode} ·{" "}
                        {selectedParty.viewerCount} Viewers
                      </span>
                      <h3 className="mt-0.5 text-lg font-bold text-white">
                        {selectedParty.mediaTitle}
                      </h3>
                    </div>

                    <Link
                      href={`/title/${selectedParty.mediaType}/${selectedParty.mediaId}`}
                      className="inline-flex h-10 items-center rounded-full bg-white px-5 text-xs font-semibold text-black hover:bg-white/90"
                    >
                      Open Title Info &amp; Stream
                    </Link>
                  </div>

                  <div className="scrollbar-hide mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {selectedParty.messages.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-[14px] bg-white/[0.04] p-3 text-xs ring-1 ring-white/[0.06]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#ff8585]">
                            {m.sender}
                          </span>
                          <span className="text-[10px] text-white/35">
                            {m.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 text-white/90">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-white/[0.08] pt-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    {["🍿", "🔥", "🤯", "⚔️", "❤️"].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleSendPartyChat(em)}
                        className="rounded-xl bg-white/[0.06] px-2.5 py-1 text-sm ring-1 ring-white/[0.08] hover:bg-white/[0.14]"
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendPartyChat();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={`Message room ${selectedParty.roomCode}...`}
                      className="flex-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-full bg-[#da1b1b] px-4 py-2 text-xs font-semibold text-white"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB: TASTE & EXPORT */}
      {tab === "genome" && (
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="beta-panel p-6 lg:col-span-7">
            <h3 className="text-lg font-bold text-white">
              Your Genre Affinity
            </h3>
            <div className="mt-4 space-y-3">
              {genreBreakdown.map((g) => (
                <div key={g.genre}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">{g.genre}</span>
                    <span className="text-white/60">{g.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#da1b1b]"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="beta-panel p-6 lg:col-span-5">
            <h3 className="text-lg font-bold text-white">
              OpenWatchlist Export
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Your list stays portable — export anytime in JSON or Markdown.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => handleExportWatchlist("json")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold text-black hover:bg-white/90"
              >
                <Download className="h-4 w-4" /> Download JSON
              </button>
              <button
                type="button"
                onClick={() => handleExportWatchlist("markdown")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/[0.08] text-xs font-semibold text-white hover:bg-white/[0.14]"
              >
                <Copy className="h-4 w-4" /> Copy Markdown
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function MyLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <MyLibraryContent />
    </Suspense>
  );
}
