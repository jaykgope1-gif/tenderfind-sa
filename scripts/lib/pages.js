// Static HTML for each tender (site/tender/<id>.html), plus sitemap.xml, robots.txt and 404.html.
// Pages work without JavaScript; a few lines of script only keep the countdown current.
const { OPERATOR } = require("./config");
const { esc, detailHtml, closingText, countdown, briefingText, NOT_STATED } = require("./display");

const BRAND = "TenderFind SA";
const PROMISE = "Every SA government tender, in plain English, on your phone.";
const DISCLAIMER = "Data from National Treasury eTenders (public domain). Always confirm details on the official portal before bidding.";

// The sign-up box shown on every page (site/index.html has the same markup). site/signup.js loads the form on tap.
const signupHtml = (root) => `<section class="signup" id="signup" aria-labelledby="signup-h">
<h2 id="signup-h">Get tenders for your trade by email every morning</h2>
<p>Free for 14 days, then R149 a month (or R1,490 a year, 2 months free). Pick your trade and province and we’ll email you the new tenders each morning. WhatsApp alerts are coming soon. <a href="${root}pricing.html">See pricing</a></p>
<button class="btn wa wide" type="button" data-signup>Start my 14-day free trial</button>
<div class="signup-form" hidden><iframe title="Sign up for tender alerts" width="100%" height="1150" frameborder="0" marginheight="0" marginwidth="0"></iframe></div>
<noscript><p><a href="https://tally.so/r/EqKWVX">Open the sign-up form</a></p></noscript>
</section>`;

const cut = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max - 1)).replace(/[\s,;:.(–-]+$/, "") + "…");
const place = (t) => t.location?.value || t.province?.value || null;
const ymdOf = (iso) => (iso || "").slice(0, 10);

// Up to `n` open tenders in the same trade: same province first, then same buyer, then closing soonest.
function similar(t, openByTrade, n = 5) {
  const pool = (openByTrade[t.trade] || []).filter((o) => o.id !== t.id);
  const score = (o) => (o.province?.value && o.province.value === t.province?.value ? 2 : 0) + (o.buyer && o.buyer === t.buyer ? 1 : 0);
  return pool
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || a.o.closing.localeCompare(b.o.closing))
    .slice(0, n)
    .map((x) => x.o);
}

function metaDescription(t, closed) {
  const where = place(t);
  const b = t.briefing?.value;
  const parts = [
    `${closed ? "Closed tender" : `${t.trade} tender`} from ${t.buyer || "a government buyer"}${where && where !== "National" ? ` (${where})` : ""}.`,
    closed ? `Closed ${closingText(t.closing)}.` : `Closes ${closingText(t.closing)}.`,
    !closed && b && b.compulsory === true ? `Compulsory briefing.` : "",
    !closed && t.cidb_grade?.value ? `CIDB ${t.cidb_grade.value}.` : "",
    `${t.summary || t.title}.`,
  ];
  return cut(parts.filter(Boolean).join(" "), 158);
}

function whatsappText(t, url) {
  const b = t.briefing?.value;
  const lines = [`*${t.summary || t.title}*`, `${t.buyer || ""}${place(t) ? " · " + place(t) : ""}`, `Closes: ${closingText(t.closing)}`];
  if (b && b.compulsory === true) lines.push(`Compulsory briefing${b.date ? ": " + briefingText(b) : " (see documents)"}`);
  if (t.cidb_grade?.value) lines.push(`CIDB: ${t.cidb_grade.value}`);
  lines.push("", `Details: ${url}`);
  return lines.join("\n");
}

function shell({ title, description, canonical, body, root, extraHead = "", script = "", signup = true }) {
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">\n` : ""}<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta name="theme-color" content="#0b5d3b">
${extraHead}<link rel="stylesheet" href="${root}style.css">
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="${root}">TenderFind <span>SA</span></a>
<p class="promise">${esc(PROMISE)}</p>
</div></header>
<main class="wrap page">
${body}
${signup ? signupHtml(root) : ""}
</main>
<footer class="foot"><div class="wrap">
<p>${esc(DISCLAIMER)}</p>
<p class="links"><a href="${root}">Search tenders</a> · <a href="${root}tenders/">Tenders by trade</a> · <a href="${root}pricing.html">Pricing</a> · <a href="${root}registration-help.html">CSD &amp; CIDB help</a> ·<a href="${root}about.html">About</a> · <a href="${root}privacy.html">Privacy</a>${OPERATOR.email ? ` · <a href="mailto:${esc(OPERATOR.email)}">Contact</a>` : ""}</p>
</div></footer>
${signup ? `<script src="${root}signup.js" defer></script>
` : ""}${script}</body>
</html>
`;
}

function similarHtml(t, list) {
  const tradeLink = `../?trade=${encodeURIComponent(t.trade)}`;
  if (!list.length) {
    return `<section id="similar" class="similar"><h2>Similar open tenders</h2>
<p>No other open ${esc(t.trade)} tenders right now. <a href="../">Search all open tenders</a></p></section>`;
  }
  return `<section id="similar" class="similar"><h2>Similar open tenders</h2>
<ol>${list.map((o) => `<li><a href="${esc(o.id)}.html"><b>${esc(o.summary || o.title)}</b><span>${esc(o.buyer || "")}${place(o) ? " · " + esc(place(o)) : ""}</span><span class="due" data-closing="${esc(o.closing)}">Closes ${esc(closingText(o.closing))}</span></a></li>`).join("")}</ol>
<p><a class="btn wide" href="${esc(tradeLink)}">See all open ${esc(t.trade)} tenders</a></p></section>`;
}

// Keeps "Closes in 3 days" current between daily rebuilds, and flips the page to closed if it passes.
const COUNTDOWN_SCRIPT = `<script src="../format.js"></script>
<script>
document.querySelectorAll("[data-closing]").forEach(function (e) {
  var c = TF.countdown(e.dataset.closing);
  e.textContent = c.closed ? "Closed" : c.text;
  e.classList.toggle("soon", c.soon);
  if (c.closed && e.id === "due") { document.getElementById("closed-note").hidden = false; var a = document.getElementById("share"); if (a) a.hidden = true; }
});
</script>
`;

// t: full detail record (open) or archive record (closed).
function tenderPage(t, { siteUrl, closed, similarList }) {
  const url = `${siteUrl}/tender/${t.id}.html`;
  const cd = countdown(t.closing);
  const where = place(t);
  const tags = [`<span class="tag">${esc(t.trade)}</span>`];
  if (!closed && cd.soon) tags.push(`<span class="tag soon">Closing soon</span>`);
  if (closed) tags.push(`<span class="tag closed">Closed</span>`);

  const facts = closed
    ? `<div class="detail"><dl>
<dt>What they wanted</dt><dd>${esc(t.description || NOT_STATED)}</dd>
<dt>Who was buying</dt><dd>${esc(t.buyer || NOT_STATED)}${t.type ? ` · ${esc(t.type)}` : ""}${t.reference ? ` · Ref ${esc(t.reference)}` : ""}</dd>
<dt>Closed</dt><dd>${esc(closingText(t.closing))}</dd>
<dt>Official record</dt><dd><a href="${esc(t.source)}" target="_blank" rel="nofollow noopener">National Treasury eTenders data</a></dd>
</dl></div>`
    : `<div class="detail">${detailHtml(t)}</div>`;

  const share = closed ? "" : `<div class="actions">
<a class="btn wa" id="share" href="https://wa.me/?text=${encodeURIComponent(whatsappText(t, url))}" target="_blank" rel="noopener">Share on WhatsApp</a>
${t.documents?.[0] ? `<a class="btn" href="${esc(t.documents[0].url)}" target="_blank" rel="nofollow noopener">Open documents</a>` : ""}
</div>`;

  const body = `<p class="crumbs"><a href="../">← All open tenders</a></p>
<div class="closed-note" id="closed-note"${closed ? "" : " hidden"}><b>This tender has closed.</b> Bids can no longer be submitted. <a href="#similar">See similar open tenders</a></div>
<article class="card tender">
<div class="tags">${tags.join("")}</div>
<h1>${esc(t.summary || t.title)}</h1>
<p class="meta">${esc(t.buyer || "Buyer not stated")} · ${esc(where || "Province not stated")}</p>
<p class="due${!closed && cd.soon ? " soon" : ""}">${closed ? "Closed" : `<span id="due" data-closing="${esc(t.closing)}">${esc(cd.text)}</span>`} <span class="meta">(${esc(closingText(t.closing))})</span></p>
${share}
${facts}
${closed ? "" : `<p class="help-link"><b>Need help with this tender?</b> We go through the documents with you and give you a checklist of everything to submit. <a href="../help.html?service=bid&amp;tender=${esc(t.id)}">Request Bid Help (R550)</a></p>`}
</article>
${similarHtml(t, similarList)}`;

  return shell({
    title: `${cut(t.summary || t.title, 70)}${closed ? " (closed)" : ""} | ${BRAND}`,
    description: metaDescription(t, closed),
    canonical: url,
    root: "../",
    extraHead: `<meta property="og:type" content="article">\n`,
    body,
    script: COUNTDOWN_SCRIPT,
  });
}

// extra: other site paths (e.g. "tenders/cleaning-tenders-gauteng.html"), rebuilt today.
function sitemap(siteUrl, pages, today, extra = []) {
  const urls = [{ loc: `${siteUrl}/`, lastmod: today }, { loc: `${siteUrl}/about.html` }, { loc: `${siteUrl}/privacy.html` }, { loc: `${siteUrl}/pricing.html` },
    ...extra.map((p) => ({ loc: `${siteUrl}/${p}`, lastmod: today })),
    ...pages.map((p) => ({ loc: `${siteUrl}/tender/${p.id}.html`, lastmod: p.lastmod }))];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
}

const robots = (siteUrl) => `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

// GitHub Pages serves this for any missing path, so links must be absolute.
function notFound(siteUrl) {
  return shell({
    title: `Page not found | ${BRAND}`,
    description: "This page doesn't exist. Search open South African government tenders.",
    root: `${siteUrl}/`,
    body: `<div class="card"><h1>Page not found</h1>
<p>This tender may be more than a year old, or the link was mistyped.</p>
<p><a class="btn wide" href="${esc(siteUrl)}/">Search all open tenders</a></p></div>`,
  });
}

module.exports = { signupHtml, shell, tenderPage, sitemap, robots, notFound, similar, ymdOf };
