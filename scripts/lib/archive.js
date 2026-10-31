// data/archive/<YYYY-MM>.json: closed tenders, one file per closing month (SA time).
// Kept so each tender's page can stay up and say "This tender has closed". Only the
// current month's file changes day to day, so the repo doesn't grow a big diff every run.
const fs = require("fs");
const path = require("path");
const { ROOT, writeJsonAtomic } = require("./store");

const DIR = path.join(ROOT, "data", "archive");
const KEEP_DAYS = 365; // closed pages older than this are dropped from the site

const month = (iso) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date(iso)).slice(0, 7);

// Enough to render a closed page and find similar tenders; extraction details are not kept.
function slim(t) {
  const { id, ocid, reference, title, description, buyer, province, trade, category, categories, type, published, closing, documents, source, firstSeen, updated } = t;
  return { id, ocid, reference, title, description, buyer, province, trade, category, categories, type, published, closing, documents, source, firstSeen, updated };
}

function readShard(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")).tenders || [];
  } catch {
    return [];
  }
}

function addToArchive(tenders) {
  const byMonth = {};
  for (const t of tenders) if (t.closing) (byMonth[month(t.closing)] ||= []).push(slim(t));
  fs.mkdirSync(DIR, { recursive: true });
  for (const [m, list] of Object.entries(byMonth)) {
    const file = path.join(DIR, `${m}.json`);
    const byId = new Map(readShard(file).map((t) => [t.id, t]));
    for (const t of list) byId.set(t.id, t);
    const all = [...byId.values()].sort((a, b) => a.closing.localeCompare(b.closing));
    writeJsonAtomic(file, { month: m, count: all.length, tenders: all });
  }
}

// Closed tenders from the last KEEP_DAYS days.
function loadArchive(now = new Date()) {
  if (!fs.existsSync(DIR)) return [];
  const cutoff = new Date(now - KEEP_DAYS * 864e5);
  return fs.readdirSync(DIR)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .flatMap((f) => readShard(path.join(DIR, f)))
    .filter((t) => new Date(t.closing) > cutoff);
}

module.exports = { addToArchive, loadArchive, slim };
