"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker and enables 10-foot / D-pad navigation
 * for TV browsers (Android TV incl. Vitron, Google TV, Fire TV, Tizen, webOS,
 * Bravia) plus Electron/Capacitor shells.
 *
 * TV detection order:
 *  1. ?tv=1 query param (force)
 *  2. standalone / fullscreen display mode (installed PWA, Electron, Capacitor)
 *  3. TV-ish user agent
 */

const TV_UA =
  /(android\s?tv|googletv|google\s?tv|smart-?tv|smarttv|hbbtv|netcast|viera|bravia|tizen|webos|web0s|aft[abms]|fire\s?tv|crkey|roku|appletv|visionos|leanback)/i;

function isTvEnvironment(): boolean {
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

function focusables(): HTMLElement[] {
  const selector =
    'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => {
      if (el.hasAttribute("aria-hidden")) return false;
      if (el.closest("[inert]")) return false;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") return false;
      if (Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    }
  );
}

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
}

/** Pick the closest focusable in the pressed direction (cone-scored). */
function nextInDirection(
  current: HTMLElement | null,
  dir: "up" | "down" | "left" | "right"
): HTMLElement | null {
  const all = focusables();
  if (all.length === 0) return null;

  if (!current || !all.includes(current)) {
    // Nothing focused yet — start with the first visible candidate.
    return all[0] ?? null;
  }

  const from = centerOf(current);
  let best: { el: HTMLElement; score: number } | null = null;

  for (const el of all) {
    if (el === current) continue;
    const to = centerOf(el);
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const primary =
      dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy;
    const cross = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);

    // Must actually be in that direction.
    if (primary < 4) continue;

    // Reject targets far off-axis (keeps movement predictable on grids).
    if (cross > primary * 2.2 + 80) continue;

    const score = primary + cross * 1.8;
    if (!best || score < best.score) best = { el, score };
  }

  return best?.el ?? null;
}

export default function PlatformSupport() {
  // ---- Service worker (offline shell, repeat-load speed) ----
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* offline support is optional — never block the app */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  // ---- TV / D-pad navigation ----
  useEffect(() => {
    if (!isTvEnvironment()) return;

    const root = document.documentElement;
    root.classList.add("tv-mode");

    const focusFirst = () => {
      const first =
        document.querySelector<HTMLElement>("[data-tv-autofocus]") ??
        focusables()[0];
      first?.focus({ preventScroll: false });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isField =
        tag === "input" || tag === "textarea" || tag === "select" ||
        target?.isContentEditable;

      // Let form controls keep normal editing behaviour.
      if (isField) return;

      const key = event.key;
      const active = document.activeElement as HTMLElement | null;

      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        const dir =
          key === "ArrowUp"
            ? "up"
            : key === "ArrowDown"
              ? "down"
              : key === "ArrowLeft"
                ? "left"
                : "right";

        // Right/Left inside a horizontal rail should scroll it first.
        const rail = active?.closest<HTMLElement>("[data-tv-rail]");
        if (rail && (dir === "left" || dir === "right")) {
          const amount = Math.max(240, rail.clientWidth * 0.6);
          rail.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
        }

        const next = nextInDirection(active, dir);
        if (next) {
          event.preventDefault();
          next.focus({ preventScroll: true });
          next.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        } else if (rail) {
          event.preventDefault();
        }
        return;
      }

      // Android TV remotes emit Backspace for "Back".
      if (key === "Backspace") {
        event.preventDefault();
        window.history.back();
        return;
      }

      // Some TV browsers don't synthesize click from Enter on custom elements.
      if (key === "Enter" && active) {
        if (active.tagName === "SELECT") return;
        event.preventDefault();
        active.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const t = window.setTimeout(focusFirst, 400);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(t);
      root.classList.remove("tv-mode");
    };
  }, []);

  return null;
}
