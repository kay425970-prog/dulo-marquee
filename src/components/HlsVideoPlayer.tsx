"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  Loader2,
  AlertCircle,
  Radio,
} from "lucide-react";

interface HlsVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  isLive?: boolean;
  autoPlay?: boolean;
  initialSeconds?: number;
  onProgress?: (percent: number, currentSeconds: number) => void;
}

export function HlsVideoPlayer({
  src,
  poster,
  title,
  subtitle,
  isLive = false,
  autoPlay = false,
  initialSeconds = 0,
  onProgress,
}: HlsVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastReportedRef = useRef<number>(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(autoPlay);
  const [buffering, setBuffering] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resolutionLabel, setResolutionLabel] = useState("HD Adaptive");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setBuffering(true);
    setErrorMsg(null);
    let hls: Hls | null = null;

    const isM3u8 = src.includes(".m3u8");

    if (isM3u8 && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setBuffering(false);
        const highest = data.levels?.[data.levels.length - 1];
        if (highest?.height) {
          setResolutionLabel(`${highest.height}p HLS`);
        }
        if (!isLive && initialSeconds > 5) {
          video.currentTime = initialSeconds;
        }
        if (autoPlay) {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg(
                "Stream unreachable or blocked by remote CORS policy. Try another channel or server."
              );
              hls?.destroy();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setErrorMsg("Unable to decode this HLS stream.");
              hls?.destroy();
              break;
          }
          setBuffering(false);
        }
      });
    } else if (
      video.canPlayType("application/vnd.apple.mpegurl") ||
      !isM3u8
    ) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setBuffering(false);
        if (!isLive && initialSeconds > 5) {
          video.currentTime = initialSeconds;
        }
        if (autoPlay) {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        }
      });
    } else {
      setBuffering(false);
      setErrorMsg("HLS playback is not supported in this browser.");
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, isLive, autoPlay, initialSeconds]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v || isLive) return;
    v.currentTime = Math.max(
      0,
      Math.min(v.duration || 99999, v.currentTime + delta)
    );
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ("requestPictureInPicture" in v) {
        await v.requestPictureInPicture();
      }
    } catch {
      // ignore if unsupported
    }
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/15"
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setBuffering(false);
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          setDuration(v.duration || 0);
          if (
            !isLive &&
            onProgress &&
            v.duration > 0 &&
            Math.abs(v.currentTime - lastReportedRef.current) >= 8
          ) {
            lastReportedRef.current = v.currentTime;
            const pct = Math.min(
              99,
              Math.max(1, Math.round((v.currentTime / v.duration) * 100))
            );
            onProgress(pct, Math.round(v.currentTime));
          }
        }}
        onError={() => {
          setBuffering(false);
          setErrorMsg(
            "Unable to load stream directly. Check URL or select an alternative player source."
          );
        }}
        className="h-full w-full cursor-pointer object-contain"
      />

      {/* Top Metadata Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent p-4 opacity-95 transition-opacity group-hover:opacity-100">
        <div>
          {title && (
            <div className="text-sm font-bold text-white drop-shadow">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-xs text-neutral-300">{subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600/90 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </span>
          )}
          <span className="rounded-md border border-white/15 bg-black/60 px-2 py-0.5 text-[11px] font-bold text-violet-200 backdrop-blur">
            {resolutionLabel}
          </span>
        </div>
      </div>

      {/* Center Play / Buffering / Error State */}
      {buffering && !errorMsg && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/35">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-[#da1b1b]" />
            <span className="text-xs font-semibold text-neutral-300">
              Tuning adaptive HLS stream...
            </span>
          </div>
        </div>
      )}

      {!playing && !buffering && !errorMsg && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 grid place-items-center bg-black/40 transition hover:bg-black/30"
        >
          <span className="grid h-18 w-18 place-items-center rounded-full bg-[#da1b1b] text-white shadow-2xl transition hover:scale-108">
            <Play className="ml-1 h-8 w-8 fill-current" />
          </span>
        </button>
      )}

      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <p className="mt-3 max-w-md text-sm font-semibold text-white">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Bottom Controls HUD */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-3 pt-8 opacity-95 transition-opacity group-hover:opacity-100">
        {!isLive && duration > 0 && (
          <input
            type="range"
            min={0}
            max={Math.floor(duration)}
            value={Math.floor(currentTime)}
            onChange={(e) => {
              const v = videoRef.current;
              if (!v) return;
              v.currentTime = Number(e.target.value);
              setCurrentTime(v.currentTime);
            }}
            className="mb-2.5 h-1.5 w-full cursor-pointer accent-fuchsia-500"
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </button>

            {!isLive && (
              <>
                <button
                  type="button"
                  onClick={() => skip(-10)}
                  title="Back 10s"
                  className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => skip(10)}
                  title="Forward 10s"
                  className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleMute}
              className="rounded-lg p-1.5 text-neutral-200 hover:bg-white/10 hover:text-white"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-amber-300" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            {muted && playing && (
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-400/30"
              >
                Tap to Unmute
              </button>
            )}

            {!isLive && duration > 0 && (
              <span className="ml-1 text-xs font-medium tabular-nums text-neutral-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePiP}
              title="Picture-in-Picture"
              className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
