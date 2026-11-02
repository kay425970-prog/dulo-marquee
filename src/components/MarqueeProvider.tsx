"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CATALOG_MEDIA,
  CatalogItem,
  LIVE_TV_CHANNELS,
  PROVIDERS,
} from "@/lib/catalog";
import {
  Search,
  X,
  Plus,
  Check,
  Radio,
  UserPlus,
  RefreshCw,
} from "lucide-react";

export interface UserProfile {
  id: number;
  name: string;
  handle: string;
  avatarGradient: string;
  avatarEmoji: string;
  bio: string;
  subscribedProviders: string[];
  preferredGenres: string[];
  isKids: boolean;
}

export interface LibraryEntry {
  id: number;
  profileId: number;
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  year: string;
  rating: string;
  genres: string[];
  inWatchlist: boolean;
  isFavorite: boolean;
  progressPercent: number;
  progressSeconds: number;
  lastSeason: number;
  lastEpisode: number;
}

export interface CustomCollection {
  id: number;
  profileId: number;
  name: string;
  description: string;
  accentColor: string;
  items: Array<{
    mediaId: string;
    mediaType: "movie" | "tv" | "anime";
    title: string;
    posterUrl: string;
    year: string;
    rating: number;
  }>;
  likesCount: number;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

interface MarqueeContextValue {
  user: AuthUser | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  library: LibraryEntry[];
  collections: CustomCollection[];
  loading: boolean;
  switchProfile: (profileId: number) => Promise<void>;
  createProfile: (input: {
    name: string;
    avatarEmoji: string;
    bio: string;
    subscribedProviders: string[];
  }) => Promise<void>;
  toggleProviderSubscription: (providerId: string) => Promise<void>;
  toggleWatchlist: (item: CatalogItem) => Promise<void>;
  toggleFavorite: (item: CatalogItem) => Promise<void>;
  saveProgress: (
    item: CatalogItem,
    progressPercent: number,
    progressSeconds: number,
    season?: number,
    episode?: number
  ) => Promise<void>;
  clearProgress: (mediaId: string) => Promise<void>;
  isInWatchlist: (mediaId: string) => boolean;
  isFavorite: (mediaId: string) => boolean;
  getProgress: (mediaId: string) => LibraryEntry | undefined;
  refreshState: () => Promise<void>;
  openOmnibar: () => void;
  openRandomPicker: () => void;
  openProfileModal: () => void;
  notify: (message: string) => void;
}

const MarqueeContext = createContext<MarqueeContextValue | null>(null);

export function useMarquee() {
  const ctx = useContext(MarqueeContext);
  if (!ctx) {
    throw new Error("useMarquee must be used within MarqueeProvider");
  }
  return ctx;
}

export function MarqueeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const [omnibarOpen, setOmnibarOpen] = useState(false);
  const [omnibarQuery, setOmnibarQuery] = useState("");
  const [externalResults, setExternalResults] = useState<CatalogItem[]>([]);

  const [randomOpen, setRandomOpen] = useState(false);
  const [randomPick, setRandomPick] = useState<CatalogItem | null>(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [creatingProfile, setCreatingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎬");
  const [newBio, setNewBio] = useState("4K cinema & series streamer");
  const [newSubs, setNewSubs] = useState<string[]>(["netflix", "max", "prime"]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const rollRandomPick = useCallback(() => {
    const pick =
      CATALOG_MEDIA[Math.floor(Math.random() * CATALOG_MEDIA.length)];
    setRandomPick(pick);
  }, []);

  const openRandomPicker = useCallback(() => {
    rollRandomPick();
    setRandomOpen(true);
  }, [rollRandomPick]);

  const fetchState = useCallback(async (preferredProfileId?: number) => {
    try {
      const savedId =
        preferredProfileId ??
        (typeof window !== "undefined"
          ? Number(window.localStorage.getItem("marquee_profile_id") || 0)
          : 0);
      const url = savedId ? `/api/state?profileId=${savedId}` : "/api/state";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user || null);
      setProfiles(data.profiles || []);
      setActiveProfile(data.activeProfile || null);
      setLibrary(data.library || []);
      setCollections(data.collections || []);
      if (data.activeProfile && typeof window !== "undefined") {
        window.localStorage.setItem(
          "marquee_profile_id",
          String(data.activeProfile.id)
        );
      }
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || "Sign in failed." };
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("marquee_profile_id");
      }
      await fetchState(0);
      notify(`Welcome back, ${data.user?.name || "there"}`);
      return { ok: true };
    },
    [fetchState, notify]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || "Could not create account." };
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("marquee_profile_id");
      }
      await fetchState(data.profile?.id);
      notify(`Account created. Welcome, ${data.user?.name || "there"}`);
      return { ok: true };
    },
    [fetchState, notify]
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("marquee_profile_id");
    }
    setUser(null);
    setProfileModalOpen(false);
    await fetchState(0);
    notify("Signed out");
    router.push("/");
    router.refresh();
  }, [fetchState, notify, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOmnibarOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setOmnibarOpen(false);
        setRandomOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Live TMDB multi-search (100% TMDB posters)
  useEffect(() => {
    if (!omnibarOpen || omnibarQuery.trim().length < 2) {
      setExternalResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/discover?q=${encodeURIComponent(omnibarQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setExternalResults(data.items || []);
        }
      } catch {
        // fallback cleanly
      }
    }, 240);
    return () => clearTimeout(timer);
  }, [omnibarOpen, omnibarQuery]);

  const switchProfile = useCallback(
    async (profileId: number) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("marquee_profile_id", String(profileId));
      }
      await fetchState(profileId);
      const found = profiles.find((p) => p.id === profileId);
      if (found) notify(`Switched profile to ${found.name}`);
      setProfileModalOpen(false);
    },
    [fetchState, notify, profiles]
  );

  const createProfile = useCallback(
    async (input: {
      name: string;
      avatarEmoji: string;
      bio: string;
      subscribedProviders: string[];
    }) => {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createProfile", ...input }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          await fetchState(data.profile.id);
          notify(`Created profile ${data.profile.name}`);
          setCreatingProfile(false);
          setProfileModalOpen(false);
          setNewName("");
        }
      }
    },
    [fetchState, notify]
  );

  const toggleProviderSubscription = useCallback(
    async (providerId: string) => {
      if (!activeProfile) return;
      const current = activeProfile.subscribedProviders || [];
      const exists = current.includes(providerId);
      const next = exists
        ? current.filter((p) => p !== providerId)
        : [...current, providerId];

      setActiveProfile({ ...activeProfile, subscribedProviders: next });
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === activeProfile.id ? { ...p, subscribedProviders: next } : p
        )
      );

      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSubscriptions",
          profileId: activeProfile.id,
          subscribedProviders: next,
        }),
      });
      notify(exists ? "Removed from Your Apps" : "Added to Your Apps");
    },
    [activeProfile, notify]
  );

  const isInWatchlist = useCallback(
    (mediaId: string) =>
      library.some((i) => i.mediaId === mediaId && i.inWatchlist),
    [library]
  );

  const isFavorite = useCallback(
    (mediaId: string) =>
      library.some((i) => i.mediaId === mediaId && i.isFavorite),
    [library]
  );

  const getProgress = useCallback(
    (mediaId: string) => library.find((i) => i.mediaId === mediaId),
    [library]
  );

  const toggleWatchlist = useCallback(
    async (item: CatalogItem) => {
      const profileId = activeProfile?.id || 1;
      const currentlyIn = isInWatchlist(item.id);

      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          year: item.year,
          rating: String(item.rating),
          genres: item.genres,
          toggle: "watchlist",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary((prev) => {
          const rest = prev.filter((x) => x.mediaId !== item.id);
          return [data.item, ...rest];
        });
        notify(currentlyIn ? "Removed from My List" : "Saved to My List");
      }
    },
    [activeProfile, isInWatchlist, notify]
  );

  const toggleFavorite = useCallback(
    async (item: CatalogItem) => {
      const profileId = activeProfile?.id || 1;
      const currentlyFav = isFavorite(item.id);

      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          year: item.year,
          rating: String(item.rating),
          genres: item.genres,
          toggle: "favorite",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary((prev) => {
          const rest = prev.filter((x) => x.mediaId !== item.id);
          return [data.item, ...rest];
        });
        notify(currentlyFav ? "Removed from Favorites" : "Added to Favorites");
      }
    },
    [activeProfile, isFavorite, notify]
  );

  const saveProgress = useCallback(
    async (
      item: CatalogItem,
      progressPercent: number,
      progressSeconds: number,
      season = 1,
      episode = 1
    ) => {
      const profileId = activeProfile?.id || 1;
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          year: item.year,
          rating: String(item.rating),
          genres: item.genres,
          progressPercent,
          progressSeconds,
          lastSeason: season,
          lastEpisode: episode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary((prev) => {
          const rest = prev.filter((x) => x.mediaId !== item.id);
          return [data.item, ...rest];
        });
      }
    },
    [activeProfile]
  );

  const clearProgress = useCallback(
    async (mediaId: string) => {
      const profileId = activeProfile?.id || 1;
      await fetch(
        `/api/library?profileId=${profileId}&mediaId=${encodeURIComponent(mediaId)}&clearProgress=true`,
        { method: "DELETE" }
      );
      setLibrary((prev) =>
        prev.map((x) =>
          x.mediaId === mediaId
            ? { ...x, progressPercent: 0, progressSeconds: 0 }
            : x
        )
      );
      notify("Removed from Continue Watching");
    },
    [activeProfile, notify]
  );

  const omnibarMatches = useMemo(() => {
    const q = omnibarQuery.trim().toLowerCase();
    if (!q) return CATALOG_MEDIA.slice(0, 8);
    const local = CATALOG_MEDIA.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q)) ||
        m.cast.some((c) => c.name.toLowerCase().includes(q))
    );
    const seen = new Set(local.map((m) => m.tmdbId));
    const merged = [...local];
    for (const ext of externalResults) {
      if (!seen.has(ext.tmdbId)) {
        seen.add(ext.tmdbId);
        merged.push(ext);
      }
    }
    return merged.slice(0, 12);
  }, [omnibarQuery, externalResults]);

  const matchingChannels = useMemo(() => {
    const q = omnibarQuery.trim().toLowerCase();
    if (!q) return [];
    return LIVE_TV_CHANNELS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    ).slice(0, 3);
  }, [omnibarQuery]);

  const value = useMemo<MarqueeContextValue>(
    () => ({
      user,
      signIn,
      register,
      signOut,
      profiles,
      activeProfile,
      library,
      collections,
      loading,
      switchProfile,
      createProfile,
      toggleProviderSubscription,
      toggleWatchlist,
      toggleFavorite,
      saveProgress,
      clearProgress,
      isInWatchlist,
      isFavorite,
      getProgress,
      refreshState: () => fetchState(activeProfile?.id),
      openOmnibar: () => setOmnibarOpen(true),
      openRandomPicker,
      openProfileModal: () => setProfileModalOpen(true),
      notify,
    }),
    [
      user,
      signIn,
      register,
      signOut,
      profiles,
      activeProfile,
      library,
      collections,
      loading,
      switchProfile,
      createProfile,
      toggleProviderSubscription,
      toggleWatchlist,
      toggleFavorite,
      saveProgress,
      clearProgress,
      isInWatchlist,
      isFavorite,
      getProgress,
      fetchState,
      openRandomPicker,
      notify,
    ]
  );

  return (
    <MarqueeContext.Provider value={value}>
      {children}

      {/* arkaflix.app Glass Toast */}
      {toast && (
        <div className="fixed bottom-20 right-5 z-[300] flex items-center gap-2.5 rounded-2xl border border-white/[0.14] bg-[#171717]/95 px-4 py-3 text-[13px] font-semibold text-white shadow-[0_18px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:bottom-6">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#da1b1b] text-white">
            <Check className="h-3 w-3" />
          </span>
          <span>{toast}</span>
        </div>
      )}

      {/* arkaflix.app Search Modal (.beta-search-field) */}
      {omnibarOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 px-4 pt-20 backdrop-blur-md"
          onClick={() => setOmnibarOpen(false)}
        >
          <div
            className="w-full max-w-[640px] overflow-hidden rounded-[24px] border border-white/[0.14] bg-[#0d0d0d]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="beta-search-field flex items-center gap-3 px-4 py-3">
              <Search className="h-5 w-5 text-white/50" />
              <input
                autoFocus
                value={omnibarQuery}
                onChange={(e) => setOmnibarQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && omnibarQuery.trim()) {
                    setOmnibarOpen(false);
                    router.push(
                      `/browse?q=${encodeURIComponent(omnibarQuery.trim())}`
                    );
                  }
                }}
                placeholder="Search movies, shows, anime on TMDB..."
                className="flex-1 bg-transparent text-[15px] text-white placeholder-white/40 focus:outline-none"
              />
              {omnibarQuery && (
                <button
                  type="button"
                  onClick={() => setOmnibarQuery("")}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.08] text-white/65 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOmnibarOpen(false)}
                className="rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-semibold text-white/55 hover:text-white"
              >
                ESC
              </button>
            </div>

            <div className="scrollbar-hide mt-3 max-h-[58vh] space-y-1 overflow-y-auto">
              {matchingChannels.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/live?channel=${ch.id}`}
                  onClick={() => setOmnibarOpen(false)}
                  className="flex items-center justify-between rounded-[14px] px-3 py-2.5 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#da1b1b]/25 text-xs font-bold text-[#ff8585] ring-1 ring-[#da1b1b]/40">
                      {ch.logoText}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-white">
                        {ch.name}
                      </p>
                      <p className="text-xs text-white/50">{ch.currentShow}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#da1b1b]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#ff8585]">
                    <Radio className="h-3 w-3" /> LIVE
                  </span>
                </Link>
              ))}

              {omnibarMatches.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`/title/${item.type}/${item.id}`}
                  onClick={() => setOmnibarOpen(false)}
                  className="flex items-center gap-3.5 rounded-[14px] p-2 transition hover:bg-white/[0.06]"
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="h-16 w-11 shrink-0 rounded-[10px] bg-white/[0.05] object-cover ring-1 ring-white/[0.08]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white/[0.92]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/55">
                      {item.year} ·{" "}
                      {item.type === "movie"
                        ? "Movie"
                        : item.type === "anime"
                          ? "Anime"
                          : "TV Show"}{" "}
                      ·{" "}
                      <span className="text-yellow-400">
                        ★ {item.rating.toFixed(1)}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-white/75">
                    Info →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Random Pick Modal */}
      {randomOpen && randomPick && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-lg"
          onClick={() => setRandomOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] border border-white/[0.14] bg-[#171717] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Tonight&apos;s Pick
            </p>
            <Link
              href={`/title/${randomPick.type}/${randomPick.id}`}
              onClick={() => setRandomOpen(false)}
              className="mx-auto mt-4 block w-44"
            >
              <div className="aspect-[2/3] overflow-hidden rounded-[14px] bg-white/[0.04] ring-1 ring-white/[0.12]">
                <img
                  src={randomPick.posterUrl}
                  alt={randomPick.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 truncate text-base font-bold text-white">
                {randomPick.title}
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                {randomPick.year} · ★ {randomPick.rating.toFixed(1)}
              </p>
            </Link>

            <div className="mt-5 flex justify-center gap-2.5">
              <Link
                href={`/title/${randomPick.type}/${randomPick.id}`}
                onClick={() => setRandomOpen(false)}
                className="beta-action inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90"
              >
                More Info
              </Link>
              <button
                type="button"
                onClick={rollRandomPick}
                className="beta-action inline-flex h-11 items-center gap-1.5 rounded-full bg-white/12 px-4 text-sm font-semibold text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" /> Shuffle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Switcher Modal */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[24px] border border-white/[0.16] bg-[#171717] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Who&apos;s watching arkaflix?
                </h3>
                <p className="mt-0.5 text-xs text-white/50">
                  {user
                    ? `Signed in as ${user.email}`
                    : "You're browsing as a guest — sign in to sync My List & progress across devices."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!creatingProfile ? (
              <>
                <div className="mt-5 space-y-2">
                  {profiles.map((p) => {
                    const isActive = activeProfile?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => switchProfile(p.id)}
                        className={`flex w-full items-center justify-between rounded-[16px] p-3.5 text-left transition ${
                          isActive
                            ? "bg-[#da1b1b]/18 ring-1 ring-[#da1b1b]/55"
                            : "bg-white/[0.04] ring-1 ring-white/[0.06] hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08] text-xl">
                            {p.avatarEmoji}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {p.name}
                            </div>
                            <div className="text-xs text-white/50">{p.bio}</div>
                          </div>
                        </div>
                        {isActive && (
                          <span className="rounded-full bg-[#da1b1b] px-3 py-1 text-xs font-semibold text-white">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-4">
                  <button
                    type="button"
                    onClick={() => setCreatingProfile(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-xs font-semibold text-white hover:bg-white/[0.14]"
                  >
                    <UserPlus className="h-4 w-4" /> New Profile
                  </button>
                  <div className="flex items-center gap-2">
                    {user ? (
                      <button
                        type="button"
                        onClick={signOut}
                        className="inline-flex h-10 items-center rounded-full bg-white/[0.08] px-4 text-xs font-semibold text-white/80 hover:bg-white/[0.14] hover:text-white"
                      >
                        Sign out
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setProfileModalOpen(false)}
                        className="inline-flex h-10 items-center rounded-full bg-[#da1b1b] px-4 text-xs font-semibold text-white hover:brightness-110"
                      >
                        Sign in
                      </Link>
                    )}
                    <Link
                      href="/my"
                      onClick={() => setProfileModalOpen(false)}
                      className="inline-flex h-10 items-center rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-white/90"
                    >
                      Your Arkaflix →
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newName.trim()) return;
                  createProfile({
                    name: newName,
                    avatarEmoji: newEmoji,
                    bio: newBio,
                    subscribedProviders: newSubs,
                  });
                }}
                className="mt-5 space-y-4"
              >
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-white/60">
                      Name
                    </label>
                    <input
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Profile name"
                      className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-[#da1b1b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60">
                      Icon
                    </label>
                    <select
                      value={newEmoji}
                      onChange={(e) => setNewEmoji(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/12 bg-[#0d0d0d] px-3 py-2.5 text-sm text-white"
                    >
                      {["🎬", "🍿", "⚡", "🚀", "🦊", "🎭", "🌙", "🔥"].map(
                        (em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60">
                    Your Streaming Apps
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PROVIDERS.filter((p) => p.type === "subscription").map(
                      (prov) => {
                        const active = newSubs.includes(prov.id);
                        return (
                          <button
                            type="button"
                            key={prov.id}
                            onClick={() =>
                              setNewSubs((prev) =>
                                prev.includes(prov.id)
                                  ? prev.filter((x) => x !== prov.id)
                                  : [...prev, prov.id]
                              )
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              active
                                ? "bg-[#da1b1b] text-white"
                                : "bg-white/[0.07] text-white/65"
                            }`}
                          >
                            {prov.shortName}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreatingProfile(false)}
                    className="rounded-full bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </MarqueeContext.Provider>
  );
}
