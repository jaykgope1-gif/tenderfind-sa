// Last gate before deploying: refuse to publish an empty or broken site.
// Exits 1 (which stops the GitHub Action before deploy) if anything looks wrong;
// the previously deployed site then stays live.
const fs = require("fs");
const path = require("path");

const SITE = path.join(__dirname, "..", "site");
const MIN_TENDERS = Number(process.env.MIN_TENDERS || 20);

function fail(msg) {
  console.error(`✗ ${msg} — not deploying; yesterday's site stays live.`);
  process.exit(1);
}

for (const f of ["index.html", "app.js", "format.js", "style.css", "data/tenders.json", "sitemap.xml", "robots.txt", "404.html"]) {
  if (!fs.existsSync(path.join(SITE, f))) fail(`missing site/${f}`);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(path.join(SITE, "data", "tenders.json"), "utf8"));
} catch (e) {
  fail(`site/data/tenders.json is not valid JSON (${e.message})`);
}
const list = data.tenders || [];
if (list.length < MIN_TENDERS) fail(`only ${list.length} open tenders (minimum ${MIN_TENDERS})`);

const missing = list.filter((t) => !fs.existsSync(path.join(SITE, "data", "t", `${t.id}.json`)));
if (missing.length) fail(`${missing.length} tender detail files missing (e.g. ${missing[0].id})`);
const noPage = list.filter((t) => !fs.existsSync(path.join(SITE, "tender", `${t.id}.html`)));
if (noPage.length) fail(`${noPage.length} tender pages missing (e.g. tender/${noPage[0].id}.html)`);
const inMap = (fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8").match(/<loc>/g) || []).length;
if (inMap < list.length + 1) fail(`sitemap.xml lists ${inMap} URLs, expected at least ${list.length + 1}`);

console.log(`✓ Site OK: ${list.length} open tenders, all detail files and pages present, sitemap has ${inMap} URLs.`);
