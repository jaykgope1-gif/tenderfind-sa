// "What you'll need to submit": the returnable documents and forms a tender's own documents ask for.
//
// The one rule applies: only what the document text actually says. Every item keeps the line it was found on
// (its evidence), nothing is guessed from the trade or the buyer, and when the documents can't be read we say so.
//
//   findReturnables([text, text, …]) -> { status, section, items: [{ key, label, snippet }] }
//     status "found"       items were found (section true: in a returnables list or checklist;
//                          section false: no such list, only SBD/MBD forms named somewhere in the documents)
//     status "none-found"  the documents were read, but no list of returnable documents was found
//     status "unreadable"  no text to read (scanned, no PDF, too big, download error, no documents online)

// Where a list of returnable documents starts. Tables of contents also match, which is why every match is tried
// and only a stretch of text that really lists several items counts (see MIN_ITEMS).
const ANCHOR = /returnable\s+(documents|schedules|forms)|documents?\s+(to\s+be|that\s+must\s+be)\s+(submitted|returned|attached)|mandatory\s+(returnable\s+)?documents|compulsory\s+documents|(submission|bid|tender|compliance)\s+checklist|checklist\s+(for|of)\s+(completeness|returnable|documents|the\s+bid)|following\s+checklist|supply\s+the\s+following\s+documents|administrative\s+(requirements|compliance)|documents?\s+required\s+(for|with)\s+(the\s+)?(bid|tender|submission)/gi;
const WINDOW = 3500; // characters read after each anchor
const MIN_ITEMS = 3; // a stretch with fewer known items is a mention, not a list

// Standard bid forms: SBD (national and provincial) and MBD (municipal). We show only the code, never a name of
// our own: buyers don't all use the same numbers for the same form (one municipality's "MBD 5" is its general
// conditions of contract). The document's own words are shown next to each item instead.
const FORM_RE = /\b(SBD|MBD)\s?([1-9](?:\.\d)?)(?!\d|\.\d)/g; // SBD 1 … SBD 9, SBD 6.1 …
// Forms only the winning bidder fills in later ("the successful bidder will be required to … (MBD 7)").
const LATER = /successful\s+bidder\s+will\s+be\s+required/i;

// Other documents, in the order they're shown. Each pattern must name the document itself, not the topic.
const DOCS = [
  { key: "csd", label: "CSD registration report (your MAAA supplier number)", re: /central\s+supplier(s)?\s+database|\bCSD\b|\bMAAA\b/i },
  { key: "tax", label: "Tax compliance status PIN from SARS (or tax clearance certificate)", re: /tax\s+(clearance|compliance)|\b(SARS|TCS|tax)\s+PIN\b/i },
  { key: "bbbee", label: "B-BBEE certificate or sworn affidavit", re: /\bB-?\s?BBEE\b|\bBBBEE\b|\bBEE\s+certificate|sworn\s+affidavit/i },
  { key: "cidb", label: "CIDB registration", re: /\bCIDB\b|construction\s+industry\s+development\s+board/i },
  { key: "company", label: "Company registration documents (CIPC)", re: /\bCIPC\b|company\s+registration\s+(documents?|certificates?)|registration\s+(documents|certificate)\s+of\s+the\s+(company|business)|\bCK\s?1\b|\bCOR\s?14\.3\b/i },
  { key: "id", label: "Certified ID copies (owners or directors)", re: /\bID\s+(copies|documents?)\b|copies\s+of\s+(the\s+)?(identity|ID)\b|identity\s+documents?/i },
  { key: "rates", label: "Municipal rates account, not in arrears", re: /municipal\s+(account|rates|statement|services\s+account)|rates\s+and\s+taxes|rates\s+clearance/i },
  { key: "briefing", label: "Briefing session attendance certificate", re: /(briefing|site\s+(meeting|inspection|visit)|clarification\s+meeting)[^\n]{0,40}(certificate|attendance|register)|attendance\s+(certificate|register)/i },
  { key: "coida", label: "COIDA letter of good standing", re: /\bCOID(A)?\b|compensation\s+fund|workm[ae]n['’]?s\s+compensation/i },
  { key: "bank", label: "Bank confirmation letter", re: /bank\s+(confirmation|rating|letter)|letter\s+from\s+(the|your)\s+bank|proof\s+of\s+banking/i },
  { key: "pricing", label: "Pricing schedule or bill of quantities", re: /pricing\s+schedule|price\s+schedule|bill\s+of\s+quantities|\bBOQ\b|priced\s+offer/i },
  { key: "jv", label: "Joint venture agreement (if you bid as a joint venture)", re: /joint\s+venture\s+agreement|consortium\s+agreement/i },
  { key: "psira", label: "PSIRA registration", re: /\bPSIRA\b/ },
  { key: "professional", label: "Professional registration", re: /\b(ECSA|SACPCMP|SACAP|SACQSP|SACLAP|SAGC|SAIPA|SAICA)\b/, bodies: /\b(ECSA|SACPCMP|SACAP|SACQSP|SACLAP|SAGC|SAIPA|SAICA)\b/g },
];

// A line that marks the item as not needed for this tender. Checked on the item's own line only.
const NOT_NEEDED = /\bnot\s+applicable\b|\bn\/a\b|\bnot\s+required\b/i;
const ownLine = (text, index) => {
  const end = text.indexOf("\n", index);
  return text.slice(text.lastIndexOf("\n", index) + 1, end < 0 ? text.length : end);
};

// The line around a match, as evidence (one line, at most 160 characters).
function lineAt(text, index) {
  const start = text.lastIndexOf("\n", index) + 1;
  let end = text.indexOf("\n", index);
  if (end < 0) end = text.length;
  let line = text.slice(start, end);
  if (line.replace(/\s/g, "").length < 25) line = text.slice(start, Math.min(text.length, end + 120)); // table cells break lines
  line = line.replace(/\s+/g, " ").trim();
  return line.length > 160 ? line.slice(0, 159).replace(/\s+\S*$/, "") + "…" : line;
}

// Known items in one stretch of text. Returns { key -> item }.
function itemsIn(text) {
  const found = new Map();
  for (const m of text.matchAll(FORM_RE)) {
    const kind = m[1].toUpperCase();
    const key = `${kind.toLowerCase()}-${m[2]}`;
    if (found.has(key)) continue;
    if (NOT_NEEDED.test(ownLine(text, m.index)) || LATER.test(text.slice(Math.max(0, m.index - 200), m.index + 40))) continue;
    found.set(key, { key, label: `${kind} ${m[2]} form`, snippet: lineAt(text, m.index) });
  }
  for (const d of DOCS) {
    const m = d.re.exec(text);
    if (!m || NOT_NEEDED.test(ownLine(text, m.index))) continue;
    const snippet = lineAt(text, m.index);
    let label = d.label;
    if (d.bodies) {
      const bodies = [...new Set([...text.matchAll(d.bodies)].map((b) => b[1].toUpperCase()))];
      label = `${d.label} (${bodies.join(", ")})`;
    }
    found.set(d.key, { key: d.key, label, snippet });
  }
  return found;
}

const ORDER = (key) => {
  const f = key.match(/^(sbd|mbd)-(.+)$/);
  if (f) return [0, f[1] === "sbd" ? 0 : 1, parseFloat(f[2])];
  return [1, DOCS.findIndex((d) => d.key === key), 0];
};
const byOrder = (a, b) => {
  const x = ORDER(a.key), y = ORDER(b.key);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

function findReturnables(texts) {
  const readable = (texts || []).filter((t) => t && t.replace(/\s/g, "").length >= 200);
  if (!readable.length) return { status: "unreadable", section: false, items: [] };

  // Every stretch after an anchor that lists at least MIN_ITEMS known items; their items together.
  const items = new Map();
  for (const text of readable) {
    for (const a of text.matchAll(ANCHOR)) {
      const win = itemsIn(text.slice(a.index, a.index + WINDOW));
      if (win.size < MIN_ITEMS) continue;
      for (const [k, v] of win) if (!items.has(k)) items.set(k, v);
    }
  }
  if (items.size) return { status: "found", section: true, items: [...items.values()].sort(byOrder) };

  // No list: only the standard forms the documents name, which are part of the bid pack.
  const forms = new Map();
  for (const text of readable) {
    for (const [k, v] of itemsIn(text)) if (/^(sbd|mbd)-/.test(k) && !forms.has(k)) forms.set(k, v);
  }
  if (forms.size) return { status: "found", section: false, items: [...forms.values()].sort(byOrder) };
  return { status: "none-found", section: false, items: [] };
}

module.exports = { findReturnables };
