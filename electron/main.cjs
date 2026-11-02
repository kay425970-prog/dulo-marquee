/**
 * arkaflix desktop shell (Electron) — wraps the live app so it installs like a
 * native Windows app with its own icon, taskbar entry and fullscreen mode.
 *
 * Loads the deployed web app by default (the site is server-rendered with API
 * routes + Postgres, so it cannot be bundled as static files). Point it at a
 * local dev server with:  ARKAFLIX_URL=http://localhost:3000 npm run electron:dev
 */
const { app, BrowserWindow, shell, Menu, globalShortcut } = require("electron");

const APP_URL =
  process.env.ARKAFLIX_URL || "https://arkaflix.netlify.app";
const isTVMode = process.argv.includes("--tv") || process.env.ARKAFLIX_TV === "1";

if (process.env.NODE_ENV !== "production") {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    show: false,
    fullscreen: isTVMode,
    kiosk: isTVMode,
    autoHideMenuBar: true,
    title: "arkaflix",
    icon: require("path").join(__dirname, "build", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isTVMode) mainWindow.setFullScreen(true);
  });

  // External links open in the user's browser, not inside the shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL) || url.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });

  // Keep navigation inside the app origin.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowed =
      url.startsWith(APP_URL) || url.startsWith("http://localhost");
    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  // F11 → fullscreen (handy on TVs and HTPCs)
  globalShortcut.register("F11", () => {
    if (!mainWindow) return;
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });
}
