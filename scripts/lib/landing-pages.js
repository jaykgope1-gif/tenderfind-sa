// Trade and province pages for Google (site/tenders/): "Cleaning tenders in Gauteng", "Security tenders
// in South Africa", plus an index. Rebuilt every morning from the open tenders, so they never go stale.
// Only combinations with at least one open tender get a page; the rest would be empty pages Google ignores.
const { esc, closingText } = require("./display");
const { shell } = require("./pages");

const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"];
const MAX_LIST = 60; // tenders listed on one page; the rest are a tap away in the search
const MAX_NATIONAL = 15;

const slug = (s) => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const tradeFile = (trade) => `${slug(trade)}-tenders.html`;
const comboFile = (trade, province) => `${slug(trade)}-tenders-${slug(province)}.html`;
const lower = (trade) => (trade === "IT" ? "IT" : trade.toLowerCase());

const place = (t) => t.location?.value || t.province?.value || null;
const byClosing = (a, b) => a.closing.localeCompare(b.closing);

function listHtml(list) {
  return `<ol>${list.map((t) => `<li><a href="../tender/${esc(t.id)}.html"><b>${esc(t.summary || t.title)}</b><span>${esc(t.buyer || "")}${place(t) ? " · " + esc(place(t)) : ""}</span><span class="due" data-closing="${esc(t.closing)}">Closes ${esc(closingText(t.closing))}</span></a></li>`).join("")}</ol>`;
}

function page({ siteUrl, file, title, h1, intro, sections, related }) {
  const body = `<p class="crumbs"><a href="./">← All trades and provinces</a></p>
<h1 class="page-h">${esc(h1)}</h1>
<p class="lede">${intro}</p>
${sections.map((s) => `<section class="similar"><h2>${esc(s.heading)}</h2>${listHtml(s.list)}${s.more || ""}</section>`).join("\n")}
${related.length ? `<section class="similar"><h2>Related</h2><p>${related.map((r) => `<a href="${esc(r.href)}">${esc(r.text)}</a>`).join(" · ")}</p></section>` : ""}`;
  return shell({
    title: `${title} | TenderFind SA`,
    description: intro.replace(/<[^>]+>/g, "").slice(0, 158),
    canonical: `${siteUrl}/tenders/${file}`,
    root: "../",
    body,
    script: `<script src="../format.js"></script>
<script>document.querySelectorAll("[data-closing]").forEach(function (e) { var c = TF.countdown(e.dataset.closing); e.textContent = c.closed ? "Closed" : c.text; e.classList.toggle("soon", c.soon); });</script>
`,
  });
}

// open: full detail records of open tenders. Returns [{ file, html }] including the index page.
function landingPages(open, siteUrl, now) {
  const day = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(now);
  const byTrade = {};
  for (const t of open) (byTrade[t.trade] ||= []).push(t);
  const trades = Object.keys(byTrade).sort((a, b) => byTrade[b].length - byTrade[a].length);
  const out = [];
  const index = [];

  for (const trade of trades) {
    const all = byTrade[trade].slice().sort(byClosing);
    const national = all.filter((t) => !PROVINCES.includes(t.province?.value));
    const combos = PROVINCES.map((p) => ({ p, list: all.filter((t) => t.province?.value === p) })).filter((c) => c.list.length);

    for (const { p, list } of combos) {
      const file = comboFile(trade, p);
      out.push({ file, html: page({
        siteUrl, file,
        title: `${trade} tenders in ${p}`,
        h1: `${trade} tenders in ${p}`,
        intro: `${list.length} open government ${lower(trade)} tender${list.length === 1 ? "" : "s"} in ${esc(p)} on ${day}, from National Treasury's eTenders, each with a one-line summary, closing date and any briefing session. Updated every morning.`,
        sections: [
          { heading: `Open in ${p}`, list: list.slice(0, MAX_LIST), more: list.length > MAX_LIST ? `<p><a class="btn wide" href="../?trade=${encodeURIComponent(trade)}&amp;province=${encodeURIComponent(p)}">See all ${list.length}</a></p>` : "" },
          ...(national.length ? [{ heading: `National ${lower(trade)} tenders (open to ${p} businesses too)`, list: national.slice(0, MAX_NATIONAL) }] : []),
        ],
        related: [
          { href: tradeFile(trade), text: `All ${lower(trade)} tenders in South Africa` },
          ...combos.filter((c) => c.p !== p).map((c) => ({ href: comboFile(trade, c.p), text: `${trade} in ${c.p}` })),
        ],
      }) });
    }

    const file = tradeFile(trade);
    out.push({ file, html: page({
      siteUrl, file,
      title: `${trade} tenders in South Africa`,
      h1: `${trade} tenders in South Africa`,
      intro: `${all.length} open government ${lower(trade)} tender${all.length === 1 ? "" : "s"} across South Africa on ${day}, from National Treasury's eTenders. Updated every morning.`,
      sections: [{ heading: "Closing soonest", list: all.slice(0, MAX_LIST), more: all.length > MAX_LIST ? `<p><a class="btn wide" href="../?trade=${encodeURIComponent(trade)}">See all ${all.length}</a></p>` : "" }],
      related: combos.map((c) => ({ href: comboFile(trade, c.p), text: `${trade} in ${c.p} (${c.list.length})` })),
    }) });
    index.push({ trade, total: all.length, combos });
  }

  const body = `<h1 class="page-h">Government tenders by trade and province</h1>
<p class="lede">All open tenders on National Treasury's eTenders, grouped by trade and province. Updated every morning (${esc(day)}).</p>
${index.map((i) => `<section class="card"><h2><a href="${esc(tradeFile(i.trade))}">${esc(i.trade)} tenders</a> <small>(${i.total})</small></h2>
<p>${i.combos.map((c) => `<a href="${esc(comboFile(i.trade, c.p))}">${esc(c.p)} (${c.list.length})</a>`).join(" · ") || "National only"}</p></section>`).join("\n")}`;
  out.push({ file: "index.html", html: shell({
    title: "Government tenders by trade and province | TenderFind SA",
    description: "Open South African government tenders by trade (cleaning, security, construction and more) and province, updated every morning from eTenders.",
    canonical: `${siteUrl}/tenders/`,
    root: "../",
    body,
  }) });
  return out;
}

module.exports = { landingPages };
