// Site-wide settings. Change them here; the next build updates every page.
module.exports = {
  // Where the site is published (custom domain since 2026-11-03; or set SITE_URL).
  SITE_URL: (process.env.SITE_URL || "https://tenderfind.co.za").replace(/\/$/, ""),

  // Who runs the service. Shown on the privacy page as the POPIA "responsible party" and
  // the contact for access, correction and deletion requests. Fill in before taking sign-ups.
  OPERATOR: {
    name: "Jay Kgope",
    location: "Pretoria, South Africa",
    email: "info@tenderfind.co.za", // Zoho Mail (free), set up 2026-11-04. Alerts still send from the Gmail in n8n.
    whatsapp: "27692898507", // international format, e.g. "27821234567". Also powers "WhatsApp us to subscribe" on /pricing.
    // Supplier details the ECT Act (section 43) requires on the Terms page. null shows "available on request"
    // and the build prints a reminder; fill them in as soon as you have them.
    legalStatus: "a sole proprietor (not a registered company)", // or e.g. "TenderFind SA (Pty) Ltd, registration number 2026/123456/07"
    address: null, // full physical address for legal notices, e.g. "12 Example Street, Hatfield, Pretoria, 0083"
    vatRegistered: false, // true once registered for VAT; prices then say "including VAT"
  },

  // Every price on the site comes from here (pricing, home page, sign-up box, help form, pay page, terms).
  // scripts/lib/match.js runs inside n8n and can't read this file, so it repeats ALERTS_PRICE, BID_HELP and
  // TRIAL_DAYS: npm test fails if they don't match these. After changing a price, also change it in n8n
  // (see README "Pricing").
  PRICING: {
    alerts: 149, alertsYear: 1490, trialDays: 14, // Alerts: the main plan
    pro: 499, proYear: 4990, proEmails: 3, // Pro: Alerts plus up to proEmails addresses, checklist in the email, priority WhatsApp
    bidHelpFrom: 1500, bidHelpMax: 5000, // Bid Help per tender: "from" price; bigger tenders quoted up to the max
    deskFrom: 3500, // Tender Desk: done-for-you, "from" price per month
    csdHelpPrice: 300, cidbHelpPrice: 500,
    partnerFrom: 5000, partnerMembers: 100, // /partners.html: bulk alert seats, "from" price a month for this many members
  },
  // false until the real PayFast account is approved: subscribe buttons stay "WhatsApp us" and pay/ links are test-only.
  // When live: set true here AND MODE = 'live' in the n8n "Payments: pay link" workflow.
  PAYMENTS_LIVE: false,
  // Help requests (Bid Help, CSD, CIDB) from site/help.js go to this n8n webhook, which emails the owner.
  HELP_WEBHOOK: "https://jaykgope.app.n8n.cloud/webhook/tenderfind-help",
};
