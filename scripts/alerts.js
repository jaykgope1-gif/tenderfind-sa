// Daily alerts file: what the WhatsApp sender (n8n) needs, already grouped.
//
//   node scripts/alerts.js [--date 2026-11-02]
//
// Writes data/alerts/<date>.json (kept in git for 60 days) and publishes the same file as
// site/alerts/<date>.json and site/alerts/latest.json, which n8n downloads each morning.
//
//   new          tenders first seen today (published in the last 3 days, so a backfill
//                doesn't flood people), by trade then province
//   closing_soon tenders closing exactly 3 days from today, same grouping (the reminder option)
//
// Only stated facts go in: briefing/CIDB come from the documents and are labelled as such.
const fs = require("fs");
const path = require("path");
const { STORE, ROOT, loadTenders, writeJsonAtomic } = require("./lib/store");
const { classify } = require("./lib/normalise");
const { closingText, briefingText, ymd } = require("./lib/display");
const { SITE_URL } = require("./lib/config");

const DATA_DIR = path.join(ROOT, "data", "alerts");
const SITE_DIR = path.join(ROOT, "site", "alerts");
const NEW_WINDOW_DAYS = 3; // matches fetch.js's default look-back
const REMIND_DAYS = 3;
const KEEP_DAYS = 60;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00+02:00`) + n * 864e5).toISOString().slice(0, 10);
const saDay = (iso) => ymd.format(new Date(iso));

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

// One tender as the message needs it.
function entry(t, x) {
  const b = x.briefing?.value;
  return {
    id: t.id,
    title: t.summary || t.title, // plain-English one-liner
    official_title: t.title,
    nationwide: !!t.nationwide, // national buyer, work across the country
    hq: t.hq || null, // national buyer with a head office here and no other place named
    buyer: t.buyer,
    province: t.province.value || "Not stated",
    trade: t.trade,
    closing: t.closing,
    closing_text: closingText(t.closing),
    briefing: b ? briefingText(b) : null,
    compulsory_briefing: b ? b.compulsory === true : null,
    cidb: x.cidb_grade?.value || null,
    url: `${SITE_URL}/tender/${t.id}.html`,
  };
}

// { trade: { province: [entries sorted by closing] } }
function group(list) {
  const out = {};
  for (const e of list.sort((a, b) => a.closing.localeCompare(b.closing))) {
    ((out[e.trade] ||= {})[e.province] ||= []).push(e);
  }
  return out;
}

function main() {
  const today = arg("date") || ymd.format(new Date());
  const now = new Date();
  const extracted = readJson(path.join(ROOT, "data", "extracted.json"), {});
  const open = loadTenders(STORE).map(classify).filter((t) => new Date(t.closing) > now);
  const fields = (t) => extracted[t.id]?.fields || {};

  const earliest = addDays(today, -NEW_WINDOW_DAYS + 1);
  const fresh = open.filter((t) => t.firstSeen === today && saDay(t.published) >= earliest);
  const remind = open.filter((t) => saDay(t.closing) === addDays(today, REMIND_DAYS));

  const alerts = {
    date: today,
    generated_at: now.toISOString(),
    site: SITE_URL,
    note: "National tenders go only to subscribers in their head-office province (hq) or, when nationwide is true, to everyone.",
    counts: { new: fresh.length, closing_soon: remind.length },
    new: group(fresh.map((t) => entry(t, fields(t)))),
    closing_soon: group(remind.map((t) => entry(t, fields(t)))),
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(SITE_DIR, { recursive: true });
  writeJsonAtomic(path.join(DATA_DIR, `${today}.json`), alerts, true);

  // Keep 60 days in git; publish the last 14 days plus latest.json.
  const files = fs.readdirSync(DATA_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const f of files) if (f.slice(0, 10) < addDays(today, -KEEP_DAYS)) fs.rmSync(path.join(DATA_DIR, f));
  for (const f of files.filter((f) => f.slice(0, 10) >= addDays(today, -14) && fs.existsSync(path.join(DATA_DIR, f)))) {
    fs.copyFileSync(path.join(DATA_DIR, f), path.join(SITE_DIR, f));
  }
  fs.copyFileSync(path.join(DATA_DIR, `${today}.json`), path.join(SITE_DIR, "latest.json"));

  const trades = Object.entries(alerts.new).map(([tr, byP]) => `${tr} ${Object.values(byP).flat().length}`).join(", ");
  console.log(`Alerts ${today}: ${fresh.length} new (${trades || "none"}), ${remind.length} closing in ${REMIND_DAYS} days`);
}

main();
