"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { CatalogItem } from "@/lib/catalog";
import { useMarquee } from "./MarqueeProvider";
import { Bookmark, ChevronLeft, ChevronRight, Film } from "lucide-react";

interface MediaCardProps {
  item: CatalogItem;
  rank?: number;
  fluid?: boolean;
  progressPercent?: number;
  episodeLabel?: string;
}

export function MediaCard({
  item,
  rank,
  fluid = false,
  progressPercent,
  episodeLabel,
}: MediaCardProps) {
  const { isInWatchlist, toggleWatchlist } = useMarquee();
  const [imgError, setImgError] = useState(false);

  const inWatchlist = isInWatchlist(item.id);
  const detailHref = `/title/${item.type}/${item.id}`;

  // ARKAFLIX.MOV TOP 10 RANKED CARD (.home-rail-ranked)
  if (rank !== undefined) {
    return (
      <Link
        href={detailHref}
        data-rail-card="true"
        className="group relative block w-[150px] shrink-0 snap-start text-left sm:w-[170px] md:w-[188px] xl:w-[218px] 2xl:w-[248px]"
      >
        <span
          aria-hidden="true"
          className="top-rank-number pointer-events-none absolute -left-1 bottom-[8px] z-0 text-[68px] sm:text-[78px] md:text-[88px] xl:text-[104px] 2xl:text-[120px]"
        >
          {rank}
        </span>

        <div className="relative z-10 ml-[38px] aspect-[2/3] w-[108px] overflow-hidden rounded-[14px] bg-white/[0.04] shadow-[0_10px_28px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.06] transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/[0.48] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
          {!imgError && item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#171717] text-xl font-bold text-white/30">
              {item.title[0]}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
          <p className="absolute bottom-2.5 left-2.5 right-2.5 truncate text-[11px] font-semibold leading-none text-white/[0.92] drop-shadow">
            {item.title}
          </p>
        </div>
      </Link>
    );
  }

  // ARKAFLIX.MOV STANDARD POSTER CARD
  return (
    <div
      data-rail-card="true"
      className={`group relative ${
        fluid
          ? "w-full"
          : "w-[124px] shrink-0 snap-start text-left sm:w-[132px] md:w-[144px] xl:w-[158px] 2xl:w-[180px]"
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[14px] bg-white/[0.04] shadow-[0_10px_28px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.06] transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/[0.45]">
        <Link href={detailHref} className="block h-full w-full">
          {!imgError && item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[#171717] p-3 text-center">
              <Film className="h-7 w-7 text-white/30" />
              <span className="mt-2 line-clamp-2 text-xs font-semibold text-white/75">
                {item.title}
              </span>
            </div>
          )}
        </Link>

        {/* Quick My List Toggle on Hover */}
        <button
          type="button"
          aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWatchlist(item);
          }}
          className={`absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full backdrop-blur-md transition ${
            inWatchlist
              ? "bg-[#da1b1b] text-white opacity-100"
              : "bg-black/60 text-white/80 opacity-0 ring-1 ring-white/15 hover:bg-black/85 hover:text-white group-hover:opacity-100"
          }`}
        >
          <Bookmark
            className={`h-3.5 w-3.5 ${inWatchlist ? "fill-current" : ""}`}
          />
        </button>

        {/* Crimson Progress Bar */}
        {typeof progressPercent === "number" && progressPercent > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/55">
            <div
              className="h-full bg-[#da1b1b]"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>

      <Link
        href={detailHref}
        tabIndex={-1}
        aria-hidden="true"
        className="mt-2 block min-w-0 transition duration-300 group-hover:-translate-y-0.5"
      >
        <p className="truncate text-[12px] font-semibold leading-[1.16] text-white/[0.80] transition-colors duration-300 group-hover:text-white/[0.98] sm:text-[13px]">
          {item.title}
        </p>
        <p className="mt-[3px] text-[11px] font-medium leading-none text-white/[0.55]">
          {episodeLabel || item.year}
        </p>
      </Link>
    </div>
  );
}

interface MediaRailProps {
  title: string;
  eyebrow?: string;
  href?: string;
  items: CatalogItem[];
  ranked?: boolean;
  landscape?: boolean;
}

export function MediaRail({
  title,
  eyebrow,
  href,
  items,
  ranked = false,
  landscape = false,
}: MediaRailProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: dir * 680,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section
      aria-label={title}
      data-tv-row={title}
      className={`group/rail relative ${
        ranked ? "home-rail-ranked" : ""
      }`}
    >
      <div className="arkaflix-rail-px mb-3 flex items-end justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.03em] text-white/[0.44]">
              {eyebrow}
            </p>
          )}
          <h2 className="text-[17px] font-semibold leading-none tracking-tight text-white/[0.92] sm:text-[19px]">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {href && (
            <Link
              href={href}
              className="mr-1 text-xs font-semibold text-white/55 transition hover:text-white"
            >
              See all
            </Link>
          )}
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            aria-label={`Scroll ${title} left`}
            className="hidden h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/75 ring-1 ring-white/[0.08] transition hover:bg-white/[0.15] hover:text-white sm:grid"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            aria-label={`Scroll ${title} right`}
            className="hidden h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/75 ring-1 ring-white/[0.08] transition hover:bg-white/[0.15] hover:text-white sm:grid"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        data-tv-rail
        className={`scrollbar-hide arkaflix-rail-px flex snap-x snap-proximity overflow-x-auto pb-6 pt-1.5 ${
          landscape ? "gap-4 sm:gap-5" : "gap-3 sm:gap-4"
        }`}
      >
        {landscape
          ? items.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/title/${item.type}/${item.id}`}
                data-rail-card="true"
                className="group relative block w-[250px] shrink-0 snap-start sm:w-[290px] xl:w-[330px]"
              >
                <div className="relative aspect-video overflow-hidden rounded-[16px] bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.07] transition duration-300 group-hover:scale-[1.02] group-hover:ring-white/[0.5]">
                  <img
                    src={item.backdropUrl || item.posterUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_34%,rgba(0,0,0,0.32)_66%,rgba(0,0,0,0.88)_100%)]" />
                  <div className="absolute bottom-3 left-3.5 right-3.5">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.title}
                        className="beta-hero-logo max-h-9 w-auto max-w-[75%] object-contain object-left"
                      />
                    ) : (
                      <p className="truncate text-[13px] font-bold text-white drop-shadow">
                        {item.title}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] font-medium text-white/65">
                      {item.year} · ★ {item.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          : items.map((item, idx) => (
              <MediaCard
                key={`${item.type}-${item.id}`}
                item={item}
                rank={ranked ? idx + 1 : undefined}
              />
            ))}
      </div>
    </section>
  );
}
