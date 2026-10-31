// Site-wide settings. Change them here; the next build updates every page.
module.exports = {
  // Where the site is published. Update when a custom domain is added (or set SITE_URL).
  SITE_URL: (process.env.SITE_URL || "https://jaykgope1-gif.github.io/tenderfind-sa").replace(/\/$/, ""),

  // Who runs the service. Shown on the privacy page as the POPIA "responsible party" and
  // the contact for access, correction and deletion requests. Fill in before taking sign-ups.
  OPERATOR: {
    name: "", // e.g. "Jane Dlamini t/a TenderFind SA"
    email: "", // e.g. "hello@tenderfind.co.za"
    whatsapp: "", // international format, e.g. "27821234567"
  },
};
