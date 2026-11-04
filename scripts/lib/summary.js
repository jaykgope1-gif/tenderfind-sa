// One-line plain-English summary of a tender, from its eTenders description. Rule-based (no AI), so it never
// invents anything: it only removes procurement boilerplate, reference codes and filler, and moves the contract
// length to the end. "RFQ for the appointment of a service provider for the provision of cleaning services at
// Braamfontein depot for a period of twenty-four (24) months" -> "Cleaning services at Braamfontein depot (24 months)".
// Used on the site, in alerts and in the daily post; the full official description is still shown on each tender page.

const MAX = 110;

// A buyer selling something (scrap, vehicles, e-waste), not buying a service: not work a supplier can bid on.
const SALE = /\b(offer to purchase|offers? to buy|for sale|sale of|selling of|disposal of (redundant|obsolete|scrap|used)|auction\w*|purchase,? collection and (removal|disposal)|collect(ion)? and purchase|tender to purchase|buyers? of|offer for the purchase|purchase and removal of)\b/i;

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, eighteen: 18, twenty: 20, "twenty-four": 24, "twenty four": 24, thirty: 30, "thirty-six": 36, "thirty six": 36, sixty: 60 };

// Only number words may stand in for digits, so "pilot boat for 12 months" keeps "boat".
const NUM = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).map((w) => w.replace(/[- ]/, "[- ]")).join("|");
const DURATION = new RegExp(String.raw`\(?\b(?:(?:for|over)\s+(?:a|the)?\s*(?:period|duration|contract period)?\s*(?:of)?\s*)?(${NUM})?\s*\(?(\d{1,3})?\)?\s*\(?(${NUM})?\)?\s*[- ]?(months?|years?)\b(?:\s*(?:period|contract))?\)?`, "i");

// "for a period of twenty-four (24) months" / "for 3(three) years" / "(12 months contract)" -> "24 months"
function duration(s) {
  const m = s.match(DURATION);
  if (!m || !(m[1] || m[2] || m[3]) || !/\b(for|over)\b|\(/.test(m[0])) return { text: s, length: "" };
  const n = m[2] ? Number(m[2]) : NUMBER_WORDS[(m[1] || m[3] || "").toLowerCase()];
  if (!n) return { text: s, length: "" };
  const unit = /^y/i.test(m[4]) ? (n === 1 ? "year" : "years") : (n === 1 ? "month" : "months");
  // Drop any other "(3 years)" / "(36 months)" restating the same length.
  const text = s.replace(m[0], " ").replace(/\(\s*\d{1,3}\s*(months?|years?)\s*\)/gi, " ");
  return { text, length: `${n} ${unit}` };
}

const ADJ = "(\\(\\d+\\) |suitabl[ey] |qualified |competent |capable |reputable |experienced |accredited |professional |independent |external |specialist |reliable |panel of |pool of |two |three |four |five |several |multiple |and )*";
const PROVIDER = "(service providers?|providers?|contractors?|compan(y|ies)|bidders?|suppliers?|firms?|panel|consultants?|entit(y|ies))";
const BOILERPLATE = [
  /^\s*(re-?advert(isement)?|re-?issue|advertisement|notice|tender notice|bid notice)\s*((of|for)\b)?\s*[:\-–]?\s*/i,
  /^\s*(call for|invitation (to|for)|request (to|for)) (bid|tender|submit|quote|quotation|proposals?|quotations?|information|bids?|expressions? of interest|rf[qpit])\w*\s*([([](rf[qpit]|eoi)[)\]])?\s*[:\-–]?\s*((for|to|from)\b)?\s*(a |an |the )?/i,
  /^\s*(rf[qpibt]|eoi|bid|tender)\b\s*(no\.?|number)?\s*[:\-–]?\s*((for|to)\b)?\s*(the )?/i,
  /^\s*the [\w &().,'-]{2,80}? (wishes|intends|invites|seeks|requires|hereby invites|would like) (to )?(appoint|invite|procure|engage|source)?\s*/i,
  new RegExp(`^\\s*(for )?(the )?(appointment|procurement|engagement|sourcing|selection) of (a |an )?${ADJ}${PROVIDER}(\\s*\\/\\s*s|\\(s\\)|s)?\\s*(for|to|that will|who will|in order to)?\\s*(the )?`, "i"),
  new RegExp(`^\\s*(a |an )?${ADJ}${PROVIDER}(\\/s|\\(s\\))?\\s+(to|for)\\b\\s*(the )?`, "i"), // "A suitable service provider to conduct …"
  new RegExp(`^\\s*(appoint|invite|procure|engage) (a |an )?${ADJ}${PROVIDER}(\\/s|\\(s\\))?\\s*(for|to)?\\s*(the )?`, "i"),
  new RegExp(`^\\s*(for )?(the )?(appointment|engagement) of (a |an )?${ADJ}`, "i"), // "Appointment of a competent event company to …"
  /^\s*(for |to )?(the )?(provisions?|rendering|render|provide|rendition|facilitation) ((of|for)\b )?(the |a |an )?/i,
  /^\s*(for |to )?(the )?(procurement|purchase|acquisition) of (the |a |an )?(?!service)/i,
];
const SUPPLY = /^\s*(to )?(the )?(supply|supplying|deliver(y)?)(\s*[,&]\s*|\s+and\s+)?((deliver(y)?|install(ation)?|commission(ing)?|assembly|assemble|delivery,? installation and commissioning)(\s*[,&]\s*|\s+and\s+)?)* (of|to) (the |a |an )?/i;

const FILLER = [
  /\s*\(?\b(on an? |on )?['‘’"“”]?as (and|&) when['‘’"“”]? (required|needed)( basis)?\)?/gi,
  /\s*\bon an ad[- ]hoc basis\b/gi,
  /\s*\bin accordance with (the )?(attached |specification|terms of reference|tor)[\w ]*/gi,
  /\s*\(?\b(as per|according to) (the )?(attached )?(specifications?|terms of reference|tor|bill of quantities|boq|scope of works?)( and pictures)?\b\)?/gi,
  /\s*\(\s*(rfq|rfp|rfb|bid|tender|ref)[^)]*\)/gi,
  /\s*\b(rfq|rfp|rfb|bid|tender) (no\.?|number|ref\.?)\s*[:\-]?\s*[\w\/.\-]+/gi,
  /\s*\bfor the period\s*$/i,
];

// Acronyms that look wrong in lower case.
const ACRONYMS = ["ppe", "ohs", "epwp", "sabs", "idp", "kzn", "dbsa", "nrf", "sarao", "cctv", "ict", "hvac", "ups", "mv", "lv", "sanral", "prasa", "sars", "sassa", "csir", "nhls", "raf", "dws", "saps", "sanpc", "cidb", "csd", "tvet", "it", "sla", "ccma", "dpwi", "eoi", "atm", "lan", "wan", "pabx", "cpd", "sita", "sap"];
const ACR = new RegExp(`\\b(${ACRONYMS.join("|")})\\b`, "gi");

const tame = (s) => {
  const letters = s.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return letters.length > 12 && upper / letters.length > 0.6 ? s.toLowerCase() : s; // SHOUTED titles
};

function cut(s, max) {
  if (s.length <= max) return s;
  let c = s.slice(0, max - 1);
  const sp = c.lastIndexOf(" ");
  c = sp > max * 0.6 ? c.slice(0, sp) : c;
  if ((c.match(/\(/g) || []).length > (c.match(/\)/g) || []).length) c = c.slice(0, c.lastIndexOf("(")); // no open bracket
  return c.replace(/[\s,;:(\-–&/@]+$/, "").replace(/\s+(and|or|of|for|at|in|the|to|with|a|an|within|located)$/i, "").trim() + "…";
}

const stripRef = (s) => s
  .replace(/^[a-z]{0,8}\s?\d[\w\/.\-]*(\s*\([^)]*\))?\s*[-–:|]\s*/i, "") // "JW151/26 - ", "Prdp 32/2025-26 – "
  .replace(/^[a-z]{1,6}\d+\/[\w\/.\-]*\s+/i, "") // "Lpt009/2026 supply …"
  .replace(/^\d{1,3}\s*[.)]?\s+(?=[a-z])/i, ""); // leading item number

function summary(description, title) {
  const original = String(description || title || "").replace(/\s+/g, " ").trim();
  if (!original) return "";
  const sale = SALE.test(original);
  let s = stripRef(tame(original));
  s = s.replace(/\b[a-z]+(?:[- ][a-z]+)?\s*\((\d{1,3})\)(?=\s*-?\s*(months?|years?)\b)/gi, "$1"); // "twenty-eight (28) months" -> "28 months"
  const d = duration(s);
  s = d.text;
  for (let i = 0; i < 4; i++) { for (const re of BOILERPLATE) s = s.replace(re, ""); s = stripRef(s); }
  let goods = false;
  if (SUPPLY.test(s)) { s = s.replace(SUPPLY, ""); goods = true; }
  else if (/^\s*(to )?supply,? (and|&) deliver(y)?\s+(?!of\b)/i.test(s)) { s = s.replace(/^\s*(to )?supply,? (and|&) deliver(y)?\s+/i, ""); goods = true; }
  for (const re of FILLER) s = s.replace(re, "");
  s = s.replace(/\s+([,.;:)])/g, "$1").replace(/([,;:])(?=\S)/g, "$1 ").replace(/\(\s*\)/g, "").replace(/,\s*,/g, ",").replace(/\s{2,}/g, " ")
    .replace(/^[\s,.;:\-–]+|[\s,.;:\-–]+$/g, "").replace(/\s+(at|for|in|of|to|and|the)$/i, "");
  if (!s || s.length < 3) s = stripRef(tame(original)); // nothing useful left: keep the original
  if (goods) s = "Supply of " + s.replace(/^supply of /i, "");
  if (sale) s = "For sale by the buyer: " + s.replace(/^((of )?invitation to submit )?(an? )?(offer (to|for the) purchase,?( collectio\w* and removal| and removal)?( of)?|sale of|disposal of|purchase,? collection and (removal|disposal) of)\s*/i, "");
  s = s.replace(ACR, (a) => a.toUpperCase());
  s = s.charAt(0).toUpperCase() + s.slice(1);
  const tail = d.length ? ` (${d.length})` : "";
  return cut(s, MAX - tail.length) + tail;
}

module.exports = { summary, SALE };
