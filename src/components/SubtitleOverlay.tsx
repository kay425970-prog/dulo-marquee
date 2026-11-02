"use client";

import { useEffect, useRef, useState } from "react";

export interface Cue {
  start: number;
  end: number;
  text: string;
}

/** Parse WebVTT (also tolerates SRT) into timed cues. */
export function parseVtt(raw: string): Cue[] {
  const text = raw.replace(/\r\n|\r/g, "\n").replace(/^\uFEFF/, "");
  const blocks = text.split(/\n{2,}/);
  const cues: Cue[] = [];

  const toSeconds = (stamp: string): number => {
    const m = stamp.trim().match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/);
    if (!m) {
      const short = stamp.trim().match(/(\d{1,2}):(\d{2})[.,](\d{1,3})/);
      if (!short) return 0;
      return (
        Number(short[1]) * 60 + Number(short[2]) + Number(short[3].padEnd(3, "0")) / 1000
      );
    }
    return (
      Number(m[1]) * 3600 +
      Number(m[2]) * 60 +
      Number(m[3]) +
      Number(m[4].padEnd(3, "0")) / 1000
    );
  };

  for (const block of blocks) {
    const lines = block.split("\n").filter((l, i) => !(i === 0 && /^\d+$/.test(l.trim())));
    const timeLineIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeLineIdx === -1) continue;
    const [a, b] = lines[timeLineIdx].split("-->");
    const start = toSeconds(a);
    const end = toSeconds((b || "").split(" ")[0]);
    const body = lines
      .slice(timeLineIdx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (body) cues.push({ start, end, text: body });
  }
  return cues;
}

interface SubtitleOverlayProps {
  /** URL returning WebVTT (our /api/subtitles proxy). Empty disables. */
  vttUrl?: string;
  /** Clock: if omitted the overlay keeps its own timer while `running`. */
  currentTime?: number;
  running?: boolean;
  /** Manual sync nudge in seconds (positive = show later). */
  offset?: number;
  size?: "sm" | "md" | "lg";
  background?: boolean;
}

/**
 * Renders subtitles as a DOM overlay so captions work even when the video is a
 * third-party <iframe> we cannot inject <track> into. Timing comes from either
 * a supplied clock (native player / embed postMessage sync) or an internal
 * timer, plus a manual offset for drift correction.
 */
export function SubtitleOverlay({
  vttUrl,
  currentTime,
  running = true,
  offset = 0,
  size = "md",
  background = true,
}: SubtitleOverlayProps) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [internal, setInternal] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  // Load + parse the VTT once per URL.
  useEffect(() => {
    if (!vttUrl) {
      setCues([]);
      return;
    }
    let cancelled = false;
    fetch(vttUrl)
      .then((r) => (r.ok ? r.text() : ""))
      .then((raw) => {
        if (!cancelled) setCues(raw ? parseVtt(raw) : []);
      })
      .catch(() => {
        if (!cancelled) setCues([]);
      });
    return () => {
      cancelled = true;
    };
  }, [vttUrl]);

  // Internal clock (only used when no external time is supplied).
  useEffect(() => {
    if (currentTime !== undefined || !running || !vttUrl) return;
    startedAtRef.current = Date.now() - internal * 1000;
    const id = window.setInterval(() => {
      setInternal((Date.now() - startedAtRef.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, running, vttUrl]);

  const t = (currentTime ?? internal) + offset;
  if (!vttUrl || cues.length === 0) return null;

  const active = cues.find((c) => t >= c.start && t <= c.end);
  if (!active) return null;

  const sizeClasses =
    size === "lg"
      ? "text-[clamp(20px,2.5vw,34px)]"
      : size === "sm"
        ? "text-[clamp(13px,1.2vw,18px)]"
        : "text-[clamp(16px,1.7vw,26px)]";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[8%] z-30 flex justify-center px-6">
      <p
        className={`${sizeClasses} max-w-[85%] whitespace-pre-line text-center font-semibold leading-snug text-white ${
          background ? "rounded-lg bg-black/72 px-3 py-1.5" : ""
        }`}
        style={{ textShadow: "0 2px 6px rgba(0,0,0,.95), 0 0 2px #000" }}
      >
        {active.text}
      </p>
    </div>
  );
}
