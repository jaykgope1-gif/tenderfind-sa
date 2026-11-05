// Static HTML for each tender (site/tender/<id>.html), plus sitemap.xml, robots.txt and 404.html.
// Pages work without JavaScript; a few lines of script only keep the countdown current.
const { OPERATOR } = require("./config");
const { P } = require("./prices");
const { esc, detailHtml, closingText, countdown, briefingText, NOT_STATED } = require("./display");

const BRAND = "TenderFind SA";
const PROMISE = "New government tenders for your trade, emailed every morning.";
const DISCLAIMER = "Tenders from National Treasury’s eTenders and the Gauteng e-Tender portal (public information). Always confirm details in the official documents before bidding.";

// Shared pieces of every page. site/index.html has the same header, footer and sign-up box (with on-page links).
const icon = (root, id, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="${root}icons.svg#${id}"/></svg>`;
const MARK = (bg, sheet, lines) => `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="${bg}"/><g transform="rotate(-4 16 18)"><rect x="8.5" y="9.5" width="15" height="16" rx="1" fill="${sheet}"/><path d="M11.5 15h9M11.5 18.5h9M11.5 22h5.5" stroke="${lines}" stroke-width="1.7" stroke-linecap="round"/></g><circle cx="16" cy="9.5" r="3" fill="#f3c744" stroke="#16191a" stroke-width="1.2"/></svg>`;

// The sign-up box. site/signup.js loads the Tally form on tap.
const signupHtml = (root) => `<section class="signup" id="signup" aria-labelledby="signup-h">
<h2 id="signup-h">Get tenders like this by email every morning</h2>
<p>Four quick questions. No card needed. After ${P.trialDays} days it’s ${P.alerts} a month (or ${P.alertsYear} a year), or stop. <a href="${root}pricing.html">See the price</a></p>
<button class="btn primary wide big" type="button" data-signup>Try it free for ${P.trialDays} days ${icon(root, "go", "icon icon-go")}</button>
<div class="signup-form" hidden><iframe title="Sign up for tender alerts" width="100%" height="720" frameborder="0" marginheight="0" marginwidth="0"></iframe></div>
<p class="signup-fallback" hidden>The form is taking a while. <a href="https://tally.so/r/EqKWVX">Open the sign-up form in a new page</a>.</p>
<noscript><p><a href="https://tally.so/r/EqKWVX">Open the sign-up form</a></p></noscript>
</section>`;

// "What makes us different": on the pricing page and the home page (build.js fills the block marked
// <!-- build:different --> in site/index.html). Only claims the site can back up: the summary is summary.js
// (rule-based, from the official wording), and the checklist is what extract.js finds in the documents.
const CHECKLIST_LIVE = false; // true once the per-tender checklist (Phase 4) is built
const differentHtml = (root) => `<section class="different" aria-labelledby="diff-h">
<h2 id="diff-h">What makes TenderFind different</h2>
<ul class="diff-list">
<li>${icon(root, "doc")}<div><h3>Every tender in plain English</h3><p>Each tender starts with a short summary of what they want, then who is buying, where, and when it closes. No need to read a 60-page document to see if it’s for you.</p></div></li>
<li>${icon(root, "check")}<div><h3>A checklist of what to submit${CHECKLIST_LIVE ? "" : ` <span class="tag soon-tag">Coming soon</span>`}</h3><p>The returnable documents and forms a tender asks for (SBD forms, CSD report, tax PIN, CIDB grade, B-BBEE), listed from the tender documents, so your bid doesn’t get disqualified for a missing page.</p></div></li>
<li>${icon(root, "briefing")}<div><h3>We can do the bid work for you</h3><p>With <a href="${root}help.html">Bid Help</a> and <a href="${root}pricing.html#g-for-you">Tender Desk</a>, we read the documents, build the checklist and prepare the pack. You submit.</p></div></li>
</ul>
</section>`;

// Fills the generated blocks in the hand-written site/index.html. Same input -> same output, so it only changes
// the file when the block's source changes.
function fillHomeBlocks(html) {
  return html.replace(/(<!-- build:different -->)[\s\S]*?(<!-- \/build:different -->)/, (m, a, b) => `${a}\n${differentHtml("")}\n${b}`);
}

const headerHtml = (root, cta) => `<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="container head-row">
<a class="brand" href="${root}" aria-label="TenderFind SA home">${MARK("#1d4a37", "#faf8f3", "#1d4a37")}TenderFind <b>SA</b></a>
<nav class="nav" aria-label="Main"><a href="${root}#board">This week’s tenders</a><a href="${root}#search">Search</a><a href="${root}tenders/">By trade</a><a href="${root}pricing.html">Price</a></nav>
<a class="btn primary head-cta" href="${cta}" data-signup-jump>Try it free</a>
</div></header>`;
const footerHtml = (root) => `<footer class="site-foot"><div class="container foot-grid">
<div><a class="brand" href="${root}" aria-label="TenderFind SA home">${MARK("#faf8f3", "#1d4a37", "#faf8f3")}TenderFind <b>SA</b></a>
<p>Government tenders for your trade, emailed every weekday morning. Run by ${esc(OPERATOR.name || "an independent operator")} in Pretoria.</p>
<p class="foot-note">${esc(DISCLAIMER)} TenderFind SA is independent and doesn’t sell tenders.</p></div>
<div><h3>Tenders</h3><ul><li><a href="${root}#search">Search tenders</a></li><li><a href="${root}tenders/">Tenders by trade</a></li><li><a href="${root}pricing.html">Price</a></li><li><a href="${root}help.html">Bid Help</a></li><li><a href="${root}registration-help.html">CSD &amp; CIDB help</a></li></ul></div>
<div><h3>TenderFind</h3><ul><li><a href="${root}about.html">About</a></li>${OPERATOR.email ? `<li><a href="mailto:${esc(OPERATOR.email)}">${esc(OPERATOR.email)}</a></li>` : ""}<li><a href="${root}terms.html">Terms &amp; refunds</a></li><li><a href="${root}privacy.html">Privacy</a></li></ul></div>
</div><div class="container foot-base"><p>© ${new Date().getFullYear()} TenderFind SA · Pretoria</p></div></footer>`;

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

function shell({ title, description, canonical, body, root, extraHead = "", script = "", signup = true, image = "img/share.jpg" }) {
  const cta = signup ? "#signup" : `${root}#signup`;
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">
<meta property="og:url" content="${esc(canonical)}">
` : ""}<meta name="theme-color" content="#1d4a37">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${root}favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:locale" content="en_ZA">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="https://tenderfind.co.za/${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${root}fonts/fraunces-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}fonts/public-sans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}fonts/public-sans-800.woff2" as="font" type="font/woff2" crossorigin>
${extraHead}<link rel="stylesheet" href="${root}style.css">
</head>
<body class="has-sticky">
${headerHtml(root, cta)}
<main class="wrap page" id="main">
${body}
${signup ? signupHtml(root) : ""}
</main>
${footerHtml(root)}
<a class="sticky-cta" href="${cta}" data-signup-jump>Try it free for ${P.trialDays} days ${icon(root, "go", "icon icon-go")}</a>
<script src="${root}ui.js" defer></script>
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
<dt>Check it on eTenders</dt><dd>${t.reference ? `Search for <b>${esc(t.reference)}</b> on ` : ""}<a href="https://www.etenders.gov.za/" target="_blank" rel="noopener">etenders.gov.za</a>, the official portal</dd>
</dl></div>`
    : `<div class="detail">${detailHtml(t)}</div>`;

  const share = closed ? "" : `<div class="actions">
<a class="btn wa" id="share" href="https://wa.me/?text=${encodeURIComponent(whatsappText(t, url))}" target="_blank" rel="noopener">Share on WhatsApp</a>
${t.documents?.[0] ? `<a class="btn" href="${esc(t.documents[0].url)}" target="_blank" rel="nofollow noopener">Open documents</a>` : t.portal ? `<a class="btn" href="${esc(t.portal.url)}" target="_blank" rel="noopener">Get the documents</a>` : ""}
</div>`;

  const body = `<p class="crumbs"><a href="../#search">${icon("../", "back", "icon icon-sm")}All open tenders</a></p>
<div class="closed-note" id="closed-note"${closed ? "" : " hidden"}><b>This tender has closed.</b> Bids can no longer be submitted. <a href="#similar">See similar open tenders</a></div>
<article class="card tender">
<div class="tags">${tags.join("")}</div>
<h1>${esc(t.summary || t.title)}</h1>
<p class="meta">${esc(t.buyer || "Buyer not stated")} · ${esc(where || "Province not stated")}</p>
<p class="due${!closed && cd.soon ? " soon" : ""}">${closed ? "Closed" : `<span id="due" data-closing="${esc(t.closing)}">${esc(cd.text)}</span>`} <span class="meta">(${esc(closingText(t.closing))})</span></p>
${share}
${facts}
${closed ? "" : `<p class="help-link"><b>Need help with this tender?</b> We go through the documents with you and give you a checklist of everything to submit. <a href="../help.html?service=bid&amp;tender=${esc(t.id)}">Request Bid Help (${P.bidHelp})</a></p>`}
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
  const root = `${siteUrl}/`;
  return shell({
    title: `Page not found | ${BRAND}`,
    description: "This page doesn't exist. Search today's open South African government tenders.",
    root,
    signup: false,
    body: `<section class="lost">
<p class="code" aria-hidden="true">404</p>
<h1 class="page-h">This page isn’t here</h1>
<p class="lede">It may be an old tender that has closed and been removed, or the link was typed wrong. Search the tenders that are open today:</p>
<form action="${root}" method="get" role="search">
<div class="search"><label class="sr" for="q404">Search tenders</label>${icon(root, "search")}<input id="q404" name="q" type="search" placeholder="Tshwane, cleaning, Eskom…" enterkeyhint="search"></div>
<button class="btn primary" type="submit">Search</button>
</form>
<ul>
<li><a class="btn" href="${root}">${icon(root, "back", "icon icon-sm")}Home page</a></li>
<li><a class="btn" href="${root}tenders/">Tenders by trade</a></li>
<li><a class="btn" href="mailto:info@tenderfind.co.za">Email us</a></li>
</ul>
</section>`,
  });
}

module.exports = { icon, differentHtml, fillHomeBlocks, CHECKLIST_LIVE, signupHtml, headerHtml, footerHtml, shell, tenderPage, sitemap, robots, notFound, similar, ymdOf };
