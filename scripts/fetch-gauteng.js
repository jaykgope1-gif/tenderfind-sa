// Adds Gauteng provincial government tenders that are on the Gauteng e-Tender portal but not on eTenders.
//
//   node scripts/fetch-gauteng.js            (runs after scripts/fetch.js in the daily job)
//   node scripts/fetch-gauteng.js --dry      (print what it found; change nothing)
//
// e-tenders.gauteng.gov.za lists every open tender of the Gauteng departments (Health, Education, Human
// Settlements, COGTA, Roads and Transport, ...) in a plain HTML table: number, department, description,
// briefing session and closing date. In November 2026, 6 of its 9 open tenders were missing from the eTenders feed.
//
// - Tenders already on eTenders (same tender number) are skipped, so nothing shows twice.
// - New ones go into data/tenders.json with an id "gp-<number>", so build.js and alerts.js treat them like any other.
// - The briefing session comes from the portal's own column, so it is stated, not guessed.
// - If the portal can't be read, nothing changes (the daily job carries on with yesterday's copy).
const fs = require("fs");
const path = require("path");
const { STORE, ROOT, writeJsonAtomic, loadTenders } = require("./lib/store");
const { addToArchive } = require("./lib/archive");

const PORTAL = "https://e-tenders.gauteng.gov.za";
const PAGES = ["/Pages/Advertised-Open-Tenders.aspx", "/pages/advertised-tenders.aspx"];
const CACHE = path.join(ROOT, "data", "extracted.json");
const UA = "Mozilla/5.0 (compatible; TenderFindSA/1.0; +https://tenderfind.co.za/about.html)";

const text = (html) => html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;|&#160;/g, " ")
  .replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const refKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

// "20 November, 2026 11:00 AM" -> { date: "2026-11-20", time: "11:00", iso: "2026-11-20T11:00:00+02:00" }
function parseWhen(s) {
  const m = String(s || "").match(/(\d{1,2})\s+([a-z]+),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?/i);
  if (!m || !MONTHS[m[2].toLowerCase()]) return null;
  let h = m[4] ? Number(m[4]) : 11;
  if (m[6] && /pm/i.test(m[6]) && h < 12) h += 12;
  if (m[6] && /am/i.test(m[6]) && h === 12) h = 0;
  const p = (n) => String(n).padStart(2, "0");
  const date = `${m[3]}-${p(MONTHS[m[2].toLowerCase()])}-${p(m[1])}`;
  const time = `${p(h)}:${m[5] || "00"}`;
  return { date, time: m[4] ? time : null, iso: `${date}T${time}:00+02:00` };
}

// Every table row with at least 5 cells: number | department | description | briefing | closing.
function parseTable(html, page) {
  const rows = [];
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => text(c[1]));
    if (cells.length < 5 || !cells[0] || /tender number/i.test(cells[0])) continue;
    const [reference, department, description, briefing, closing] = cells;
    const close = parseWhen(closing);
    if (!close || !description) continue;
    const brief = parseWhen(briefing);
    rows.push({ reference, department, description, closing: close.iso, page,
      briefing: brief
        ? { compulsory: /non[- ]?compulsory/i.test(briefing) ? false : /compulsory/i.test(briefing) ? true : null, date: brief.date, time: brief.time, venue: null }
        : /^(n\/?a|none|no briefing)/i.test(briefing) ? { held: false } : null,
      briefingText: briefing });
  }
  return rows;
}

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const saDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(d);
const cut = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max - 1)) + "…");

function toTender(row, today) {
  const dept = row.department.replace(/^gauteng\s*(department of\s*)?/i, "").trim();
  const description = row.description;
  return {
    id: `gp-${slug(row.reference)}`,
    reference: row.reference,
    title: cut(description.charAt(0) + description.slice(1), 140),
    description,
    buyer: `Gauteng - ${dept}`,
    province: { value: "Gauteng", source: "feed" },
    category: null,
    categories: [],
    type: "Request for Bid(Open-Tender)",
    published: `${today}T00:00:00+02:00`, // the portal doesn't say; the day we first saw it
    closing: row.closing,
    documents: [],
    portal: { name: "the Gauteng e-Tender portal", url: PORTAL + row.page },
    source: PORTAL + row.page,
  };
}

async function main() {
  const dry = process.argv.includes("--dry");
  const now = new Date();
  const today = saDay(now);

  let rows = [];
  try {
    for (const page of PAGES) rows.push(...parseTable(await get(PORTAL + page), page));
  } catch (e) {
    console.error(`Gauteng e-Tender portal unreachable (${e.message}); kept yesterday's copies.`);
    return; // exit 0: never block the daily job
  }
  if (!rows.length) { console.error("Gauteng e-Tender portal: no rows found (page layout changed?); kept yesterday's copies."); return; }

  const store = loadTenders(STORE);
  const fromEtenders = new Set(store.filter((t) => !t.id.startsWith("gp-")).map((t) => refKey(t.reference)));
  const oldGp = new Map(store.filter((t) => t.id.startsWith("gp-")).map((t) => [t.id, t]));
  const listed = new Map();
  const skipped = [];
  for (const row of rows) {
    if (fromEtenders.has(refKey(row.reference))) { skipped.push(row.reference); continue; }
    if (new Date(row.closing) <= now) continue;
    const t = toTender(row, today);
    const old = oldGp.get(t.id);
    if (old) {
      Object.assign(t, { firstSeen: old.firstSeen, published: old.published });
      if (old.closing !== t.closing) Object.assign(t, { updated: today, changes: ["closing date"] });
      else if (old.updated) Object.assign(t, { updated: old.updated, changes: old.changes });
    } else t.firstSeen = today;
    listed.set(t.id, { t, row });
  }

  // Gone from the portal: closed (archive it) or withdrawn (drop it). Also drop any now on eTenders.
  const closed = [...oldGp.values()].filter((t) => !listed.has(t.id) && new Date(t.closing) <= now);
  const added = [...listed.keys()].filter((id) => !oldGp.has(id));
  console.log(`Gauteng e-Tender portal: ${rows.length} listed, ${skipped.length} already on eTenders, ${listed.size} added from the portal (${added.length} new today), ${closed.length} closed.`);
  for (const { t } of listed.values()) console.log(`  ${oldGp.has(t.id) ? " " : "+"} ${t.reference} | ${t.buyer} | closes ${t.closing.slice(0, 10)} | ${t.description.slice(0, 90)}`);
  if (dry) return;

  const tenders = [...store.filter((t) => !t.id.startsWith("gp-")), ...[...listed.values()].map((x) => x.t)].sort((a, b) => a.closing.localeCompare(b.closing));
  if (closed.length) addToArchive(closed);
  writeJsonAtomic(STORE, { fetched_at: now.toISOString(), count: tenders.length, tenders });

  // The portal's briefing column goes in the extraction cache, so extract.js skips these (they have no PDFs to read).
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch {}
  for (const { t, row } of listed.values()) {
    cache[t.id] = { status: "ok", docs: [], extracted_at: now.toISOString(), fields: {
      briefing: row.briefing ? { value: row.briefing, source: "portal", snippet: `Briefing session: ${row.briefingText}` } : { value: null, source: "not stated on the portal" },
      cidb_grade: { value: null, source: "not stated on the portal" },
      csd_required: { value: null, source: "not stated on the portal" },
      bbbee_level: { value: null, source: "not stated on the portal" },
      location: { value: null, source: "not stated on the portal" },
    } };
  }
  for (const t of oldGp.values()) if (!listed.has(t.id)) delete cache[t.id];
  writeJsonAtomic(CACHE, cache, true);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(0); });

module.exports = { parseTable, parseWhen, toTender };
