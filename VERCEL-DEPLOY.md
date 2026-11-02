# Deploying to Vercel (alongside Netlify)

Both hosts run the same repo. `netlify.toml` and `vercel.json` coexist without
conflict — each host reads only its own file.

| | Netlify (live) | Vercel |
| --- | --- | --- |
| Web app | https://dulo-marquee.netlify.app | created on first import |
| Runtime | `@netlify/plugin-nextjs` | built-in Next.js |
| DB env var | `NETLIFY_DATABASE_URL` (auto) | `DATABASE_URL` or `POSTGRES_URL` |
| Headers | `netlify.toml` | `vercel.json` |

---

## 1. Import the repo

https://vercel.com/new/clone?repository-url=https://github.com/kay425970-prog/dulo-marquee

- Framework: **Next.js** (auto-detected; `vercel.json` makes it explicit)
- Build command: `npm run build` (default)
- Output: `.next` (default)
- Do **not** override install/build commands.

## 2. Environment variables

Project → Settings → Environment Variables (Production **and** Preview):

| Key | Value | Required |
| --- | --- | --- |
| `DATABASE_URL` | pooled Postgres URL, `?sslmode=require` | recommended |
| `TMDB_API_KEY` | your TMDB v3 key | optional |

`POSTGRES_URL` is also accepted (Vercel Postgres / Neon integration injects it),
so attaching **Vercel Postgres** or the **Neon integration** works with no manual
copy-paste.

> The build succeeds with **no** database configured, so you get a URL
> immediately. Browsing, TMDB artwork, VidLink/VidPro playback and Live TV work
> right away; login, My List and Watch Parties activate once `DATABASE_URL`
> exists (tables self-create on first request — no migration step).

## 3. Deploy

Dashboard: **Deploy**. Or CLI:

```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL production
vercel --prod
```

## 4. Verify

```text
/api/health        → {"ok":true,"database":true}
/api/engines       → prioritizedProvider: "VidLink", blockedFamilies:["vidsrc"]
/api/subtitles?type=movie&tmdbId=155&langs=en  → VTT tracks
/favicon.ico       → image/x-icon
```

## Notes

- **Use a pooled connection string.** Vercel functions are serverless; a direct
  URL exhausts Postgres connections.
- **Pick a matching region** (e.g. `iad1` with a US-East database).
- **Env changes need a redeploy** — they are not hot-applied.
- Auto-deploy: once imported, every push to `main` builds on Vercel and Netlify
  simultaneously.
