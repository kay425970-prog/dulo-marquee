"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMarquee } from "@/components/MarqueeProvider";
import { ArkaflixLogoMark } from "@/components/Navbar";
import { Loader2, Mail, Lock, User } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, register } = useMarquee();

  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dbReady, setDbReady] = useState<boolean | null>(null);

  const next = searchParams.get("next") || "/";

  // Tell the user up-front when this deployment has no database attached.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDbReady(Boolean(d.database));
      })
      .catch(() => {
        if (!cancelled) setDbReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result =
        mode === "signin"
          ? await signIn(email, password)
          : await register(email, password, name);
      if (result.ok) {
        router.push(next);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 pb-24 pt-24">
      <div className="w-full max-w-md rounded-[24px] border border-white/[0.16] bg-[#171717] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.75)] sm:p-9">
        <div className="flex items-center gap-3">
          <ArkaflixLogoMark className="h-9 w-9 text-white" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {mode === "signin" ? "Sign in to arkaflix" : "Create your arkaflix account"}
            </h1>
            <p className="text-xs text-white/50">
              Keep My List, ratings &amp; Continue Watching synced across devices.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-[14px] bg-black/40 p-1 ring-1 ring-white/[0.08]">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`h-10 rounded-[11px] text-sm font-semibold transition ${
                mode === m
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {dbReady === false && (
          <div
            role="status"
            className="mt-5 rounded-xl bg-amber-500/12 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-200/90 ring-1 ring-amber-400/30"
          >
            <strong className="font-semibold text-amber-100">
              Database not connected on this deployment.
            </strong>{" "}
            Browsing, TMDB artwork and playback all work — but accounts need
            persistence. Add a{" "}
            <code className="font-mono text-amber-100">DATABASE_URL</code>{" "}
            environment variable (any Postgres) and redeploy to enable sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-semibold text-white/60">Name</span>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-black/40 px-3.5 focus-within:border-[#da1b1b]">
                <User className="h-4 w-4 text-white/40" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-11 flex-1 bg-transparent text-sm text-white placeholder-white/35 focus:outline-none"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-white/60">Email</span>
            <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-black/40 px-3.5 focus-within:border-[#da1b1b]">
              <Mail className="h-4 w-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 flex-1 bg-transparent text-sm text-white placeholder-white/35 focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-white/60">
              Password
            </span>
            <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-black/40 px-3.5 focus-within:border-[#da1b1b]">
              <Lock className="h-4 w-4 text-white/40" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup" ? "At least 6 characters" : "Your password"
                }
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                className="h-11 flex-1 bg-transparent text-sm text-white placeholder-white/35 focus:outline-none"
              />
            </div>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#da1b1b]/15 px-3.5 py-2.5 text-xs font-semibold text-[#ff8585] ring-1 ring-[#da1b1b]/40"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="beta-action inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{mode === "signin" ? "Sign in" : "Create account"}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-white/45">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-white/80 hover:text-white"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-semibold text-white/80 hover:text-white"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-3 text-center text-[11px] text-white/35">
          No account needed to browse —{" "}
          <Link href="/" className="underline hover:text-white/70">
            continue as guest
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#da1b1b]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
