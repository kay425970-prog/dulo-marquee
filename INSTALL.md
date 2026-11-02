# Install arkaflix everywhere

The app is deployed at **https://arkaflix.netlify.app**.

Because it's server-rendered (Next.js API routes + Postgres), the phone/desktop
builds act as a **native shell** that loads the deployed app — that's how it
gets a real icon, its own window, fullscreen, and no browser chrome.

---

## 🤖 Android phone / tablet / Android TV (Vitron, Skyworth, TCL, Hisense)

### Get the APK
1. GitHub → **Actions** → **Build Android APK (phone + Android TV)** → **Run workflow**
2. Wait ~8 min → open the finished run → download **`arkaflix-android-apk`**
3. Unzip → `app-debug.apk`

> First run of the `android` workflow after a push also triggers automatically.

### Install on a phone
1. Copy the APK to the device (USB, Drive, Telegram…)
2. Tap it → allow **Install unknown apps** for your file manager
3. Open **arkaflix**

### Install on Android TV / Vitron
The APK declares `LEANBACK_LAUNCHER`, a TV banner,
`android.software.leanback (not required)` and
`android.hardware.touchscreen (not required)`, so it appears in the TV launcher
row and installs on TVs without a touchscreen.

**Easiest — Downloader app (no PC needed):**
1. Install **Downloader** (by AFTVnews) from the Play Store on the TV
2. In Downloader enter the direct APK URL (host the file on Drive/GitHub Releases and paste the link)
3. Install → Open

**Via PC + ADB (most reliable):**
```bash
adb connect <TV_IP>:5555       # enable Developer options → USB debugging / ADB on the TV
adb install -r app-debug.apk
adb shell monkey -p app.arkaflix.marquee -c android.intent.category.LEANBACK_LAUNCHER 1
```

**USB drive:** copy the APK to a USB stick → plug into the TV → use a file
manager app (e.g. "FX File Explorer") → install.

### Remote controls
| Remote button | Action |
| --- | --- |
| D-pad arrows | Move focus between cards / buttons (spatial navigation) |
| Center / OK | Open the focused item |
| Back | Go back |
| Left / Right on a rail | Scrolls that row, then moves focus |

TV mode auto-enables on Android TV / Fire TV / Tizen / webOS / Google TV UAs and
whenever the app runs installed. Force it manually with `?tv=1`, disable with
`?tv=0`.

---

## 🪟 Windows (.exe)

1. GitHub → **Actions** → **Build Windows EXE (+ Linux AppImage)** → **Run workflow**
2. Download **`arkaflix-windows-exe`**
3. You get:
   - `arkaflix-1.0.0-x64.exe` — NSIS installer (desktop + Start Menu shortcut)
   - `arkaflix-1.0.0-portable.exe` — single-file portable, no install

Unsigned build → Windows SmartScreen may warn. **More info → Run anyway**, or
sign it with a code-signing certificate by setting `CSC_LINK` / `CSC_KEY_PASSWORD`.

**TV / HTPC mode:** run with `--tv` for kiosk fullscreen, or press **F11** to
toggle fullscreen.

---

## 🍎 macOS / 🐧 Linux

`windows-exe.yml` also builds a Linux **AppImage** (`arkaflix-<version>-x64.AppImage`,
`chmod +x` then run). For macOS run locally:

```bash
npm ci && npm install --no-save electron@32 electron-builder@25
npx electron-builder --mac --publish never
```

---

## 🌐 Install as an app (no binary needed — works on everything)

The site is a full PWA with offline fallback:

| Device | How |
| --- | --- |
| **iPhone / iPad** | Safari → Share → **Add to Home Screen** |
| **Android** | Chrome → ⋮ → **Install app** |
| **Windows / macOS** | Chrome/Edge → install icon in the address bar |
| **Smart TV browser** | Open the URL, press the remote's fullscreen button |
| **Xbox / PlayStation** | Edge app → open the URL |

Offline: pages you've visited and artwork are cached; you get a branded offline
screen instead of a browser error.

---

## Build locally (if you have the toolchains)

```bash
# Android APK (needs JDK 17+ and Android SDK)
npm ci
npm install --no-save @capacitor/cli@6 @capacitor/core@6 @capacitor/android@6
npx cap add android && npx cap sync android
node scripts/patch-android-tv.mjs
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# Windows exe (needs to run on Windows, or Wine on Linux)
npm ci
npm install --no-save electron@32 electron-builder@25
npx electron-builder --win --publish never
# → dist/arkaflix-1.0.0-x64.exe
```

---

## Notes

- The native shells load the **live** site, so web deploys update the apps
  instantly — no store review, no reinstall.
- To point a shell at a different host: edit `server.url` in
  `capacitor.config.json` (mobile) or set `ARKAFLIX_URL` (desktop).
- Portraits, playback and Live TV all stream client-side; no media is bundled in
  the app.
