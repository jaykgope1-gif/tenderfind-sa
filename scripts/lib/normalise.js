// OCDS release -> flat tender. Field paths verified against live eTenders data (Oct 2026):
// the feed has no province, briefing, CIDB or contact fields; items/parties are always empty.
const { buyerProvince, descriptionProvince } = require("./provinces");

const NOT_STATED = "Not stated — check the tender documents";

// Checked in order; the first trade whose pattern matches wins. Specific before general:
// training before the trade it trains for, cyber-security before guarding, services before "supply".
const TRADES = [
  ["Professional services", /\b(training|trade test|short courses?|learnerships?|skills? development|capacitation|entrepreneurship (development )?programme|marketing agency|consulting engineer\w*|implementing agent)\b/i],
  ["IT", /\b(cyber ?security|security operations cent(er|re)|threat intelligence|off-site backup|backup tapes|backup (storage|solution|software)|ibm|analytics|information technology|ict|it services|software|sap|network|laptops?|computers?|monitors?|licen[cs]es?|servers?|cloud|website|microsoft|data cent(er|re)|digital display|signage solution|business continuity)\b/i],
  // Titles that open with "supply ..." / "purchase of" / "to procure" are buying goods.
  ["Supplies", /^(re-?advertisement:?\s*)?(request for (a )?quot\w*\s*(\(rfq\))?\s*(for|of)?\s*(the )?)?(supply|purchase of|to procure)\b/i],
  ["Security", /\b(security services?|security (systems?|company|guards?|officers?)|guarding|guards?|cctv|access control|alarm|armed response|surveillance)\b/i],
  ["Cleaning", /\b(cleaning|cleaners?|hygiene|sanitary|sanitation services|pest control|fumigation|refuse|waste|grass cutting|garden(ing)?|grounds maintenance|landscaping|horticultur\w*|laundry|alien (invasive )?(vegetation|plant)|invasive|vegetation (clearing|management)|firebreaks?|beautification|dredging)\b/i],
  ["Catering", /\b(catering|meals|food|refreshments|canteen|kitchen)\b/i],
  ["Transport", /\b(transport(ation)?|vehicle hire|car hire|bus(es)?|fleet|shuttle|courier|logistics|travel management|removal of furniture|aircraft|uld pallets|gear ?box(es)?|gerbox(es)?|diffs|mercedes|fuel bowsers?|mobile crane|trucks?)\b/i],
  // Electrical/mechanical equipment: named outright, or any maintenance/repair word plus a piece of kit.
  // Building, civil and road maintenance stay under Construction.
  ["Maintenance & repairs", /\b(air[- ]?condition\w*|hvac|chillers?|heaters?|boilers?|generators?|substations?|lifts|lifting equipment|elevators?|escalators?|compressors?|precipitators?|turbines?|flow meters|uninterruptible power|high mast lights?|street lights?)\b/i],
  ["Maintenance & repairs", /\b(maint\w*|repairs?|servicing|service of|overhaul|inspections?)\b.*\b(equipment|workshop machines|engines?|systems?|valves|pumps?|roller doors?|lights?|lighting|coalescers|purifiers|condensers?|heat exchangers?)\b|\b(equipment|engines?|systems?|valves|pumps?|lights?|lighting)\b.*\b(maintenance|repairs?|servicing)\b/i],
  ["Construction", /\b(construction|contractors?|building works?|building maintenance|renovations?|refurbishment|civil|roads?\b(?! ?block| accident)|stormwater|paving|plumbing|sewer|electrical|wiring|lighting|boreholes?|cidb|upgrad(e|es|ing)|ugpgrade|rehabilitation|repairs?|maintenance|hvac|air[- ]?condition\w*|chillers?|boilers?|generators?|fence|fencing|reticulation|substations?|sinkhole|precipitators?|railway track|dust suppression|roofs?|roofing|fire protection|flow meters|turbine|valves)\b/i],
  ["Professional services", /\b(consult(ing|ancy|ants?)|audit|legal|advisory|research|valuation|actuarial|feasibility|panel of|professional|study|surveys?|assessment|evaluation|investigation|review|marketing|advertising|publication|print media|media|photograph\w*|video|graphic design|design and layout|television|commercial production|event management|events?|conference|agm|annual general meeting|interpret\w*|headhunting|recruitment|employee (assistance|wellness|wellbeing)|wellness|project management|prince2|awareness programmes?|wellness programme|development programme|auctioneer\w*|banking|financial institution|certification|calibration|weather forecasting|architect\w*|engineering services|engineer|implementing agent|implementation agent|energy services company|fraud hotline|records|quality management system|stakeholder engagement|mural|organisational structure|regulations)\b/i],
  ["Supplies", /\b(supply|supplies|delivery|deliver|stationery|paper|cartridges?|multi-functional print\w*|photocopi\w*|copiers?|ppe|uniforms?|clothing|t-shirts|furniture|equipment|toner|consumables|chemicals|purchase of|procurement of|oil|containers|unmanned aerial|baler)\b/i],
];
// When no keyword matches, the feed's own procurement category is a reasonable guide.
const CATEGORY_TRADE = { goods: "Supplies", works: "Construction", consultingServices: "Professional services" };

// eTenders stores SA wall-clock time but labels it "Z" (most close at "10:00Z"/"11:00Z").
const sast = (s) => (s ? s.replace(/Z$/, "+02:00") : null);

function cleanText(s) {
  s = (s || "").replace(/\s+/g, " ").trim();
  if (s && s === s.toUpperCase()) s = s.charAt(0) + s.slice(1).toLowerCase(); // tame ALL CAPS
  return s;
}

// Cut at a word boundary so titles don't end mid-word.
function shorten(s, max) {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length).replace(/[\s,;:(–-]+$/, "") + "…";
}

const firstTrade = (text) => (TRADES.find(([, re]) => re.test(text || "")) || [])[0];

// Title first, then the rest of the description and the bid reference, then the feed category.
function trade(t) {
  return firstTrade(t.title) || firstTrade(`${t.description || ""} ${t.reference || ""}`) ||
    (t.categories || []).map((c) => CATEGORY_TRADE[c]).find(Boolean) || "Other";
}

function province(buyer, description) {
  const fromText = descriptionProvince(description);
  if (fromText) return { value: fromText, source: "feed" };
  const fromBuyer = buyerProvince(buyer);
  if (fromBuyer) return { value: fromBuyer, source: "buyer-mapping" };
  return { value: null, source: "not found" };
}

function normalise(r) {
  const t = r.tender;
  const buyer = (r.buyer?.name || t.procuringEntity?.name || "").replace(/\s+/g, " ").trim();
  const description = cleanText(t.description);
  const categories = [...new Set([t.mainProcurementCategory, ...(t.additionalProcurementCategories || [])].filter(Boolean))];
  const out = {
    id: t.id,
    ocid: r.ocid,
    reference: (t.title || "").trim(), // eTenders "title" is usually the bid number
    title: shorten(description, 140) || t.title,
    description: description || null,
    buyer: buyer || null,
    province: province(buyer, t.description),
    category: categories[0] || null,
    categories,
    type: t.procurementMethodDetails || null,
    published: sast(t.tenderPeriod?.startDate),
    closing: sast(t.tenderPeriod?.endDate),
    documents: (t.documents || []).map((d) => ({ title: d.title, url: d.url, format: d.format })),
    source: `https://ocds-api.etenders.gov.za/api/OCDSReleases/release/${r.ocid}`,
  };
  out.trade = trade(out);
  return out;
}

// Trade and province are re-derived at build time, so rule changes apply without a refetch.
function classify(t) {
  return { ...t, trade: trade(t), province: province(t.buyer || "", t.description || "") };
}

module.exports = { normalise, classify, NOT_STATED };
