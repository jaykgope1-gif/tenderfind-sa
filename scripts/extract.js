// Pull briefing / CIDB / B-BBEE / CSD / location details out of tender PDFs.
// Runs only for tenders not already in data/extracted.json (cache keyed by tender id).
//
//   node scripts/extract.js [--input data/tenders.json] [--limit 20] [--ids 1,2,3]
//
// Order per field: tender description ("feed") -> PDF regex ("regex") -> Claude ("ai", only when
// regex found nothing and ANTHROPIC_API_KEY is set) -> "not found". Nothing is ever inferred.
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse/lib/pdf-parse.js");
const { STORE, writeJsonAtomic, loadTenders } = require("./lib/store");

const ROOT = path.join(__dirname, "..");
const CACHE = path.join(ROOT, "data", "extracted.json");
const MAX_BYTES = 10 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 45_000;
const PARSE_TIMEOUT_MS = 60_000;
const MAX_DOCS = 2;
const MAX_ATTEMPTS = 3;
const CONCURRENCY = 3;
const AI_MODEL = "claude-haiku-5-5";
const AI_CHARS = 6000;

// ---------- documents ----------

const isPdf = (d) => /pdf/i.test(d.format || "") || /\.pdf(&|$)/i.test(d.url || "");

// Main tender document first; standard forms (SBD, returnables, pricing) last.
function docScore(d) {
  const t = (d.title || "").toLowerCase();
  let s = 0;
  if (/tender doc|bid doc|rfq|rfp|request for (quotation|proposal|bid)|invitation|terms of reference|\btor\b|specification|scope/.test(t)) s += 2;
  if (/sbd|returnable|pricing|price schedule|declaration|annex|form|affidavit|gcc|general conditions|bill of quantit|drawing/.test(t)) s -= 3;
  return s;
}

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out`)), ms))]);

async function download(url, retries = 1) {
  try {
    return await downloadOnce(url);
  } catch (e) {
    if (retries > 0 && !/HTTP 4/.test(e.message)) return download(url, retries - 1);
    throw e;
  }
}

async function downloadOnce(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (Number(res.headers.get("content-length")) > MAX_BYTES) return { tooLarge: true };
    const chunks = [];
    let size = 0;
    for await (const chunk of res.body) {
      size += chunk.length;
      if (size > MAX_BYTES) { ctrl.abort(); return { tooLarge: true }; }
      chunks.push(chunk);
    }
    return { buf: Buffer.concat(chunks) };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- regex extraction ----------

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const DATE_RE = new RegExp(
  String.raw`\b(\d{1,2})\s?(?:st|nd|rd|th)?\s+(${MONTHS.map((m) => m.slice(0, 3) + "[a-z]*").join("|")})\.?,?\s+(\d{4})\b` +
    String.raw`|\b(\d{4})[-/](\d{2})[-/](\d{2})\b|\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b`,
  "i"
);
const TIME_RE = /(?<!\d)([01]?\d|2[0-3])\s?[:hH.]\s?([0-5]\d)(?!\d)/; // "11h00", "10.00am", "12:00pm"
const pad = (n) => String(n).padStart(2, "0");
const snip = (text, i, before = 60, after = 200) => text.slice(Math.max(0, i - before), i + after).replace(/\s+/g, " ").trim();

function parseDate(s) {
  const m = s.match(DATE_RE);
  if (!m) return null;
  if (m[1]) return `${m[3]}-${pad(MONTHS.findIndex((x) => x.startsWith(m[2].slice(0, 3).toLowerCase())) + 1)}-${pad(m[1])}`;
  if (m[4]) return `${m[4]}-${m[5]}-${m[6]}`;
  return `${m[9]}-${pad(m[8])}-${pad(m[7])}`; // SA writes dd/mm/yyyy
}

const BRIEFING_RE = /(non[-\s]*compulsory|not compulsory|compulsory|mandatory|optional)?[\s:]*(?:site\s+|virtual\s+|tender\s+)?(briefing(?:\s+session|\s+meeting)?|site (?:meeting|inspection|visit)|clarification meeting)/gi;

function briefingAt(text, h) {
  // Cover pages are often tables ("BRIEFING | CLOSING DATE | ..."), so never read past "closing".
  let win = text.slice(h.index + h[0].length, h.index + 350);
  const stop = win.search(/closing/i);
  if (stop >= 0) win = win.slice(0, stop);
  const dm = win.match(DATE_RE);
  const time = (dm ? win.replace(dm[0], " ") : win).match(TIME_RE); // so "04.11.2026" isn't read as a time
  const flat = win.replace(/\s+/g, " ");
  // Only take a venue with a clear end; open-ended captures pick up form fields and boilerplate.
  const venue = flat.match(/venue[^:]{0,60}:\s*(.{4,140}?)(?=\.?\s+(?:date|time|tel|contact|enquir|latitude|gps|co-?ordinates|safety|issue|name of)\b)/i);
  const lead = text.slice(Math.max(0, h.index - 40), h.index + h[0].length + 40);
  return {
    compulsory: /non[-\s]*compulsory|not compulsory|optional/i.test(lead) ? false : /compulsory|mandatory/i.test(lead + win.slice(0, 60)) ? true : null,
    date: dm ? parseDate(dm[0]) : null,
    time: time ? `${pad(time[1])}:${time[2]}` : null,
    venue: venue ? venue[1].trim().replace(/[.;,]$/, "") : null,
  };
}

function findBriefing(text, tender) {
  const hits = [...text.matchAll(BRIEFING_RE)];
  if (!hits.length) return null;
  const closing = tender.closing ? tender.closing.slice(0, 10) : "9999";
  const published = tender.published ? tender.published.slice(0, 10) : "0000";
  // Prefer the first mention with a plausible date: after publication, before closing.
  for (const h of hits) {
    const b = briefingAt(text, h);
    if (b.date && b.date > published && b.date < closing) return { value: b, snippet: snip(text, h.index, 20, 300) };
  }
  // No date anywhere: still report a stated time/venue, or that attendance is compulsory.
  for (const h of hits) {
    const b = briefingAt(text, h);
    b.date = null;
    if (b.time || b.venue) return { value: b, snippet: snip(text, h.index, 20, 300) };
  }
  // ...but not standard-form wording like "attended a compulsory briefing where applicable".
  const c = hits.find((h) => h[1] && /compulsory|mandatory/i.test(h[1]) && !/non|not/i.test(h[1]) &&
    !/applicable|fail(s|ed)? to attend|should|attended/i.test(text.slice(Math.max(0, h.index - 60), h.index + h[0].length + 40)));
  if (c) return { value: { compulsory: true, date: null, time: null, venue: null }, snippet: snip(text, c.index, 20, 300) };
  // A clear "no briefing" statement counts as a value too.
  const none = text.match(/\b(no|there (?:will be|is) no)\s+(?:compulsory\s+)?(?:site\s+)?briefing/i) ||
    text.match(/briefing(?:\s+session)?\s*[:\-]?\s*(none|n\/a|not applicable)\b/i);
  if (none) return { value: { held: false }, snippet: snip(text, none.index) };
  return null;
}

const CIDB_CODE_RE = /\b([1-9])\s?(CE|GB|EB|ME|EP|SQ|SO|SH|SL|SN|SG|SW)(\s?PE)?\b/g;

// Keep the first grade plus any written right next to it ("4GB/4CE"); grades further away
// are usually from grading tables or other boilerplate.
function cidbGrades(text) {
  const grades = [];
  let first = -1;
  for (const m of text.matchAll(CIDB_CODE_RE)) {
    if (first < 0) first = m.index;
    else if (m.index - first > 40) break;
    const g = `${m[1]}${m[2]}${m[3] ? " PE" : ""}`;
    if (!grades.includes(g)) grades.push(g);
  }
  return { grades, first };
}

function findCidb(text) {
  if (!/cidb|construction industry development board/i.test(text)) return null;
  const { grades, first } = cidbGrades(text);
  if (!grades.length) return null;
  return { value: grades.join(" or "), snippet: snip(text, first) };
}

function findBbbee(text) {
  const re = /b-?bbee[^.\n]{0,60}?level\s*(?:of\s+contribution\s*)?([1-8])\b|level\s*([1-8])\s*(?:b-?bbee|contributor)/gi;
  for (const m of text.matchAll(re)) {
    const around = text.slice(Math.max(0, m.index - 120), m.index + m[0].length + 120);
    // Only a stated minimum, not a scoring row ("Level 1 ... 5,0") or a preference ("endeavours to use").
    if (/minimum|at least|or (better|higher)/i.test(around) &&
      !/points?\b|80\/20|90\/10|specific goals|%|endeavou?r|prefer|contribution\s*\d|\d,\d/i.test(around)) {
      return { value: `Level ${m[1] || m[2]}`, snippet: snip(text, m.index) };
    }
  }
  return null;
}

function findCsd(text) {
  const m = text.match(/central supplier(?:s)? database|\bCSD\b/);
  return m ? { value: true, snippet: snip(text, m.index) } : null;
}

const FIELDS = { briefing: findBriefing, cidb_grade: findCidb, bbbee_level: findBbbee, csd_required: findCsd };

// ---------- AI fallback ----------

let anthropic = null;
async function aiExtract(text) {
  const { z } = require("zod");
  const { zodOutputFormat } = require("@anthropic-ai/sdk/helpers/zod");
  if (!anthropic) {
    const Anthropic = require("@anthropic-ai/sdk").default;
    anthropic = new Anthropic();
  }
  const Schema = z.object({
    briefing: z
      .object({
        compulsory: z.boolean().nullable(),
        date: z.string().nullable().describe("YYYY-MM-DD"),
        time: z.string().nullable().describe("HH:MM, 24-hour"),
        venue: z.string().nullable(),
      })
      .nullable(),
    cidb_grade: z.string().nullable().describe('e.g. "6CE" or "3GB PE"'),
    bbbee_level: z.string().nullable().describe('minimum B-BBEE level required, e.g. "Level 2"'),
    location: z.string().nullable().describe("where the work or delivery happens: town/site and province"),
  });
  const res = await anthropic.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(Schema) },
    system:
      "You extract facts from South African government tender documents. Report only what the text explicitly states. " +
      "Use null for anything not explicitly stated. Never infer, estimate or fill in typical values. " +
      "If the text says there is no briefing session, set briefing to null.",
    messages: [{ role: "user", content: `Tender document text (first part):\n\n${text.slice(0, AI_CHARS)}` }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) return null;
  return res.parsed_output;
}

// ---------- per tender ----------

async function extractTender(t) {
  const out = { status: "ok", docs: [], fields: {}, extracted_at: new Date().toISOString() };
  const set = (k, hit, source) => { out.fields[k] = hit ? { value: hit.value, source, snippet: hit.snippet } : { value: null, source: "not found" }; };

  // 1. The feed's own description.
  for (const [k, fn] of Object.entries(FIELDS)) {
    const hit = fn(t.description || "", t);
    if (hit) set(k, hit, "feed");
  }

  // 2. PDFs.
  const pdfs = t.documents.filter(isPdf).sort((a, b) => docScore(b) - docScore(a)).slice(0, MAX_DOCS);
  if (!pdfs.length) out.status = "no-pdf";
  let mainText = "";
  for (const d of pdfs) {
    const doc = { title: d.title };
    out.docs.push(doc);
    try {
      const dl = await download(d.url);
      if (dl.tooLarge) { doc.result = "too-large"; continue; }
      const parsed = await withTimeout(pdf(dl.buf), PARSE_TIMEOUT_MS, "PDF parse");
      doc.pages = parsed.numpages;
      if (parsed.text.replace(/\s/g, "").length < 200) { doc.result = "scanned"; continue; }
      doc.result = "text";
      mainText ||= parsed.text;
      for (const [k, fn] of Object.entries(FIELDS)) {
        if (out.fields[k]) continue;
        const hit = fn(parsed.text, t);
        if (hit) set(k, hit, "regex");
      }
    } catch (e) {
      doc.result = "error";
      doc.error = e.message;
    }
  }
  if (pdfs.length && out.docs.every((d) => d.result === "scanned")) out.status = "scanned";
  else if (pdfs.length && out.docs.every((d) => d.result === "error")) out.status = "error";

  // 3. AI, only when regex found none of the key details.
  const keyFound = ["briefing", "cidb_grade", "bbbee_level"].some((k) => out.fields[k]);
  if (!keyFound && mainText && process.env.ANTHROPIC_API_KEY) {
    try {
      const ai = await aiExtract(mainText);
      if (ai) {
        const b = ai.briefing;
        if (b && (b.date || b.venue || b.compulsory != null)) set("briefing", { value: b }, "ai");
        if (ai.cidb_grade) set("cidb_grade", { value: ai.cidb_grade }, "ai");
        if (ai.bbbee_level) set("bbbee_level", { value: ai.bbbee_level }, "ai");
        if (ai.location) set("location", { value: ai.location }, "ai");
      }
      out.ai = true;
    } catch (e) {
      out.ai_error = e.message; // site still works on regex results
    }
  }

  for (const k of [...Object.keys(FIELDS), "location"]) if (!out.fields[k]) set(k, null);
  return out;
}

// ---------- main ----------

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const input = arg("input") ? path.resolve(ROOT, arg("input")) : STORE;
  const limit = Number(arg("limit") || Infinity);
  const ids = arg("ids") ? new Set(arg("ids").split(",")) : null;

  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
  const now = new Date();
  const tenders = loadTenders(input)
    .filter((t) => new Date(t.closing) > now)
    .filter((t) => !ids || ids.has(t.id));

  const todo = tenders
    .filter((t) => {
      const c = cache[t.id];
      return !c || (c.status === "error" && (c.attempts || 1) < MAX_ATTEMPTS);
    })
    .slice(0, limit);

  console.log(`${tenders.length} open tenders, ${todo.length} to extract, AI ${process.env.ANTHROPIC_API_KEY ? "on" : "off"}`);
  let done = 0;
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let t; (t = queue.shift()); ) {
        const prev = cache[t.id];
        const r = await extractTender(t);
        if (r.status === "error") r.attempts = (prev?.attempts || 0) + 1;
        cache[t.id] = r;
        console.log(`[${++done}/${todo.length}] ${t.id} ${r.status}`);
        writeJsonAtomic(CACHE, cache, true); // save as we go
      }
    })
  );
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

module.exports = { extractTender, findBriefing, findCidb, cidbGrades, findBbbee, findCsd };
