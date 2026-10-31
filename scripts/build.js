// Merge normalised tenders + data/extracted.json into the files the site loads.
//
//   node scripts/build.js [--input data/tenders.json] [--ids 1,2,3]
//
// Writes:
//   site/data/tenders.json      compact index of all open tenders (what the search page loads)
//   site/data/p/<province>.json the same, one file per province
//   site/data/t/<id>.json       full detail per tender, fetched when someone taps "View"
// Read-only on data/extracted.json, so it is safe to run while extraction is in progress.
const fs = require("fs");
const path = require("path");
const { STORE, loadTenders } = require("./lib/store");
const { classify } = require("./lib/normalise");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "site", "data");

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

  const tenders = loadTenders(input)
    .map(classify)
    .filter((t) => new Date(t.closing) > now)
    .filter((t) => !ids || ids.has(t.id))
    .sort((a, b) => a.closing.localeCompare(b.closing));

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "t"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "p"), { recursive: true });

  const index = [];
  for (const t of tenders) {
    const x = extracted[t.id]?.fields || {};
    const b = val(x.briefing);
    const location = val(x.location);

    // Compact record for the list (short keys keep the first load small on 3G).
    index.push({
      id: t.id,
      r: t.reference,
      t: t.title,
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
    };
    fs.writeFileSync(path.join(OUT, "t", `${t.id}.json`), JSON.stringify(detail));
  }

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

main();
