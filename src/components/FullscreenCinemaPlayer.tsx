"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CatalogItem } from "@/lib/catalog";
import type { ResolvedStreamOption } from "@/app/api/stream-resolve/route";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Users,
  ListVideo,
  SkipForward,
  SkipBack,
  Send,
  Loader2,
  CheckCircle2,
  Server,
  X,
} from "lucide-react";

export interface ActiveWatchPartyRoom {
  id: number;
  roomCode: string;
  hostName: string;
  mediaTitle: string;
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

interface FullscreenCinemaPlayerProps {
  open: boolean;
  onClose: () => void;
  item: CatalogItem;
  streams: ResolvedStreamOption[];
  resolvingStreams: boolean;
  season: number;
  episode: number;
  onSelectEpisode: (season: number, episode: number) => void;
  onProgress: (percent: number, seconds: number) => void;
  activeParty: ActiveWatchPartyRoom | null;
  onStartParty: () => Promise<void>;
  onSendPartyMessage: (text: string, reaction?: string) => Promise<void>;
  onCopyPartyCode: (code: string) => void;
}

export function FullscreenCinemaPlayer({
  open,
  onClose,
  item,
  streams,
  resolvingStreams,
  season,
  episode,
  onSelectEpisode,
  onProgress,
  activeParty,
  onStartParty,
  onSendPartyMessage,
  onCopyPartyCode,
}: FullscreenCinemaPlayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [streamIndex, setStreamIndex] = useState(0);
  const [manualStream, setManualStream] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [episodesDrawerOpen, setEpisodesDrawerOpen] = useState(false);
  const [partyDrawerOpen, setPartyDrawerOpen] = useState(false);
  const [drawerSeason, setDrawerSeason] = useState(season);
  const [chatInput, setChatInput] = useState("");
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);

  useEffect(() => {
    setStreamIndex(0);
    setManualStream(false);
    setIframeLoaded(false);
  }, [streams, season, episode, item.id]);

  useEffect(() => {
    setDrawerSeason(season);
  }, [season]);

  useEffect(() => {
    if (activeParty && open) {
      setPartyDrawerOpen(true);
    }
  }, [activeParty?.roomCode, open]);

  const activeStream: ResolvedStreamOption | undefined =
    streams[streamIndex] || streams[0];

  // Lock page scroll & request OS fullscreen on open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const el = rootRef.current;
    if (el && !document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    const onFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("fullscreenchange", onFsChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [open]);

  const handleExitPlayer = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (episodesDrawerOpen) {
          setEpisodesDrawerOpen(false);
        } else if (partyDrawerOpen) {
          setPartyDrawerOpen(false);
        } else {
          handleExitPlayer();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, episodesDrawerOpen, partyDrawerOpen, handleExitPlayer]);

  // Auto-hide HUD after 3s of pointer inactivity
  const revealHud = useCallback(() => {
    setHudVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!episodesDrawerOpen && !partyDrawerOpen) {
        setHudVisible(false);
      }
    }, 3000);
  }, [episodesDrawerOpen, partyDrawerOpen]);

  useEffect(() => {
    if (open) revealHud();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [open, revealHud]);

  // Silent Auto-Failover Watchdog: automatically advance if an embed takes > 10s to load
  // (disabled after a manual API override so the user's choice sticks).
  useEffect(() => {
    if (!open || !activeStream || iframeLoaded || manualStream) {
      return;
    }
    if (streamIndex >= streams.length - 1) return;

    const timer = setTimeout(() => {
      if (!iframeLoaded && streamIndex < streams.length - 1) {
        setStreamIndex((idx) => idx + 1);
      }
    }, 10500);

    return () => clearTimeout(timer);
  }, [open, activeStream, iframeLoaded, streamIndex, streams.length, manualStream]);

  // Listen for progress telemetry emitted via postMessage
  useEffect(() => {
    if (!open) return;
    const onMessage = (event: MessageEvent) => {
      try {
        const payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!payload || typeof payload !== "object") return;

        const current =
          payload?.data?.currentTime ??
          payload?.currentTime ??
          payload?.timestamp;
        const duration = payload?.data?.duration ?? payload?.duration;

        if (
          typeof current === "number" &&
          typeof duration === "number" &&
          duration > 30
        ) {
          const pct = Math.min(
            99,
            Math.max(1, Math.round((current / duration) * 100))
          );
          onProgress(pct, Math.round(current));
        }
      } catch {
        // ignore non-JSON messages
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, onProgress]);

  const toggleNativeFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const hasEpisodes = Boolean(item.seasons && item.seasons.length > 0);
  const currentSeasonObj = useMemo(() => {
    if (!item.seasons?.length) return null;
    return (
      item.seasons.find((s) => s.seasonNumber === season) || item.seasons[0]
    );
  }, [item.seasons, season]);

  const drawerSeasonObj = useMemo(() => {
    if (!item.seasons?.length) return null;
    return (
      item.seasons.find((s) => s.seasonNumber === drawerSeason) ||
      item.seasons[0]
    );
  }, [item.seasons, drawerSeason]);

  const currentEpObj = useMemo(() => {
    return currentSeasonObj?.episodes.find((e) => e.number === episode) || null;
  }, [currentSeasonObj, episode]);

  const canGoPrevEp = hasEpisodes && (episode > 1 || season > 1);
  const canGoNextEp = useMemo(() => {
    if (!hasEpisodes || !currentSeasonObj || !item.seasons) return false;
    if (episode < currentSeasonObj.episodes.length) return true;
    return item.seasons.some((s) => s.seasonNumber === season + 1);
  }, [hasEpisodes, currentSeasonObj, item.seasons, episode, season]);

  const handleStepEpisode = (dir: -1 | 1) => {
    if (!item.seasons || !currentSeasonObj) return;
    if (dir === 1) {
      if (episode < currentSeasonObj.episodes.length) {
        onSelectEpisode(season, episode + 1);
      } else {
        const nextS = item.seasons.find((s) => s.seasonNumber === season + 1);
        if (nextS) onSelectEpisode(nextS.seasonNumber, 1);
      }
    } else {
      if (episode > 1) {
        onSelectEpisode(season, episode - 1);
      } else {
        const prevS = item.seasons.find((s) => s.seasonNumber === season - 1);
        if (prevS) {
          onSelectEpisode(
            prevS.seasonNumber,
            prevS.episodes[prevS.episodes.length - 1]?.number || 1
          );
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      onMouseMove={revealHud}
      onTouchStart={revealHud}
      className="fixed inset-0 z-[250] flex h-screen w-screen flex-col overflow-hidden bg-black select-none"
    >
      {/* DULO.MOV TRANSLUCENT AUTO-HIDING FULLSCREEN HUD */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-black/90 via-black/55 to-transparent px-4 pb-8 pt-4 transition-opacity duration-300 sm:px-7 ${
          hudVisible || episodesDrawerOpen || partyDrawerOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Left: Back Pill + Title + Prioritized VidCore Status */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleExitPlayer}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#0d0d0d]/80 px-4 text-xs font-semibold text-white ring-1 ring-white/[0.1] backdrop-blur-2xl transition hover:bg-white/[0.14]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-white sm:text-base">
                {item.title}
              </h2>
              {hasEpisodes && (
                <span className="rounded-md bg-white/[0.12] px-2 py-0.5 text-xs font-semibold text-white ring-1 ring-white/[0.08]">
                  S{season} · E{episode}
                  {currentEpObj ? ` — ${currentEpObj.title}` : ""}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/65">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {activeStream
                  ? `${manualStream ? "Manual API" : "Auto-Connected"} · ${activeStream.qualityTag}`
                  : "Connecting VidCore 4K..."}
              </span>
            </div>
          </div>
        </div>

        {/* Right: API Selector + Episode Switcher + Watch Party + Native Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Streaming API Dropdown (Auto by default, manual override available) */}
          <div className="flex h-10 items-center gap-1.5 rounded-full bg-[#0d0d0d]/80 px-3 ring-1 ring-white/[0.1] backdrop-blur-2xl">
            <Server className="h-3.5 w-3.5 shrink-0 text-white/70" />
            <select
              aria-label="Select streaming API"
              value={manualStream ? String(streamIndex) : "auto"}
              onMouseDown={revealHud}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "auto") {
                  setManualStream(false);
                  setStreamIndex(0);
                } else {
                  const nextIndex = Number(value);
                  if (Number.isInteger(nextIndex) && streams[nextIndex]) {
                    setManualStream(true);
                    setStreamIndex(nextIndex);
                  }
                }
                setIframeLoaded(false);
                revealHud();
              }}
              className="max-w-[148px] cursor-pointer bg-transparent text-xs font-semibold text-white outline-none sm:max-w-[210px]"
            >
              <option value="auto" className="bg-[#171717] text-white">
                Auto · Best ({streams[0]?.provider || "VidCore"})
              </option>
              {streams.map((stream, idx) => {
                let host = stream.provider;
                try {
                  host = new URL(stream.url).hostname.replace(/^www\./, "");
                } catch {
                  // keep provider label
                }
                return (
                  <option
                    key={`${stream.id}-${idx}`}
                    value={String(idx)}
                    className="bg-[#171717] text-white"
                  >
                    {stream.provider} · {host}
                  </option>
                );
              })}
            </select>
          </div>

          {hasEpisodes && (
            <>
              <button
                type="button"
                disabled={!canGoPrevEp}
                onClick={() => handleStepEpisode(-1)}
                title="Previous Episode"
                className="inline-flex h-10 items-center gap-1 rounded-full bg-[#0d0d0d]/80 px-3.5 text-xs font-semibold text-white ring-1 ring-white/[0.1] backdrop-blur-2xl transition hover:bg-white/[0.14] disabled:opacity-35"
              >
                <SkipBack className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Prev</span>
              </button>
              <button
                type="button"
                disabled={!canGoNextEp}
                onClick={() => handleStepEpisode(1)}
                title="Next Episode"
                className="inline-flex h-10 items-center gap-1 rounded-full bg-[#0d0d0d]/80 px-3.5 text-xs font-semibold text-white ring-1 ring-white/[0.1] backdrop-blur-2xl transition hover:bg-white/[0.14] disabled:opacity-35"
              >
                <span className="hidden md:inline">Next</span>
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPartyDrawerOpen(false);
                  setEpisodesDrawerOpen((v) => !v);
                }}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ring-1 backdrop-blur-2xl transition ${
                  episodesDrawerOpen
                    ? "bg-[#da1b1b] text-white ring-[#da1b1b]"
                    : "bg-[#0d0d0d]/80 text-white ring-white/[0.1] hover:bg-white/[0.14]"
                }`}
              >
                <ListVideo className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Episodes</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={async () => {
              setEpisodesDrawerOpen(false);
              if (!activeParty) {
                await onStartParty();
                setPartyDrawerOpen(true);
              } else {
                setPartyDrawerOpen((v) => !v);
              }
            }}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ring-1 backdrop-blur-2xl transition ${
              partyDrawerOpen || activeParty
                ? "bg-[#da1b1b] text-white ring-[#da1b1b]"
                : "bg-[#0d0d0d]/80 text-white ring-white/[0.1] hover:bg-white/[0.14]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {activeParty ? `Party ${activeParty.roomCode}` : "Watch Party"}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleNativeFullscreen}
            title={isNativeFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#0d0d0d]/80 text-white ring-1 ring-white/[0.1] backdrop-blur-2xl transition hover:bg-white/[0.14]"
          >
            {isNativeFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExitPlayer}
            title="Close Player (ESC)"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#0d0d0d]/80 text-white/80 ring-1 ring-white/[0.1] backdrop-blur-2xl transition hover:bg-[#da1b1b] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FULLSCREEN STREAMING IFRAME STAGE */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center bg-black">
        {(resolvingStreams && !activeStream) || !iframeLoaded ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]/90">
            <Loader2 className="h-10 w-10 animate-spin text-[#da1b1b]" />
            <p className="text-xs font-semibold text-white/85">
              Launching {item.title} on VidCore 4K...
            </p>
          </div>
        ) : null}

        {activeStream && (
          <iframe
            key={`${activeStream.id}-${activeStream.url}`}
            src={activeStream.url}
            title={item.title}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            onLoad={() => setIframeLoaded(true)}
            onError={() => {
              if (!manualStream && streamIndex < streams.length - 1) {
                setStreamIndex((idx) => idx + 1);
              }
            }}
            className="h-full w-full border-0"
          />
        )}

        {floatingReaction && (
          <div className="pointer-events-none absolute bottom-20 right-12 z-40 animate-bounce text-5xl drop-shadow-2xl">
            {floatingReaction}
          </div>
        )}

        {/* IN-PLAYER EPISODES DRAWER (with TMDB w300 Episode Thumbnails) */}
        {episodesDrawerOpen && hasEpisodes && item.seasons && (
          <aside className="absolute bottom-0 right-0 top-0 z-40 flex w-96 max-w-[90vw] flex-col border-l border-white/[0.1] bg-[#0d0d0d]/95 p-5 pt-20 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Episodes</h3>
              <button
                type="button"
                onClick={() => setEpisodesDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <select
                value={drawerSeason}
                onChange={(e) => setDrawerSeason(Number(e.target.value))}
                className="h-10 w-full rounded-[12px] bg-white/[0.08] px-3 text-[13px] font-semibold text-white ring-1 ring-white/[0.1] outline-none"
              >
                {item.seasons.map((s) => (
                  <option
                    key={s.seasonNumber}
                    value={s.seasonNumber}
                    className="bg-[#171717]"
                  >
                    Season {s.seasonNumber} ({s.episodes.length} eps)
                  </option>
                ))}
              </select>
            </div>

            <div className="scrollbar-hide mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {drawerSeasonObj?.episodes.map((ep) => {
                const isCurrent =
                  drawerSeason === season && ep.number === episode;
                return (
                  <button
                    key={ep.number}
                    type="button"
                    onClick={() => {
                      onSelectEpisode(drawerSeason, ep.number);
                      setEpisodesDrawerOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[16px] p-2.5 text-left transition ${
                      isCurrent
                        ? "bg-[#da1b1b]/22 ring-1 ring-[#da1b1b]/60"
                        : "bg-white/[0.04] ring-1 ring-white/[0.06] hover:bg-white/[0.09]"
                    }`}
                  >
                    <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-[10px] bg-white/[0.06]">
                      {ep.stillUrl ? (
                        <img
                          src={ep.stillUrl}
                          alt={ep.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-bold text-white/40">
                          E{ep.number}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {ep.number}. {ep.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/50">
                        {ep.duration} · ★ {ep.rating}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* IN-PLAYER WATCH PARTY DRAWER */}
        {partyDrawerOpen && activeParty && (
          <aside className="absolute bottom-0 right-0 top-0 z-40 flex w-96 max-w-[90vw] flex-col justify-between border-l border-white/[0.1] bg-[#0d0d0d]/95 p-5 pt-20 shadow-2xl backdrop-blur-2xl">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff8585]">
                    <span className="h-2 w-2 rounded-full bg-[#da1b1b] animate-pulse" />
                    Room {activeParty.roomCode}
                  </span>
                  <div className="text-xs text-white/55">
                    {activeParty.viewerCount} watching together
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCopyPartyCode(activeParty.roomCode)}
                    className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white hover:bg-white/[0.15]"
                  >
                    Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyDrawerOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="scrollbar-hide mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                {activeParty.messages.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-[14px] bg-white/[0.04] p-2.5 text-xs ring-1 ring-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#ff8585]">
                        {m.sender}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {m.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-white/90">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-white/[0.08] pt-3">
              <div className="mb-2 flex items-center gap-1.5">
                {["🍿", "🔥", "🤯", "⚔️", "❤️"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setFloatingReaction(emoji);
                      setTimeout(() => setFloatingReaction(null), 1800);
                      onSendPartyMessage(`Reacted ${emoji}`, emoji);
                    }}
                    className="rounded-xl bg-white/[0.06] px-2.5 py-1 text-sm ring-1 ring-white/[0.08] hover:bg-white/[0.14]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  onSendPartyMessage(chatInput.trim());
                  setChatInput("");
                }}
                className="flex gap-2"
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat in fullscreen..."
                  className="flex-1 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
                />
                <button
                  type="submit"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#da1b1b] text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
