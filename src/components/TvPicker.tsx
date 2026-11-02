"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";

export interface PickerOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface TvPickerProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  active?: boolean;
  warn?: boolean;
  title?: string;
  badge?: string | number;
  onInteract?: () => void;
}

const PANEL_WIDTH = 240;
const EDGE = 8;

/**
 * Remote-first replacement for <select>.
 *
 * The panel is rendered in a portal on document.body with fixed coordinates
 * clamped to the viewport. That matters because the player root is
 * `overflow: hidden` — an absolutely-positioned panel inside it gets clipped
 * (which is exactly why the subtitle list appeared as a sliver at the screen
 * edge). Portal + clamping makes it immune to ancestor clipping and to being
 * the left-most control on screen.
 */
export function TvPicker({
  icon,
  label,
  value,
  options,
  onChange,
  active = false,
  warn = false,
  title,
  badge,
  onInteract,
}: TvPickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer left-aligned with the trigger, then clamp into the viewport.
    let left = r.left;
    if (left + PANEL_WIDTH > vw - EDGE) left = vw - PANEL_WIDTH - EDGE;
    if (left < EDGE) left = EDGE;

    // Open downwards unless there isn't room.
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    const openUp = below < 220 && above > below;
    const top = openUp ? Math.max(EDGE, r.top - 8) : r.bottom + 8;
    const maxHeight = Math.max(160, Math.min(openUp ? above : below, vh * 0.7));

    setPos({ left, top, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, place]);

  // Keep it anchored while the HUD moves / the window resizes.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => place();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  // Move D-pad focus into the panel when it opens so a remote can act at once.
  useEffect(() => {
    if (!open || !pos) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target =
      panel.querySelector<HTMLElement>('[data-selected="true"]') ??
      panel.querySelector<HTMLElement>("button[role='option']");
    target?.focus({ preventScroll: true });
  }, [open, pos]);

  const panel = open && pos && (
    <div
      ref={panelRef}
      data-picker-panel
      role="listbox"
      aria-label={label}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: PANEL_WIDTH,
        maxHeight: pos.maxHeight,
      }}
      className="z-[400] overflow-y-auto rounded-2xl border border-white/[0.16] bg-[#0f0f16] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.75)] ring-1 ring-black/60"
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="rounded-full p-1 text-white/45 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={selected}
            data-selected={selected}
            disabled={opt.disabled}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
              triggerRef.current?.focus({ preventScroll: true });
            }}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 ${
              selected
                ? "bg-[#da1b1b]/30 text-white ring-1 ring-[#da1b1b]/55"
                : "text-white/80 hover:bg-white/[0.1] hover:text-white"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate">{opt.label}</span>
              {opt.hint && (
                <span className="mt-0.5 block truncate text-[10px] font-medium text-white/40">
                  {opt.hint}
                </span>
              )}
            </span>
            {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title={title || label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onMouseDown={onInteract}
        onFocus={onInteract}
        onClick={() => {
          setOpen((v) => !v);
          onInteract?.();
        }}
        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 backdrop-blur-2xl transition ${
          warn
            ? "bg-amber-500/20 text-amber-100 ring-amber-400/40"
            : active
              ? "bg-[#da1b1b] text-white ring-[#da1b1b]"
              : "bg-[#0d0d0d]/80 text-white ring-white/[0.1] hover:bg-white/[0.14]"
        }`}
      >
        <span className="shrink-0 text-white/80">{icon}</span>
        <span className="max-w-[104px] truncate sm:max-w-[136px]">
          {current?.label ?? label}
        </span>
        {badge !== undefined && (
          <span className="rounded bg-emerald-500/20 px-1 text-[10px] font-bold text-emerald-300">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
