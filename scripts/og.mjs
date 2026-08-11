// Open Graph card generator. Renders one 1200x630 PNG per essay plus one for
// the site root, in the site's console language, to src/og/<slug>.png.
// Requires Google Chrome (rendered via playwright-core, channel "chrome").
// Run with: npm run og

import { chromium } from "playwright-core";
import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const ESSAY_DIR = path.join(ROOT, "src/essays");
const OUT_DIR = path.join(ROOT, "src/og");

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Title size scales down for longer titles so eight words still fit.
const titleSize = (t) => (t.length > 44 ? 64 : t.length > 28 ? 78 : 96);

const card = ({ title, stamp }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #0d1015; color: #edf0f5;
    font-family: "Avenir Next", "Avenir", "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card { width: 1200px; height: 630px; display: flex; flex-direction: column; }
  .head {
    flex: none; height: 118px; padding: 0 72px;
    display: flex; align-items: center;
    border-bottom: 1px solid #2b3342;
  }
  .wordmark {
    font-family: "Helvetica Neue Condensed Black", "Arial Black", sans-serif;
    font-style: italic; font-weight: 900; font-size: 46px;
    letter-spacing: .09em; text-transform: uppercase; color: #fff;
    -webkit-text-stroke: .5px #fff;
    text-shadow: 0 0 1px #fff, 0 0 3px #fff, 0 0 8px rgba(255,255,255,.98),
      0 0 18px rgba(225,235,255,.72), 0 0 48px rgba(130,160,255,.34);
  }
  .field { flex: 1; display: flex; flex-direction: column; padding: 40px 72px 48px; }
  .stamp-row { height: 64px; display: flex; justify-content: flex-end; align-items: flex-start; }
  .stamp {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 26px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; white-space: nowrap;
    color: #4ecb7c; border: 3px solid #4ecb7c;
    padding: 6px 20px; transform: rotate(-2deg);
  }
  .title {
    flex: 1; display: flex; align-items: center;
    font-size: ${titleSize(title)}px; line-height: 1.12;
    font-weight: 600; letter-spacing: -.01em; max-width: 1010px;
  }
  .domain { font-family: ui-monospace, Menlo, monospace; font-size: 28px; color: #9ba6b7; }
</style></head><body>
  <div class="card">
    <div class="head"><span class="wordmark">Jay Clark</span></div>
    <div class="field">
      <div class="stamp-row">${stamp ? `<span class="stamp">${escapeHtml(stamp)}</span>` : ""}</div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="domain">jayclark.ai</div>
    </div>
  </div>
</body></html>`;

const frontmatter = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return out;
};

const pages = [{ slug: "site", title: "Building software with AI coding agents", stamp: null }];

for (const file of await readdir(ESSAY_DIR)) {
  if (!file.endsWith(".md")) continue;
  const fm = frontmatter(await readFile(path.join(ESSAY_DIR, file), "utf8"));
  if (!fm.title) {
    console.error(`skipping ${file}, no title in front matter`);
    continue;
  }
  pages.push({
    slug: path.basename(file, ".md"),
    title: fm.title,
    stamp: fm.date ? `Issued ${fm.date}` : null,
  });
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const p of pages) {
  await page.setContent(card(p), { waitUntil: "networkidle" });
  const out = path.join(OUT_DIR, `${p.slug}.png`);
  await page.screenshot({ path: out });
  console.log(`wrote ${path.relative(ROOT, out)}`);
}
await browser.close();
