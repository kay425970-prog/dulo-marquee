"use client";

import React, { useEffect, useRef, useState } from "react";
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
  /** Tint the trigger when a non-default value is active. */
  active?: boolean;
  warn?: boolean;
  title?: string;
  badge?: string | number;
  /** Called on hover/keyboard focus so the HUD stays visible. */
  onInteract?: () => void;
}

/**
 * Remote-first replacement for <select>.
 *
 * Native <select> popups are hostile on TVs: Android TV often can't render
 * them, the D-pad jumps out of the control, and webOS/Tizen style them badly.
 * This renders an in-DOM panel of real buttons, so the page-level D-pad
 * navigator (PlatformSupport) drives it: Up/Down/Left/Right move, OK selects,
 * Back closes.
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);

  // Close on outside click or Escape/Back.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  // Focus the selected (or first) option when the panel opens, so a remote can
  // act immediately.
  useEffect(() => {
    if (!open) return;
    const panel = rootRef.current?.querySelector<HTMLElement>("[data-picker-panel]");
    if (!panel) return;
    const target =
      panel.querySelector<HTMLElement>('[data-selected="true"]') ??
      panel.querySelector<HTMLElement>("button");
    target?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
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
        className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 backdrop-blur-2xl transition ${
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

      {open && (
        <div
          data-picker-panel
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 max-h-[60vh] w-60 overflow-y-auto rounded-2xl border border-white/[0.14] bg-[#0f0f16]/98 p-1.5 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
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
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 ${
                  selected
                    ? "bg-[#da1b1b]/25 text-white ring-1 ring-[#da1b1b]/50"
                    : "text-white/75 hover:bg-white/[0.09] hover:text-white"
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
      )}
    </div>
  );
}
