// Merge normalised tenders + data/extracted.json into the files the site loads.
//
//   node scripts/build.js [--input data/tenders.json] [--ids 1,2,3]
//
// Writes:
//   site/data/tenders.json      compact index of all open tenders (what the search page loads)
//   site/data/p/<province>.json the same, one file per province
//   site/data/t/<id>.json       full detail per tender, fetched when someone taps "View"
//   site/tender/<id>.html       a page per tender, open or closed within the last year (data/archive)
//   site/tenders/*.html         trade and province pages for Google ("Cleaning tenders in Gauteng")
//   site/about.html, site/privacy.html, site/terms.html, site/pricing.html, site/help.html, site/registration-help.html,
//   site/pay/index.html, site/sitemap.xml, site/robots.txt, site/404.html
//   and fills the prices in the hand-written site/index.html (<span data-price="...">) from PRICING
// Read-only on data/extracted.json, so it is safe to run while extraction is in progress.
const fs = require("fs");
const path = require("path");
const { STORE, loadTenders } = require("./lib/store");
const { classify } = require("./lib/normalise");
const { loadArchive } = require("./lib/archive");
const pages = require("./lib/pages");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(SITE, "data");
const PAGES = path.join(SITE, "tender");
const { SITE_URL } = require("./lib/config");
const { aboutPage, privacyPage, pricingPage, helpPage, registrationHelpPage, termsPage, payPage } = require("./lib/info-pages");
const { fillPrices } = require("./lib/prices");
const { landingPages } = require("./lib/landing-pages");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

// extract.js rewrites the cache as it goes; retry if we catch it mid-write.
function readJsonRetry(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  for (let i = 0; i < 5; i++) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
    }
  }
  throw new Error(`Could not parse ${file}`);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const val = (f) => (f && f.value != null ? f.value : null);
const field = (f) => (f && f.value != null ? { value: f.value, source: f.source, snippet: f.snippet } : { value: null, source: (f && f.source) || "not extracted" });

function main() {
  const input = arg("input") ? path.resolve(ROOT, arg("input")) : STORE;
  const ids = arg("ids") ? new Set(arg("ids").split(",")) : null;
  const extracted = readJsonRetry(path.join(ROOT, "data", "extracted.json"), {});
  const now = new Date();

  const stored = loadTenders(input).map(classify);
  const tenders = stored
    .filter((t) => new Date(t.closing) > now)
    .filter((t) => !ids || ids.has(t.id))
    .sort((a, b) => a.closing.localeCompare(b.closing));

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.rmSync(PAGES, { recursive: true, force: true });
  fs.mkdirSync(PAGES, { recursive: true });
  fs.mkdirSync(path.join(OUT, "t"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "p"), { recursive: true });

  const index = [];
  const details = [];
  for (const t of tenders) {
    const x = extracted[t.id]?.fields || {};
    const b = val(x.briefing);
    const location = val(x.location);

    // Compact record for the list (short keys keep the first load small on 3G).
    index.push({
      id: t.id,
      r: t.reference,
      t: t.summary || t.title,
      ...(t.summary && t.summary !== t.title && { o: t.title }), // the official wording, still searchable
      b: t.buyer,
      p: t.province.value,
      tr: t.trade,
      ty: t.type,
      pu: t.published,
      c: t.closing,
      ...(b && { bc: b.held === false ? "none" : b.compulsory, bd: b.date || null }),
      ...(val(x.cidb_grade) && { g: x.cidb_grade.value }),
      ...(location && { l: location }),
      ...(t.updated && { u: t.updated }),
    });

    // Full detail, loaded on demand.
    const detail = {
      ...t,
      province: t.province,
      extraction: extracted[t.id] ? extracted[t.id].status : "pending",
      briefing: field(x.briefing),
      cidb_grade: field(x.cidb_grade),
      bbbee_level: field(x.bbbee_level),
      csd_required: field(x.csd_required),
      location: field(x.location),
      // "What you'll need to submit": null until extract.js has checked the documents for it.
      checklist: extracted[t.id]?.checklist || null,
    };
    fs.writeFileSync(path.join(OUT, "t", `${t.id}.json`), JSON.stringify(detail));
    details.push(detail);
  }
  if (!ids) writePages(details, stored, now);

  const meta = { updated: now.toISOString(), count: index.length };
  fs.writeFileSync(path.join(OUT, "tenders.json"), JSON.stringify({ ...meta, tenders: index }));

  const byProvince = {};
  for (const r of index) (byProvince[r.p || "Not stated"] ||= []).push(r);
  for (const [p, list] of Object.entries(byProvince)) {
    fs.writeFileSync(path.join(OUT, "p", `${slug(p)}.json`), JSON.stringify({ ...meta, province: p, count: list.length, tenders: list }));
  }

  const size = fs.statSync(path.join(OUT, "tenders.json")).size;
  const withX = index.filter((r) => extracted[r.id]).length;
  console.log(`Built ${index.length} open tenders (${withX} with PDF extraction), index ${(size / 1024).toFixed(1)} KB, ${Object.keys(byProvince).length} province files`);
}

// One page per tender. Closed ones come from the archive (plus any in the store that closed since
// the last fetch) and point people to similar open tenders.
function writePages(open, stored, now) {
  const openIds = new Set(open.map((t) => t.id));
  const closedById = new Map();
  for (const t of [...loadArchive(now).map(classify), ...stored.filter((t) => !openIds.has(t.id))]) {
    if (!openIds.has(t.id)) closedById.set(t.id, t);
  }
  const openByTrade = {};
  for (const t of open) (openByTrade[t.trade] ||= []).push(t);

  const listed = [];
  const write = (t, closed) => {
    const html = pages.tenderPage(t, { siteUrl: SITE_URL, closed, similarList: pages.similar(t, openByTrade) });
    fs.writeFileSync(path.join(PAGES, `${t.id}.html`), html);
    listed.push({ id: t.id, lastmod: pages.ymdOf(closed ? t.closing : t.updated || t.firstSeen || t.published) });
  };
  for (const t of open) write(t, false);
  for (const t of closedById.values()) write(t, true);

  // Trade and province pages for Google (site/tenders/), rebuilt daily.
  const LANDING = path.join(SITE, "tenders");
  fs.rmSync(LANDING, { recursive: true, force: true });
  fs.mkdirSync(LANDING, { recursive: true });
  const landing = landingPages(open, SITE_URL, now);
  for (const p of landing) fs.writeFileSync(path.join(LANDING, p.file), p.html);

  const today = now.toISOString().slice(0, 10);
  const extra = ["help.html", "registration-help.html", "terms.html", ...landing.map((p) => (p.file === "index.html" ? "tenders/" : `tenders/${p.file}`))];
  fs.writeFileSync(path.join(SITE, "sitemap.xml"), pages.sitemap(SITE_URL, listed, today, extra));
  fs.writeFileSync(path.join(SITE, "robots.txt"), pages.robots(SITE_URL));
  fs.writeFileSync(path.join(SITE, "404.html"), pages.notFound(SITE_URL));
  fs.writeFileSync(path.join(SITE, "about.html"), aboutPage(SITE_URL, open.length));
  fs.writeFileSync(path.join(SITE, "privacy.html"), privacyPage(SITE_URL));
  fs.writeFileSync(path.join(SITE, "pricing.html"), pricingPage(SITE_URL));
  fs.writeFileSync(path.join(SITE, "help.html"), helpPage(SITE_URL));
  fs.writeFileSync(path.join(SITE, "registration-help.html"), registrationHelpPage(SITE_URL));
  fs.writeFileSync(path.join(SITE, "terms.html"), termsPage(SITE_URL));
  fs.mkdirSync(path.join(SITE, "pay"), { recursive: true });
  fs.writeFileSync(path.join(SITE, "pay", "index.html"), payPage());
  // The home page is hand-written; only its marked prices are rewritten (no change when prices are the same).
  const home = path.join(SITE, "index.html");
  const before = fs.readFileSync(home, "utf8");
  const after = pages.fillHomeBlocks(fillPrices(before));
  if (after !== before) { fs.writeFileSync(home, after); console.log("Home page prices or blocks updated (commit site/index.html)."); }
  const { OPERATOR } = require("./lib/config");
  if (!OPERATOR.address) console.log("Reminder: add your physical address to OPERATOR.address in scripts/lib/config.js (the ECT Act requires it on the Terms page).");
  console.log(`Pages: ${open.length} open + ${closedById.size} closed tender pages, ${landing.length} trade/province pages, sitemap with ${listed.length + 4 + extra.length} URLs`);
}

main();
