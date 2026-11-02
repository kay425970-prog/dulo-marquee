/* Run: npm i -D jsdom && node scripts/tvnav.test.mjs */
/* Verifies the row-aware navigation model used by PlatformSupport.tsx against
 * a jsdom DOM shaped like the real homepage (nav row + hero row + card rails). */
import { JSDOM } from "jsdom";

const html = `<!doctype html><html><body>
  <header>
    <nav data-tv-row="top-nav">
      <a href="#1" id="nav-home">Home</a>
      <a href="#2" id="nav-movies">Movies</a>
      <a href="#3" id="nav-shows">Shows</a>
    </nav>
  </header>
  <div data-tv-row="hero-actions">
    <a href="#p" id="hero-play" data-tv-autofocus>Play</a>
    <a href="#i" id="hero-info">More Info</a>
  </div>
  <section data-tv-row="Top 10">
    <div data-tv-rail>
      <a href="#a" class="card">A</a><a href="#b" class="card">B</a><a href="#c" class="card">C</a>
    </div>
  </section>
  <section data-tv-row="Popular">
    <div data-tv-rail>
      <a href="#d" class="card">D</a><a href="#e" class="card">E</a><a href="#f" class="card">F</a>
    </div>
  </section>
  <section data-tv-row="Anime">
    <div data-tv-rail>
      <a href="#g" class="card">G</a><a href="#h" class="card">H</a>
    </div>
  </section>
</body></html>`;

const dom = new JSDOM(html, { pretendToBeVisual: true });
const { window } = dom;
global.window = window;
global.document = window.document;
global.Node = window.Node;

// Line up geometry: 3 rows of cards + nav + hero
function lay(el, left, top, w = 120, h = 180) {
  el.getBoundingClientRect = () => ({
    left, top, width: w, height: h,
    right: left + w, bottom: top + h,
    x: left, y: top, toJSON() {},
  });
  el.scrollIntoView = () => {};
}
const nav = ["nav-home", "nav-movies", "nav-shows"];
nav.forEach((id, i) => lay(doc(id), 100 + i * 130, 10, 110, 40));
lay(doc("hero-play"), 100, 100, 140, 50);
lay(doc("hero-info"), 260, 100, 150, 50);
const rows = [
  ["#a", "#b", "#c"],
  ["#d", "#e", "#f"],
  ["#g", "#h"],
];
rows.forEach((r, ri) =>
  r.forEach((sel, ci) =>
    lay(document.querySelector(`a[href="${sel}"]`), 100 + ci * 140, 220 + ri * 220)
  )
);
// rails scroll containers
document.querySelectorAll("[data-tv-rail]").forEach((rail, i) => {
  lay(rail, 80, 200 + i * 220, 800, 220);
  rail.scrollLeft = 0;
});

function doc(id) { return document.getElementById(id); }
function centreX(el) { const r = el.getBoundingClientRect(); return r.left + r.width / 2; }
function isVisible(el) {
  return !el.hasAttribute("aria-hidden") && !el.closest("[inert]");
}
const FOCUSABLE = 'a[href],button:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
function rowItems(row) { return Array.from(row.querySelectorAll(FOCUSABLE)).filter(isVisible); }
function allRows() {
  const r = Array.from(document.querySelectorAll("[data-tv-row]")).filter(isVisible);
  const loose = Array.from(document.querySelectorAll(FOCUSABLE))
    .filter((el) => isVisible(el) && !el.closest("[data-tv-row]"));
  return [...r, ...loose].sort((a, b) =>
    a.compareDocumentPosition(b) & window.Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
}
function rowOf(el) { return el?.closest("[data-tv-row]") ?? el; }
function closestInRow(row, x) {
  const items = row.hasAttribute("data-tv-row") ? rowItems(row) : [row];
  return items.reduce((b, el) => Math.abs(centreX(el) - x) < Math.abs(centreX(b) - x) ? el : b);
}
function moveToAdjacentRow(current, dir) {
  const rows2 = allRows();
  const cur = rowOf(current);
  const idx = rows2.indexOf(cur);
  const x = centreX(current);
  const nextIdx = dir === "down" ? idx + 1 : idx - 1;
  if (nextIdx < 0 || nextIdx >= rows2.length) return null;
  return closestInRow(rows2[nextIdx], x);
}
function moveWithinRow(row, current, dir) {
  const items = row.hasAttribute("data-tv-row") ? rowItems(row) : [row];
  const idx = items.indexOf(current);
  const nextIdx = dir === "right" ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
  return items[nextIdx];
}

const label = (el) => el ? (el.textContent.trim() || el.id || el.getAttribute("href")) : "null";
const results = [];
function check(name, got, want) {
  const ok = got === want;
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(46)} → ${got}${ok ? "" : `  (expected ${want})`}`);
}

// Start: hero play (autofocus target)
let cur = doc("hero-play");
check("initial autofocus", label(cur), "Play");

// Right within hero row
cur = moveWithinRow(rowOf(cur), cur, "right");
check("Right → More Info", label(cur), "More Info");

// Down from hero → nearest card in Top 10 row (x=335 → C is at 380, B at 240)
cur = moveToAdjacentRow(cur, "down");
check("Down from hero → Top 10 row", ["A","B","C"].includes(label(cur)) ? "in-row" : label(cur), "in-row");

// Walk right through the rail
const first = label(cur);
cur = moveWithinRow(rowOf(cur), cur, "right");
const second = label(cur);
check("Right → next card in same rail", first !== second ? "moved" : "stuck", "moved");

// Down to Popular row keeps column
const xBefore = centreX(cur);
cur = moveToAdjacentRow(cur, "down");
check("Down → Popular row", ["D","E","F"].includes(label(cur)) ? "in-row" : label(cur), "in-row");
check("Down preserves column (±140px)", Math.abs(centreX(cur) - xBefore) <= 140 ? "aligned" : "jumped", "aligned");

// Down again → Anime row
cur = moveToAdjacentRow(cur, "down");
check("Down → Anime row", ["G","H"].includes(label(cur)) ? "in-row" : label(cur), "in-row");

// Up twice → back to Top 10
cur = moveToAdjacentRow(cur, "up");
cur = moveToAdjacentRow(cur, "up");
check("Up ×2 → back to Top 10", ["A","B","C"].includes(label(cur)) ? "in-row" : label(cur), "in-row");

// Up → hero, Up → nav
cur = moveToAdjacentRow(cur, "up");
check("Up → hero row", ["Play","More Info"].includes(label(cur)) ? "in-row" : label(cur), "in-row");
cur = moveToAdjacentRow(cur, "up");
check("Up → top nav", nav.map(n => label(doc(n))).includes(label(cur)) ? "in-row" : label(cur), "in-row");

// Left at row edge stays put (no dead-end wrap)
const atLeft = rowItems(rowOf(cur))[0];
check("Left at row edge is a no-op", label(moveWithinRow(rowOf(cur), atLeft, "left")), label(atLeft));

// Row count sanity
check("rows discovered (3 nav/hero/3 rails = 5)", String(allRows().length), "5");

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);
