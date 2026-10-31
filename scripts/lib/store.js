// data/tenders.json: every open tender we know about, normalised, keyed by tender id.
// fetch.js writes it; extract.js and build.js read it.
const fs = require("fs");
const path = require("path");
const { normalise } = require("./normalise");

const ROOT = path.join(__dirname, "..", "..");
const STORE = path.join(ROOT, "data", "tenders.json");

// Write via a temp file so a reader never sees half a file.
function writeJsonAtomic(file, data, pretty) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, pretty ? 1 : 0));
  fs.renameSync(tmp, file);
}

// Accepts the store ({ tenders: [...] }) or a raw OCDS release array (e.g. data/raw-sample.json).
function loadTenders(file = STORE) {
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(data)) return data.map(normalise);
  return data.tenders || [];
}

module.exports = { STORE, ROOT, writeJsonAtomic, loadTenders };
