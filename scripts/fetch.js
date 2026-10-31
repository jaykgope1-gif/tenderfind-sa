// Daily fetch: pull the last 3 days of eTenders releases and merge them into data/tenders.json.
//
//   node scripts/fetch.js                       normal daily run
//   node scripts/fetch.js --seed data/raw-sample.json   start the store from a saved release dump
//   node scripts/fetch.js --days 5              look further back (e.g. after an outage)
//
// - Keeps the latest release per tender (amendments replace older data).
// - If a tender's closing date or documents changed, marks it "updated" and drops its
//   extraction cache entry so extract.js re-reads its PDFs. Nothing else is re-extracted.
// - Drops tenders whose closing date has passed (and their cache entries).
// - If the API can't be reached, leaves yesterday's data untouched and logs the error.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { normalise } = require("./lib/normalise");
const { STORE, ROOT, writeJsonAtomic, loadTenders } = require("./lib/store");

const API = process.env.ETENDERS_API || "https://ocds-api.etenders.gov.za/api/OCDSReleases";
const CACHE = path.join(ROOT, "data", "extracted.json");
const LOG = path.join(ROOT, "data", "fetch-log.json");
const PAGE_SIZE = 100; // the API returns HTTP 500 for 500+, and for any page containing a broken record
const TIMEOUT_MS = 60_000;

// ---------- API ----------

class NetworkError extends Error {}

async function getPage(day, page, size) {
  const url = `${API}?PageNumber=${page}&PageSize=${size}&dateFrom=${day}&dateTo=${day}`;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      if (attempt >= 3) throw new NetworkError(`${e.message} (${url})`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    if (res.ok) return (await res.json()).releases || [];
    if (res.status === 500) { const e = new Error("HTTP 500"); e.status = 500; throw e; } // usually a broken record
    if (attempt >= 3) throw new NetworkError(`HTTP ${res.status} (${url})`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

// One page, split into smaller pages on HTTP 500 so a single broken record only loses itself.
// Returns { releases, slots } where slots counts positions consumed (a skipped record is a slot).
async function getBlock(day, page, size, stats) {
  try {
    const releases = await getPage(day, page, size);
    return { releases, slots: releases.length };
  } catch (e) {
    if (e instanceof NetworkError) throw e;
    if (size === 1) { stats.badRecords++; return { releases: [], slots: 1 }; }
    const sub = size >= 100 ? 10 : 1;
    const releases = [];
    let slots = 0;
    for (let i = 0; i < size / sub; i++) {
      const b = await getBlock(day, (page - 1) * (size / sub) + i + 1, sub, stats);
      releases.push(...b.releases);
      slots += b.slots;
      if (b.slots < sub) break;
    }
    return { releases, slots };
  }
}

async function fetchDay(day) {
  const stats = { releases: 0, badRecords: 0 };
  const all = [];
  for (let page = 1; ; page++) {
    const b = await getBlock(day, page, PAGE_SIZE, stats);
    all.push(...b.releases);
    if (b.slots < PAGE_SIZE) break;
  }
  stats.releases = all.length;
  return { releases: all, stats };
}

// ---------- merge ----------

// What counts as a change worth re-extracting: closing date or the set of documents.
function fingerprint(t) {
  const docs = t.documents.map((d) => d.url).sort().join("\n");
  return crypto.createHash("sha1").update(`${t.closing}\n${docs}`).digest("hex").slice(0, 12);
}

// Latest release per OCID: newest release date, then newest document change.
function releaseStamp(r) {
  const docs = (r.tender?.documents || []).map((d) => d.dateModified || d.datePublished || "").sort().pop() || "";
  return `${r.date || ""}|${docs}`;
}

function latestPerOcid(releases) {
  const best = new Map();
  for (const r of releases) {
    if (!r.ocid || !r.tender) continue;
    const cur = best.get(r.ocid);
    if (!cur || releaseStamp(r) > releaseStamp(cur)) best.set(r.ocid, r);
  }
  return [...best.values()];
}

// Pure merge so it can be tested: returns the new tender list plus what happened.
function merge(existing, releases, now = new Date(), today = now.toISOString().slice(0, 10)) {
  const byId = new Map(existing.map((t) => [t.id, t]));
  const result = { added: [], updated: [], unchanged: 0, removed: [] };

  for (const r of latestPerOcid(releases)) {
    const t = normalise(r);
    t.fp = fingerprint(t);
    t.releaseDate = r.date;
    const old = byId.get(t.id);
    if (!old) {
      t.firstSeen = today;
      byId.set(t.id, t);
      result.added.push(t.id);
      continue;
    }
    // An older release than the one we already have: ignore it.
    if ((old.releaseDate || "") > (r.date || "")) { result.unchanged++; continue; }
    t.firstSeen = old.firstSeen || today;
    const oldFp = old.fp || fingerprint(old);
    if (oldFp !== t.fp) {
      const changes = [];
      if (old.closing !== t.closing) changes.push("closing date");
      if (fingerprint({ ...old, closing: t.closing }) !== t.fp) changes.push("documents");
      t.updated = today;
      t.changes = changes;
      result.updated.push({ id: t.id, changes, from: old.closing, to: t.closing });
    } else {
      if (old.updated) { t.updated = old.updated; t.changes = old.changes; }
      result.unchanged++;
    }
    byId.set(t.id, t);
  }

  for (const [id, t] of byId) {
    if (!t.closing || new Date(t.closing) <= now) { byId.delete(id); result.removed.push(id); }
  }
  const tenders = [...byId.values()].sort((a, b) => a.closing.localeCompare(b.closing));
  return { tenders, ...result };
}

// ---------- main ----------

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const saDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(d);

function appendLog(entry) {
  let log = [];
  try { log = JSON.parse(fs.readFileSync(LOG, "utf8")); } catch {}
  log.unshift(entry);
  writeJsonAtomic(LOG, log.slice(0, 60), true);
}

async function main() {
  const now = new Date();
  const today = saDay(now);
  const entry = { at: now.toISOString(), ok: true, days: {} };

  let releases = [];
  if (arg("seed")) {
    releases = JSON.parse(fs.readFileSync(path.resolve(ROOT, arg("seed")), "utf8"));
    entry.seed = arg("seed");
  } else {
    const days = Number(arg("days") || 3);
    const failed = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = saDay(new Date(now - i * 864e5));
      try {
        const { releases: rs, stats } = await fetchDay(day);
        releases.push(...rs);
        entry.days[day] = stats;
        console.log(`${day}: ${stats.releases} releases${stats.badRecords ? `, ${stats.badRecords} broken record(s) skipped` : ""}`);
      } catch (e) {
        failed.push(day);
        entry.days[day] = { error: e.message };
        console.error(`${day}: FAILED — ${e.message}`);
      }
    }
    if (failed.length === days) {
      // API down: publish yesterday's data rather than an empty site.
      entry.ok = false;
      entry.error = "eTenders API unreachable; kept previous data";
      appendLog(entry);
      console.error(`${entry.error}. Store left unchanged (${loadTenders().length} tenders).`);
      return; // exit 0 so the rest of the daily job still rebuilds and deploys
    }
    if (failed.length) entry.partial = failed;
  }

  const existing = loadTenders(STORE);
  const m = merge(existing, releases, now, today);

  // Drop cache entries for changed tenders (so they are re-extracted) and for closed ones.
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch {}
  let dropped = 0;
  for (const id of [...m.updated.map((u) => u.id), ...m.removed]) if (cache[id]) { delete cache[id]; dropped++; }
  if (dropped) writeJsonAtomic(CACHE, cache, true);

  writeJsonAtomic(STORE, { fetched_at: now.toISOString(), count: m.tenders.length, tenders: m.tenders });

  Object.assign(entry, { releases: releases.length, added: m.added.length, updated: m.updated, unchanged: m.unchanged, removed: m.removed.length, total: m.tenders.length });
  appendLog(entry);
  console.log(`Store: ${m.tenders.length} open tenders — ${m.added.length} new, ${m.updated.length} updated, ${m.unchanged} unchanged, ${m.removed.length} closed and removed. ${dropped} cache entries dropped for re-extraction.`);
  for (const u of m.updated) console.log(`  updated ${u.id}: ${u.changes.join(" + ")}${u.from !== u.to ? ` (closing ${u.from} → ${u.to})` : ""}`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

module.exports = { merge, fingerprint, latestPerOcid };
