// site/about.html, site/privacy.html and site/pricing.html. Plain words; no claims the service can't back up.
const { esc } = require("./display");
const { shell } = require("./pages");
const { OPERATOR, PRICING, HELP_WEBHOOK, PAYMENTS_LIVE } = require("./config");
const { P } = require("./prices");

function contactLines() {
  const lines = [];
  if (OPERATOR.email) lines.push(`Email: <a href="mailto:${esc(OPERATOR.email)}">${esc(OPERATOR.email)}</a>`);
  if (OPERATOR.whatsapp) lines.push(`WhatsApp: <a href="https://wa.me/${esc(OPERATOR.whatsapp)}">+${esc(OPERATOR.whatsapp)}</a>`);
  return lines;
}

function aboutPage(siteUrl, count) {
  const body = `<article class="card prose">
<h1>About TenderFind SA</h1>
<p>TenderFind SA helps small businesses find government work that fits them. Every morning we email subscribers the new tenders for their trade and province, so they don't have to search eTenders themselves. Anyone can also search all open tenders on this site for free, on a phone.</p>
<div class="founder">
<img src="img/jay-kgope.jpg" width="160" height="200" alt="${esc(OPERATOR.name || "The founder")}, founder of TenderFind SA" loading="lazy">
<p>TenderFind SA is run by <b>${esc(OPERATOR.name || "an independent operator")}</b>${OPERATOR.location ? ` in ${esc(OPERATOR.location.replace(/, South Africa$/, ""))}` : ""}. I started it because good small businesses keep missing government work they could do, simply because they hear about it too late. If you have a question, email me at <a href="mailto:${esc(OPERATOR.email)}">${esc(OPERATOR.email)}</a> and I'll answer it myself.</p>
</div>

<h2>Where the tenders come from</h2>
<p>The tenders come from National Treasury's eTenders portal, through its official open-data feed. We check it every morning, so new tenders, changed closing dates and closed tenders show up the same day. Right now we list ${count} open tenders. Tenders that a municipality or state company publishes only on its own website, and not on eTenders, are not included yet.</p>

<h2>What we add</h2>
<ul>
<li><b>A one-line summary.</b> Our software shortens each tender's official description into one line (for example "Cleaning services for the Polokwane office (36 months)"). It works from the official wording only, so it can be clumsy; the full official description is always on the tender's page.</li>
<li><b>Briefings and CIDB grades.</b> We read the tender documents to find compulsory briefing sessions, CIDB grades and CSD requirements. These are marked "auto-extracted, confirm before bidding" because a computer read them.</li>
<li><b>Trades and provinces.</b> Tenders are tagged by trade (cleaning, security, construction and more) and by province. The province comes from the place named in the tender where there is one, and otherwise from who is buying. National tenders are only sent to you when the work is nationwide or at the buyer's offices in your province.</li>
<li><b>Closing soon.</b> Countdowns and "Did you miss these?" so deadlines don't slip past.</li>
<li><b>Morning email.</b> New tenders for your trade and province by email every morning (<a href="pricing.html">${P.trialDays} days free, then ${P.alerts} a month</a>). You can also share any tender on WhatsApp in one tap.</li>
</ul>

<h2>What we never do</h2>
<p>We never make up tender details. If something isn't in the feed or the documents, the page says "Not stated — check the tender documents" and links to them.</p>

<h2>Important</h2>
<p>TenderFind SA is an independent service. It is not part of National Treasury or any government department, and we don't accept or handle bids. Always read the official tender documents and confirm every detail on the <a href="https://www.etenders.gov.za/" rel="noopener">eTenders portal</a> before you bid.</p>
${contactLines().length ? `<h2>Contact</h2><p>${contactLines().join("<br>")}</p>` : ""}
</article>`;
  return shell({
    title: "About | TenderFind SA",
    description: "TenderFind SA emails small businesses the new government tenders for their trade and province every morning, from National Treasury eTenders.",
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
<p>This notice explains what personal information TenderFind SA collects when you sign up for tender alerts by email, pay for a subscription or ask us for help with a tender, why we collect it, and your rights under the Protection of Personal Information Act (POPIA).</p>

<h2>Who is responsible</h2>
<p>The responsible party is ${who}.${contact.length ? `<br>${contact.join("<br>")}` : ""}</p>

<h2>What we collect</h2>
<p><b>When you sign up for alerts</b>, what you give us on the sign-up form:</p>
<ul>
<li>your email address</li>
<li>the trades and provinces you choose</li>
<li>your consent to receive alerts, and the date you gave it</li>
<li>which page of this site you signed up from, and the referral code in the link, if there was one</li>
</ul>
<p>If you signed up on an earlier version of the form, we may also hold the name, business name and WhatsApp number you gave then.</p>
<p><b>When you pay</b>, PayFast processes the payment and tells us your name, email address, the amount, the payment reference and date, and whether a monthly payment is active or cancelled. <b>We never see or store your card or bank details.</b></p>
<p><b>When you ask for help</b> (Bid Help, CSD or CIDB registration), what you type into the request form: your name, business name, email address, WhatsApp number if you give it, the tender, and your message.</p>
<p>And, to run your subscription: whether you're on the free trial, paying or cancelled, until when you've paid, and a log of the alerts we've sent you.</p>
<p>Searching and reading tenders on this site does not require any personal information, and we don't use advertising or tracking cookies.</p>

<h2>Why we use it</h2>
<ul>
<li>To send you one email each morning with new tenders that match your trades and provinces, with reminders before matching tenders close.</li>
<li>To manage your free trial and subscription, and to confirm your payments.</li>
<li>To reply to your help request and do the work you asked for.</li>
</ul>
<p>We use your information for nothing else. We never sell it or share it for marketing.</p>

<h2>Who else handles it</h2>
<p>We use a few services to run TenderFind SA. They store or process your information on our behalf, and some do so outside South Africa, under their own data-protection terms:</p>
<ul>
<li><b>Tally</b> (the sign-up form)</li>
<li><b>n8n</b> (where sign-ups, payments and help requests are stored, and which prepares the morning emails)</li>
<li><b>Gmail (Google)</b> (to send the emails)</li>
<li><b>PayFast</b> (to take payments, in South Africa)</li>
</ul>

<h2>How long we keep it</h2>
<p>For as long as you stay subscribed. When you unsubscribe, the emails stop and we delete your details within 30 days. Payment records are the exception: tax law requires us to keep them for five years. Help requests are deleted 12 months after the work is finished.</p>

<h2>Your rights</h2>
<ul>
<li><b>Stop at any time:</b> use the unsubscribe link in any alert email, or reply UNSUBSCRIBE.</li>
<li><b>See, correct or delete</b> the information we hold about you${contact.length ? " by contacting us using the details above" : " by replying to any alert"}.</li>
<li><b>Complain</b> to the Information Regulator if you're unhappy with how we handle your information: <a href="https://inforegulator.org.za/" rel="noopener">inforegulator.org.za</a>.</li>
</ul>

<h2>Tender information</h2>
<p>The tender details on this site are public information published by National Treasury on eTenders.</p>
</article>`;
  return shell({
    title: "Privacy notice | TenderFind SA",
    description: "What TenderFind SA collects when you sign up for tender alerts, pay or ask for help, why, and your rights under POPIA.",
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
  const { trialDays } = PRICING;
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
  "Search all open tenders on National Treasury’s eTenders",
  "Filter by trade, province and closing date",
  "A page for each tender with a one-line summary, the key dates and the documents",
  "Closing-soon countdowns and “Did you miss these?”",
  "Share any tender on WhatsApp",
], { html: `<a class="btn wide" href="./">Search tenders</a>` })}
${plan("Alerts", P.alerts, "a month", [
  "Everything in Free",
  "One email every morning with new tenders for your trades and provinces",
  "A reminder 3 days before matching tenders close",
  `<b>${trialDays} days free</b> when you sign up, no payment details needed`,
  "Cancel any time: unsubscribe from any email",
], { main: true, html: PAYMENTS_LIVE
  ? `${payButton("monthly", `Subscribe: ${P.alerts} a month`)}<p class="small"><a href="#signup">Or start the ${trialDays}-day free trial first</a></p>`
  : subscribe
  ? `<a class="btn wa wide" href="${subscribe}" target="_blank" rel="noopener">WhatsApp us to subscribe</a><p class="small"><a href="#signup">Or start the ${trialDays}-day free trial</a></p>`
  : `<a class="btn wa wide" href="#signup">Start your ${trialDays}-day free trial</a>` })}
${plan("Alerts yearly", P.alertsYear, "a year", [
  "Everything in Alerts",
  `<b>2 months free</b>: ${P.alertsSaving} less than paying monthly`,
  "One payment a year, no monthly debit",
  "Cancel any time; alerts run to the end of your year",
], { html: PAYMENTS_LIVE
  ? payButton("annual", `Subscribe: ${P.alertsYear} a year`, "btn wide")
  : subscribeYear ? `<a class="btn wide" href="${subscribeYear}" target="_blank" rel="noopener">WhatsApp us for the yearly plan</a>` : "" })}
${plan("Bid Help", P.bidHelp, "per tender", [
  "We read the tender documents and list everything you need to submit",
  "We draft your cover letter and a compliance checklist",
  "We flag deadlines, briefing sessions and missing documents",
  `Bigger or complex tenders: we quote you (up to ${P.bidHelpMax}) after we see the documents`,
  "Pay once per tender, before we start",
  "<b>We don’t guarantee a win.</b> You submit the bid yourself.",
], { html: `<a class="btn wide" href="help.html?service=bid">Request Bid Help</a>${bidHelp ? `<p class="small"><a href="${bidHelp}" target="_blank" rel="noopener">Or WhatsApp us about Bid Help</a></p>` : ""}` })}
</div>
<p class="lede">Not registered yet? <a href="registration-help.html">CSD and CIDB registration help</a> from ${P.csd}.</p>

<article class="card prose faq">
<h2>Questions</h2>
<h3>What happens after the free trial?</h3>
<p>On day ${trialDays + 1} we send you one email saying the trial has ended. Alerts stop unless you subscribe. Nothing is charged automatically.</p>
<h3>How do I pay?</h3>
<p>Payments go through <b>PayFast</b>, South Africa’s payment gateway: card, Instant EFT, SnapScan and more. We never see your card or bank details. ${PAYMENTS_LIVE ? "Tap Subscribe to pay. The monthly plan renews every month until you cancel; the yearly plan is one payment a year." : `Online payment is being switched on. Until then, ${subscribe ? "tap “WhatsApp us to subscribe” or reply to any of our emails" : "reply to any of our emails"} and we’ll send you a secure PayFast payment link.`} Your alerts carry on as soon as payment is confirmed.</p>
<h3>How do I cancel?</h3>
<p>Use the unsubscribe link at the bottom of any alert email, or just reply UNSUBSCRIBE. If you pay monthly, we stop the PayFast payments too. See the <a href="terms.html#refunds">refund and cancellation policy</a>.</p>
<h3>Can I change my trades or provinces?</h3>
<p>Yes. Sign up again with the same email address and your new choices; the newest sign-up is used.</p>
</article>`;
  return shell({
    title: "Pricing | TenderFind SA",
    description: `Search all open eTenders government tenders free. Get new tenders for your trade by email every morning for ${P.alerts} a month, with a ${trialDays}-day free trial.`,
    canonical: `${siteUrl}/pricing.html`,
    root: "./",
    body,
  });
}

// The help-request form (site/help.js posts it to n8n, which emails the owner). No payment is taken here:
// we reply with the details and how to pay before any work starts.
function helpForm(preselect) {
  const opt = (value, text) => `<option value="${value}"${value === preselect ? " selected" : ""}>${esc(text)}</option>`;
  return `<form class="card help-form" id="help-form" data-endpoint="${esc(HELP_WEBHOOK)}" novalidate>
<label><span>What do you need help with?</span><select name="service" required>
${opt("bid", `Bid Help for a tender (${P.bidHelp})`)}
${opt("csd", `CSD registration (${P.csd})`)}
${opt("cidb", `CIDB registration (${P.cidb})`)}
${opt("csd+cidb", `CSD and CIDB registration (${P.csdCidb})`)}
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
  const body = `<h1 class="page-h">Get help with a tender</h1>
<p class="lede">Tell us what you need and we'll get back to you within one working day.</p>
${helpForm("bid")}
<article class="card prose">
<h2>Bid Help (${P.bidHelp} per tender)</h2>
<ul>
<li>We read the tender documents and list everything you must submit</li>
<li>We draft your cover letter and a compliance checklist</li>
<li>We flag deadlines, briefing sessions and missing documents</li>
</ul>
<p>Bigger or complex tenders: we look at the documents first and quote you a price (up to ${P.bidHelpMax}). You pay once we agree the price, before we start.</p>
<p><b>We don’t guarantee a win.</b> You submit the bid yourself.</p>
<p>Need to register first? See <a href="registration-help.html">CSD and CIDB registration help</a>.</p>
</article>`;
  return shell({
    title: "Get help with a tender | TenderFind SA",
    description: `Bid Help for South African government tenders: we go through the documents with you and give you a checklist of everything to submit. Prices start ${P.bidHelp} per tender.`,
    canonical: `${siteUrl}/help.html`,
    root: "./",
    body,
    signup: false,
    script: `<script src="help.js" defer></script>\n`,
  });
}

function registrationHelpPage(siteUrl) {
  const body = `<h1 class="page-h">CSD and CIDB registration help</h1>
<p class="lede">You can’t bid on most government tenders without these. We’ll help you get registered properly, the first time.</p>
<div class="plans">
<section class="plan"><h2>CSD registration</h2><p class="price">${P.csd} <small>once-off</small></p>
<ul><li>Register your business on National Treasury’s Central Supplier Database (CSD)</li><li>We check your tax, bank and B-BBEE details are captured correctly</li><li>You get your CSD supplier number (MAAA…) to use on every bid</li></ul></section>
<section class="plan"><h2>CIDB registration</h2><p class="price">${P.cidb} <small>once-off</small></p>
<ul><li>For construction, building and maintenance tenders</li><li>We help you choose the right class of works and grade</li><li>We prepare and submit your application on the CIDB portal with you</li></ul></section>
</div>
<p class="small">Our fee is for our help only. Registration on the CSD is free; any CIDB fees are paid to the CIDB directly. Approval is decided by the CSD and CIDB, not by us.</p>
<h2 class="page-h" id="request">Request help</h2>
${helpForm("csd")}`;
  return shell({
    title: "CSD and CIDB registration help | TenderFind SA",
    description: `Get registered on the Central Supplier Database (CSD) and with the CIDB so you can bid on government tenders. CSD help ${P.csd}, CIDB help ${P.cidb}.`,
    canonical: `${siteUrl}/registration-help.html`,
    root: "./",
    body,
    script: `<script src="help.js" defer></script>\n`,
  });
}

// Terms of service, refund and cancellation policy, and the supplier details section 43 of the
// Electronic Communications and Transactions (ECT) Act requires of anyone selling online.
// Refund rules follow the ECT Act cooling-off period (s44) and the Consumer Protection Act on fixed-term plans (s14).
function termsPage(siteUrl) {
  const { trialDays } = PRICING;
  const onRequest = "available on request: email us";
  const phone = OPERATOR.whatsapp ? `0${OPERATOR.whatsapp.slice(2, 4)} ${OPERATOR.whatsapp.slice(4, 7)} ${OPERATOR.whatsapp.slice(7)}` : null;
  const tax = OPERATOR.vatRegistered ? "All prices include VAT." : "We are not registered for VAT, so no VAT is added: the price shown is the full price.";
  const body = `<article class="card prose terms">
<h1>Terms of service</h1>
<p>These terms apply when you use tenderfind.co.za, sign up for tender alerts, or buy any of our services. Please read them, especially the parts in <b>bold</b>: they limit our responsibility and explain when you can get your money back. Last updated 4 November 2026.</p>

<h2 id="supplier">1. Who we are</h2>
<dl class="facts">
<dt>Business name</dt><dd>TenderFind SA</dd>
<dt>Run by</dt><dd>${esc(OPERATOR.name || onRequest)}, ${esc(OPERATOR.legalStatus || "")}</dd>
<dt>Physical address (also for legal notices)</dt><dd>${esc(OPERATOR.address || `${OPERATOR.location || "South Africa"}; full address ${onRequest}`)}</dd>
<dt>Email</dt><dd>${OPERATOR.email ? `<a href="mailto:${esc(OPERATOR.email)}">${esc(OPERATOR.email)}</a>` : onRequest}</dd>
${phone ? `<dt>Phone and WhatsApp</dt><dd>${esc(phone)}</dd>` : ""}
<dt>Website</dt><dd>${esc(siteUrl.replace(/^https?:\/\//, ""))}</dd>
<dt>Industry body or code of conduct</dt><dd>None. We are not a member of any industry body.</dd>
</dl>
<p>TenderFind SA is independent. We are not part of National Treasury or any government department, we don't sell tenders, and we don't accept or handle bids.</p>

<h2>2. What we offer and what it costs</h2>
<ul>
<li><b>Free search.</b> Searching and reading open tenders on this site is free.</li>
<li><b>Tender alerts: ${P.alerts} a month, or ${P.alertsYear} a year.</b> One email each morning with the new tenders for the trades and provinces you choose, plus a reminder 3 days before matching tenders close. The first ${trialDays} days are free and we don't ask for payment details. Nothing is charged automatically when the trial ends.</li>
<li><b>Bid Help: ${P.bidHelp} per tender.</b> We read the tender documents, list everything you must submit, draft a cover letter and a compliance checklist, and flag deadlines and briefing sessions. For bigger or complex tenders we quote a price (up to ${P.bidHelpMax}) after we see the documents, and you agree it before we start. You submit the bid yourself.</li>
<li><b>CSD registration help: ${P.csd}. CIDB registration help: ${P.cidb}.</b> Once-off fees for our help only. CSD registration itself is free; CIDB fees are paid to the CIDB.</li>
</ul>
<p>${tax} Prices are in South African rand.</p>

<h2>3. How long a subscription runs</h2>
<p>The monthly plan runs one month at a time and carries on until you cancel. The yearly plan runs for 12 months from the day you pay. Alerts start (or carry on) as soon as your payment is confirmed. We send the first alert on the next morning that has matching tenders; some days there are none for your trade and province.</p>

<h2>4. Paying</h2>
<p>All payments go through <b>PayFast</b> (card, Instant EFT, SnapScan and more). PayFast emails you a receipt for every payment. <b>We never see or store your card or bank details.</b> Payment pages are secured by PayFast with encryption (https). We keep a record of each payment and will send you a copy on request. Help services are paid in full before we start.</p>

<h2 id="refunds">5. Cancelling and refunds</h2>
<ul>
<li><b>Free trial:</b> nothing to cancel. If you don't subscribe, the alerts stop after ${trialDays} days.</li>
<li><b>Cancel any time:</b> use the unsubscribe link in any alert email, reply UNSUBSCRIBE, or email us. The alerts stop, and for the monthly plan we stop the PayFast payments within one working day.</li>
<li><b>Changed your mind within 7 days:</b> if you cancel within 7 days of paying for a subscription, we refund the full amount.</li>
<li><b>Monthly plan after 7 days:</b> no refund for the month you're in; the alerts carry on until the end of that month and you're not charged again.</li>
<li><b>Yearly plan after 7 days:</b> you can still cancel at any time. We refund the full months you haven't used.</li>
<li><b>Bid Help and registration help:</b> full refund if you cancel before we start. Once we've started, we refund the part of the work we haven't done. We don't refund because a bid wasn't successful or because the CSD or CIDB turned down an application: those decisions aren't ours.</li>
<li><b>If our service fails:</b> if you get no alert emails for 3 working days in a row because of a fault on our side, tell us and we'll refund that month (or add the missing days to your subscription, if you prefer).</li>
</ul>
<p>Refunds go back to the way you paid, through PayFast, within 30 days of your request.</p>

<h2>6. The tender information</h2>
<p>The tenders come from National Treasury's eTenders portal (public information). Our one-line summaries, trades, provinces, briefing dates and CIDB grades are produced by software and can be wrong or incomplete. <b>Always read the official tender documents and confirm every detail on eTenders before you bid.</b> We don't promise to find every tender that suits you: some buyers publish tenders only on their own websites, and our matching by trade and province isn't perfect.</p>

<h2>7. Our responsibility</h2>
<p><b>We don't guarantee that you will win any tender, and we are not responsible for losses that come from missing a tender, a deadline or a document, or from relying on our summaries instead of the official documents.</b> If we are responsible for a loss, our total responsibility is limited to what you paid us in the 12 months before it happened. Nothing in these terms takes away rights you have under the Consumer Protection Act or the ECT Act.</p>

<h2>8. Using the site fairly</h2>
<p>Please don't copy this site's content in bulk, resell our alerts, or try to break or overload the site. We may stop the alerts for anyone who does.</p>

<h2>9. Your personal information</h2>
<p>Our <a href="privacy.html">privacy notice</a> explains what we collect and how we protect it.</p>

<h2>10. Complaints and disputes</h2>
<p>Please contact us first: we'll reply within 2 working days and try to put it right. If we can't agree, you can go to the <a href="https://www.cgso.org.za/" rel="noopener">Consumer Goods and Services Ombud</a> or the <a href="https://thencc.org.za/" rel="noopener">National Consumer Commission</a>. These terms are governed by South African law.</p>

<h2>11. Changes</h2>
<p>If we change these terms or our prices, we'll email subscribers at least 20 working days before the change applies to them. You can cancel before then if you don't agree.</p>
</article>`;
  return shell({
    title: "Terms of service and refunds | TenderFind SA",
    description: "TenderFind SA terms of service, prices, refund and cancellation policy, and supplier details.",
    canonical: `${siteUrl}/terms.html`,
    root: "./",
    body,
  });
}

// site/pay/index.html: tenderfind.co.za/pay/?plan=monthly&email=... goes straight to the signed PayFast checkout
// (built in the n8n "Payments: pay link" workflow, where the merchant key lives AND its own price list: keep both in
// step). Without an email it shows this short form first. Only plans the n8n workflow knows are listed here.
function payPage() {
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Subscribe | TenderFind SA</title>
<link rel="stylesheet" href="../style.css">
</head>
<body>
<header class="top"><div class="wrap"><a class="brand" href="../">TenderFind <span>SA</span></a>
<p class="promise">New government tenders for your trade, emailed every morning.</p></div></header>
<main class="wrap page">
<!-- Generated by scripts/build.js (payPage in scripts/lib/info-pages.js). Prices come from PRICING in scripts/lib/config.js. -->
<h1 class="page-h">Subscribe to TenderFind SA</h1>
<p class="lede" id="pay-note">Secure payment by PayFast: card, Instant EFT, SnapScan and more.</p>
<form class="card help-form" id="pay-form" novalidate>
<label><span>Choose</span><select name="plan">
<option value="monthly">Tender alerts: ${P.alerts} a month</option>
<option value="annual">Tender alerts: ${P.alertsYear} a year (2 months free)</option>
<option value="bid">Bid Help for one tender: ${P.bidHelpFrom} (bigger tenders are quoted first)</option>
<option value="csd">CSD registration help: ${P.csd}</option>
<option value="cidb">CIDB registration help: ${P.cidb}</option>
<option value="csd+cidb">CSD and CIDB registration help: ${P.csdCidb}</option>
</select></label>
<label><span>Email address you signed up with</span><input name="email" type="email" required autocomplete="email"></label>
<label><span>Your name</span><input name="name" autocomplete="name"></label>
<input type="hidden" name="tender"><input type="hidden" name="test">
<button class="btn wa wide" type="submit">Continue to secure payment</button>
<p class="form-msg" id="pay-msg" role="status"></p>
<p class="small">Monthly and yearly plans renew automatically until you cancel. Reply to any of our emails to cancel.</p>
</form>
</main>
<script>
(function () {
  var ENDPOINT = "https://jaykgope.app.n8n.cloud/webhook/tenderfind-pay";
  var form = document.getElementById("pay-form");
  var q = new URLSearchParams(location.search);
  ["plan", "email", "name", "tender", "test"].forEach(function (k) { if (q.get(k) && form[k]) form[k].value = q.get(k); });
  var go = function () { location.replace(ENDPOINT + "?" + new URLSearchParams(new FormData(form)).toString()); };
  // A complete link (plan + email) goes straight through with its own values, so plans that aren't in the
  // drop-down (e.g. the R5 go-live test) still reach the checkout builder, which checks them.
  if (q.get("plan") && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(q.get("email") || "")) {
    document.getElementById("pay-msg").textContent = "Opening secure payment…";
    location.replace(ENDPOINT + location.search);
    return;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email.value.trim())) { document.getElementById("pay-msg").textContent = "Please enter the email address you signed up with."; form.email.focus(); return; }
    go();
  });
})();
</script>
</body>
</html>
`;
}

module.exports = { aboutPage, privacyPage, pricingPage, helpPage, registrationHelpPage, termsPage, payPage };
