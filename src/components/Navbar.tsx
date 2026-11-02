"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMarquee } from "./MarqueeProvider";
import {
  Search,
  Home,
  Compass,
  User,
  Radio,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  Users,
  Layers,
  Briefcase,
  Menu,
  X,
  Maximize2,
  Minimize2,
  LogOut,
} from "lucide-react";

/**
 * Arkaflix wordmark: a bold white "A" followed by a red dot — the direct
 * analogue of dulo's "d." lockup.
 */
export function ArkaflixLogoMark({
  className = "h-7 w-auto",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 104 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* A */}
      <path
        d="M4 56 L30 8 L56 56 L44 56 L30 28 L16 56 Z"
        fill="currentColor"
      />
      <rect x="21" y="40" width="18" height="8" rx="3" fill="currentColor" />
      {/* . */}
      <circle cx="76" cy="50" r="7" fill="#e02020" />
    </svg>
  );
}

const MOVIE_FOOTER_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Science Fiction",
  "Thriller",
];

export function Navbar() {
  const pathname = usePathname();
  const {
    user,
    activeProfile,
    openOmnibar,
    openProfileModal,
    openRandomPicker,
    signOut,
  } = useMarquee();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [clockText, setClockText] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setClockText(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const t = setInterval(updateClock, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  const primaryNav = [
    {
      key: "home",
      label: "Home",
      href: "/",
      icon: Home,
      active: pathname === "/",
    },
    {
      key: "discover",
      label: "Discover",
      href: "/browse",
      icon: Compass,
      active: pathname === "/browse",
    },
    {
      key: "live",
      label: "Live",
      href: "/live",
      icon: Radio,
      active: pathname.startsWith("/live"),
    },
    {
      key: "movies",
      label: "Movies",
      href: "/movies",
      icon: Film,
      active:
        pathname.startsWith("/movies") ||
        pathname.startsWith("/media/movie") ||
        pathname.startsWith("/title/movie"),
    },
    {
      key: "shows",
      label: "Shows",
      href: "/shows",
      icon: Tv,
      active:
        pathname.startsWith("/shows") ||
        pathname.startsWith("/media/tv") ||
        pathname.startsWith("/title/tv"),
    },
    {
      key: "anime",
      label: "Anime",
      href: "/anime",
      icon: Sparkles,
      active:
        pathname.startsWith("/anime") ||
        pathname.startsWith("/media/anime") ||
        pathname.startsWith("/title/anime"),
    },
    {
      key: "providers",
      label: "Providers",
      href: "/providers",
      icon: Layers,
      active: pathname.startsWith("/providers"),
    },
    {
      key: "mylist",
      label: "My List",
      href: "/my",
      icon: Bookmark,
      active: pathname === "/my",
    },
    {
      key: "watchparties",
      label: "Watch Parties",
      href: "/my?tab=parties",
      icon: Users,
      active: false,
    },
  ];

  const moreNav = [
    {
      key: "browse",
      label: "Discover & Genres",
      href: "/browse",
      icon: Bookmark,
      active: pathname === "/browse",
    },
    {
      key: "crm",
      label: "Studio CRM",
      href: "/crm",
      icon: Briefcase,
      active: pathname.startsWith("/crm"),
    },
  ];

  const renderSidebarCard = (closeFn: () => void) => (
    <aside className="beta-sidebar relative flex h-full min-h-0 w-[min(280px,calc(100vw-2rem))] flex-col overflow-hidden px-5 py-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012)_42%,transparent_100%)]" />

      {/* Top Profile & Live Clock Pill */}
      <button
        type="button"
        onClick={() => {
          closeFn();
          if (user) {
            openProfileModal();
          } else {
            window.location.href = "/login";
          }
        }}
        className="relative mb-6 flex items-center gap-3 rounded-[22px] bg-white/[0.03] px-2.5 py-2 text-left ring-1 ring-white/[0.04] transition hover:bg-white/[0.07] hover:ring-white/[0.09]"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#da1b1b]/25 text-sm ring-1 ring-[#da1b1b]/40">
          {activeProfile?.avatarEmoji || "🎬"}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white/[0.85]">
          {user ? activeProfile?.name || user.name : "Sign in"}
        </span>
        <span className="text-[12px] font-medium tabular-nums text-white/[0.44]">
          {clockText}
        </span>
      </button>

      {/* Scrollable Navigation Links */}
      <div className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto pr-1">
        <nav className="relative space-y-1" aria-label="Primary">
          <button
            type="button"
            onClick={() => {
              closeFn();
              openOmnibar();
            }}
            className="beta-nav-item flex min-h-[44px] w-full items-center gap-3.5 rounded-[13px] px-4 text-left text-[14px] font-semibold text-white/65 transition"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search</span>
          </button>

          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={closeFn}
                aria-current={item.active ? "page" : undefined}
                className="beta-nav-item flex min-h-[44px] w-full items-center gap-3.5 rounded-[13px] px-4 text-[14px] font-semibold text-white/65 transition"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-5">
          <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
            More
          </p>
          <div className="space-y-1">
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={closeFn}
                  aria-current={item.active ? "page" : undefined}
                  className="beta-nav-item flex min-h-[44px] w-full items-center gap-3.5 rounded-[13px] px-4 text-[14px] font-semibold text-white/60 transition"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Profile Switch / Sign in / Sign out & Close */}
      <div className="relative mt-auto space-y-1 border-t border-white/[0.06] pt-3">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => {
                closeFn();
                openProfileModal();
              }}
              className="flex w-full items-center gap-3.5 rounded-[13px] px-4 py-2.5 text-left text-[14px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
            >
              <User className="h-4 w-4" />
              <span>Switch profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                closeFn();
                signOut();
              }}
              className="flex w-full items-center gap-3.5 rounded-[13px] px-4 py-2.5 text-left text-[14px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={closeFn}
            className="block w-full rounded-[13px] bg-white/[0.08] px-4 py-3 text-left text-[14px] font-semibold text-white/85 transition hover:bg-white/[0.12] hover:text-white"
          >
            Sign in
          </Link>
        )}
        <button
          type="button"
          onClick={closeFn}
          className="flex w-full items-center gap-3.5 rounded-[13px] px-4 py-2.5 text-left text-[14px] font-semibold text-white/50 transition hover:bg-white/[0.06] hover:text-white/85"
        >
          <X className="h-4 w-4" />
          <span>Close menu</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* DESKTOP FLOATING PILL TOP NAVBAR (arkaflix.app exact) */}
      <header
        aria-label="Top navigation"
        className={`pointer-events-none fixed left-1/2 top-5 z-[42] hidden h-[58px] w-fit max-w-[calc(100vw-2rem)] -translate-x-1/2 transition-all duration-300 lg:block ${
          sidebarOpen
            ? "-translate-y-4 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="pointer-events-auto relative flex w-full items-center gap-0.5 rounded-[26px] bg-[#0d0d0d]/80 px-2.5 py-2 shadow-[0_24px_70px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/[0.06] backdrop-blur-[42px] backdrop-saturate-150">
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />

          {/* arkaflix.app d. Logo */}
          <Link
            href="/"
            aria-label="arkaflix home"
            className="mr-1 flex shrink-0 items-center gap-2 rounded-[16px] py-1 pl-2 pr-3 text-white transition-opacity hover:opacity-85"
          >
            <ArkaflixLogoMark className="h-5 w-auto shrink-0 text-white" />
          </Link>

          {/* Action chips: TV mode · fullscreen · surprise me */}
          <div className="ml-0.5 flex shrink-0 items-center gap-1.5">
            <Link
              href="/?tv=1"
              className="inline-flex h-9 items-center rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-semibold text-white/85 ring-1 ring-white/[0.07] transition hover:bg-white/[0.13] hover:text-white"
            >
              Exit TV mode
            </Link>
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="inline-flex h-9 items-center rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-semibold text-white/85 ring-1 ring-white/[0.07] transition hover:bg-white/[0.13] hover:text-white"
            >
              {isFullscreen ? "Exit full screen" : "Exit full screen"}
            </button>
            <button
              type="button"
              onClick={openRandomPicker}
              className="inline-flex h-9 items-center rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-semibold text-white/85 ring-1 ring-white/[0.07] transition hover:bg-white/[0.13] hover:text-white"
            >
              Surprise me
            </button>
            <span className="hidden items-center gap-1 2xl:flex">
              <kbd className="grid h-6 min-w-6 place-items-center rounded-md border border-white/25 bg-white/[0.08] px-1.5 text-[10px] font-bold text-white/80">
                Enter
              </kbd>
              <kbd className="grid h-6 min-w-6 place-items-center rounded-md border border-white/25 bg-white/[0.08] px-1.5 text-[10px] font-bold text-white/80">
                Arrows
              </kbd>
            </span>
          </div>

          {/* Fullscreen Toggle + Divider */}
          <span className="mx-1 h-7 w-px shrink-0 bg-white/[0.08]" />

          {/* Primary Top Pills */}
          <nav
            className="ml-1 flex min-w-0 flex-none items-center gap-1"
            aria-label="Primary top"
            data-tv-row="top-nav"
          >
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[16px] px-2.5 text-[13px] font-semibold transition-all duration-200 xl:px-3 xl:text-[14px] ${
                    item.active
                      ? "bg-white/[0.22] text-white/[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]"
                      : "text-white/[0.68] hover:bg-white/[0.09] hover:text-white/[0.92]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Search + Profile Pill */}
          <div className="ml-1 flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openOmnibar}
              className="inline-flex h-10 items-center gap-2 rounded-[16px] px-3 text-[13px] font-semibold text-white/[0.68] transition-colors duration-200 hover:bg-white/[0.09] hover:text-white/[0.92] xl:text-[14px]"
            >
              <Search className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden xl:inline">Search</span>
            </button>

            {user ? (
              <button
                type="button"
                onClick={openProfileModal}
                aria-label="Profiles"
                className="inline-flex h-10 min-w-0 items-center gap-2 rounded-[18px] bg-white/[0.04] px-2.5 text-[12px] font-semibold text-white/[0.78] ring-1 ring-white/[0.06] transition-all duration-200 hover:bg-white/[0.11] hover:text-white/[0.95]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#e02020] to-[#7a0f2a] text-[11px] font-bold uppercase text-white ring-1 ring-white/20">
                  {(activeProfile?.name || user.name || "A").slice(0, 1)}
                </span>
                <span className="hidden max-w-[110px] truncate xl:inline">
                  {activeProfile?.name.split(" ")[0] || user.name}
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-2 rounded-[18px] bg-white px-4 text-[12px] font-semibold text-black transition hover:bg-white/90"
              >
                <User className="h-4 w-4" />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* DESKTOP LEFT EDGE HANDLE & FLOATING ROUNDED SIDEBAR (arkaflix.app exact) */}
      <div
        onMouseEnter={() => {
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          setSidebarOpen(true);
        }}
        onMouseLeave={() => {
          closeTimerRef.current = setTimeout(() => setSidebarOpen(false), 220);
        }}
        className={`fixed inset-y-0 left-0 z-[80] hidden lg:block ${
          sidebarOpen ? "w-[310px]" : "w-9"
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Show navigation"
          className={`group absolute inset-y-0 left-0 flex w-9 cursor-pointer items-center justify-start ${
            sidebarOpen ? "pointer-events-none opacity-0" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="h-[132px] w-[7px] rounded-r-full border-y border-r border-white/[0.08] bg-white/[0.10] shadow-[0_0_30px_rgba(255,255,255,0.16)] backdrop-blur-[30px] transition-all duration-300 group-hover:w-[12px] group-hover:bg-white/[0.18]"
          />
        </button>

        <div
          className={`absolute bottom-5 left-5 top-5 z-[1] w-[280px] transition-all duration-200 ease-out ${
            sidebarOpen
              ? "translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-4 opacity-0"
          }`}
        >
          {renderSidebarCard(() => setSidebarOpen(false))}
        </div>
      </div>

      {/* MOBILE TOP HEADER (arkaflix.app exact) */}
      <header
        aria-label="Mobile navigation"
        className="beta-mobile-header fixed inset-x-0 top-0 z-40 flex h-[64px] items-center justify-between px-4 lg:hidden"
      >
        <Link
          href="/"
          aria-label="arkaflix home"
          className="inline-flex min-h-11 items-center gap-2 text-white"
        >
          <ArkaflixLogoMark className="h-6 w-auto text-white" />
          <span className="text-[20px] font-bold tracking-[-0.06em]">Arkaflix</span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openOmnibar}
            aria-label="Search"
            className="grid h-11 w-11 place-items-center text-white/75 transition hover:text-white"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open menu"
            className="grid h-11 w-11 place-items-center text-white/75 transition hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0d0d0d]/80 p-3 backdrop-blur-sm lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-[85dvh] w-full max-w-sm"
          >
            {renderSidebarCard(() => setMobileDrawerOpen(false))}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM GLASS DOCK (arkaflix.app exact) */}
      <nav
        aria-label="Mobile dock"
        className="beta-mobile-dock fixed inset-x-0 bottom-0 z-50 lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-[560px] items-stretch px-2 py-1">
          {primaryNav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`beta-dock-link flex min-h-[54px] flex-1 flex-col items-center justify-center gap-1 rounded-[16px] transition ${
                  item.active
                    ? "text-white"
                    : "text-white/55 hover:text-white/90"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
          {user ? (
            <button
              type="button"
              onClick={openProfileModal}
              className="beta-dock-link flex min-h-[54px] flex-1 flex-col items-center justify-center gap-1 text-white/60 hover:text-white"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-none">
                Profiles
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              aria-current={pathname === "/login" ? "page" : undefined}
              className="beta-dock-link flex min-h-[54px] flex-1 flex-col items-center justify-center gap-1 text-white/60 hover:text-white"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-none">
                Sign in
              </span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-14 border-t border-white/10 bg-black px-5 pb-24 pt-10 text-white/65 sm:px-8 sm:pb-12 md:px-12 lg:px-14 xl:px-16 2xl:px-20">
      <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        <div>
          <div className="flex items-center gap-2">
            <ArkaflixLogoMark className="h-6 w-auto text-white" />
            <h2 className="text-lg font-semibold tracking-tight text-white">
              arkaflix
            </h2>
          </div>
          <p className="mt-2 max-w-xs text-sm leading-6 text-white/70">
            Movies, shows, anime and live TV in one place.
          </p>
          <p className="mt-4 max-w-xs text-xs leading-5 text-white/60">
            Prioritized VidBolt HD streaming &amp; multi-service catalog
            aggregation. No player download or payment details needed.
          </p>
        </div>

        <nav aria-label="Browse movies" className="min-w-0">
          <h3 className="text-sm font-semibold text-white/85">Movies</h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2.5 text-xs">
            <Link href="/movies" className="transition hover:text-white">
              All movies
            </Link>
            <Link
              href="/browse?media=movie&sort=popular"
              className="transition hover:text-white"
            >
              Popular
            </Link>
            <Link
              href="/browse?media=movie&sort=rating"
              className="transition hover:text-white"
            >
              Top Rated
            </Link>
            {MOVIE_FOOTER_GENRES.map((g) => (
              <Link
                key={g}
                href={`/browse?media=movie&genre=${encodeURIComponent(g)}`}
                className="transition hover:text-white"
              >
                {g}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Browse shows" className="min-w-0">
          <h3 className="text-sm font-semibold text-white/85">
            Shows &amp; Live
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2.5 text-xs">
            <Link href="/shows" className="transition hover:text-white">
              All shows
            </Link>
            <Link href="/anime" className="transition hover:text-white">
              Anime
            </Link>
            <Link href="/live" className="transition hover:text-white">
              Live TV
            </Link>
            <Link href="/providers" className="transition hover:text-white">
              Channels &amp; Apps
            </Link>
            <Link
              href="/my?tab=parties"
              className="transition hover:text-white"
            >
              Watch Parties
            </Link>
            <Link href="/my" className="transition hover:text-white">
              Your Arkaflix
            </Link>
            <Link href="/crm" className="transition hover:text-white">
              CRM
            </Link>
          </div>
        </nav>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/55">
        <span>© {new Date().getFullYear()} arkaflix · VidBolt HD Priority</span>
        <span>Posters &amp; Metadata by TMDB.</span>
      </div>
    </footer>
  );
}
