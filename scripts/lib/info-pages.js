// site/about.html, site/privacy.html and site/pricing.html. Plain words; no claims the service can't back up.
const { esc } = require("./display");
const { shell } = require("./pages");
const { OPERATOR, PRICING, HELP_WEBHOOK, PAYMENTS_LIVE } = require("./config");

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
  const who = (OPERATOR.name ? esc(OPERATOR.name) : "the operator of TenderFind SA") + (OPERATOR.location ? `, ${esc(OPERATOR.location)}` : "");
  const contact = contactLines();
  const body = `<article class="card prose">
<h1>Privacy notice</h1>
<p>This notice explains what personal information TenderFind SA collects when you sign up for tender alerts (by email now, and on WhatsApp once it starts), why, and your rights under the Protection of Personal Information Act (POPIA).</p>

<h2>Who is responsible</h2>
<p>The responsible party is ${who}.${contact.length ? `<br>${contact.join("<br>")}` : ""}</p>

<h2>What we collect</h2>
<p>What you type into the sign-up form:</p>
<ul>
<li>your name and business name</li>
<li>the trades and provinces you choose, and whether you want closing reminders</li>
<li>your email address, and your WhatsApp number if you give it</li>
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
<li><b>Google Sheets</b> (a backup copy of sign-ups)</li>
<li><b>Gmail (Google)</b> (to send the alert emails)</li>
<li><b>n8n</b> (where sign-ups are stored, and which prepares and sends the morning alerts)</li>
<li><b>WhatsApp / Meta</b> (once WhatsApp alerts start)</li>
</ul>

<h2>How long we keep it</h2>
<p>For as long as you stay subscribed. When you unsubscribe (or reply STOP on WhatsApp), the alerts stop and we delete your details within 30 days.</p>

<h2>Your rights</h2>
<ul>
<li><b>Stop at any time:</b> use the unsubscribe line in any alert email, or reply UNSUBSCRIBE.</li>
<li><b>See, correct or delete</b> the information we hold about you${contact.length ? " by contacting us using the details above" : " by replying to any alert"}.</li>
<li><b>Complain</b> to the Information Regulator if you're unhappy with how we handle your information: <a href="https://inforegulator.org.za/" rel="noopener">inforegulator.org.za</a>.</li>
</ul>

<h2>Tender information</h2>
<p>The tender details on this site are public information published by National Treasury on eTenders.</p>
</article>`;
  return shell({
    title: "Privacy notice | TenderFind SA",
    description: "What TenderFind SA collects when you sign up for tender alerts (by email now, and on WhatsApp once it starts), why, and your rights under POPIA.",
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
  const { alerts, alertsYear, trialDays, bidHelpPrice } = PRICING;
  // Until PayFast is live, "subscribe" means WhatsApp us; once live, it goes to the secure pay page (pay/).
  const payButton = (planId, label, cls = "btn wa wide") => `<a class="${cls}" href="pay/?plan=${planId}">${label}</a>`;
  const subscribe = waLink("Hi, I'd like to subscribe to tender alerts");
  const subscribeYear = waLink("Hi, I'd like the yearly tender alerts plan");
  const bidHelp = waLink("Hi, I'd like help with a tender bid");
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
  "One email every morning with new tenders for your trades and provinces (WhatsApp coming soon)",
  "Optional reminder 3 days before matching tenders close",
  `<b>${trialDays} days free</b> when you sign up, no payment details needed`,
  "Cancel any time: unsubscribe from any email",
], { main: true, html: PAYMENTS_LIVE
  ? `${payButton("monthly", `Subscribe: R${alerts} a month`)}<p class="small"><a href="#signup">Or start the ${trialDays}-day free trial first</a></p>`
  : subscribe
  ? `<a class="btn wa wide" href="${subscribe}" target="_blank" rel="noopener">WhatsApp us to subscribe</a><p class="small"><a href="#signup">Or start the ${trialDays}-day free trial</a></p>`
  : `<a class="btn wa wide" href="#signup">Start your ${trialDays}-day free trial</a>` })}
${plan("Alerts yearly", `R${alertsYear.toLocaleString("en-ZA").replace(/\s/g, ",")}`, "a year", [
  "Everything in Alerts",
  `<b>2 months free</b>: R${(alerts * 12 - alertsYear).toLocaleString("en-ZA").replace(/\s/g, ",")} less than paying monthly`,
  "One payment a year, no monthly debit",
  "Cancel any time; alerts run to the end of your year",
], { html: PAYMENTS_LIVE
  ? payButton("annual", `Subscribe: R${alertsYear.toLocaleString("en-ZA").replace(/\s/g, ",")} a year`, "btn wide")
  : subscribeYear ? `<a class="btn wide" href="${subscribeYear}" target="_blank" rel="noopener">WhatsApp us for the yearly plan</a>` : "" })}
${plan("Bid Help", bidHelpPrice ? `R${bidHelpPrice}` : "Ask us", "per tender", [
  "We read the tender documents and list everything you need to submit",
  "We draft your cover letter and a compliance checklist",
  "We flag deadlines, briefing sessions and missing documents",
  "Pay once per tender, before we start",
  "<b>We don’t guarantee a win.</b> You submit the bid yourself.",
], { html: `<a class="btn wide" href="help.html?service=bid">Request Bid Help</a>${bidHelp ? `<p class="small"><a href="${bidHelp}" target="_blank" rel="noopener">Or WhatsApp us about Bid Help</a></p>` : ""}` })}
</div>
<p class="lede">Not registered yet? <a href="registration-help.html">CSD and CIDB registration help</a> from R${PRICING.csdHelpPrice}.</p>

<article class="card prose faq">
<h2>Questions</h2>
<h3>What happens after the free trial?</h3>
<p>On day ${trialDays + 1} we send you one email saying the trial has ended. Alerts stop unless you subscribe. Nothing is charged automatically.</p>
<h3>How do I pay?</h3>
<p>${PAYMENTS_LIVE ? "Tap Subscribe and pay securely with PayFast (card, Instant EFT, SnapScan and more). Monthly and yearly plans renew automatically until you cancel." : subscribe ? "Tap “WhatsApp us to subscribe” and we’ll send you the payment details." : "When your trial ends, reply to our email and we’ll send you the payment details."} Your alerts carry on as soon as payment is confirmed.</p>
<h3>How do I cancel?</h3>
<p>Use the unsubscribe line at the bottom of any alert email, or just reply UNSUBSCRIBE.</p>
<h3>Can I change my trades or provinces?</h3>
<p>Yes. Sign up again with the same email address and your new choices; the newest sign-up is used.</p>
</article>`;
  return shell({
    title: "Pricing | TenderFind SA",
    description: `Search every South African government tender free. Get new tenders for your trade by email every morning for R${alerts} a month, with a ${trialDays}-day free trial.`,
    canonical: `${siteUrl}/pricing.html`,
    root: "./",
    body,
  });
}

// The help-request form (site/help.js posts it to n8n, which emails the owner). No payment is taken here:
// we reply with the details and how to pay before any work starts.
function helpForm(preselect) {
  const { bidHelpPrice, csdHelpPrice, cidbHelpPrice } = PRICING;
  const opt = (value, text) => `<option value="${value}"${value === preselect ? " selected" : ""}>${esc(text)}</option>`;
  return `<form class="card help-form" id="help-form" data-endpoint="${esc(HELP_WEBHOOK)}" novalidate>
<label><span>What do you need help with?</span><select name="service" required>
${opt("bid", `Bid Help for a tender (R${bidHelpPrice})`)}
${opt("csd", `CSD registration (R${csdHelpPrice})`)}
${opt("cidb", `CIDB registration (R${cidbHelpPrice})`)}
${opt("csd+cidb", `CSD and CIDB registration (R${csdHelpPrice + cidbHelpPrice})`)}
</select></label>
<p class="help-tender" id="help-tender" hidden></p>
<input type="hidden" name="tender">
<label><span>Your name</span><input name="name" required autocomplete="name"></label>
<label><span>Business name</span><input name="business" autocomplete="organization"></label>
<label><span>Email address</span><input name="email" type="email" required autocomplete="email"></label>
<label><span>WhatsApp number</span><input name="whatsapp" type="tel" autocomplete="tel" placeholder="e.g. 082 123 4567"></label>
<label><span>Anything we should know? (optional)</span><textarea name="message" rows="3" placeholder="e.g. tender number, closing date, what you're unsure about"></textarea></label>
<label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
<label class="check"><input type="checkbox" name="consent" value="yes" required> <span>I agree that TenderFind SA may contact me about this request. <a href="privacy.html">Privacy notice</a></span></label>
<button class="btn wa wide" type="submit">Send my request</button>
<p class="form-msg" id="help-msg" role="status"></p>
<p class="small">No payment now. We'll reply within one working day with what we need from you and how to pay. Work starts once payment is received.</p>
</form>`;
}

function helpPage(siteUrl) {
  const { bidHelpPrice } = PRICING;
  const body = `<h1 class="page-h">Get help with a tender</h1>
<p class="lede">Tell us what you need and we'll get back to you within one working day.</p>
${helpForm("bid")}
<article class="card prose">
<h2>Bid Help (R${bidHelpPrice} per tender)</h2>
<ul>
<li>We read the tender documents and list everything you must submit</li>
<li>We draft your cover letter and a compliance checklist</li>
<li>We flag deadlines, briefing sessions and missing documents</li>
</ul>
<p><b>We don’t guarantee a win.</b> You submit the bid yourself.</p>
<p>Need to register first? See <a href="registration-help.html">CSD and CIDB registration help</a>.</p>
</article>`;
  return shell({
    title: "Get help with a tender | TenderFind SA",
    description: `Bid Help for South African government tenders: we go through the documents with you and give you a checklist of everything to submit. R${bidHelpPrice} per tender.`,
    canonical: `${siteUrl}/help.html`,
    root: "./",
    body,
    signup: false,
    script: `<script src="help.js" defer></script>\n`,
  });
}

function registrationHelpPage(siteUrl) {
  const { csdHelpPrice, cidbHelpPrice } = PRICING;
  const body = `<h1 class="page-h">CSD and CIDB registration help</h1>
<p class="lede">You can’t bid on most government tenders without these. We’ll help you get registered properly, the first time.</p>
<div class="plans">
<section class="plan"><h2>CSD registration</h2><p class="price">R${csdHelpPrice} <small>once-off</small></p>
<ul><li>Register your business on National Treasury’s Central Supplier Database (CSD)</li><li>We check your tax, bank and B-BBEE details are captured correctly</li><li>You get your CSD supplier number (MAAA…) to use on every bid</li></ul></section>
<section class="plan"><h2>CIDB registration</h2><p class="price">R${cidbHelpPrice} <small>once-off</small></p>
<ul><li>For construction, building and maintenance tenders</li><li>We help you choose the right class of works and grade</li><li>We prepare and submit your application on the CIDB portal with you</li></ul></section>
</div>
<p class="small">Our fee is for our help only. Registration on the CSD is free; any CIDB fees are paid to the CIDB directly. Approval is decided by the CSD and CIDB, not by us.</p>
<h2 class="page-h" id="request">Request help</h2>
${helpForm("csd")}`;
  return shell({
    title: "CSD and CIDB registration help | TenderFind SA",
    description: `Get registered on the Central Supplier Database (CSD) and with the CIDB so you can bid on government tenders. CSD help R${csdHelpPrice}, CIDB help R${cidbHelpPrice}.`,
    canonical: `${siteUrl}/registration-help.html`,
    root: "./",
    body,
    script: `<script src="help.js" defer></script>\n`,
  });
}

module.exports = { aboutPage, privacyPage, pricingPage, helpPage, registrationHelpPage };
