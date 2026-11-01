"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { LIVE_TV_CHANNELS, LiveChannel } from "@/lib/catalog";
import { HlsVideoPlayer } from "@/components/HlsVideoPlayer";
import { useMarquee } from "@/components/MarqueeProvider";
import {
  Radio,
  Search,
  Plus,
  Trash2,
  Tv,
  Upload,
  Loader2,
} from "lucide-react";

interface CustomDbChannel {
  id: number;
  name: string;
  category: string;
  streamUrl: string;
  logoText: string;
  country: string;
}

function LiveTvContent() {
  const searchParams = useSearchParams();
  const { activeProfile, notify } = useMarquee();

  const [customChannels, setCustomChannels] = useState<CustomDbChannel[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    searchParams.get("channel") || LIVE_TV_CHANNELS[0].id
  );
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [channelSearch, setChannelSearch] = useState("");

  const [m3uInput, setM3uInput] = useState("");
  const [customName, setCustomName] = useState("");
  const [importing, setImporting] = useState(false);

  const loadCustomChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/live-channels");
      if (res.ok) {
        const data = await res.json();
        setCustomChannels(data.channels || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadCustomChannels();
  }, [loadCustomChannels]);

  const allChannels: Array<LiveChannel & { dbId?: number }> = useMemo(() => {
    const mappedCustom: Array<LiveChannel & { dbId?: number }> =
      customChannels.map((c) => ({
        id: `custom-${c.id}`,
        dbId: c.id,
        name: c.name,
        category: c.category || "Custom IPTV",
        streamUrl: c.streamUrl,
        logoText: c.logoText || "TV",
        accent: "from-red-600 to-rose-700",
        country: c.country || "IPTV",
        quality: "Custom HLS",
        currentShow: "Live Imported IPTV Broadcast",
        nextShow: "Continuous Linear Feed",
        viewers: "Live",
      }));
    return [...mappedCustom, ...LIVE_TV_CHANNELS];
  }, [customChannels]);

  const activeChannel =
    allChannels.find((c) => c.id === selectedId) || allChannels[0];

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const c of allChannels) set.add(c.category);
    return Array.from(set);
  }, [allChannels]);

  const visibleChannels = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    return allChannels.filter((c) => {
      if (categoryFilter !== "All" && c.category !== categoryFilter) {
        return false;
      }
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.category.toLowerCase().includes(q) &&
        !c.currentShow.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [allChannels, categoryFilter, channelSearch]);

  const handleImportM3u = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uInput.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/live-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: activeProfile?.id || 1,
          m3uText: m3uInput.trim(),
          customName: customName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.channels?.length) {
        setM3uInput("");
        setCustomName("");
        await loadCustomChannels();
        setSelectedId(`custom-${data.channels[0].id}`);
        notify(`Imported ${data.channels.length} live channel(s)`);
      } else {
        notify(data.error || "Could not parse M3U / HLS URL");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteCustom = async (dbId: number) => {
    await fetch(`/api/live-channels?id=${dbId}`, { method: "DELETE" });
    await loadCustomChannels();
    if (selectedId === `custom-${dbId}`) {
      setSelectedId(LIVE_TV_CHANNELS[0].id);
    }
    notify("Removed custom channel");
  };

  return (
    <main className="dulo-rail-px min-h-[100dvh] pb-24 pt-24 lg:pt-28">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#da1b1b]/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#ff8585]">
          <Radio className="h-3 w-3 animate-pulse" /> Live TV
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          24/7 Live Channels &amp; M3U Studio
        </h1>
        <p className="mt-1 text-xs font-medium text-white/55">
          Free adaptive HLS <code className="text-[#ff8585]">.m3u8</code>{" "}
          broadcasts across space, sports, news, kids &amp; custom IPTV lists.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <HlsVideoPlayer
            key={activeChannel.streamUrl}
            src={activeChannel.streamUrl}
            title={activeChannel.name}
            subtitle={`${activeChannel.category} · ${activeChannel.currentShow}`}
            isLive
            autoPlay
          />

          <div className="beta-panel mt-4 flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#da1b1b]/25 text-xs font-bold text-[#ff8585] ring-1 ring-[#da1b1b]/45">
                {activeChannel.logoText}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {activeChannel.name}
                </h2>
                <p className="text-xs text-white/55">
                  On now:{" "}
                  <span className="text-white/85">
                    {activeChannel.currentShow}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold text-white/80">
                {activeChannel.quality}
              </span>
              <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs text-white/55">
                {activeChannel.country}
              </span>
            </div>
          </div>

          <div className="beta-panel mt-5 p-5">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#ff8585]" />
              <h3 className="text-sm font-bold text-white">
                Import Custom Live TV (M3U / M3U8 URL)
              </h3>
            </div>

            <form onSubmit={handleImportM3u} className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Channel name (optional)"
                  className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/35 focus:border-[#da1b1b] focus:outline-none"
                />
                <input
                  value={m3uInput}
                  onChange={(e) => setM3uInput(e.target.value)}
                  placeholder="https://example.com/live/master.m3u8 or #EXTM3U..."
                  className="sm:col-span-2 rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/35 focus:border-[#da1b1b] focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={importing}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {importing ? "Importing…" : "Load Playlist"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="beta-panel p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-white/70" />
                <h3 className="text-sm font-bold text-white">
                  Channels ({visibleChannels.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                ● Live
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                placeholder="Filter channels..."
                className="w-full rounded-xl border border-white/10 bg-black/35 py-2 pl-9 pr-3 text-xs text-white placeholder-white/35 focus:border-[#da1b1b] focus:outline-none"
              />
            </div>

            <div className="scrollbar-hide mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    categoryFilter === cat
                      ? "bg-[#da1b1b] text-white"
                      : "bg-white/[0.06] text-white/60 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="scrollbar-hide mt-3 max-h-[500px] space-y-2 overflow-y-auto pr-1">
              {visibleChannels.map((ch) => {
                const isSelected = ch.id === activeChannel.id;
                return (
                  <div
                    key={ch.id}
                    className={`flex items-center justify-between rounded-[14px] p-2.5 transition ${
                      isSelected
                        ? "bg-[#da1b1b]/20 ring-1 ring-[#da1b1b]/55"
                        : "bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.07]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(ch.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white/[0.08] text-xs font-bold text-white">
                        {ch.logoText}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">
                          {ch.name}
                        </div>
                        <div className="truncate text-[11px] text-white/50">
                          {ch.currentShow}
                        </div>
                      </div>
                    </button>

                    {ch.dbId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(ch.dbId!)}
                        className="ml-2 rounded p-1 text-white/45 hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LiveTvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <LiveTvContent />
    </Suspense>
  );
}
