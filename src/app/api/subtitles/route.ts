import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Universal subtitle engine.
 *
 * Works for ANY title (movie / series / anime) by resolving the TMDB id to an
 * IMDb id and querying the OpenSubtitles v3 catalog index. Subtitles are
 * normalised to WebVTT so a plain <track src> can consume them, which lets the
 * player show captions even when the upstream embed provides none.
 *
 *   GET /api/subtitles?type=movie&tmdbId=155&langs=en,es
 *       → { imdbId, subtitles: [{ id, lang, label, url }] }
 *
 *   GET /api/subtitles?format=vtt&url=<encoded subtitle url>&name=English
 *       → WebVTT text (proxied, CORS-friendly, cached)
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const DEFAULT_TMDB_KEY = "1865f43a0549ca50d341dd9ab8b29f49";
const OS_BASE = "https://opensubtitles-v3.strem.io/subtitles";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  eng: "English",
  es: "Spanish",
  spa: "Spanish",
  fr: "French",
  fre: "French",
  de: "German",
  ger: "German",
  it: "Italian",
  ita: "Italian",
  pt: "Portuguese",
  por: "Portuguese",
  pob: "Portuguese (BR)",
  ru: "Russian",
  rus: "Russian",
  ar: "Arabic",
  ara: "Arabic",
  hi: "Hindi",
  hin: "Hindi",
  ja: "Japanese",
  jpn: "Japanese",
  ko: "Korean",
  kor: "Korean",
  zh: "Chinese",
  chi: "Chinese",
  nl: "Dutch",
  dut: "Dutch",
  pl: "Polish",
  pol: "Polish",
  tr: "Turkish",
  tur: "Turkish",
  sv: "Swedish",
  swe: "Swedish",
  da: "Danish",
  dan: "Danish",
  fi: "Finnish",
  fin: "Finnish",
  no: "Norwegian",
  nor: "Norwegian",
  el: "Greek",
  ell: "Greek",
  he: "Hebrew",
  heb: "Hebrew",
  id: "Indonesian",
  ind: "Indonesian",
  th: "Thai",
  tha: "Thai",
  vi: "Vietnamese",
  vie: "Vietnamese",
  uk: "Ukrainian",
  ukr: "Ukrainian",
  cs: "Czech",
  cze: "Czech",
  hu: "Hungarian",
  hun: "Hungarian",
  ro: "Romanian",
  ron: "Romanian",
  fa: "Persian",
  fas: "Persian",
};

/** Normalise ISO-639-2 (3-letter) → ISO-639-1 (2-letter) for the UI. */
function toShortLang(lang: string): string {
  const map: Record<string, string> = {
    eng: "en", spa: "es", fre: "fr", ger: "de", ita: "it", por: "pt",
    rus: "ru", ara: "ar", hin: "hi", jpn: "ja", kor: "ko", chi: "zh",
    dut: "nl", pol: "pl", tur: "tr", swe: "sv", dan: "da", fin: "fi",
    nor: "no", ell: "el", heb: "he", ind: "id", tha: "th", vie: "vi",
    ukr: "uk", cze: "cs", hun: "hu", ron: "ro", fas: "fa", pob: "pt",
  };
  return map[lang] ?? lang.slice(0, 2);
}

function labelFor(lang: string): string {
  return LANGUAGE_LABELS[lang] ?? LANGUAGE_LABELS[toShortLang(lang)] ?? lang.toUpperCase();
}

const imdbCache = new Map<string, { id: string | null; at: number }>();

async function resolveImdbId(
  mediaType: "movie" | "tv",
  tmdbId: string
): Promise<string | null> {
  const key = `${mediaType}:${tmdbId}`;
  const hit = imdbCache.get(key);
  if (hit && Date.now() - hit.at < 86_400_000) return hit.id;

  try {
    const apiKey = process.env.TMDB_API_KEY || DEFAULT_TMDB_KEY;
    const res = await fetch(
      `${TMDB_BASE}/${mediaType}/${tmdbId}/external_ids?api_key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      imdbCache.set(key, { id: null, at: Date.now() });
      return null;
    }
    const json = (await res.json()) as { imdb_id?: string | null };
    const id = json.imdb_id ?? null;
    imdbCache.set(key, { id, at: Date.now() });
    return id;
  } catch {
    return null;
  }
}

/** SRT (and loose variants) → WebVTT. */
function srtToVtt(input: string): string {
  let text = input.replace(/\r\n|\r/g, "\n").replace(/^\uFEFF/, "").trim();

  // Already WebVTT
  if (text.startsWith("WEBVTT")) return text;

  // SRT uses `,` as the millisecond separator; VTT requires `.`
  text = text.replace(
    /(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g,
    (_m, time: string, ms: string) =>
      `${time}.${ms.padEnd(3, "0").slice(0, 3)}`
  );

  // Strip SRT cue numbers that sit on their own line
  const lines = text.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const next = lines[i + 1] ?? "";
    if (/^\d+$/.test(line.trim()) && next.includes("-->")) continue;
    out.push(line);
  }

  return `WEBVTT\n\n${out.join("\n").trim()}\n`;
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");

  /* ---------------- proxy / convert a subtitle file ---------------- */
  if (format === "vtt") {
    const url = req.nextUrl.searchParams.get("url");
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid subtitle url" }, { status: 400 });
    }
    try {
      const upstream = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(9000),
      });
      if (!upstream.ok) {
        return NextResponse.json(
          { error: `Subtitle source returned ${upstream.status}` },
          { status: 502 }
        );
      }
      const raw = await upstream.text();
      const vtt = srtToVtt(raw);

      return new NextResponse(vtt, {
        status: 200,
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Could not fetch subtitle" },
        { status: 502 }
      );
    }
  }

  /* ---------------- search available subtitles ---------------- */
  const typeParam = req.nextUrl.searchParams.get("type") || "movie";
  const tmdbId = (req.nextUrl.searchParams.get("tmdbId") || "").trim();
  const season = Math.max(1, Number(req.nextUrl.searchParams.get("season") || 1));
  const episode = Math.max(1, Number(req.nextUrl.searchParams.get("episode") || 1));
  const langsParam = req.nextUrl.searchParams.get("langs") || "";

  if (!/^\d+$/.test(tmdbId)) {
    return NextResponse.json({ subtitles: [], error: "Invalid tmdbId" }, { status: 400 });
  }

  const mediaType: "movie" | "tv" = typeParam === "movie" ? "movie" : "tv";
  const imdbId = await resolveImdbId(mediaType, tmdbId);

  if (!imdbId) {
    return NextResponse.json({ imdbId: null, subtitles: [] });
  }

  const endpoint =
    mediaType === "movie"
      ? `${OS_BASE}/movie/${imdbId}.json`
      : `${OS_BASE}/series/${imdbId}:${season}:${episode}.json`;

  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) {
      return NextResponse.json({ imdbId, subtitles: [] });
    }

    const json = (await res.json()) as {
      subtitles?: Array<{ id: string; url: string; lang: string }>;
    };

    const wanted = langsParam
      .split(",")
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean);

    // One best entry per language (the provider returns many uploads each).
    const byLang = new Map<string, { id: string; lang: string; label: string; url: string }>();
    for (const sub of json.subtitles || []) {
      if (!sub?.url) continue;
      const short = toShortLang(sub.lang || "");
      if (!short) continue;
      if (wanted.length > 0 && !wanted.includes(short) && !wanted.includes(sub.lang)) {
        continue;
      }
      if (byLang.has(short)) continue;
      byLang.set(short, {
        id: sub.id,
        lang: short,
        label: labelFor(sub.lang || short),
        url: `/api/subtitles?format=vtt&url=${encodeURIComponent(sub.url)}`,
      });
    }

    // Preferred languages first, then alphabetical.
    const order = wanted.length ? wanted : ["en"];
    const subtitles = [...byLang.values()].sort((a, b) => {
      const ai = order.indexOf(a.lang);
      const bi = order.indexOf(b.lang);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.label.localeCompare(b.label);
    });

    return NextResponse.json({ imdbId, subtitles });
  } catch {
    return NextResponse.json({ imdbId, subtitles: [] });
  }
}
