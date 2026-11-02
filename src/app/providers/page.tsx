"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATALOG_MEDIA, CatalogItem, PROVIDERS } from "@/lib/catalog";
import { useMarquee } from "@/components/MarqueeProvider";
import { MediaCard } from "@/components/MediaCard";
import { Check, Plus, Loader2 } from "lucide-react";

function ProvidersContent() {
  const searchParams = useSearchParams();
  const { activeProfile, toggleProviderSubscription } = useMarquee();

  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    searchParams.get("selected") || "netflix"
  );
  const [liveServiceItems, setLiveServiceItems] = useState<CatalogItem[]>([]);
  const [loadingService, setLoadingService] = useState(false);

  const activeProvider =
    PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0];

  useEffect(() => {
    const sel = searchParams.get("selected");
    if (sel) setSelectedProviderId(sel);
  }, [searchParams]);

  // Fetch live TMDB catalog for the selected streaming service
  useEffect(() => {
    if (!activeProvider) return;
    let cancelled = false;
    setLoadingService(true);
    fetch(
      `/api/discover?mode=service&providerId=${activeProvider.tmdbProviderId}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setLiveServiceItems(data?.items || []);
          setLoadingService(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingService(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProvider]);

  const userSubs = useMemo(
    () => activeProfile?.subscribedProviders || [],
    [activeProfile]
  );

  const displayItems = useMemo(() => {
    if (liveServiceItems.length > 0) return liveServiceItems;
    return CATALOG_MEDIA.filter((m) =>
      [
        ...(m.providers.stream || []),
        ...(m.providers.free || []),
        ...(m.providers.rent || []),
      ].includes(activeProvider.id)
    );
  }, [liveServiceItems, activeProvider]);

  return (
    <main className="dulo-rail-px min-h-[100dvh] pb-24 pt-24 lg:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Channels &amp; Apps
          </h1>
          <p className="mt-1 text-xs font-medium text-white/55">
            Select any streaming service to browse its US TMDB catalog and play
            instantly via VidCore.
          </p>
        </div>
        <span className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-white/75 ring-1 ring-white/[0.08]">
          {userSubs.length} saved in Your Apps
        </span>
      </div>

      {/* DULO.MOV SERVICE CARDS GRID (.beta-service-card) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {PROVIDERS.filter((p) => p.type !== "store").map((prov) => {
          const isSelected = prov.id === activeProvider.id;
          const isSubscribed = userSubs.includes(prov.id);

          return (
            <div key={prov.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedProviderId(prov.id)}
                style={
                  { "--service-tint": prov.accent } as React.CSSProperties
                }
                className={`beta-service-card group relative flex h-[116px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] px-2 ${
                  isSelected ? "ring-2 ring-white" : ""
                }`}
              >
                <span className="beta-service-logo grid h-14 w-14 place-items-center rounded-[14px]">
                  <img
                    src={prov.logoUrl}
                    alt={prov.name}
                    loading="lazy"
                    className="h-11 w-11 rounded-[11px] object-cover"
                  />
                </span>
                <span className="max-w-full truncate text-[12px] font-semibold leading-none text-white/85">
                  {prov.shortName}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleProviderSubscription(prov.id)}
                title={isSubscribed ? "In Your Apps" : "Save to Your Apps"}
                className={`absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full text-[10px] transition ${
                  isSubscribed
                    ? "bg-[#da1b1b] text-white"
                    : "bg-black/60 text-white/70 ring-1 ring-white/15 hover:bg-black"
                }`}
              >
                {isSubscribed ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* SELECTED SERVICE CATALOG */}
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={activeProvider.logoUrl}
              alt={activeProvider.name}
              className="h-10 w-10 rounded-[10px] object-cover ring-1 ring-white/15"
            />
            <div>
              <h2 className="text-xl font-bold text-white">
                {activeProvider.name}
              </h2>
              <p className="text-xs text-white/50">{activeProvider.tagline}</p>
            </div>
          </div>
          {loadingService && (
            <Loader2 className="h-5 w-5 animate-spin text-[#da1b1b]" />
          )}
        </div>

        <div data-tv-row="service-grid" data-tv-grid
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
          {displayItems.map((item) => (
            <MediaCard
              key={`${item.tmdbMediaType}-${item.id}`}
              item={item}
              fluid
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <ProvidersContent />
    </Suspense>
  );
}
