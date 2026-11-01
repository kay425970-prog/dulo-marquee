import { db } from "@/db";
import {
  profiles,
  libraryItems,
  customCollections,
  mediaReviews,
  watchParties,
  crmDeals,
} from "@/db/schema";
import { eq, like, sql } from "drizzle-orm";
import { dbConfigured } from "@/db";

let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  // If no database is configured, skip initialization so builds and pages still
  // work; API handlers will return graceful empty/fallback results instead of
  // crashing. Set DATABASE_URL (or POSTGRES_URL) to enable full persistence.
  if (!dbConfigured) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          token TEXT NOT NULL UNIQUE,
          user_id INTEGER NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          handle TEXT NOT NULL,
          avatar_gradient TEXT NOT NULL,
          avatar_emoji TEXT NOT NULL,
          bio TEXT NOT NULL DEFAULT 'Cinema & streaming enthusiast',
          subscribed_providers JSONB NOT NULL DEFAULT '[]'::jsonb,
          preferred_genres JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_kids BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS library_items (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER NOT NULL,
          media_id TEXT NOT NULL,
          media_type TEXT NOT NULL,
          title TEXT NOT NULL,
          poster_url TEXT NOT NULL,
          backdrop_url TEXT NOT NULL DEFAULT '',
          year TEXT NOT NULL DEFAULT '2024',
          rating TEXT NOT NULL DEFAULT '8.4',
          genres JSONB NOT NULL DEFAULT '[]'::jsonb,
          in_watchlist BOOLEAN NOT NULL DEFAULT false,
          is_favorite BOOLEAN NOT NULL DEFAULT false,
          progress_percent INTEGER NOT NULL DEFAULT 0,
          progress_seconds INTEGER NOT NULL DEFAULT 0,
          last_season INTEGER NOT NULL DEFAULT 1,
          last_episode INTEGER NOT NULL DEFAULT 1,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS custom_collections (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          accent_color TEXT NOT NULL DEFAULT 'red',
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_public BOOLEAN NOT NULL DEFAULT true,
          likes_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS media_reviews (
          id SERIAL PRIMARY KEY,
          media_id TEXT NOT NULL,
          media_type TEXT NOT NULL,
          profile_name TEXT NOT NULL,
          avatar_gradient TEXT NOT NULL,
          rating INTEGER NOT NULL,
          headline TEXT NOT NULL,
          comment TEXT NOT NULL,
          spoiler BOOLEAN NOT NULL DEFAULT false,
          likes_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS watch_parties (
          id SERIAL PRIMARY KEY,
          room_code TEXT NOT NULL,
          host_name TEXT NOT NULL,
          media_id TEXT NOT NULL,
          media_type TEXT NOT NULL,
          media_title TEXT NOT NULL,
          poster_url TEXT NOT NULL,
          current_server TEXT NOT NULL DEFAULT 'vidcore',
          season INTEGER NOT NULL DEFAULT 1,
          episode INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'live',
          viewer_count INTEGER NOT NULL DEFAULT 1,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS custom_live_channels (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER NOT NULL DEFAULT 1,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'Custom IPTV',
          stream_url TEXT NOT NULL,
          logo_text TEXT NOT NULL DEFAULT 'TV',
          country TEXT NOT NULL DEFAULT 'Global',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS crm_deals (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          studio TEXT NOT NULL,
          stage TEXT NOT NULL DEFAULT 'scouting',
          deal_value INTEGER NOT NULL DEFAULT 250000,
          priority TEXT NOT NULL DEFAULT 'High',
          owner TEXT NOT NULL DEFAULT 'Elena Vance',
          media_type TEXT NOT NULL DEFAULT 'Movie',
          notes TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id INTEGER;
      `);

      // Enforce 100% TMDB-only poster URLs across any previously seeded rows
      await db
        .update(libraryItems)
        .set({
          mediaId: "85937",
          title: "Demon Slayer: Kimetsu no Yaiba",
          posterUrl:
            "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
          backdropUrl:
            "https://image.tmdb.org/t/p/w1280/nTvM4mhqNlHIvUkI1gVnW6XP7GG.jpg",
        })
        .where(like(libraryItems.posterUrl, "%anilist%"));

      await db
        .update(watchParties)
        .set({
          mediaId: "1429",
          mediaTitle: "Attack on Titan",
          posterUrl:
            "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
        })
        .where(like(watchParties.posterUrl, "%anilist%"));

      // Sanitize custom_collections JSONB items if any legacy non-TMDB URL exists
      const existingCollections = await db.select().from(customCollections);
      for (const col of existingCollections) {
        const hasNonTmdb = col.items.some(
          (i) => !i.posterUrl.startsWith("https://image.tmdb.org/")
        );
        if (hasNonTmdb) {
          const fixedItems = col.items.map((i) => {
            if (i.title.toLowerCase().includes("titan")) {
              return {
                ...i,
                mediaId: "1429",
                posterUrl:
                  "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
              };
            }
            if (i.title.toLowerCase().includes("demon slayer")) {
              return {
                ...i,
                mediaId: "85937",
                posterUrl:
                  "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
              };
            }
            return {
              ...i,
              posterUrl: i.posterUrl.startsWith("https://image.tmdb.org/")
                ? i.posterUrl
                : "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
            };
          });
          await db
            .update(customCollections)
            .set({ items: fixedItems })
            .where(eq(customCollections.id, col.id));
        }
      }

      const existingProfiles = await db.select().from(profiles).limit(1);
      if (existingProfiles.length === 0) {
        const insertedProfiles = await db
          .insert(profiles)
          .values([
            {
              name: "Alex Mercer",
              handle: "@alex",
              avatarGradient: "from-red-600 to-rose-700",
              avatarEmoji: "🎬",
              bio: "4K cinema, thrillers & prestige series",
              subscribedProviders: ["netflix", "max", "apple-tv", "prime", "crunchyroll"],
              preferredGenres: ["Science Fiction", "Thriller", "Action", "Drama"],
              isKids: false,
            },
            {
              name: "Maya Lin",
              handle: "@maya",
              avatarGradient: "from-neutral-700 to-neutral-900",
              avatarEmoji: "⚡",
              bio: "Anime simulcasts, Studio Ghibli & A24 cinema",
              subscribedProviders: ["crunchyroll", "netflix", "mubi", "hulu"],
              preferredGenres: ["Animation", "Fantasy", "Action"],
              isKids: false,
            },
            {
              name: "Kids & Family",
              handle: "@family",
              avatarGradient: "from-amber-500 to-red-600",
              avatarEmoji: "🍿",
              bio: "Family movie nights & animated adventures",
              subscribedProviders: ["disney", "netflix", "prime", "pluto"],
              preferredGenres: ["Adventure", "Animation", "Family", "Fantasy"],
              isKids: true,
            },
          ])
          .returning();

        const p1 = insertedProfiles[0]?.id ?? 1;

        await db.insert(libraryItems).values([
          {
            profileId: p1,
            mediaId: "693134",
            mediaType: "movie",
            title: "Dune: Part Two",
            posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
            year: "2024",
            rating: "8.4",
            genres: ["Science Fiction", "Adventure", "Action"],
            inWatchlist: true,
            isFavorite: true,
            progressPercent: 64,
            progressSeconds: 5620,
            lastSeason: 1,
            lastEpisode: 1,
          },
          {
            profileId: p1,
            mediaId: "95396",
            mediaType: "tv",
            title: "Severance",
            posterUrl: "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg",
            year: "2022",
            rating: "8.7",
            genres: ["Science Fiction", "Mystery", "Thriller"],
            inWatchlist: true,
            isFavorite: true,
            progressPercent: 48,
            progressSeconds: 1380,
            lastSeason: 2,
            lastEpisode: 3,
          },
          {
            profileId: p1,
            mediaId: "533535",
            mediaType: "movie",
            title: "Deadpool & Wolverine",
            posterUrl: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/w1280/ufpeVEM64uZHPpzzeiDNIAdaeOD.jpg",
            year: "2024",
            rating: "7.8",
            genres: ["Action", "Comedy", "Science Fiction"],
            inWatchlist: true,
            isFavorite: false,
            progressPercent: 0,
            progressSeconds: 0,
            lastSeason: 1,
            lastEpisode: 1,
          },
          {
            profileId: p1,
            mediaId: "95480",
            mediaType: "tv",
            title: "Slow Horses",
            posterUrl: "https://image.tmdb.org/t/p/w500/AdYr4DjOgXvDUMwu6vEhZy1Rnxk.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/w1280/AdYr4DjOgXvDUMwu6vEhZy1Rnxk.jpg",
            year: "2022",
            rating: "8.6",
            genres: ["Thriller", "Crime", "Drama"],
            inWatchlist: false,
            isFavorite: true,
            progressPercent: 85,
            progressSeconds: 2640,
            lastSeason: 2,
            lastEpisode: 5,
          },
        ]);

        await db.insert(customCollections).values([
          {
            profileId: p1,
            name: "Mind-Bending Sci-Fi Epics",
            description:
              "Cosmic blockbusters and high-concept sci-fi series.",
            accentColor: "red",
            likesCount: 48,
            items: [
              {
                mediaId: "693134",
                mediaType: "movie",
                title: "Dune: Part Two",
                posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
                year: "2024",
                rating: 8.4,
              },
              {
                mediaId: "157336",
                mediaType: "movie",
                title: "Interstellar",
                posterUrl: "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
                year: "2014",
                rating: 8.7,
              },
              {
                mediaId: "95396",
                mediaType: "tv",
                title: "Severance",
                posterUrl: "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
                year: "2022",
                rating: 8.7,
              },
            ],
          },
          {
            profileId: p1,
            name: "Essential Anime Masterpieces",
            description:
              "Legendary full-run series and films from ufotable, MAPPA, Wit Studio & Ghibli.",
            accentColor: "red",
            likesCount: 73,
            items: [
              {
                mediaId: "1429",
                mediaType: "anime",
                title: "Attack on Titan",
                posterUrl:
                  "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
                year: "2013",
                rating: 9.0,
              },
              {
                mediaId: "85937",
                mediaType: "anime",
                title: "Demon Slayer",
                posterUrl:
                  "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
                year: "2019",
                rating: 8.7,
              },
              {
                mediaId: "105248",
                mediaType: "anime",
                title: "Cyberpunk: Edgerunners",
                posterUrl: "https://image.tmdb.org/t/p/w500/v3JuB15WybKmxDeT1hWdK3j6eSJ.jpg",
                year: "2022",
                rating: 8.6,
              },
              {
                mediaId: "129",
                mediaType: "anime",
                title: "Spirited Away",
                posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
                year: "2001",
                rating: 8.6,
              },
            ],
          },
        ]);

        await db.insert(mediaReviews).values([
          {
            mediaId: "693134",
            mediaType: "movie",
            profileName: "Alex Mercer",
            avatarGradient: "from-red-600 to-rose-700",
            rating: 10,
            headline: "Generational sci-fi spectacle in 4K",
            comment:
              "Denis Villeneuve delivered an absolute monument of cinema. VidCore 4K stream loaded instantaneously.",
            spoiler: false,
            likesCount: 64,
          },
          {
            mediaId: "95396",
            mediaType: "tv",
            profileName: "Maya Lin",
            avatarGradient: "from-neutral-700 to-neutral-900",
            rating: 10,
            headline: "Best mystery series on streaming right now",
            comment:
              "Every single episode ratchets up the tension. Switching episodes directly inside the fullscreen player is effortless.",
            spoiler: false,
            likesCount: 52,
          },
        ]);

        await db.insert(watchParties).values([
          {
            roomCode: "DL-8842",
            hostName: "Alex Mercer",
            mediaId: "693134",
            mediaType: "movie",
            mediaTitle: "Dune: Part Two",
            posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            currentServer: "vidcore",
            season: 1,
            episode: 1,
            status: "live",
            viewerCount: 9,
            messages: [
              {
                id: "m1",
                sender: "Alex Mercer",
                avatarGradient: "from-red-600 to-rose-700",
                text: "Welcome to Arrakis Night! VidCore 4K stream synced & rolling 🍿",
                timestamp: "Just now",
              },
            ],
          },
          {
            roomCode: "DL-2049",
            hostName: "Maya Lin",
            mediaId: "1429",
            mediaType: "anime",
            mediaTitle: "Attack on Titan",
            posterUrl:
              "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
            currentServer: "vidcore",
            season: 1,
            episode: 1,
            status: "live",
            viewerCount: 14,
            messages: [
              {
                id: "m2",
                sender: "Maya Lin",
                avatarGradient: "from-neutral-700 to-neutral-900",
                text: "Starting S1E1 marathon in fullscreen via VidCore!",
                reaction: "⚔️",
                timestamp: "2m ago",
              },
            ],
          },
        ]);

        await db.insert(crmDeals).values([
          {
            title: "VidCore Global 4K Edge Priority Routing",
            studio: "VidCore · TMDB Sync",
            stage: "live",
            dealValue: 720000,
            priority: "Critical",
            owner: "Elena Vance",
            mediaType: "Movie",
            notes: "Primary 4K embed routing active across 120+ edge PoPs.",
          },
          {
            title: "Severance S1–S2 — Episode Still & Metadata Sync",
            studio: "Apple TV+",
            stage: "live",
            dealValue: 610000,
            priority: "Critical",
            owner: "Elena Vance",
            mediaType: "Series",
            notes: "TMDB w300 stills + VidCore instant episode routing active.",
          },
          {
            title: "Anime Simulcast TMDB Index",
            studio: "Crunchyroll · Aniplex",
            stage: "live",
            dealValue: 490000,
            priority: "High",
            owner: "Kenji Sato",
            mediaType: "Anime",
            notes: "100% TMDB poster parity + VidCore TV episode routing.",
          },
        ]);
      }
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}
