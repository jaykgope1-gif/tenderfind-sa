// site/about.html, site/privacy.html and site/pricing.html. Plain words; no claims the service can't back up.
const { esc } = require("./display");
const { shell } = require("./pages");
const { OPERATOR, PRICING } = require("./config");

function contactLines() {
  const lines = [];
  if (OPERATOR.email) lines.push(`Email: <a href="mailto:${esc(OPERATOR.email)}">${esc(OPERATOR.email)}</a>`);
  if (OPERATOR.whatsapp) lines.push(`WhatsApp: <a href="https://wa.me/${esc(OPERATOR.whatsapp)}">+${esc(OPERATOR.whatsapp)}</a>`);
  return lines;
}

function aboutPage(siteUrl, count) {
  const body = `<article class="card prose">
<h1>About TenderFind SA</h1>
<p>TenderFind SA lists every open South African government tender in plain English, so a small business can find the work that fits it in a minute, on a phone.</p>

<h2>Where the tenders come from</h2>
<p>Every tender comes from National Treasury's eTenders portal through its official open-data feed. We check it every morning, so new tenders, changed closing dates and closed tenders show up the same day. Right now we list ${count} open tenders.</p>

<h2>What we add</h2>
<ul>
<li><b>Plain English.</b> Each tender shows what the buyer wants, who is buying, where, and when it closes.</li>
<li><b>Briefings and CIDB grades.</b> We read the tender documents to find compulsory briefing sessions, CIDB grades and CSD requirements. These are marked "auto-extracted, confirm before bidding" because a computer read them.</li>
<li><b>Trades and provinces.</b> Tenders are tagged by trade (cleaning, security, construction and more) and province so you can filter fast. The province usually comes from who is buying, so national departments show as "National".</li>
<li><b>Closing soon.</b> Countdowns and "Did you miss these?" so deadlines don't slip past.</li>
<li><b>WhatsApp.</b> Share any tender in one tap, or get a morning message with new tenders for your trade (<a href="pricing.html">14 days free, then R${PRICING.alerts} a month</a>).</li>
</ul>

<h2>What we never do</h2>
<p>We never make up tender details. If something isn't in the feed or the documents, the page says "Not stated — check the tender documents" and links to them.</p>

<h2>Important</h2>
<p>TenderFind SA is an independent service. It is not part of National Treasury or any government department, and we don't accept or handle bids. Always read the official tender documents and confirm every detail on the <a href="https://www.etenders.gov.za/" rel="noopener">eTenders portal</a> before you bid.</p>
${contactLines().length ? `<h2>Contact</h2><p>${contactLines().join("<br>")}</p>` : ""}
</article>`;
  return shell({
    title: "About | TenderFind SA",
    description: "TenderFind SA lists every open South African government tender in plain English, updated every morning from National Treasury eTenders.",
    canonical: `${siteUrl}/about.html`,
    root: "./",
    body,
  });
}

function privacyPage(siteUrl) {
  const who = OPERATOR.name ? esc(OPERATOR.name) : "the operator of TenderFind SA";
  const contact = contactLines();
  const body = `<article class="card prose">
<h1>Privacy notice</h1>
<p>This notice explains what personal information TenderFind SA collects when you sign up for WhatsApp tender alerts, why, and your rights under the Protection of Personal Information Act (POPIA).</p>

<h2>Who is responsible</h2>
<p>The responsible party is ${who}.${contact.length ? `<br>${contact.join("<br>")}` : ""}</p>

<h2>What we collect</h2>
<p>What you type into the sign-up form:</p>
<ul>
<li>your name and business name</li>
<li>the trades and provinces you choose, and whether you want closing reminders</li>
<li>your WhatsApp number</li>
<li>your consent to receive alerts, and the date you gave it</li>
<li>which page of this site you signed up from</li>
</ul>
<p>And, to run your subscription: whether you're on the free trial, paying or cancelled, until when you've paid, and a log of the alerts we've sent you. We don't store card or bank details.</p>
<p>Searching and reading tenders on this site does not require any personal information, and we don't use advertising or tracking cookies.</p>

<h2>Why we use it</h2>
<p>To send you one WhatsApp message each morning with new tenders that match your trades and provinces, and, if you choose it, reminders before tenders close; and to manage your free trial and subscription. We use your information for nothing else. We never sell it or share it for marketing.</p>

<h2>Who else handles it</h2>
<p>We use a few services to run the alerts. They store or process your information on our behalf and may do so outside South Africa, under their own data-protection terms:</p>
<ul>
<li><b>Tally</b> (the sign-up form)</li>
<li><b>Google Sheets</b> (where sign-ups are kept)</li>
<li><b>WhatsApp / Meta</b> (to deliver the messages)</li>
<li>the automation service that sends the morning messages</li>
</ul>

<h2>How long we keep it</h2>
<p>For as long as you stay subscribed. When you reply STOP, the messages stop straight away and we delete your details within 30 days.</p>

<h2>Your rights</h2>
<ul>
<li><b>Stop at any time:</b> reply STOP to any alert.</li>
<li><b>See, correct or delete</b> the information we hold about you${contact.length ? " by contacting us using the details above" : " by replying to any alert"}.</li>
<li><b>Complain</b> to the Information Regulator if you're unhappy with how we handle your information: <a href="https://inforegulator.org.za/" rel="noopener">inforegulator.org.za</a>.</li>
</ul>

<h2>Tender information</h2>
<p>The tender details on this site are public information published by National Treasury on eTenders.</p>
</article>`;
  return shell({
    title: "Privacy notice | TenderFind SA",
    description: "What TenderFind SA collects when you sign up for WhatsApp tender alerts, why, and your rights under POPIA.",
    canonical: `${siteUrl}/privacy.html`,
    root: "./",
    body,
  });
}

// "WhatsApp us" link with a ready-made message; falls back to the sign-up box until a number is set.
function waLink(text) {
  return OPERATOR.whatsapp ? `https://wa.me/${OPERATOR.whatsapp}?text=${encodeURIComponent(text)}` : null;
}

function pricingPage(siteUrl) {
  const { alerts, trialDays } = PRICING;
  const subscribe = waLink(`Hi, I'd like to subscribe to TenderFind SA Alerts (R${alerts} a month).`);
  const bidHelp = waLink("Hi, I'd like to ask about Bid Help for a tender.");
  const plan = (name, price, sub, items, action) => `<section class="plan${action.main ? " main" : ""}">
<h2>${name}</h2>
<p class="price">${price}${sub ? ` <small>${sub}</small>` : ""}</p>
<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
${action.html}
</section>`;
  const body = `<h1 class="page-h">Pricing</h1>
<p class="lede">Searching tenders is free, always. Pay only if you want them sent to you.</p>
<div class="plans">
${plan("Free", "R0", "", [
  "Search every open government tender",
  "Filter by trade, province and closing date",
  "A plain-English page for each tender, with the documents",
  "Closing-soon countdowns and “Did you miss these?”",
  "Share any tender on WhatsApp",
], { html: `<a class="btn wide" href="./">Search tenders</a>` })}
${plan("Alerts", `R${alerts}`, "a month", [
  "Everything in Free",
  "One WhatsApp message every morning with new tenders for your trades and provinces",
  "Optional reminder 3 days before matching tenders close",
  `<b>${trialDays} days free</b> when you sign up, no payment details needed`,
  "Cancel any time: reply STOP",
], { main: true, html: subscribe
  ? `<a class="btn wa wide" href="${subscribe}" target="_blank" rel="noopener">WhatsApp us to subscribe</a><p class="small"><a href="#signup">Or start the ${trialDays}-day free trial</a></p>`
  : `<a class="btn wa wide" href="#signup">Start your ${trialDays}-day free trial</a>` })}
${plan("Bid Help", "Ask us", "per tender", [
  "Help with a tender you want to bid on",
  "Price depends on the tender: WhatsApp us for a quote",
], { html: bidHelp ? `<a class="btn wide" href="${bidHelp}" target="_blank" rel="noopener">WhatsApp us about Bid Help</a>` : "" })}
</div>

<article class="card prose faq">
<h2>Questions</h2>
<h3>What happens after the free trial?</h3>
<p>On day ${trialDays + 1} we send you one message saying the trial has ended. Alerts stop unless you subscribe. Nothing is charged automatically.</p>
<h3>How do I pay?</h3>
<p>${subscribe ? "Tap “WhatsApp us to subscribe” and we’ll send you the payment details." : "When your trial ends, reply to our message and we’ll send you the payment details."} Your alerts carry on as soon as payment is confirmed.</p>
<h3>How do I cancel?</h3>
<p>Reply STOP to any alert. The messages stop straight away.</p>
<h3>Can I change my trades or provinces?</h3>
<p>Yes. Sign up again with the same WhatsApp number and your new choices; the newest sign-up is used.</p>
</article>`;
  return shell({
    title: "Pricing | TenderFind SA",
    description: `Search every South African government tender free. Get new tenders for your trade on WhatsApp every morning for R${alerts} a month, with a ${trialDays}-day free trial.`,
    canonical: `${siteUrl}/pricing.html`,
    root: "./",
    body,
  });
}

module.exports = { aboutPage, privacyPage, pricingPage };
