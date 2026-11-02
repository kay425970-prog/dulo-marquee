"use client";

import React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { ResolvedStreamOption } from "@/app/api/stream-resolve/route";

export interface PlayerSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  streams: ResolvedStreamOption[];
  streamIndex: number;
  onSelectStream: (index: number) => void;
  quality: string;
  qualities: string[];
  onSelectQuality: (q: string) => void;
  audioLabel: string;
  audioOptions: string[];
  onSelectAudio: (a: string) => void;
  subtitleLabel: string;
  subtitleOptions: string[];
  onSelectSubtitle: (s: string) => void;
  speed: string;
  speedOptions: string[];
  onSelectSpeed: (s: string) => void;
  volumeBoost: string;
  volumeBoostOptions: string[];
  onSelectVolumeBoost: (v: string) => void;
  skipIntro: boolean;
  onToggleSkipIntro: () => void;
  skipCredits: boolean;
  onToggleSkipCredits: () => void;
  pictureSize: "fill" | "fit";
  onTogglePictureSize: () => void;
}

function Row({
  label,
  value,
  onClick,
  toggle,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  toggle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1.5 rounded-[14px] bg-white/[0.055] px-4 py-3.5 text-left transition hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className="text-[11px] font-medium text-white/45">{label}</span>
      {toggle ? (
        <span
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
            value === "on" ? "bg-[#e02020]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-all ${
              value === "on" ? "left-[19px]" : "left-[3px]"
            }`}
          />
        </span>
      ) : (
        <span className="text-[15px] font-semibold text-white">{value}</span>
      )}
    </button>
  );
}

/**
 * dulo.mov's settings panel, recreated: a dark rounded card on the right with a
 * source header + up/down step arrows, then a 2-column grid of option rows.
 */
export function PlayerSettingsPanel({
  open,
  onClose,
  streams,
  streamIndex,
  onSelectStream,
  quality,
  qualities,
  onSelectQuality,
  audioLabel,
  audioOptions,
  onSelectAudio,
  subtitleLabel,
  subtitleOptions,
  onSelectSubtitle,
  speed,
  speedOptions,
  onSelectSpeed,
  volumeBoost,
  volumeBoostOptions,
  onSelectVolumeBoost,
  skipIntro,
  onToggleSkipIntro,
  skipCredits,
  onToggleSkipCredits,
  pictureSize,
  onTogglePictureSize,
}: PlayerSettingsPanelProps) {
  if (!open) return null;

  const active = streams[streamIndex] ?? streams[0];
  const cycle = (dir: 1 | -1) => {
    if (streams.length < 2) return;
    const next = (streamIndex + dir + streams.length) % streams.length;
    onSelectStream(next);
  };

  const cycleValue = (
    options: string[],
    current: string,
    setter: (v: string) => void,
    dir: 1 | -1
  ) => {
    if (options.length < 2) return;
    const i = Math.max(0, options.indexOf(current));
    setter(options[(i + dir + options.length) % options.length]);
  };

  return (
    <div
      role="dialog"
      aria-label="Player settings"
      className="arkaflix-settings-scroll absolute right-4 top-1/2 z-40 max-h-[86dvh] w-[22rem] -translate-y-1/2 overflow-y-auto rounded-[22px] border border-white/[0.09] bg-[#141418]/98 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:right-6"
    >
      {/* Source header + steppers */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-white/[0.09] text-[15px] font-bold uppercase text-white/90">
            {(active?.provider || "S").slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-white/40">Source</span>
              <span className="text-[11px] font-semibold text-white/60">
                {streamIndex + 1} / {streams.length}
              </span>
            </div>
            <div className="truncate text-[17px] font-bold leading-tight text-white">
              {active?.provider || "Source"}
            </div>
            <div className="text-[11px] font-medium text-white/45">In use</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.16] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => cycle(1)}
            aria-label="Next source"
            disabled={streams.length < 2}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.16] hover:text-white disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => cycle(-1)}
            aria-label="Previous source"
            disabled={streams.length < 2}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.16] hover:text-white disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quality / segment sample */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Row
          label="Quality"
          value={quality}
          onClick={() => {
            const i = qualities.indexOf(quality);
            onSelectQuality(qualities[(i + 1) % Math.max(1, qualities.length)] ?? quality);
          }}
        />
        <Row label="Segment sample" value="—" />
      </div>

      {/* 2-column option grid */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Row
          label="Quality"
          value={quality}
          onClick={() => {
            const i = qualities.indexOf(quality);
            onSelectQuality(qualities[(i + 1) % Math.max(1, qualities.length)] ?? quality);
          }}
        />
        <Row
          label="Audio"
          value={audioLabel}
          onClick={() => cycleValue(audioOptions, audioLabel, onSelectAudio, 1)}
        />
        <Row
          label="Subtitles"
          value={subtitleLabel}
          onClick={() => cycleValue(subtitleOptions, subtitleLabel, onSelectSubtitle, 1)}
        />
        <Row
          label="Playback speed"
          value={speed}
          onClick={() => cycleValue(speedOptions, speed, onSelectSpeed, 1)}
        />
        <Row
          label="Volume boost"
          value={volumeBoost}
          onClick={() => cycleValue(volumeBoostOptions, volumeBoost, onSelectVolumeBoost, 1)}
        />
        <Row
          label="Skip verified intros"
          value={skipIntro ? "on" : "off"}
          toggle
          onClick={onToggleSkipIntro}
        />
        <div className="col-span-2">
          <Row
            label="Skip verified credits"
            value={skipCredits ? "on" : "off"}
            toggle
            onClick={onToggleSkipCredits}
          />
        </div>
      </div>

      <div className="mt-2.5">
        <Row
          label="Picture size"
          value={pictureSize === "fill" ? "Fill screen" : "Fit to screen"}
          onClick={onTogglePictureSize}
        />
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-medium text-white/30">
          Arkaflix v1.0
        </span>
        <span className="text-[10px] font-medium text-white/25">
          {active?.qualityTag || ""}
        </span>
      </div>
    </div>
  );
}
