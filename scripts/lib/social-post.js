// Daily social post for WhatsApp Status / Facebook: 5 broadly useful Gauteng tenders closing in the next 7 days.
// Plain JavaScript with no require(): the same code runs in the n8n "Daily social post" workflow.
// Input: the site's compact index (site/data/tenders.json: { tenders: [{ id, t, b, p, tr, c }] }).

const SOCIAL = {
  SIGNUP: "https://jaykgope1-gif.github.io/tenderfind-sa/#signup",
  PROVINCE: "Gauteng",
  DAYS: 7,
  COUNT: 5,
  MAX_CHARS: 600,
  // Trades most small businesses can bid on rank first; 0 = never picked.
  TRADE_RANK: { "Cleaning": 3, "Security": 3, "Catering": 3, "Supplies": 3, "Maintenance & repairs": 3, "Construction": 2, "Transport": 2, "Other": 1, "IT": 1, "Professional services": 0 },
};
// Too specialised for a general audience, or not a tender to supply anything (sales of scrap, auctions).
const SPECIALISED = /\b(offer to purchase|disposal of|auction\w*|sale of|consult\w*|engineer\w*|actuar\w*|audit\w*|legal|attorney|valuation|feasibility|calibrat\w*|laborator\w*|sampling|emission\w*|analytics|ibm|sap|oracle|licen[cs]e\w*|software|reactor|dosimeter\w*|radar|telemetry|scada|forensic|psycholog\w*|investigat\w*|research|interpret\w*|translat\w*)\b/i;
// Everyday goods and services many small businesses can supply rank above technical parts.
const EVERYDAY = /\b(toilet|soap|clean\w*|hygiene|office|stationery|lights?|lighting|plumbing|electrical|paint\w*|furniture|uniforms?|ppe|safety|catering|food|meals|security|guard\w*|garden\w*|grass|refuse|waste removal|transport|vehicles?)\b/i;
// Product model codes ("RTN 380AXH", "MSA 2060") mean specialised equipment.
const MODEL_CODE = /\b(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9-]{4,}\b/;
const BUYER_ALIAS = { "Passenger Rail Agency of South Africa": "PRASA", "Airports Company of South Africa": "ACSA", "South African National Roads Agency": "SANRAL" };

const TZ = "Africa/Johannesburg";
const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const dayLabel = (iso) =>
  new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })
    .format(new Date(iso)).replace(",", "").replace(/ 0(\d)/, " $1"); // "Tue 3 Nov"

const cut = (s, max) => (s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[,;:\-–]$/, "") + "…" : s);

// "RFQ for the provision of cleaning services at …" -> "Cleaning services at …"
function shortTitle(title) {
  let s = String(title || "").replace(/\s+/g, " ").replace(/…$/, "").trim();
  s = s.replace(/^[a-z]*\d[\w\/.\-]*\s*[-–:]\s*/i, ""); // leading reference code, e.g. "JW151/26 - "
  s = s.replace(/^\d+\s+(?=[a-z])/i, ""); // leading item number, e.g. "27 Supply of …"
  s = s.replace(/^(re-?advert(isement)?|advertisement|rfq|request for (a )?quot\w*( \(rfq\))?)\s*[:\-–]?\s*/i, "");
  s = s.replace(/^(for )?(the )?appointment of (a |an )?(suitable |qualified )?(service provider|contractor|company)(s|\/s)?\s*(for|to)\s*(the )?/i, "");
  s = s.replace(/^(for )?(the )?(provision|rendering|procurement) of (the )?/i, "");
  s = s.replace(/^(supply and delivery|supply, deliver\w*( and \w+)?) of /i, "Supply of ");
  s = s.replace(/\s*[(\[][^)\]]*\b(rfq|bid|tender|ref|no\.?)\b[^)\]]*[)\]]/gi, "");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return cut(s, 48);
}
const shortBuyer = (b) => cut(BUYER_ALIAS[String(b || "").trim()] || String(b || "Buyer not stated").replace(/\s+/g, " ").trim(), 32);

function buildSocialPost(tenders, now = new Date()) {
  const today = dayKey(now);
  const until = new Date(now.getTime() + SOCIAL.DAYS * 864e5);
  const rank = (t) => (SOCIAL.TRADE_RANK[t.tr] || 0) && (SOCIAL.TRADE_RANK[t.tr] + (EVERYDAY.test(t.t) ? 2 : 0));
  const pool = tenders
    .filter((t) => t.p === SOCIAL.PROVINCE && new Date(t.c) > now && new Date(t.c) <= until && dayKey(new Date(t.c)) > today) // not closing today
    .filter((t) => rank(t) > 0 && !SPECIALISED.test(t.t) && !MODEL_CODE.test(shortTitle(t.t)))
    .sort((a, b) => rank(b) - rank(a) || a.c.localeCompare(b.c));

  // Variety first (max 2 per trade, 3 per buyer), then fill gaps allowing up to 4 per buyer.
  const chosen = [];
  const perTrade = {};
  const perBuyer = {};
  for (const t of pool) {
    if (chosen.length === SOCIAL.COUNT) break;
    if ((perTrade[t.tr] || 0) >= 2 || (perBuyer[t.b] || 0) >= 3) continue;
    perTrade[t.tr] = (perTrade[t.tr] || 0) + 1;
    perBuyer[t.b] = (perBuyer[t.b] || 0) + 1;
    chosen.push(t);
  }
  for (const t of pool) {
    if (chosen.length === SOCIAL.COUNT) break;
    if (chosen.includes(t) || (perBuyer[t.b] || 0) >= 4) continue; // relax the trade limit, keep a buyer limit
    perBuyer[t.b] = (perBuyer[t.b] || 0) + 1;
    chosen.push(t);
  }
  chosen.sort((a, b) => a.c.localeCompare(b.c));

  const foot = `Get tenders for your trade by email every morning. Free trial: ${SOCIAL.SIGNUP}`;
  let lines = chosen.map((t) => `• ${shortTitle(t.t)} – ${shortBuyer(t.b)} – closes ${dayLabel(t.c)}`);
  const compose = () => [`📢 ${lines.length} ${SOCIAL.PROVINCE} government tenders closing this week`, "", ...lines, "", foot].join("\n");
  let text = compose();
  while (text.length > SOCIAL.MAX_CHARS && lines.length > 3) { lines = lines.slice(0, -1); text = compose(); }
  return { text, count: lines.length, chars: text.length, ids: chosen.slice(0, lines.length).map((t) => t.id) };
}

if (typeof module !== "undefined" && module.exports) module.exports = { buildSocialPost, shortTitle };
