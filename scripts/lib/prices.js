// Price text for the pages, always from PRICING in config.js, so no page has a price typed in by hand.
const { PRICING } = require("./config");

// 1490 -> "R1,490" (South African style with a comma, never a space).
const rand = (n) => `R${Number(n).toLocaleString("en-ZA").replace(/\s/g, ",")}`;

const P = {
  alerts: rand(PRICING.alerts),
  alertsYear: rand(PRICING.alertsYear),
  alertsSaving: rand(PRICING.alerts * 12 - PRICING.alertsYear),
  pro: rand(PRICING.pro),
  proYear: rand(PRICING.proYear),
  proSaving: rand(PRICING.pro * 12 - PRICING.proYear),
  bidHelp: `from ${rand(PRICING.bidHelpFrom)}`,
  bidHelpFrom: rand(PRICING.bidHelpFrom),
  bidHelpMax: rand(PRICING.bidHelpMax),
  desk: `from ${rand(PRICING.deskFrom)}`,
  deskFrom: rand(PRICING.deskFrom),
  csd: rand(PRICING.csdHelpPrice),
  cidb: rand(PRICING.cidbHelpPrice),
  csdCidb: rand(PRICING.csdHelpPrice + PRICING.cidbHelpPrice),
  trialDays: String(PRICING.trialDays),
};

// The prices marked in the hand-written site/index.html as <span data-price="key">…</span>.
// build.js fills them in; check-site.js refuses to deploy if one is out of date.
function fillPrices(html) {
  return html.replace(/(<span data-price="([\w]+)">)[^<]*(<\/span>)/g, (m, open, key, close) => {
    if (!(key in P)) throw new Error(`site/index.html: unknown data-price="${key}"`);
    return open + P[key] + close;
  });
}

module.exports = { rand, P, fillPrices };
