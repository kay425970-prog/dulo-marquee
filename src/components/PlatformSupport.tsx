"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, X } from "lucide-react";

/**
 * TV / 10-foot remote navigation.
 *
 * Navigation model (deliberately YouTube-on-TV-like):
 *  - Left/Right moves between items *inside the current row* (`[data-tv-row]`).
 *    The page scrolls only enough to keep the focused item visible — it never
 *    jumps a whole rail.
 *  - Up/Down moves to the adjacent row and picks the item closest to the
 *    current horizontal position (so columns line up going up and down).
 *  - Left/Right on a <select> changes its value; Up/Down leaves the select.
 *  - OK/Enter activates; Back goes back one screen.
 *  - Focus is restored when a modal / player closes.
 */

const TV_UA =
  /(android\s?tv|googletv|google\s?tv|smart-?tv|smarttv|hbbtv|netcast|viera|bravia|tizen|webos|web0s|aft[abms]|fire\s?tv|crkey|roku|appletv|visionos|leanback)/i;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function isTvMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("tv") === "1") return true;
  if (params.get("tv") === "0") return false;

  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
  if (standalone) return true;

  return TV_UA.test(window.navigator.userAgent || "");
}

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute("aria-hidden")) return false;
  if (el.closest("[inert]")) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  // Hidden hover-only controls (opacity 0) must not become dead focus stops.
  if (Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function rowItems(row: HTMLElement): HTMLElement[] {
  return Array.from(row.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    isVisible
  );
}

function allRows(): HTMLElement[] {
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>("[data-tv-row]")
  ).filter(isVisible);

  // Anything focusable that is not inside a declared row still needs to be
  // reachable (header, footer, hero buttons). Treat each as its own row.
  const loose = Array.from(
    document.querySelectorAll<HTMLElement>(FOCUSABLE)
  ).filter((el) => isVisible(el) && !el.closest("[data-tv-row]"));

  return [...rows, ...loose].sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function rowOf(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const row = el.closest<HTMLElement>("[data-tv-row]");
  if (row) return row;
  // Loose element behaves as a single-item row.
  return el;
}

function revealFocus(el: HTMLElement) {
  // Horizontal: scroll the containing rail just enough.
  const rail = el.closest<HTMLElement>("[data-tv-rail]");
  if (rail) {
    const e = el.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    const pad = 48;
    if (e.left < r.left + pad) {
      rail.scrollLeft -= r.left + pad - e.left;
    } else if (e.right > r.right - pad) {
      rail.scrollLeft += e.right - (r.right - pad);
    }
  }
  // Vertical: reveal the row without yanking the page around.
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function centreX(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  return r.left + r.width / 2;
}

/** Nearest element in a target row to a given x position. */
function closestInRow(row: HTMLElement, x: number): HTMLElement | null {
  const items = row.hasAttribute("data-tv-row") ? rowItems(row) : [row];
  if (items.length === 0) return null;
  return items.reduce((best, el) =>
    Math.abs(centreX(el) - x) < Math.abs(centreX(best) - x) ? el : best
  );
}

function focusEl(el: HTMLElement | null) {
  if (!el) return;
  el.focus({ preventScroll: true });
  revealFocus(el);
}

export default function PlatformSupport() {
  const [hintVisible, setHintVisible] = useState(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // ---- Service worker ----
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  // ---- Remote navigation ----
  useEffect(() => {
    if (!isTvMode()) return;

    const root = document.documentElement;
    root.classList.add("tv-mode");

    // Remember focus so closing a dialog returns you to the same card.
    const remember = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body) lastFocusRef.current = active;
    };
    document.addEventListener("focusin", remember);

    // One-time remote hint (dismissed automatically).
    try {
      if (!window.localStorage.getItem("dulo_tv_hint_seen")) {
        setHintVisible(true);
        window.localStorage.setItem("dulo_tv_hint_seen", "1");
        window.setTimeout(() => setHintVisible(false), 6500);
      }
    } catch {
      /* storage unavailable */
    }

    const moveWithinRow = (
      row: HTMLElement,
      current: HTMLElement | null,
      dir: "left" | "right"
    ) => {
      const items =
        row.hasAttribute("data-tv-row") ? rowItems(row) : [row];
      if (items.length === 0) return;
      const idx = current ? items.indexOf(current) : -1;
      const nextIdx =
        idx === -1
          ? 0
          : dir === "right"
            ? Math.min(items.length - 1, idx + 1)
            : Math.max(0, idx - 1);
      focusEl(items[nextIdx]);
    };

    /**
     * Inside a poster grid ([data-tv-grid]) "down" should land on the tile
     * directly below, not on the next DOM node. Returns null when the current
     * tile is in the last grid row, so the caller can continue to the next rail.
     */
    const moveWithinGrid = (
      current: HTMLElement | null,
      dir: "up" | "down"
    ): HTMLElement | null => {
      if (!current) return null;
      const grid = current.closest<HTMLElement>("[data-tv-grid]");
      if (!grid) return null;

      const items = rowItems(grid);
      const from = current.getBoundingClientRect();
      const cx = centreX(current);
      let best: { el: HTMLElement; dy: number; dx: number } | null = null;

      for (const el of items) {
        if (el === current) continue;
        const r = el.getBoundingClientRect();
        const dy = dir === "down" ? r.top - from.bottom : from.top - r.bottom;
        if (dy < -8) continue; // not actually above/below
        // Must overlap horizontally with the current tile.
        const overlap =
          Math.min(r.right, from.right) - Math.max(r.left, from.left);
        if (overlap < Math.min(r.width, from.width) * 0.35) continue;
        const dx = Math.abs(centreX(el) - cx);
        if (
          !best ||
          Math.abs(dy) < Math.abs(best.dy) - 2 ||
          (Math.abs(Math.abs(dy) - Math.abs(best.dy)) <= 2 && dx < best.dx)
        ) {
          best = { el, dy, dx };
        }
      }
      return best?.el ?? null;
    };

    const moveToAdjacentRow = (
      current: HTMLElement | null,
      dir: "up" | "down"
    ) => {
      const inGrid = moveWithinGrid(current, dir);
      if (inGrid) {
        focusEl(inGrid);
        return;
      }
      const rows = allRows();
      if (rows.length === 0) return;

      const currentRow = rowOf(current);
      const idx = currentRow ? rows.indexOf(currentRow) : -1;
      const x = current ? centreX(current) : window.innerWidth / 2;

      if (idx === -1) {
        focusEl(closestInRow(rows[0], x));
        return;
      }

      const nextIdx = dir === "down" ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= rows.length) return;
      focusEl(closestInRow(rows[nextIdx], x));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const key = event.key;
      const active = document.activeElement as HTMLElement | null;

      // <select>: left/right changes value, up/down leaves the control.
      if (tag === "select") {
        if (key === "ArrowUp" || key === "ArrowDown") {
          event.preventDefault();
          moveToAdjacentRow(active, key === "ArrowDown" ? "down" : "up");
          return;
        }
        if (key === "ArrowLeft" || key === "ArrowRight") {
          // Let the browser change the option (native behaviour) and stop the
          // event from also moving focus.
          event.stopPropagation();
          return;
        }
        return;
      }

      // Text inputs keep native editing behaviour.
      const isField =
        tag === "input" ||
        tag === "textarea" ||
        Boolean(target?.isContentEditable);
      if (isField) {
        if (key === "ArrowUp" || key === "ArrowDown") {
          event.preventDefault();
          moveToAdjacentRow(active, key === "ArrowDown" ? "down" : "up");
        }
        return;
      }

      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        event.preventDefault();
        const row = rowOf(active);

        if (key === "ArrowLeft" || key === "ArrowRight") {
          const dir = key === "ArrowRight" ? "right" : "left";
          if (row) {
            const items = row.hasAttribute("data-tv-row")
              ? rowItems(row)
              : [row];
            const idx = active ? items.indexOf(active) : -1;
            // At the row edge, fall through to the neighbouring row instead of
            // dead-ending (feels broken on TV).
            const atEdge =
              (dir === "right" && idx === items.length - 1) ||
              (dir === "left" && idx === 0);
            if (atEdge) return;
            moveWithinRow(row, active, dir);
          } else {
            moveToAdjacentRow(active, key === "ArrowRight" ? "down" : "down");
          }
          return;
        }

        moveToAdjacentRow(active, key === "ArrowDown" ? "down" : "up");
        return;
      }

      // Android TV remotes send Backspace for "Back".
      if (key === "Backspace") {
        event.preventDefault();
        window.history.back();
        return;
      }

      // Some TV browsers don't translate Enter into a click for custom widgets.
      if (key === "Enter" && active) {
        if (active.tagName === "SELECT" || active.tagName === "TEXTAREA") return;
        event.preventDefault();
        active.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    // Initial focus: hero CTA if present, otherwise first card in the first row.
    // Content on TV devices can arrive after mount (client-rendered rails), so
    // retry a few times until something focusable exists — but never steal
    // focus once the viewer has started moving.
    let attempts = 0;
    let timer = 0;
    const primeFocus = () => {
      attempts += 1;
      const active = document.activeElement as HTMLElement | null;
      const alreadyFocused =
        active && active !== document.body && isVisible(active);
      if (!alreadyFocused) {
        const preferred =
          document.querySelector<HTMLElement>("[data-tv-autofocus]") ??
          closestInRow(allRows()[0], window.innerWidth / 2);
        if (preferred) {
          focusEl(preferred);
          return;
        }
      }
      if (attempts < 6) {
        timer = window.setTimeout(primeFocus, 250 + attempts * 250);
      }
    };
    timer = window.setTimeout(primeFocus, 300);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", remember);
      window.clearTimeout(timer);
      root.classList.remove("tv-mode");
    };
  }, []);

  if (!hintVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[300] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-white/15 bg-[#171717]/95 px-5 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl">
        <span className="flex items-center gap-1.5">
          <ArrowUp className="h-3.5 w-3.5" />
          <ArrowDown className="h-3.5 w-3.5" />
          <ArrowLeft className="h-3.5 w-3.5" />
          <ArrowRight className="h-3.5 w-3.5" />
          Navigate
        </span>
        <span className="h-4 w-px bg-white/15" />
        <span>OK to select</span>
        <span className="h-4 w-px bg-white/15" />
        <span>Back to return</span>
        <button
          type="button"
          onClick={() => setHintVisible(false)}
          aria-label="Dismiss"
          className="ml-1 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
