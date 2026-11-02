import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Uses DATABASE_URL (or the Netlify-provisioned NETLIFY_DATABASE_URL) from the
 * environment, so the same config works locally, on Netlify and on Vercel.
 *
 * Note: the app also self-provisions its tables at runtime via
 * `ensureDbInitialized()` in src/lib/db-bootstrap.ts, so `drizzle-kit push`
 * is optional — handy for inspecting or pre-creating the schema.
 *
 * Never throws when the variable is absent: `drizzle-kit` is a dev tool and
 * should not be able to break a production build.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.NETLIFY_DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
