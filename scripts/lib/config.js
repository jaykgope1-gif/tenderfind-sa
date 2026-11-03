// Site-wide settings. Change them here; the next build updates every page.
module.exports = {
  // Where the site is published (custom domain since 2026-11-03; or set SITE_URL).
  SITE_URL: (process.env.SITE_URL || "https://tenderfind.co.za").replace(/\/$/, ""),

  // Who runs the service. Shown on the privacy page as the POPIA "responsible party" and
  // the contact for access, correction and deletion requests. Fill in before taking sign-ups.
  OPERATOR: {
    name: "Jay Kgope",
    location: "Pretoria, South Africa",
    email: "jobkgope1@gmail.com",
    whatsapp: "27692898507", // international format, e.g. "27821234567". Also powers "WhatsApp us to subscribe" on /pricing.
  },

  // Shown on /pricing and in the sign-up box. The trial length must match TRIAL_DAYS in scripts/lib/match.js.
  // bidHelpPrice: Bid Help price per tender in rand, paid once before work starts; null shows "Ask us".
  PRICING: { alerts: 149, trialDays: 14, bidHelpPrice: 550 },
};
