export type MediaType = "movie" | "tv" | "anime";

export interface ProviderInfo {
  id: string;
  tmdbProviderId: number;
  name: string;
  shortName: string;
  logoUrl: string;
  monthlyPrice: number;
  tierLabel: string;
  accent: string;
  tagline: string;
  type: "subscription" | "free" | "store";
}

export interface CastMember {
  id?: number;
  name: string;
  character: string;
  photoUrl?: string;
}

export interface EpisodeInfo {
  number: number;
  title: string;
  duration: string;
  overview: string;
  airDate: string;
  rating: number;
  stillUrl?: string;
}

export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  year: string;
  episodes: EpisodeInfo[];
}

export interface TmdbReviewExcerpt {
  id: string;
  author: string;
  rating?: number | null;
  content: string;
  createdAt?: string;
  url?: string;
}

export interface CatalogItem {
  id: string;
  tmdbId: string;
  /** AniList id — used by the anime audio/subtitle provider (sub + dub). */
  anilistId?: number;
  tmdbMediaType: "movie" | "tv";
  type: MediaType;
  title: string;
  tagline: string;
  overview: string;
  year: string;
  releaseDate: string;
  rating: number;
  runtime: string;
  maturity: string;
  quality: "4K" | "HD";
  status: string;
  country?: string;
  director?: string;
  posterUrl: string;
  backdropUrl: string;
  logoUrl?: string;
  genres: string[];
  moods: string[];
  studio?: string;
  audioBadge?: string;
  providers: {
    stream: string[];
    rent: string[];
    buy: string[];
    free?: string[];
  };
  liveProviders?: {
    stream: Array<{ id: number; name: string; logoUrl: string; slug?: string }>;
    rent: Array<{ id: number; name: string; logoUrl: string; slug?: string }>;
    buy: Array<{ id: number; name: string; logoUrl: string; slug?: string }>;
  };
  cast: CastMember[];
  seasons?: SeasonInfo[];
  tmdbReviews?: TmdbReviewExcerpt[];
  recommendations?: CatalogItem[];
  featuredHero?: boolean;
  trendingRank?: number;
  isHotToday?: boolean;
  isNewRelease?: boolean;
}

export interface LiveChannel {
  id: string;
  name: string;
  category: string;
  streamUrl: string;
  logoText: string;
  accent: string;
  country: string;
  quality: string;
  currentShow: string;
  nextShow: string;
  viewers: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "netflix",
    tmdbProviderId: 8,
    name: "Netflix",
    shortName: "Netflix",
    logoUrl: "https://image.tmdb.org/t/p/w185/rK1KljqmbvO9HQa1PBFLILWah72.png",
    monthlyPrice: 15.49,
    tierLabel: "4K Spatial",
    accent: "#e50914",
    tagline: "Global blockbusters, prestige series & anime originals",
    type: "subscription",
  },
  {
    id: "prime",
    tmdbProviderId: 9,
    name: "Prime Video",
    shortName: "Prime Video",
    logoUrl: "https://image.tmdb.org/t/p/w185/gMZdpavHmxFNnLpMHwVxfqeux2g.png",
    monthlyPrice: 14.99,
    tierLabel: "4K HDR10+",
    accent: "#00a8e1",
    tagline: "Hit originals, theatrical releases & global cinema",
    type: "subscription",
  },
  {
    id: "disney",
    tmdbProviderId: 337,
    name: "Disney+",
    shortName: "Disney+",
    logoUrl: "https://image.tmdb.org/t/p/w185/5eZ872CghnHFLB1j8grszbrx0dx.png",
    monthlyPrice: 13.99,
    tierLabel: "IMAX 4K",
    accent: "#2586d9",
    tagline: "Marvel, Star Wars, Pixar & 20th Century Studios",
    type: "subscription",
  },
  {
    id: "apple-tv",
    tmdbProviderId: 350,
    name: "Apple TV+",
    shortName: "Apple TV+",
    logoUrl: "https://image.tmdb.org/t/p/w185/9icYBfYFcwgCbky5VdGUIKJ4C5i.png",
    monthlyPrice: 9.99,
    tierLabel: "4K Dolby Vision",
    accent: "#adb2bb",
    tagline: "Acclaimed sci-fi, espionage thrillers & Apple Originals",
    type: "subscription",
  },
  {
    id: "max",
    tmdbProviderId: 1899,
    name: "Max",
    shortName: "Max",
    logoUrl: "https://image.tmdb.org/t/p/w185/skypuy7SXuugIQeYg0IglmzoKaS.png",
    monthlyPrice: 16.99,
    tierLabel: "4K Atmos",
    accent: "#7352d6",
    tagline: "HBO prestige dramas, Warner Bros. & DC universe",
    type: "subscription",
  },
  {
    id: "hulu",
    tmdbProviderId: 15,
    name: "Hulu",
    shortName: "Hulu",
    logoUrl: "https://image.tmdb.org/t/p/w185/44uAnmSqvA4yBOdbPWN8YgQHjWm.png",
    monthlyPrice: 9.99,
    tierLabel: "FX & Originals",
    accent: "#1ce783",
    tagline: "FX prestige series, next-day TV & hit films",
    type: "subscription",
  },
  {
    id: "peacock",
    tmdbProviderId: 386,
    name: "Peacock",
    shortName: "Peacock",
    logoUrl: "https://image.tmdb.org/t/p/w185/yrEwyMzEKdqAoGhaWUARtIxByol.png",
    monthlyPrice: 11.99,
    tierLabel: "4K UHD",
    accent: "#a37bb8",
    tagline: "Universal theatrical hits, NBC series & live sports",
    type: "subscription",
  },
  {
    id: "crunchyroll",
    tmdbProviderId: 283,
    name: "Crunchyroll",
    shortName: "Crunchyroll",
    logoUrl: "https://image.tmdb.org/t/p/w185/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png",
    monthlyPrice: 7.99,
    tierLabel: "Simulcast HD",
    accent: "#f47521",
    tagline: "Same-day Japan simulcasts, shonen epics & anime films",
    type: "subscription",
  },
  {
    id: "mubi",
    tmdbProviderId: 11,
    name: "MUBI",
    shortName: "MUBI",
    logoUrl: "https://image.tmdb.org/t/p/w185/k7iSlvgWzZuO4zU5PcBjhABMuia.png",
    monthlyPrice: 14.99,
    tierLabel: "Curated HD",
    accent: "#4f46e5",
    tagline: "Hand-picked auteur cinema, festival winners & restorations",
    type: "subscription",
  },
  {
    id: "mgm",
    tmdbProviderId: 636,
    name: "MGM+",
    shortName: "MGM+",
    logoUrl: "https://image.tmdb.org/t/p/w185/q63Uzpu7JAs566vA2G23Lk7LcID.png",
    monthlyPrice: 6.99,
    tierLabel: "HD Ad-Free",
    accent: "#d97706",
    tagline: "Hollywood classics, noir thrillers & original series",
    type: "subscription",
  },
  {
    id: "pluto",
    tmdbProviderId: 300,
    name: "Pluto TV",
    shortName: "Pluto TV",
    logoUrl: "https://image.tmdb.org/t/p/w185/fN4czqaMQNLeF6sSSIjGbAWzvwK.png",
    monthlyPrice: 0,
    tierLabel: "Free FAST",
    accent: "#facc15",
    tagline: "100% free streaming movies, series & 24/7 channels",
    type: "free",
  },
  {
    id: "apple-store",
    tmdbProviderId: 2,
    name: "Apple TV Store",
    shortName: "Apple Store",
    logoUrl: "https://image.tmdb.org/t/p/w185/qdEGArH3lKfFnAtYXMkSYk5wxuG.png",
    monthlyPrice: 0,
    tierLabel: "4K VOD",
    accent: "#94a3b8",
    tagline: "Digital rentals & 4K Dolby Vision ownership",
    type: "store",
  },
  {
    id: "amazon-video",
    tmdbProviderId: 10,
    name: "Amazon Video",
    shortName: "Amazon Store",
    logoUrl: "https://image.tmdb.org/t/p/w185/jn6TLbtaTZntTRX9UYucHJvpQx1.png",
    monthlyPrice: 0,
    tierLabel: "4K VOD",
    accent: "#38bdf8",
    tagline: "Digital movie & series rentals on demand",
    type: "store",
  },
  {
    id: "google-play",
    tmdbProviderId: 3,
    name: "Google Play Movies",
    shortName: "Google TV",
    logoUrl: "https://image.tmdb.org/t/p/w185/aZRENwYILujqs0RVOZutTh0BVGV.png",
    monthlyPrice: 0,
    tierLabel: "4K VOD",
    accent: "#34d399",
    tagline: "Stream rentals across Android & Smart TVs",
    type: "store",
  },
  {
    id: "fandango",
    tmdbProviderId: 7,
    name: "Fandango At Home",
    shortName: "Fandango",
    logoUrl: "https://image.tmdb.org/t/p/w185/wpOt6x0dRxTrIzuBosto4LGd7E9.png",
    monthlyPrice: 0,
    tierLabel: "4K UHD",
    accent: "#fb7185",
    tagline: "Home premiere rentals & digital bundles",
    type: "store",
  },
];

export const PROVIDER_MAP: Record<string, ProviderInfo> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
);

export const TMDB_PROVIDER_SLUG_MAP: Record<number, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.tmdbProviderId, p.id])
);

export const LIVE_TV_CHANNELS: LiveChannel[] = [
  {
    id: "nasa-live",
    name: "NASA Space Live (ISS & Artemis)",
    category: "Space & Science",
    streamUrl:
      "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    logoText: "NASA",
    accent: "from-red-600 to-rose-700",
    country: "US",
    quality: "1080p60 HLS",
    currentShow: "Live Earth Views from the International Space Station",
    nextShow: "Artemis Mission Control Briefing",
    viewers: "18.4K",
  },
  {
    id: "redbull-tv",
    name: "Red Bull TV Live",
    category: "Sports & Racing",
    streamUrl:
      "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    logoText: "RB",
    accent: "from-red-600 to-amber-600",
    country: "Global",
    quality: "1080p60 HLS",
    currentShow: "World Rally Championship & Cliff Diving Finals",
    nextShow: "Red Bull Rampage Freeride Showcase",
    viewers: "24.9K",
  },
  {
    id: "cbs-news",
    name: "CBS News Live 24/7",
    category: "News",
    streamUrl:
      "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8",
    logoText: "CBS",
    accent: "from-neutral-700 to-neutral-900",
    country: "US",
    quality: "1080p HLS",
    currentShow: "CBS News Prime: Breaking Global Coverage",
    nextShow: "60 Minutes Special Report",
    viewers: "31.1K",
  },
  {
    id: "bloomberg-tv",
    name: "Bloomberg Tech & Markets Live",
    category: "Finance & Tech",
    streamUrl:
      "https://liveproduseast.global.ssl.fastly.net/us/Channel-USTV-AWS-virginia-1/Source-USTV-1000-1_live.m3u8",
    logoText: "BBG",
    accent: "from-neutral-700 to-neutral-900",
    country: "US",
    quality: "1080p HLS",
    currentShow: "Bloomberg Technology: Global Markets & AI",
    nextShow: "Wall Street Closing Bell",
    viewers: "19.7K",
  },
  {
    id: "pbs-kids",
    name: "PBS Kids Live (Free Broadcast)",
    category: "Kids & Family",
    streamUrl:
      "https://2-fss-2.streamhoster.com/pl_140/amlst:200914-1298290/playlist.m3u8",
    logoText: "PBS",
    accent: "from-emerald-600 to-teal-700",
    country: "US",
    quality: "1080p HLS",
    currentShow: "Wild Kratts: Deep Sea Expedition",
    nextShow: "Odd Squad & Arthur Marathon",
    viewers: "14.2K",
  },
  {
    id: "dw-english",
    name: "DW International News HD",
    category: "News",
    streamUrl:
      "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    logoText: "DW",
    accent: "from-neutral-700 to-neutral-900",
    country: "Global",
    quality: "1080p HLS",
    currentShow: "World Headlines Live",
    nextShow: "Shift: Future of Science & Tech",
    viewers: "9.8K",
  },
  {
    id: "france24",
    name: "France 24 English Global",
    category: "News",
    streamUrl:
      "https://live.france24.com/hls/live/2037218-b/F24_EN_HI_HLS/master_5000.m3u8",
    logoText: "F24",
    accent: "from-neutral-700 to-neutral-900",
    country: "Global",
    quality: "1080p 5Mbps",
    currentShow: "World Desk & Cinema Culture",
    nextShow: "International Arts & Film",
    viewers: "11.3K",
  },
  {
    id: "cgtn-doc",
    name: "Earth & Wild Documentary 24/7",
    category: "Documentary",
    streamUrl: "https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8",
    logoText: "DOC",
    accent: "from-emerald-700 to-neutral-900",
    country: "Global",
    quality: "1080p HLS",
    currentShow: "Hidden Wonders of Nature",
    nextShow: "Ancient Civilizations",
    viewers: "8.6K",
  },
];

export const ALL_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
];

function makeSeasons(
  count: number,
  epsPerSeason: number,
  startYear: number,
  titles: string[],
  stillUrl: string
): SeasonInfo[] {
  return Array.from({ length: count }, (_, sIdx) => {
    const seasonNumber = sIdx + 1;
    return {
      seasonNumber,
      name: `Season ${seasonNumber}`,
      episodeCount: epsPerSeason,
      year: String(startYear + sIdx),
      episodes: Array.from({ length: Math.min(epsPerSeason, 12) }, (__, eIdx) => {
        const epNum = eIdx + 1;
        const baseTitle =
          titles[(sIdx * 3 + eIdx) % titles.length] || `Episode ${epNum}`;
        return {
          number: epNum,
          title:
            sIdx === 0 && titles[eIdx]
              ? titles[eIdx]
              : `${baseTitle} (Ep ${epNum})`,
          duration: `${44 + ((eIdx * 5) % 16)}m`,
          overview: `Season ${seasonNumber}, Episode ${epNum}. Stream instantly in HD via VidCore.`,
          airDate: `${startYear + sIdx}-0${((eIdx % 8) + 1)}-1${eIdx % 9}`,
          rating: Number((8.2 + ((eIdx * 3 + sIdx) % 15) * 0.1).toFixed(1)),
          stillUrl,
        };
      }),
    };
  });
}

// 100% TMDB-ONLY POSTERS & BACKDROPS (image.tmdb.org EXCLUSIVELY)
export const CATALOG_MEDIA: CatalogItem[] = [
  {
    id: "693134",
    tmdbId: "693134",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    overview:
      "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    year: "2024",
    releaseDate: "2024-03-01",
    rating: 8.4,
    runtime: "2h 47m",
    maturity: "PG-13",
    quality: "4K",
    status: "Released",
    country: "United States, Canada",
    director: "Denis Villeneuve",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    genres: ["Science Fiction", "Adventure", "Action"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "Warner Bros. · Legendary",
    providers: {
      stream: ["max", "netflix"],
      rent: ["apple-store", "amazon-video", "fandango"],
      buy: ["apple-store", "amazon-video", "google-play"],
    },
    cast: [
      { name: "Timothée Chalamet", character: "Paul Atreides" },
      { name: "Zendaya", character: "Chani" },
      { name: "Rebecca Ferguson", character: "Lady Jessica" },
      { name: "Javier Bardem", character: "Stilgar" },
      { name: "Austin Butler", character: "Feyd-Rautha" },
      { name: "Florence Pugh", character: "Princess Irulan" },
    ],
    featuredHero: true,
    trendingRank: 1,
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "533535",
    tmdbId: "533535",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Deadpool & Wolverine",
    tagline: "Come together.",
    overview:
      "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must suit-up again alongside Wolverine.",
    year: "2024",
    releaseDate: "2024-07-26",
    rating: 7.8,
    runtime: "2h 08m",
    maturity: "R",
    quality: "4K",
    status: "Released",
    country: "United States",
    director: "Shawn Levy",
    posterUrl: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/ufpeVEM64uZHPpzzeiDNIAdaeOD.jpg",
    genres: ["Action", "Comedy", "Science Fiction"],
    moods: ["epic-worlds"],
    studio: "Marvel Studios",
    providers: {
      stream: ["disney"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play", "fandango"],
    },
    cast: [
      { name: "Ryan Reynolds", character: "Wade Wilson / Deadpool" },
      { name: "Hugh Jackman", character: "Logan / Wolverine" },
      { name: "Emma Corrin", character: "Cassandra Nova" },
      { name: "Matthew Macfadyen", character: "Mr. Paradox" },
    ],
    featuredHero: true,
    trendingRank: 2,
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "95396",
    tmdbId: "95396",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Severance",
    tagline: "Please try to enjoy each episode equally.",
    overview:
      "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the unsettling truth about Lumon.",
    year: "2022",
    releaseDate: "2022-02-18",
    rating: 8.7,
    runtime: "2 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    country: "United States",
    director: "Ben Stiller · Dan Erickson",
    posterUrl: "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg",
    genres: ["Science Fiction", "Mystery", "Thriller", "Drama"],
    moods: ["mind-bending", "dark-thriller", "masterpiece"],
    studio: "Apple TV+",
    providers: {
      stream: ["apple-tv"],
      rent: [],
      buy: ["apple-store"],
    },
    cast: [
      { name: "Adam Scott", character: "Mark Scout" },
      { name: "Britt Lower", character: "Helly Riggs" },
      { name: "Zach Cherry", character: "Dylan George" },
      { name: "John Turturro", character: "Irving Bailiff" },
      { name: "Patricia Arquette", character: "Harmony Cobel" },
    ],
    seasons: makeSeasons(
      2,
      10,
      2022,
      [
        "Good News About Hell",
        "Half Loop",
        "In Perpetuity",
        "The You You Are",
        "The Grim Barbarity of Optics and Design",
        "Hide and Seek",
        "Defiant Jazz",
        "What's for Dinner?",
        "The We We Are",
        "Cold Harbor",
      ],
      "https://image.tmdb.org/t/p/w300/ixgFmf1X59PUZam2qbAfskx2gQr.jpg"
    ),
    featuredHero: true,
    trendingRank: 3,
    isHotToday: true,
  },
  {
    id: "872585",
    tmdbId: "872585",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Oppenheimer",
    tagline: "The world forever changes.",
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, and the political fallout that followed.",
    year: "2023",
    releaseDate: "2023-07-21",
    rating: 8.3,
    runtime: "3h 01m",
    maturity: "R",
    quality: "4K",
    status: "Released",
    country: "United States, United Kingdom",
    director: "Christopher Nolan",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg",
    genres: ["Drama", "Thriller"],
    moods: ["masterpiece", "dark-thriller"],
    studio: "Universal Pictures · Syncopy",
    providers: {
      stream: ["peacock", "prime"],
      rent: ["apple-store", "amazon-video", "fandango"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Cillian Murphy", character: "J. Robert Oppenheimer" },
      { name: "Emily Blunt", character: "Kitty Oppenheimer" },
      { name: "Matt Damon", character: "Leslie Groves" },
      { name: "Robert Downey Jr.", character: "Lewis Strauss" },
    ],
    featuredHero: true,
    trendingRank: 4,
    isHotToday: true,
  },
  {
    id: "911430",
    tmdbId: "911430",
    tmdbMediaType: "movie",
    type: "movie",
    title: "F1",
    tagline: "Built for combat on the world's fastest circuits.",
    overview:
      "Veteran Formula One driver Sonny Hayes comes out of retirement to mentor rookie prodigy Joshua Pearce on the struggling APXGP grid, risking everything at 220 mph.",
    year: "2025",
    releaseDate: "2025-06-27",
    rating: 8.2,
    runtime: "2h 35m",
    maturity: "PG-13",
    quality: "4K",
    status: "Released",
    country: "United States",
    director: "Joseph Kosinski",
    posterUrl: "https://image.tmdb.org/t/p/w500/vqBmyAj0Xm9LnS1xe1MSlMAJyHq.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/rZWkXnIyTLzUJpHSUpOb7vgB0BL.jpg",
    genres: ["Action", "Drama"],
    moods: ["epic-worlds"],
    studio: "Apple Original Films · Warner Bros.",
    providers: {
      stream: ["apple-tv"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Brad Pitt", character: "Sonny Hayes" },
      { name: "Damson Idris", character: "Joshua Pearce" },
      { name: "Javier Bardem", character: "Ruben Cervantes" },
    ],
    featuredHero: true,
    trendingRank: 5,
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "1184918",
    tmdbId: "1184918",
    tmdbMediaType: "movie",
    type: "movie",
    title: "The Wild Robot",
    tagline: "Discover your true nature.",
    overview:
      "After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island. To survive the harsh environment, Roz bonds with the island's animals and cares for an orphaned baby goose.",
    year: "2024",
    releaseDate: "2024-09-27",
    rating: 8.5,
    runtime: "1h 42m",
    maturity: "PG",
    quality: "4K",
    status: "Released",
    country: "United States",
    director: "Chris Sanders",
    posterUrl: "https://image.tmdb.org/t/p/w500/eG9lz41mJqsI4J6ubMtVqD26q2J.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/mQZJoIhTEkNhCYAqcHrQqhENLdu.jpg",
    genres: ["Animation", "Science Fiction", "Family", "Adventure"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "DreamWorks Animation",
    providers: {
      stream: ["peacock", "netflix"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Lupita Nyong'o", character: "Roz (Voice)" },
      { name: "Pedro Pascal", character: "Fink (Voice)" },
      { name: "Kit Connor", character: "Brightbill (Voice)" },
    ],
    featuredHero: true,
    trendingRank: 6,
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "945961",
    tmdbId: "945961",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Alien: Romulus",
    tagline: "In space, no one can hear you.",
    overview:
      "While scavenging the deep ends of a derelict space station, a group of young space colonists come face to face with the most terrifying life form in the universe.",
    year: "2024",
    releaseDate: "2024-08-16",
    rating: 7.5,
    runtime: "1h 59m",
    maturity: "R",
    quality: "4K",
    status: "Released",
    country: "United States",
    director: "Fede Álvarez",
    posterUrl: "https://image.tmdb.org/t/p/w500/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/iYqSQaWDttQIQzsxg9xHyg0bttG.jpg",
    genres: ["Horror", "Science Fiction", "Thriller"],
    moods: ["dark-thriller"],
    studio: "20th Century Studios",
    providers: {
      stream: ["hulu", "disney"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "fandango"],
    },
    cast: [
      { name: "Cailee Spaeny", character: "Rain Carradine" },
      { name: "David Jonsson", character: "Andy" },
    ],
    trendingRank: 7,
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "558449",
    tmdbId: "558449",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Gladiator II",
    tagline: "Prepare to be entertained.",
    overview:
      "Years after witnessing the death of Maximus at the hands of his uncle, Lucius is forced to enter the Colosseum after his home is conquered by the tyrannical Emperors leading Rome.",
    year: "2024",
    releaseDate: "2024-11-22",
    rating: 7.4,
    runtime: "2h 28m",
    maturity: "R",
    quality: "4K",
    status: "Released",
    country: "United Kingdom, United States",
    director: "Ridley Scott",
    posterUrl: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/tOqIwliWMovSIZ9DyvHcHI7p2im.jpg",
    genres: ["Action", "Adventure", "Drama"],
    moods: ["epic-worlds"],
    studio: "Paramount Pictures",
    providers: {
      stream: ["prime", "mgm"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "fandango"],
    },
    cast: [
      { name: "Paul Mescal", character: "Lucius Verus" },
      { name: "Denzel Washington", character: "Macrinus" },
      { name: "Pedro Pascal", character: "Marcus Acacius" },
    ],
    trendingRank: 8,
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "1396",
    tmdbId: "1396",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Breaking Bad",
    tagline: "Remember my name.",
    overview:
      "Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and enters the dangerous world of crime to secure his family's financial future.",
    year: "2008",
    releaseDate: "2008-01-20",
    rating: 9.0,
    runtime: "5 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Ended",
    country: "United States",
    director: "Vince Gilligan",
    posterUrl: "https://image.tmdb.org/t/p/w500/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    genres: ["Drama", "Crime", "Thriller"],
    moods: ["dark-thriller", "masterpiece"],
    studio: "AMC",
    providers: {
      stream: ["netflix"],
      rent: [],
      buy: ["apple-store", "amazon-video"],
    },
    cast: [
      { name: "Bryan Cranston", character: "Walter White" },
      { name: "Aaron Paul", character: "Jesse Pinkman" },
      { name: "Anna Gunn", character: "Skyler White" },
      { name: "Bob Odenkirk", character: "Saul Goodman" },
    ],
    seasons: makeSeasons(
      5,
      10,
      2008,
      [
        "Pilot",
        "Cat's in the Bag...",
        "...And the Bag's in the River",
        "Cancer Man",
        "Gray Matter",
        "Crazy Handful of Nothin'",
        "A No-Rough-Stuff-Type Deal",
        "Seven Thirty-Seven",
        "Grilled",
        "Ozymandias",
      ],
      "https://image.tmdb.org/t/p/w300/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg"
    ),
    trendingRank: 9,
  },
  {
    id: "157336",
    tmdbId: "157336",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    overview:
      "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    year: "2014",
    releaseDate: "2014-11-07",
    rating: 8.7,
    runtime: "2h 49m",
    maturity: "PG-13",
    quality: "4K",
    status: "Released",
    country: "United States",
    director: "Christopher Nolan",
    posterUrl: "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
    genres: ["Adventure", "Drama", "Science Fiction"],
    moods: ["mind-bending", "epic-worlds", "masterpiece"],
    studio: "Paramount · Warner Bros.",
    providers: {
      stream: ["prime", "max", "netflix"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Matthew McConaughey", character: "Joseph Cooper" },
      { name: "Anne Hathaway", character: "Dr. Amelia Brand" },
      { name: "Jessica Chastain", character: "Murphy Cooper" },
    ],
    trendingRank: 10,
  },
  {
    id: "155",
    tmdbId: "155",
    tmdbMediaType: "movie",
    type: "movie",
    title: "The Dark Knight",
    tagline: "Why so serious?",
    overview:
      "Batman raises the stakes in his war on crime with Lt. Jim Gordon and DA Harvey Dent—until the Joker plunges Gotham into chaos.",
    year: "2008",
    releaseDate: "2008-07-16",
    rating: 8.5,
    runtime: "2h 32m",
    maturity: "PG-13",
    quality: "4K",
    status: "Released",
    country: "United States",
    director: "Christopher Nolan",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg",
    genres: ["Action", "Crime", "Drama", "Thriller"],
    moods: ["dark-thriller", "masterpiece"],
    studio: "Warner Bros. Pictures",
    providers: {
      stream: ["max", "netflix"],
      rent: ["apple-store", "amazon-video", "google-play"],
      buy: ["apple-store", "amazon-video", "fandango"],
    },
    cast: [
      {
        name: "Christian Bale",
        character: "Bruce Wayne / Batman",
        photoUrl: "https://image.tmdb.org/t/p/w185/7Pxez9J8fuPd2Mn9kex13YALrCQ.jpg",
      },
      {
        name: "Heath Ledger",
        character: "The Joker",
        photoUrl: "https://image.tmdb.org/t/p/w185/p2z2bURSg7nuMsN9P2s61e2RvNz.jpg",
      },
      {
        name: "Aaron Eckhart",
        character: "Harvey Dent",
        photoUrl: "https://image.tmdb.org/t/p/w185/u5JjnRMr9zKEVvOP7k3F6gdcwT6.jpg",
      },
      {
        name: "Gary Oldman",
        character: "Jim Gordon",
        photoUrl: "https://image.tmdb.org/t/p/w185/2v9FVVBUrrkW2m3QOcYkuhq9A6o.jpg",
      },
    ],
  },
  {
    id: "1234821",
    tmdbId: "1234821",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Jurassic World Rebirth",
    tagline: "A new era is born.",
    overview:
      "Covert operations expert Zora Bennett leads a skilled team on a top-secret mission to secure genetic material from the world's three most massive dinosaurs on a forbidden island.",
    year: "2025",
    releaseDate: "2025-07-02",
    rating: 7.6,
    runtime: "2h 14m",
    maturity: "PG-13",
    quality: "4K",
    status: "Released",
    director: "Gareth Edwards",
    posterUrl: "https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/zNriRTr0kWwyaXPzdg1EIxf0BWk.jpg",
    genres: ["Action", "Adventure", "Science Fiction"],
    moods: ["epic-worlds"],
    studio: "Universal Pictures",
    providers: {
      stream: ["peacock"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Scarlett Johansson", character: "Zora Bennett" },
      { name: "Mahershala Ali", character: "Duncan Kincaid" },
      { name: "Jonathan Bailey", character: "Dr. Henry Loomis" },
    ],
    isHotToday: true,
    isNewRelease: true,
  },
  {
    id: "402431",
    tmdbId: "402431",
    tmdbMediaType: "movie",
    type: "movie",
    title: "Wicked",
    tagline: "Everyone deserves the chance to fly.",
    overview:
      "In the land of Oz, ostracized green-skinned Elphaba shares a room with Glinda at Shiz University as their friendship is tested by destiny.",
    year: "2024",
    releaseDate: "2024-11-22",
    rating: 7.7,
    runtime: "2h 40m",
    maturity: "PG",
    quality: "4K",
    status: "Released",
    director: "Jon M. Chu",
    posterUrl: "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg",
    genres: ["Fantasy", "Romance", "Drama"],
    moods: ["epic-worlds"],
    studio: "Universal Pictures",
    providers: {
      stream: ["peacock", "prime"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "fandango"],
    },
    cast: [
      { name: "Cynthia Erivo", character: "Elphaba" },
      { name: "Ariana Grande", character: "Glinda" },
    ],
  },
  {
    id: "278",
    tmdbId: "278",
    tmdbMediaType: "movie",
    type: "movie",
    title: "The Shawshank Redemption",
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    overview:
      "Imprisoned in the 1940s for a double murder he did not commit, banker Andy Dufresne begins an unforgettable quarter-century friendship inside Shawshank.",
    year: "1994",
    releaseDate: "1994-09-23",
    rating: 8.7,
    runtime: "2h 22m",
    maturity: "R",
    quality: "4K",
    status: "Released",
    director: "Frank Darabont",
    posterUrl: "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    genres: ["Drama", "Crime"],
    moods: ["masterpiece"],
    studio: "Castle Rock",
    providers: {
      stream: ["max"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Tim Robbins", character: "Andy Dufresne" },
      { name: "Morgan Freeman", character: "Ellis Boyd 'Red' Redding" },
    ],
  },
  {
    id: "238",
    tmdbId: "238",
    tmdbMediaType: "movie",
    type: "movie",
    title: "The Godfather",
    tagline: "An offer you can't refuse.",
    overview:
      "Spanning 1945 to 1955, a chronicle of the Corleone crime dynasty as reluctant war hero Michael Corleone is drawn into his family's empire.",
    year: "1972",
    releaseDate: "1972-03-14",
    rating: 8.7,
    runtime: "2h 55m",
    maturity: "R",
    quality: "4K",
    status: "Released",
    director: "Francis Ford Coppola",
    posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    genres: ["Drama", "Crime"],
    moods: ["masterpiece"],
    studio: "Paramount Pictures",
    providers: {
      stream: ["prime", "pluto"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "fandango"],
      free: ["pluto"],
    },
    cast: [
      { name: "Marlon Brando", character: "Don Vito Corleone" },
      { name: "Al Pacino", character: "Michael Corleone" },
    ],
  },
  // --- TV SHOWS (100% TMDB POSTERS) ---
  {
    id: "1399",
    tmdbId: "1399",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Game of Thrones",
    tagline: "When you play the game of thrones, you win or you die.",
    overview:
      "Seven noble families fight for control of Westeros while an ancient evil awakens beyond the Wall in the farthest north.",
    year: "2011",
    releaseDate: "2011-04-17",
    rating: 8.5,
    runtime: "8 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Ended",
    director: "David Benioff · D. B. Weiss",
    posterUrl: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/zZqpAXxVSBtxV9qPBcscfXBcL2w.jpg",
    genres: ["Fantasy", "Drama", "Action", "Adventure"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "HBO",
    providers: {
      stream: ["max"],
      rent: [],
      buy: ["amazon-video", "apple-store", "google-play"],
    },
    cast: [
      {
        name: "Peter Dinklage",
        character: "Tyrion Lannister",
        photoUrl: "https://image.tmdb.org/t/p/w185/9CAd7wr8QZyIN0E7nm8v1B6WkGn.jpg",
      },
      {
        name: "Kit Harington",
        character: "Jon Snow",
        photoUrl: "https://image.tmdb.org/t/p/w185/iGXlJbExWwZmo9sUDsYuzf4Sv4y.jpg",
      },
      {
        name: "Emilia Clarke",
        character: "Daenerys Targaryen",
        photoUrl: "https://image.tmdb.org/t/p/w185/iFY6t7Ux9r70WB7Sp0TTVz6eGtm.jpg",
      },
      {
        name: "Lena Headey",
        character: "Cersei Lannister",
        photoUrl: "https://image.tmdb.org/t/p/w185/cDyZLf8ddz0EgoUjpv4jjzy7qxA.jpg",
      },
    ],
    seasons: makeSeasons(
      8,
      10,
      2011,
      [
        "Winter Is Coming",
        "The Kingsroad",
        "Lord Snow",
        "Cripples, Bastards, and Broken Things",
        "The Wolf and the Lion",
        "A Golden Crown",
        "You Win or You Die",
        "The Pointy End",
        "Baelor",
        "Fire and Blood",
      ],
      "https://image.tmdb.org/t/p/w300/zZqpAXxVSBtxV9qPBcscfXBcL2w.jpg"
    ),
  },
  {
    id: "100088",
    tmdbId: "100088",
    tmdbMediaType: "tv",
    type: "tv",
    title: "The Last of Us",
    tagline: "When you're lost in the darkness, look for the light.",
    overview:
      "Twenty years after modern civilization has been destroyed, hardened survivor Joel is hired to smuggle 14-year-old Ellie across a post-pandemic America.",
    year: "2023",
    releaseDate: "2023-01-15",
    rating: 8.6,
    runtime: "2 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    director: "Craig Mazin · Neil Druckmann",
    posterUrl: "https://image.tmdb.org/t/p/w500/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg",
    genres: ["Drama", "Action", "Science Fiction"],
    moods: ["dark-thriller", "epic-worlds"],
    studio: "HBO",
    providers: {
      stream: ["max"],
      rent: [],
      buy: ["apple-store", "amazon-video"],
    },
    cast: [
      { name: "Pedro Pascal", character: "Joel Miller" },
      { name: "Bella Ramsey", character: "Ellie Williams" },
    ],
    seasons: makeSeasons(
      2,
      9,
      2023,
      [
        "When You're Lost in the Darkness",
        "Infected",
        "Long, Long Time",
        "Please Hold to My Hand",
        "Endure and Survive",
        "Kin",
        "Left Behind",
        "When We Are in Need",
        "Look for the Light",
      ],
      "https://image.tmdb.org/t/p/w300/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg"
    ),
    isHotToday: true,
  },
  {
    id: "93405",
    tmdbId: "93405",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Squid Game",
    tagline: "45.6 billion won is child's play.",
    overview:
      "Hundreds of cash-strapped players accept a strange invitation to compete in children's games with deadly high stakes.",
    year: "2021",
    releaseDate: "2021-09-17",
    rating: 8.1,
    runtime: "2 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    director: "Hwang Dong-hyuk",
    posterUrl: "https://image.tmdb.org/t/p/w500/1QdXdRYfktUSONkl1oD5gc6Be0s.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/2meX1nMdScFOoV4370rqHWKmXhY.jpg",
    genres: ["Action", "Mystery", "Drama", "Thriller"],
    moods: ["dark-thriller"],
    studio: "Netflix",
    providers: { stream: ["netflix"], rent: [], buy: [] },
    cast: [
      { name: "Lee Jung-jae", character: "Seong Gi-hun" },
      { name: "Lee Byung-hun", character: "Front Man" },
    ],
    seasons: makeSeasons(
      2,
      8,
      2021,
      [
        "Red Light, Green Light",
        "Hell",
        "The Man with the Umbrella",
        "Stick to the Team",
        "A Fair World",
        "Gganbu",
        "VIPs",
        "Front Man",
      ],
      "https://image.tmdb.org/t/p/w300/2meX1nMdScFOoV4370rqHWKmXhY.jpg"
    ),
  },
  {
    id: "94605",
    tmdbId: "94605",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Arcane",
    tagline: "Every legend has a beginning.",
    overview:
      "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
    year: "2021",
    releaseDate: "2021-11-06",
    rating: 8.8,
    runtime: "2 Seasons",
    maturity: "TV-14",
    quality: "4K",
    status: "Ended",
    director: "Christian Linke · Fortiche",
    posterUrl: "https://image.tmdb.org/t/p/w500/87C0wecB8bHb1PsrKBI4kJiEkgV.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg",
    genres: ["Animation", "Action", "Science Fiction", "Fantasy"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "Fortiche · Netflix",
    providers: { stream: ["netflix"], rent: [], buy: [] },
    cast: [
      { name: "Hailee Steinfeld", character: "Vi" },
      { name: "Ella Purnell", character: "Jinx" },
    ],
    seasons: makeSeasons(
      2,
      9,
      2021,
      [
        "Welcome to the Playground",
        "Some Mysteries Are Better Left Unsolved",
        "The Base Violence Necessary for Change",
        "Happy Progress Day!",
      ],
      "https://image.tmdb.org/t/p/w300/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg"
    ),
  },
  {
    id: "95480",
    tmdbId: "95480",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Slow Horses",
    tagline: "MI5's rejects are Britain's sharpest last line of defense.",
    overview:
      "Follow a dysfunctional team of MI5 agents—and their irascible boss Jackson Lamb—as they defend England from sinister espionage plots.",
    year: "2022",
    releaseDate: "2022-04-01",
    rating: 8.6,
    runtime: "4 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    director: "Will Smith",
    posterUrl: "https://image.tmdb.org/t/p/w500/AdYr4DjOgXvDUMwu6vEhZy1Rnxk.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/AdYr4DjOgXvDUMwu6vEhZy1Rnxk.jpg",
    genres: ["Thriller", "Crime", "Drama", "Mystery"],
    moods: ["dark-thriller", "masterpiece"],
    studio: "Apple TV+",
    providers: { stream: ["apple-tv"], rent: [], buy: [] },
    cast: [
      { name: "Gary Oldman", character: "Jackson Lamb" },
      { name: "Jack Lowden", character: "River Cartwright" },
    ],
    seasons: makeSeasons(
      4,
      6,
      2022,
      [
        "Failure's Contagious",
        "Work Drinks",
        "Bad Tradecraft",
        "Visiting Hours",
        "Fiasco",
        "Follies",
      ],
      "https://image.tmdb.org/t/p/w300/AdYr4DjOgXvDUMwu6vEhZy1Rnxk.jpg"
    ),
  },
  {
    id: "136315",
    tmdbId: "136315",
    tmdbMediaType: "tv",
    type: "tv",
    title: "The Bear",
    tagline: "Every second counts.",
    overview:
      "Carmy, a young fine-dining chef, comes home to Chicago to run his family sandwich shop alongside a rough-around-the-edges kitchen crew.",
    year: "2022",
    releaseDate: "2022-06-23",
    rating: 8.5,
    runtime: "3 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    director: "Christopher Storer",
    posterUrl: "https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg",
    genres: ["Drama", "Comedy"],
    moods: ["masterpiece"],
    studio: "FX · Hulu",
    providers: { stream: ["hulu", "disney"], rent: [], buy: ["apple-store"] },
    cast: [
      { name: "Jeremy Allen White", character: "Carmen 'Carmy' Berzatto" },
      { name: "Ayo Edebiri", character: "Sydney Adamu" },
    ],
    seasons: makeSeasons(
      3,
      10,
      2022,
      ["System", "Hands", "Brigade", "Dogs", "Sheridan", "Fishes", "Forks"],
      "https://image.tmdb.org/t/p/w300/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg"
    ),
  },
  {
    id: "108978",
    tmdbId: "108978",
    tmdbMediaType: "tv",
    type: "tv",
    title: "Reacher",
    tagline: "Reacher said nothing.",
    overview:
      "When retired Military Police Officer Jack Reacher is arrested for a murder he did not commit, he uncovers a lethal small-town conspiracy.",
    year: "2022",
    releaseDate: "2022-02-04",
    rating: 8.1,
    runtime: "3 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    director: "Nick Santora",
    posterUrl: "https://image.tmdb.org/t/p/w500/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg",
    genres: ["Action", "Crime", "Thriller", "Drama"],
    moods: ["dark-thriller"],
    studio: "Prime Video",
    providers: {
      stream: ["prime"],
      rent: [],
      buy: ["apple-store", "amazon-video"],
    },
    cast: [{ name: "Alan Ritchson", character: "Jack Reacher" }],
    seasons: makeSeasons(
      3,
      8,
      2022,
      ["Welcome to Margrave", "First Dance", "Spoonful", "In a Tree"],
      "https://image.tmdb.org/t/p/w300/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg"
    ),
  },
  // --- ANIME (100% OFFICIAL TMDB POSTERS & BACKDROPS ONLY!) ---
  {
    id: "1429",
    tmdbId: "1429",
    anilistId: 16498,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Attack on Titan",
    tagline: "Beyond the walls lies the truth of freedom.",
    overview:
      "Several hundred years ago, humans were nearly exterminated by Titans. Survivors walled themselves inside towering concentric cities—until a Colossal Titan shatters the outer gate.",
    year: "2013",
    releaseDate: "2013-04-07",
    rating: 9.0,
    runtime: "4 Seasons · 89 Eps",
    maturity: "TV-MA",
    quality: "HD",
    status: "Ended",
    director: "Tetsurō Araki · Yuichiro Hayashi",
    posterUrl: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
    genres: ["Animation", "Action", "Drama", "Fantasy", "Mystery"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "Wit Studio · MAPPA",
    audioBadge: "SUB · DUB",
    providers: {
      stream: ["crunchyroll", "hulu"],
      rent: [],
      buy: ["apple-store", "amazon-video"],
    },
    cast: [
      { name: "Yuki Kaji", character: "Eren Yeager" },
      { name: "Yui Ishikawa", character: "Mikasa Ackerman" },
      { name: "Hiroshi Kamiya", character: "Levi Ackerman" },
    ],
    seasons: makeSeasons(
      4,
      22,
      2013,
      [
        "To You, in 2000 Years: The Fall of Shiganshina",
        "That Day",
        "A Dim Light Amid Despair",
        "First Battle",
      ],
      "https://image.tmdb.org/t/p/w300/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg"
    ),
  },
  {
    id: "85937",
    tmdbId: "85937",
    anilistId: 101922,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Demon Slayer: Kimetsu no Yaiba",
    tagline: "Sever the chains of tragedy with your blade.",
    overview:
      "Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon and his younger sister Nezuko turned into a demon herself.",
    year: "2019",
    releaseDate: "2019-04-06",
    rating: 8.7,
    runtime: "4 Seasons",
    maturity: "TV-MA",
    quality: "4K",
    status: "Returning Series",
    director: "Haruo Sotozaki",
    posterUrl: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/nTvM4mhqNlHIvUkI1gVnW6XP7GG.jpg",
    genres: ["Animation", "Action", "Fantasy"],
    moods: ["epic-worlds"],
    studio: "ufotable",
    audioBadge: "SUB · DUB",
    providers: {
      stream: ["crunchyroll", "netflix", "hulu"],
      rent: [],
      buy: ["apple-store", "amazon-video"],
    },
    cast: [
      { name: "Natsuki Hanae", character: "Tanjiro Kamado" },
      { name: "Akari Kitō", character: "Nezuko Kamado" },
    ],
    seasons: makeSeasons(
      4,
      12,
      2019,
      ["Cruelty", "Trainer Sakonji Urokodaki", "Sabito and Makomo", "Final Selection"],
      "https://image.tmdb.org/t/p/w300/nTvM4mhqNlHIvUkI1gVnW6XP7GG.jpg"
    ),
  },
  {
    id: "95479",
    tmdbId: "95479",
    anilistId: 113415,
    tmdbMediaType: "tv",
    type: "anime",
    title: "JUJUTSU KAISEN",
    tagline: "Curse each other, risk everything.",
    overview:
      "Yuji Itadori swallows a cursed talisman—the finger of Ryomen Sukuna—and enters Tokyo Jujutsu High to exorcise lethal curses.",
    year: "2020",
    releaseDate: "2020-10-03",
    rating: 8.6,
    runtime: "2 Seasons · 47 Eps",
    maturity: "TV-MA",
    quality: "HD",
    status: "Returning Series",
    director: "Sunghoo Park · Shōta Goshozono",
    posterUrl: "https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/qpin8cASXEVtwhzNsprHYFiOAGk.jpg",
    genres: ["Animation", "Action", "Fantasy"],
    moods: ["epic-worlds"],
    studio: "MAPPA",
    audioBadge: "SUB · DUB",
    providers: {
      stream: ["crunchyroll", "netflix"],
      rent: [],
      buy: ["apple-store", "amazon-video"],
    },
    cast: [
      { name: "Junya Enoki", character: "Yuji Itadori" },
      { name: "Yuichi Nakamura", character: "Satoru Gojo" },
    ],
    seasons: makeSeasons(
      2,
      24,
      2020,
      ["Ryomen Sukuna", "For Myself", "Girl of Steel", "Hidden Inventory"],
      "https://image.tmdb.org/t/p/w300/qpin8cASXEVtwhzNsprHYFiOAGk.jpg"
    ),
  },
  {
    id: "127532",
    tmdbId: "127532",
    anilistId: 151807,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Solo Leveling",
    tagline: "Arise from the weakest hunter of all mankind.",
    overview:
      "In a world where hunters battle deadly monsters inside dimensional gates, E-rank hunter Sung Jinwoo awakens a mysterious system that lets him level up without limit.",
    year: "2024",
    releaseDate: "2024-01-07",
    rating: 8.7,
    runtime: "2 Seasons",
    maturity: "TV-MA",
    quality: "HD",
    status: "Returning Series",
    director: "Shunsuke Nakashige",
    posterUrl: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",
    genres: ["Animation", "Action", "Fantasy", "Adventure"],
    moods: ["epic-worlds"],
    studio: "A-1 Pictures",
    audioBadge: "SUB · DUB",
    providers: { stream: ["crunchyroll"], rent: [], buy: [] },
    cast: [{ name: "Taito Ban", character: "Sung Jinwoo" }],
    seasons: makeSeasons(
      2,
      12,
      2024,
      ["I'm Used to It", "If I Had One More Chance", "It's Like a Game", "Arise"],
      "https://image.tmdb.org/t/p/w300/xMNH87maNLt9n2bMDYeI6db5VFm.jpg"
    ),
  },
  {
    id: "209867",
    tmdbId: "209867",
    anilistId: 154587,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Frieren: Beyond Journey's End",
    tagline: "What comes after the Demon King falls?",
    overview:
      "After a ten-year quest alongside hero Himmel defeats the Demon King, elven mage Frieren embarks on a poignant new journey to understand humanity.",
    year: "2023",
    releaseDate: "2023-09-29",
    rating: 9.0,
    runtime: "28 Episodes",
    maturity: "TV-14",
    quality: "HD",
    status: "Returning Series",
    director: "Keiichirō Saitō",
    posterUrl: "https://image.tmdb.org/t/p/w500/dqZENchTd7lp5zht7BdlqM7RBhD.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/rBOnrVlck7BIlGeWVlzYiZeg4l2.jpg",
    genres: ["Animation", "Adventure", "Fantasy", "Drama"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "Madhouse",
    audioBadge: "SUB · DUB",
    providers: { stream: ["crunchyroll", "netflix"], rent: [], buy: [] },
    cast: [{ name: "Atsumi Tanezaki", character: "Frieren" }],
    seasons: makeSeasons(
      1,
      28,
      2023,
      ["The Journey's End", "It Didn't Have to Be Magic...", "Killing Magic"],
      "https://image.tmdb.org/t/p/w300/rBOnrVlck7BIlGeWVlzYiZeg4l2.jpg"
    ),
  },
  {
    id: "31911",
    tmdbId: "31911",
    anilistId: 5114,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Fullmetal Alchemist: Brotherhood",
    tagline:
      "Humankind cannot gain anything without first giving something in return.",
    overview:
      "Brothers Edward and Alphonse Elric search for the Philosopher's Stone to restore their bodies after a catastrophic alchemical ritual.",
    year: "2009",
    releaseDate: "2009-04-05",
    rating: 9.1,
    runtime: "64 Episodes",
    maturity: "TV-14",
    quality: "HD",
    status: "Ended",
    director: "Yasuhiro Irie",
    posterUrl: "https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg",
    genres: ["Animation", "Action", "Adventure", "Fantasy"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "Bones",
    audioBadge: "SUB · DUB",
    providers: { stream: ["crunchyroll", "hulu"], rent: [], buy: [] },
    cast: [
      { name: "Romi Park", character: "Edward Elric" },
      { name: "Rie Kugimiya", character: "Alphonse Elric" },
    ],
    seasons: makeSeasons(
      1,
      64,
      2009,
      ["Fullmetal Alchemist", "The First Day", "City of Heresy"],
      "https://image.tmdb.org/t/p/w300/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg"
    ),
  },
  {
    id: "13916",
    tmdbId: "13916",
    anilistId: 1535,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Death Note",
    tagline: "The human whose name is written in this note shall die.",
    overview:
      "Prodigy student Light Yagami discovers a supernatural notebook dropped by a Shinigami and ignites a razor-sharp battle of wits against world-renowned detective L.",
    year: "2006",
    releaseDate: "2006-10-04",
    rating: 8.6,
    runtime: "37 Episodes",
    maturity: "TV-14",
    quality: "HD",
    status: "Ended",
    director: "Tetsurō Araki",
    posterUrl: "https://image.tmdb.org/t/p/w500/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/koBa94NxTaGe2FoDzlXMuJptsv0.jpg",
    genres: ["Animation", "Mystery", "Thriller"],
    moods: ["dark-thriller", "masterpiece"],
    studio: "Madhouse",
    audioBadge: "SUB · DUB",
    providers: {
      stream: ["netflix", "crunchyroll", "hulu", "pluto"],
      rent: [],
      buy: [],
      free: ["pluto"],
    },
    cast: [
      { name: "Mamoru Miyano", character: "Light Yagami" },
      { name: "Kappei Yamaguchi", character: "L" },
    ],
    seasons: makeSeasons(
      1,
      37,
      2006,
      ["Rebirth", "Confrontation", "Dealings", "Pursuit"],
      "https://image.tmdb.org/t/p/w300/koBa94NxTaGe2FoDzlXMuJptsv0.jpg"
    ),
  },
  {
    id: "105248",
    tmdbId: "105248",
    anilistId: 120377,
    tmdbMediaType: "tv",
    type: "anime",
    title: "Cyberpunk: Edgerunners",
    tagline: "In Night City, you become a legend on the edge.",
    overview:
      "A street kid trying to survive in a body-modification-obsessed city of the future chooses to stay alive by becoming a cyberpunk mercenary.",
    year: "2022",
    releaseDate: "2022-09-13",
    rating: 8.6,
    runtime: "10 Episodes",
    maturity: "TV-MA",
    quality: "4K",
    status: "Ended",
    director: "Hiroyuki Imaishi",
    posterUrl: "https://image.tmdb.org/t/p/w500/v3JuB15WybKmxDeT1hWdK3j6eSJ.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/v3JuB15WybKmxDeT1hWdK3j6eSJ.jpg",
    genres: ["Animation", "Science Fiction", "Action"],
    moods: ["masterpiece"],
    studio: "Studio Trigger",
    audioBadge: "SUB · DUB",
    providers: { stream: ["netflix"], rent: [], buy: [] },
    cast: [
      { name: "KENN", character: "David Martinez" },
      { name: "Aoi Yuuki", character: "Lucy" },
    ],
    seasons: makeSeasons(
      1,
      10,
      2022,
      ["Let You Down", "Like a Boy", "Smooth Criminal", "My Moon My Man"],
      "https://image.tmdb.org/t/p/w300/v3JuB15WybKmxDeT1hWdK3j6eSJ.jpg"
    ),
  },
  {
    id: "129",
    tmdbId: "129",
    anilistId: 199,
    tmdbMediaType: "movie",
    type: "anime",
    title: "Spirited Away",
    tagline: "Step across the river into Miyazaki's spirit world.",
    overview:
      "Ten-year-old Chihiro wanders into a world ruled by gods, witches, and spirits where humans are changed into beasts.",
    year: "2001",
    releaseDate: "2001-07-20",
    rating: 8.6,
    runtime: "2h 05m",
    maturity: "PG",
    quality: "HD",
    status: "Released",
    director: "Hayao Miyazaki",
    posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    genres: ["Animation", "Family", "Fantasy", "Adventure"],
    moods: ["epic-worlds", "masterpiece"],
    studio: "Studio Ghibli",
    audioBadge: "SUB · DUB",
    providers: {
      stream: ["max", "netflix"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [{ name: "Rumi Hiiragi", character: "Chihiro / Sen" }],
  },
  {
    id: "372058",
    tmdbId: "372058",
    anilistId: 21519,
    tmdbMediaType: "movie",
    type: "anime",
    title: "Your Name.",
    tagline: "Searching for someone you have never met.",
    overview:
      "High schoolers Mitsuha and Taki are complete strangers living separate lives—until one night they mysteriously begin switching places across time.",
    year: "2016",
    releaseDate: "2016-08-26",
    rating: 8.6,
    runtime: "1h 46m",
    maturity: "PG",
    quality: "4K",
    status: "Released",
    director: "Makoto Shinkai",
    posterUrl: "https://image.tmdb.org/t/p/w500/vfJFJPepRKapMd5G2ro7klIRysq.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/w1280/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg",
    genres: ["Animation", "Romance", "Drama", "Fantasy"],
    moods: ["masterpiece"],
    studio: "CoMix Wave Films",
    audioBadge: "SUB · DUB",
    providers: {
      stream: ["crunchyroll"],
      rent: ["apple-store", "amazon-video"],
      buy: ["apple-store", "google-play"],
    },
    cast: [
      { name: "Ryunosuke Kamiki", character: "Taki Tachibana" },
      { name: "Mone Kamishiraishi", character: "Mitsuha Miyamizu" },
    ],
  },
];

export function findCatalogItem(
  id: string,
  type?: string
): CatalogItem | undefined {
  return (
    CATALOG_MEDIA.find(
      (m) =>
        (m.id === id || m.tmdbId === id) &&
        (!type ||
          m.type === type ||
          m.tmdbMediaType === type ||
          (type === "tv" && m.type === "anime"))
    ) || CATALOG_MEDIA.find((m) => m.id === id || m.tmdbId === id)
  );
}

export function getHeroItems(): CatalogItem[] {
  return CATALOG_MEDIA.filter((m) => m.featuredHero);
}

export function getTopTenItems(): CatalogItem[] {
  return [...CATALOG_MEDIA]
    .filter((m) => m.trendingRank !== undefined)
    .sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99))
    .slice(0, 10);
}
