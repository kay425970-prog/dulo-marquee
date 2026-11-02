/**
 * Patches the Capacitor-generated Android project so the APK also installs and
 * launches correctly on Android TV / Google TV (incl. Vitron, Skyworth, Hisense,
 * TCL, Fire TV) — not just phones and tablets.
 *
 * Run AFTER `npx cap add android`:
 *   node scripts/patch-android-tv.mjs
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";

const ANDROID = "android";
const manifestPath = join(
  ANDROID,
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);

if (!existsSync(manifestPath)) {
  console.error(`✖ ${manifestPath} not found — run "npx cap add android" first.`);
  process.exit(1);
}

let xml = readFileSync(manifestPath, "utf8");
const original = xml;

/* 1. Declare TV support without excluding phones/tablets. */
const features = [
  '<uses-feature android:name="android.software.leanback" android:required="false" />',
  '<uses-feature android:name="android.hardware.touchscreen" android:required="false" />',
  '<uses-feature android:name="android.hardware.faketouch" android:required="false" />',
  '<uses-feature android:name="android.hardware.wifi" android:required="false" />',
  '<uses-permission android:name="android.permission.INTERNET" />',
];

const missing = features.filter((f) => !xml.includes(f.replace(" />", "/>")) && !xml.includes(f));
if (missing.length) {
  xml = xml.replace(/<application/, `${missing.join("\n    ")}\n\n    <application`);
}

/* 2. Add the LEANBACK_LAUNCHER category so Android TV shows the app in its row. */
if (!xml.includes("LEANBACK_LAUNCHER")) {
  xml = xml.replace(
    /(<category android:name="android\.intent\.category\.LAUNCHER" \/>)/,
    `$1\n            <category android:name="android.intent.category.LEANBACK_LAUNCHER" />`
  );
}

/* 3. TV banner (required by leanback) + landscape-friendly orientation. */
if (!xml.includes("android:banner")) {
  xml = xml.replace(
    /<application/,
    '<application\n        android:banner="@drawable/tv_banner"'
  );
}

/* 4. Make sure the activity handles configuration changes on TV boxes. */
if (!xml.includes("android:configChanges")) {
  xml = xml.replace(
    /<activity([^>]*?)android:name="\.MainActivity"/,
    '<activity$1android:name=".MainActivity"\n            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"'
  );
}

/* 5. Copy artwork into res/drawable (TV banner is required by leanback). */
const drawableDir = join(ANDROID, "app", "src", "main", "res", "drawable");
mkdirSync(drawableDir, { recursive: true });

const bannerSource =
  [
    "public/icon-512.png",
    "public/icon-192.png",
    "public/icon-1024.png",
    "src/app/apple-icon.png",
    "electron/build/icon.png",
  ].find((p) => existsSync(p)) ?? null;

if (bannerSource) {
  copyFileSync(bannerSource, join(drawableDir, "tv_banner.png"));
  console.log(`✔ TV banner → res/drawable/tv_banner.png (from ${bannerSource})`);
} else {
  // Never let a missing image break the build: drop the banner reference so
  // AAPT doesn't fail on an unresolved @drawable/tv_banner resource.
  console.warn("⚠ No banner artwork found — removing android:banner reference.");
  xml = xml.replace(/\s*android:banner="[^"]*"/, "");
}

if (xml !== original) {
  writeFileSync(manifestPath, xml);
  console.log("✔ AndroidManifest patched for Android TV (leanback + banner)");
} else {
  console.log("• AndroidManifest already TV-ready");
}

/* 6. Report what the APK will support. */
console.log(`
Ready:
  • Phones / tablets   — LAUNCHER
  • Android TV / Vitron — LEANBACK_LAUNCHER + banner
  • Remote D-pad        — handled in-app (PlatformSupport.tsx)
`);
