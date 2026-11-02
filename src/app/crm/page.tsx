"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useMarquee } from "@/components/MarqueeProvider";
import { DuloLogoMark } from "@/components/Navbar";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Plus,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Users,
  Bookmark,
  Play,
  DollarSign,
  LogOut,
} from "lucide-react";

interface CrmDeal {
  id: number;
  title: string;
  studio: string;
  stage: "scouting" | "negotiation" | "encoding" | "live";
  dealValue: number;
  priority: string;
  owner: string;
  mediaType: string;
  notes: string;
}

interface CrmMetrics {
  activeProfiles: number;
  watchlistSaves: number;
  favoritesCount: number;
  activeStreams: number;
  communityReviews: number;
  liveWatchParties: number;
  totalPipelineValue: number;
}

const STAGES: Array<{
  id: CrmDeal["stage"];
  label: string;
}> = [
  { id: "scouting", label: "1. Scouting" },
  { id: "negotiation", label: "2. Negotiation" },
  { id: "encoding", label: "3. 4K Encoding" },
  { id: "live", label: "4. Live on VidLink" },
];

export default function CrmPage() {
  const { notify } = useMarquee();
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("elena.vance@dulo.mov");
  const [password, setPassword] = useState("dulo-exec-2026");

  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newStudio, setNewStudio] = useState("");
  const [newValue, setNewValue] = useState("450000");
  const [newStage, setNewStage] = useState<CrmDeal["stage"]>("scouting");
  const [newPriority, setNewPriority] = useState("High");
  const [newType, setNewType] = useState("Movie");
  const [newNotes, setNewNotes] = useState("");

  const loadCrm = useCallback(async () => {
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
        setMetrics(data.metrics || null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (unlocked) loadCrm();
  }, [unlocked, loadCrm]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setUnlocked(true);
    notify("CRM Pipeline Unlocked");
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStudio.trim()) return;
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createDeal",
        title: newTitle.trim(),
        studio: newStudio.trim(),
        dealValue: Number(newValue || 250000),
        stage: newStage,
        priority: newPriority,
        mediaType: newType,
        notes: newNotes.trim(),
      }),
    });
    if (res.ok) {
      setNewTitle("");
      setNewStudio("");
      setNewNotes("");
      setShowAddForm(false);
      await loadCrm();
      notify("Deal added to pipeline");
    }
  };

  const handleMoveDeal = async (deal: CrmDeal, dir: -1 | 1) => {
    const idx = STAGES.findIndex((s) => s.id === deal.stage);
    const nextStage = STAGES[idx + dir];
    if (!nextStage) return;

    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "moveStage",
        id: deal.id,
        stage: nextStage.id,
      }),
    });
    await loadCrm();
    notify(`Moved to ${nextStage.label}`);
  };

  const handleDeleteDeal = async (id: number) => {
    await fetch(`/api/crm?id=${id}`, { method: "DELETE" });
    await loadCrm();
    notify("Removed deal");
  };

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-[85vh] max-w-md items-center px-4 pt-20">
        <div className="w-full rounded-[24px] border border-white/[0.16] bg-[#171717] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#da1b1b]/20 text-white ring-1 ring-[#da1b1b]/45">
              <DuloLogoMark className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-white">CRM Admin Login</h1>
              <p className="text-xs text-white/50">
                VidLink &amp; TMDB Catalog Operations
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-white/60">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-[#da1b1b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-[#da1b1b] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black hover:bg-white/90"
            >
              <Lock className="h-4 w-4" /> Access CRM Pipeline
            </button>
          </form>

          <div className="mt-4 border-t border-white/[0.08] pt-3.5 text-center">
            <button
              type="button"
              onClick={() => {
                setUnlocked(true);
                notify("Executive Demo Unlocked");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff8585] hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" /> 1-Click Instant Demo Unlock →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dulo-rail-px min-h-[100dvh] pb-24 pt-24 lg:pt-28">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Content Aggregator CRM &amp; Telemetry
          </h1>
          <p className="text-xs text-white/55">
            Live PostgreSQL pipeline for TMDB catalog sync, VidLink 4K routing
            &amp; viewer engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> New Deal
          </button>
          <button
            type="button"
            onClick={() => setUnlocked(false)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-xs font-semibold text-white hover:bg-white/[0.14]"
          >
            <LogOut className="h-3.5 w-3.5" /> Lock
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Pipeline",
            val: `$${((metrics?.totalPipelineValue || 0) / 1000000).toFixed(2)}M`,
            icon: DollarSign,
          },
          {
            label: "Profiles",
            val: String(metrics?.activeProfiles ?? 3),
            icon: Users,
          },
          {
            label: "My List Saves",
            val: String(metrics?.watchlistSaves ?? 0),
            icon: Bookmark,
          },
          {
            label: "Active Streams",
            val: String(metrics?.activeStreams ?? 0),
            icon: Play,
          },
          {
            label: "Watch Parties",
            val: String(metrics?.liveWatchParties ?? 0),
            icon: Sparkles,
          },
          {
            label: "Reviews",
            val: String(metrics?.communityReviews ?? 0),
            icon: ShieldCheck,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="beta-panel p-4">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{kpi.label}</span>
                <Icon className="h-4 w-4 text-[#ff8585]" />
              </div>
              <div className="mt-1.5 text-xl font-bold text-white">
                {kpi.val}
              </div>
            </div>
          );
        })}
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateDeal} className="beta-panel mt-5 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title / Package"
              className="sm:col-span-2 rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
            />
            <input
              required
              value={newStudio}
              onChange={(e) => setNewStudio(e.target.value)}
              placeholder="Studio / Network"
              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
            />
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value ($)"
              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
            />
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value as CrmDeal["stage"])}
              className="rounded-xl border border-white/12 bg-[#171717] px-3 py-2 text-xs text-white"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-xl border border-white/12 bg-[#171717] px-3 py-2 text-xs text-white"
            >
              {["Movie", "Series", "Anime", "Live TV"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes..."
              className="flex-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#da1b1b] focus:outline-none"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="rounded-xl border border-white/12 bg-[#171717] px-3 py-2 text-xs text-white"
            >
              {["Critical", "High", "Medium"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage, stageIdx) => {
          const colDeals = deals.filter((d) => d.stage === stage.id);
          return (
            <div key={stage.id} className="beta-panel p-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {stage.label}
                </span>
                <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-white/75">
                  {colDeals.length}
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {colDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-[14px] bg-white/[0.04] p-3.5 ring-1 ring-white/[0.06]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="uppercase text-white/55">
                        {deal.mediaType}
                      </span>
                      <span className="text-[#ff8585]">{deal.priority}</span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-white">
                      {deal.title}
                    </h4>
                    <div className="text-xs text-white/50">{deal.studio}</div>
                    {deal.notes && (
                      <p className="mt-1 text-[11px] text-white/45">
                        {deal.notes}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2">
                      <span className="text-xs font-semibold text-emerald-400">
                        ${deal.dealValue.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        {stageIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveDeal(deal, -1)}
                            className="rounded-lg bg-white/[0.08] p-1 text-white hover:bg-white/[0.15]"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {stageIdx < STAGES.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveDeal(deal, 1)}
                            className="rounded-lg bg-[#da1b1b] p-1 text-white hover:brightness-110"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="rounded-lg p-1 text-white/40 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
