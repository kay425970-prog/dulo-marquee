import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export interface CollectionMediaEntry {
  mediaId: string;
  mediaType: "movie" | "tv" | "anime";
  title: string;
  posterUrl: string;
  year: string;
  rating: number;
}

export interface WatchPartyMessage {
  id: string;
  sender: string;
  avatarGradient: string;
  text: string;
  reaction?: string;
  timestamp: string;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  avatarGradient: text("avatar_gradient").notNull(),
  avatarEmoji: text("avatar_emoji").notNull(),
  bio: text("bio").notNull().default("Cinema & streaming enthusiast"),
  subscribedProviders: jsonb("subscribed_providers")
    .$type<string[]>()
    .notNull()
    .default([]),
  preferredGenres: jsonb("preferred_genres")
    .$type<string[]>()
    .notNull()
    .default([]),
  isKids: boolean("is_kids").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  mediaId: text("media_id").notNull(),
  mediaType: text("media_type").notNull(), // 'movie' | 'tv' | 'anime'
  title: text("title").notNull(),
  posterUrl: text("poster_url").notNull(),
  backdropUrl: text("backdrop_url").notNull().default(""),
  year: text("year").notNull().default("2026"),
  rating: text("rating").notNull().default("8.0"),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  inWatchlist: boolean("in_watchlist").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),
  progressPercent: integer("progress_percent").notNull().default(0),
  progressSeconds: integer("progress_seconds").notNull().default(0),
  lastSeason: integer("last_season").notNull().default(1),
  lastEpisode: integer("last_episode").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customCollections = pgTable("custom_collections", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  accentColor: text("accent_color").notNull().default("violet"),
  items: jsonb("items").$type<CollectionMediaEntry[]>().notNull().default([]),
  isPublic: boolean("is_public").notNull().default(true),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaReviews = pgTable("media_reviews", {
  id: serial("id").primaryKey(),
  mediaId: text("media_id").notNull(),
  mediaType: text("media_type").notNull(),
  profileName: text("profile_name").notNull(),
  avatarGradient: text("avatar_gradient").notNull(),
  rating: integer("rating").notNull(), // 1 - 10
  headline: text("headline").notNull(),
  comment: text("comment").notNull(),
  spoiler: boolean("spoiler").notNull().default(false),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchParties = pgTable("watch_parties", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  hostName: text("host_name").notNull(),
  mediaId: text("media_id").notNull(),
  mediaType: text("media_type").notNull(),
  mediaTitle: text("media_title").notNull(),
  posterUrl: text("poster_url").notNull(),
  currentServer: text("current_server").notNull().default("marquee-direct"),
  season: integer("season").notNull().default(1),
  episode: integer("episode").notNull().default(1),
  status: text("status").notNull().default("live"),
  viewerCount: integer("viewer_count").notNull().default(1),
  messages: jsonb("messages").$type<WatchPartyMessage[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customLiveChannels = pgTable("custom_live_channels", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().default(1),
  name: text("name").notNull(),
  category: text("category").notNull().default("Custom IPTV"),
  streamUrl: text("stream_url").notNull(),
  logoText: text("logo_text").notNull().default("TV"),
  country: text("country").notNull().default("Global"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  studio: text("studio").notNull(),
  stage: text("stage").notNull().default("scouting"), // 'scouting' | 'negotiation' | 'encoding' | 'live'
  dealValue: integer("deal_value").notNull().default(250000),
  priority: text("priority").notNull().default("High"),
  owner: text("owner").notNull().default("Elena Vance"),
  mediaType: text("media_type").notNull().default("Movie"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
