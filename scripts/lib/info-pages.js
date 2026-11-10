// site/about.html, site/privacy.html and site/pricing.html. Plain words; no claims the service can't back up.
const { esc } = require("./display");
const { shell, differentHtml, CHECKLIST_LIVE, icon } = require("./pages");
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
<p>TenderFind SA helps small businesses find government work that fits them, and bid for it properly. Every morning we email subscribers the new tenders for their trade and province, so they don't have to search eTenders themselves. Every tender is explained in plain English, and if you want, we do the bid paperwork for you. Anyone can also search all open tenders on this site for free, on a phone.</p>
<div class="founder">
<img src="img/jay-kgope.jpg" width="160" height="200" alt="${esc(OPERATOR.name || "The founder")}, founder of TenderFind SA" loading="lazy">
<p>TenderFind SA is run by <b>${esc(OPERATOR.name || "an independent operator")}</b>${OPERATOR.location ? ` in ${esc(OPERATOR.location.replace(/, South Africa$/, ""))}` : ""}. I started it because good small businesses keep missing government work they could do, simply because they hear about it too late. If you have a question, email me at <a href="mailto:${esc(OPERATOR.email)}">${esc(OPERATOR.email)}</a> and I'll answer it myself.</p>
</div>

<h2>Where the tenders come from</h2>
<p>The tenders come from National Treasury's eTenders portal, through its official open-data feed, and from the Gauteng e-Tender portal for Gauteng department tenders that aren't on eTenders. We check them every morning, so new tenders, changed closing dates and closed tenders show up the same day. Right now we list ${count} open tenders. Tenders that a municipality or state company publishes only on its own website, and not on eTenders, are not included yet.</p>

<h2>What we add</h2>
<ul>
<li><b>Every tender in plain English.</b> Our software shortens each tender's official description into one line (for example "Cleaning services for the Polokwane office (36 months)"), and the page shows who is buying, where, and when it closes. It works from the official wording only, so it can be clumsy; the full official description is always on the tender's page.</li>
<li><b>Briefings and CIDB grades.</b> We read the tender documents to find compulsory briefing sessions, CIDB grades and CSD requirements. These are marked "auto-extracted, confirm before bidding" because a computer read them.</li>
<li><b>A checklist of what to submit${CHECKLIST_LIVE ? "" : " (coming soon)"}.</b> From the tender documents, we list the returnable documents and forms the tender asks for, such as SBD forms, the CSD report, your tax PIN, CIDB grade and B-BBEE. If we can't read the documents, we say so. The official documents always win.</li>
<li><b>We can do the bid work for you.</b> With <a href="help.html">Bid Help</a> (${P.bidHelp} per tender) and <a href="pricing.html#g-for-you">Tender Desk</a> (${P.desk} a month), we read the documents, build the checklist and prepare the pack. You approve and submit the bid yourself, and we don't guarantee a win.</li>
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
    description: "TenderFind SA emails small businesses the new government tenders for their trade every morning, explains each tender in plain English, and can do the bid paperwork for you.",
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

// The main action: a filled WhatsApp button with a ready-made message. Empty until a number is set.
function waMain(text, label) {
  const href = waLink(text);
  return href ? `<a class="btn main wide" href="${href}" target="_blank" rel="noopener">${icon("./", "chat")}<span>${label}</span></a>` : "";
}
const PACK_MSG = `Hi Jay, I want the Tender-Ready Pack (${P.tenderReady})`;
const tick = (html) => `<li>${icon("./", "check")}<span>${html}</span></li>`;
// The Tender-Ready Pack box (same contents as the home page).
function packHtml() {
  return `<section class="tf-offer" id="pack" aria-labelledby="pack-h">
<div class="tf-offer-top"><span>Main offer</span><span>Once-off</span></div>
<div class="tf-offer-body">
<h2 id="pack-h">Tender-Ready Pack</h2>
<p class="tf-price">${P.tenderReady}</p>
<ul class="tf-ticks">
${tick("<b>CSD registration</b> (your supplier number)")}
${tick("<b>SARS tax compliance PIN</b> help")}
${tick("<b>B-BBEE sworn affidavit</b>, filled in")}
${tick("<b>Document check:</b> CIPC, tax and bank")}
${tick("<b>1-page company profile</b>")}
${tick("<b>3 months of tender alerts</b> free")}
</ul>
${waMain(PACK_MSG, "WhatsApp Jay about the pack")}
<p class="tf-num">Or WhatsApp <b>069 289 8507</b></p>
<p class="small">Our fee is for our help. CSD registration itself is free. You use your own logins and your documents stay private. SARS and the CSD decide approvals, not us. We never promise tender wins.</p>
</div>
</section>`;
}
// Every "get ready" service and its price, in one ruled table (pricing page).
function readyTable() {
  const row = (name, note, price, per, top) => `<tr${top ? " class=\"top\"" : ""}><th scope="row">${name}${note ? `<small>${note}</small>` : ""}</th><td>${price}${per ? `<small>${per}</small>` : ""}</td></tr>`;
  return `<table class="tf-prices"><tbody>
${row("Tender-Ready Pack <span class=\"tf-tag\">Main offer</span>", "CSD, tax PIN help, B-BBEE affidavit, document check, company profile and 3 months of alerts", P.tenderReady, "once-off", true)}
${row("<a href=\"registration-help.html\">CSD registration help</a>", "", P.csd)}
${row("<a href=\"registration-help.html\">CIDB registration help</a>", "For construction, building and maintenance tenders", P.cidb)}
${row("CSD and CIDB together", "", P.csdCidb)}
${row("Company profile", "", P.companyProfile)}
${row("Workshop: Get Tender-Ready", "", P.workshop, "a person")}
</tbody></table>`;
}

function pricingPage(siteUrl) {
  const { trialDays } = PRICING;
  // Until PayFast is live, "subscribe" means WhatsApp us; once live, it goes to the secure pay page (pay/).
  const payButton = (planId, label, cls = "btn wa wide") => `<a class="${cls}" href="pay/?plan=${planId}">${label}</a>`;
  const subscribe = waLink("Hi, I'd like to subscribe to tender alerts");
  const subscribeYear = waLink("Hi, I'd like the yearly tender alerts plan");
  const bidHelp = waLink("Hi, I'd like help with a tender bid");
  const proWa = waLink("Hi, I'd like the TenderFind Pro plan");
  const deskWa = waLink("Hi, I'd like to book a call about Tender Desk");
  const NO_WIN = "<b>We don’t guarantee a win.</b> You submit the bid yourself.";
  const waBtn = (href, label, cls = "btn wa wide") => (href ? `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>` : "");
  const plan = (name, price, sub, items, action) => `<section class="plan${action.main ? " main" : ""}">
<h3>${name}</h3>
<p class="price">${price}${sub ? ` <small>${sub}</small>` : ""}</p>
${action.who ? `<p class="plan-who">${action.who}</p>` : ""}
<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
${action.html}
</section>`;
  const body = `<h1 class="page-h">Pricing</h1>
<p class="lede">Searching tenders is free, always. Pay if you want them sent to you, or if you want us to do the paperwork.</p>
<section class="plan-group" aria-labelledby="g-ready">
<h2 class="group-h" id="g-ready">Get tender-ready</h2>
${readyTable()}
${waMain(PACK_MSG, "WhatsApp Jay about the Tender-Ready Pack")}
<p class="small">Our fee is for our help only. CSD registration itself is free, and any CIDB fees are paid to the CIDB. You use your own logins and your documents stay private. We never promise a tender win.</p>
</section>
<section class="plan-group" aria-labelledby="g-yourself">
<h2 class="group-h" id="g-yourself">Find tenders yourself</h2>
<div class="plans">
${plan("Free", "R0", "", [
  "Search all open tenders",
  "Filter by trade, province and closing date",
  "A page for each tender with a one-line summary, the key dates and the documents",
  "Closing-soon countdowns and “Did you miss these?”",
  "Share any tender on WhatsApp",
], { html: `<a class="btn wide" href="./">Search tenders</a>` })}
${plan("Alerts", P.alerts, "a month", [
  "Everything in Free",
  "One email every morning with new tenders for your trades and provinces. Choose as many as you like.",
  "A reminder 3 days before matching tenders close",
  `<b>${trialDays} days free</b> when you sign up, no payment details needed`,
  `Or pay ${P.alertsYear} a year: 2 months free (${P.alertsSaving} less)`,
  "Cancel any time: unsubscribe from any email",
], { main: true, who: "Our main plan, for most small businesses.", html: (PAYMENTS_LIVE
  ? `${payButton("monthly", `Subscribe: ${P.alerts} a month`)}<p class="small"><a href="pay/?plan=annual">Or pay ${P.alertsYear} a year</a> · <a href="#signup">Start the free trial first</a></p>`
  : subscribe
  ? `${waBtn(subscribe, "WhatsApp us to subscribe")}<p class="small"><a href="#signup">Or start the ${trialDays}-day free trial</a>${subscribeYear ? ` · <a href="${subscribeYear}" target="_blank" rel="noopener">Ask for the yearly plan</a>` : ""}</p>`
  : `<a class="btn wa wide" href="#signup">Start your ${trialDays}-day free trial</a>`) })}
${plan("Pro", P.pro, "a month", [
  "Everything in Alerts",
  `Alerts sent to up to ${PRICING.proEmails} email addresses, so your team sees them too`,
  "“What you’ll need to submit” under every tender in your email: the forms and documents listed in its tender documents",
  "Priority WhatsApp support: we answer Pro customers first",
  `Or pay ${P.proYear} a year: 2 months free (${P.proSaving} less)`,
  "Cancel any time",
], { who: "For businesses that bid a lot: CIDB grade 3 and up, engineering and consulting firms, and suppliers.",
  html: `${waBtn(proWa, "WhatsApp us for Pro", "btn wide")}<p class="small"><a href="help.html?service=pro">Or send us a request</a></p>` })}
</div>
<div class="card coverage">
<h3>Where the tenders come from</h3>
<ul class="cover-list">
<li><span class="tag">Included</span> <b>National Treasury’s eTenders portal:</b> national and provincial departments, municipalities, and state companies like Eskom, Transnet and SANRAL when they post their tenders there.</li>
<li><span class="tag">Included</span> <b>The Gauteng e-Tender portal:</b> Gauteng department tenders that are not on eTenders.</li>
<li><span class="tag soon-tag">Coming soon</span> Tenders that municipalities and state companies put only on their own websites.</li>
<li><span class="tag soon-tag">Coming soon</span> Private-sector tenders.</li>
</ul>
</div>
</section>

<section class="plan-group" aria-labelledby="g-for-you">
<h2 class="group-h" id="g-for-you">We do the work for you</h2>
<div class="plans">
${plan("Bid Help", `<small>from</small> ${P.bidHelpFrom}`, "per tender", [
  "We read the tender documents and list everything you need to submit",
  "We draft your cover letter and a compliance checklist",
  "We flag deadlines, briefing sessions and missing documents",
  `Bigger or complex tenders: we quote you (up to ${P.bidHelpMax}) after we see the documents`,
  "Pay once per tender, before we start",
  NO_WIN,
], { who: "For one tender you want to get right.", html: `<a class="btn wide" href="help.html?service=bid">Request Bid Help</a>${bidHelp ? `<p class="small"><a href="${bidHelp}" target="_blank" rel="noopener">Or WhatsApp us about Bid Help</a></p>` : ""}` })}
${plan("Tender Desk", `<small>from</small> ${P.deskFrom}`, "a month", [
  "We find the right tenders for you",
  "We keep your CSD, tax clearance and B-BBEE documents up to date, and track when they expire",
  "We prepare the compliance pack and the returnable-documents checklist for each bid",
  "We track every deadline and briefing session",
  "You approve and submit every bid yourself",
  NO_WIN,
], { who: "For businesses that want to bid every month but don’t have time for the paperwork.",
  html: `${waBtn(deskWa, "Book a call on WhatsApp")}<p class="small"><a href="help.html?service=tender-desk">Or send us a request</a></p>` })}
</div>
</section>
${differentHtml("./")}

<article class="card prose faq">
<h2>Questions</h2>
<h3>Which plan is right for me?</h3>
<p><b>Free</b> if you only want to look now and then. <b>Alerts</b> (${P.alerts} a month) if you want the new tenders for your trade in your email every morning: this is right for most small businesses. <b>Pro</b> (${P.pro} a month) if you bid often and more than one person in your team needs the alerts. <b>Bid Help</b> (${P.bidHelp}) if you want help with one tender. <b>Tender Desk</b> (${P.desk} a month) if you want us to do the paperwork for you every month. Not sure? <a href="help.html">Ask us</a>.</p>
<h3>What happens after the free trial?</h3>
<p>On day ${trialDays + 1} we send you one email saying the trial has ended. Alerts stop unless you subscribe. Nothing is charged automatically.</p>
<h3>How do I pay?</h3>
<p>Payments go through <b>PayFast</b>, South Africa’s payment gateway: card, Instant EFT, SnapScan and more. We never see your card or bank details. ${PAYMENTS_LIVE ? "Tap Subscribe to pay. The monthly plan renews every month until you cancel; the yearly plan is one payment a year." : `Online payment is being switched on. Until then, ${subscribe ? "tap “WhatsApp us to subscribe” or reply to any of our emails" : "reply to any of our emails"} and we’ll send you a secure PayFast payment link.`} Your alerts carry on as soon as payment is confirmed. For Pro, Bid Help and Tender Desk, WhatsApp us or send a request: we agree the details with you first and then tell you how to pay.</p>
<h3>How do I cancel?</h3>
<p>Use the unsubscribe link at the bottom of any alert email, or just reply UNSUBSCRIBE. If you pay monthly, we stop the PayFast payments too. See the <a href="terms.html#refunds">refund and cancellation policy</a>.</p>
<h3>Can I change my trades or provinces?</h3>
<p>Yes. Sign up again with the same email address and your new choices; the newest sign-up is used.</p>
</article>`;
  return shell({
    title: "Pricing | TenderFind SA",
    description: `Search government tenders free. Alerts ${P.alerts} a month (${trialDays} days free), Pro ${P.pro} a month for teams, Bid Help ${P.bidHelp} per tender, and Tender Desk ${P.desk} a month.`,
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
${opt("tender-ready", `Tender-Ready Pack (${P.tenderReady})`)}
${opt("bid", `Bid Help for a tender (${P.bidHelp})`)}
${opt("csd", `CSD registration (${P.csd})`)}
${opt("cidb", `CIDB registration (${P.cidb})`)}
${opt("csd+cidb", `CSD and CIDB registration (${P.csdCidb})`)}
${opt("profile", `Company profile (${P.companyProfile})`)}
${opt("workshop", `Workshop: Get Tender-Ready (${P.workshop} a person)`)}
${opt("tender-desk", `Tender Desk: we do the bid paperwork every month (${P.desk} a month)`)}
${opt("pro", `Pro plan: alerts for up to ${PRICING.proEmails} email addresses (${P.pro} a month)`)}
${opt("partner", "Partner: tender alerts for our members or clients")}
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
${waMain("Hi Jay, I'd like help with a tender bid", "WhatsApp Jay about Bid Help")}
<h2 class="page-h form-h" id="request">Or send a request</h2>
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
<h2>Tender Desk (${P.desk} a month)</h2>
<p>We do the bid paperwork for you every month: we find the right tenders, keep your CSD, tax clearance and B-BBEE documents up to date, prepare the compliance pack for each bid and track every deadline. You approve and submit every bid yourself. <a href="pricing.html#g-for-you">See what’s included</a>.</p>
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
${packHtml()}
<h2 class="page-h form-h">Or one thing at a time</h2>
<div class="plans">
<section class="plan"><h2>CSD registration</h2><p class="price">${P.csd} <small>once-off</small></p>
<ul><li>Register your business on National Treasury’s Central Supplier Database (CSD)</li><li>We check your tax, bank and B-BBEE details are captured correctly</li><li>You get your CSD supplier number (MAAA…) to use on every bid</li></ul></section>
<section class="plan"><h2>CIDB registration</h2><p class="price">${P.cidb} <small>once-off</small></p>
<ul><li>For construction, building and maintenance tenders</li><li>We help you choose the right class of works and grade</li><li>We prepare and submit your application on the CIDB portal with you</li></ul></section>
</div>
<table class="tf-prices"><tbody>
<tr><th scope="row">CSD and CIDB together</th><td>${P.csdCidb}</td></tr>
<tr><th scope="row">Company profile</th><td>${P.companyProfile}</td></tr>
</tbody></table>
${waLink("Hi Jay, I need help with CSD or CIDB registration") ? `<a class="btn wide" href="${waLink("Hi Jay, I need help with CSD or CIDB registration")}" target="_blank" rel="noopener">${icon("./", "chat")}<span>WhatsApp Jay about CSD or CIDB</span></a>` : ""}
<p class="small">Our fee is for our help only. Registration on the CSD is free; any CIDB fees are paid to the CIDB directly. Approval is decided by the CSD and CIDB, not by us. You use your own logins, and your documents stay private.</p>
<h2 class="page-h form-h" id="request">Or send a request</h2>
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
<p>These terms apply when you use tenderfind.co.za, sign up for tender alerts, or buy any of our services. Please read them, especially the parts in <b>bold</b>: they limit our responsibility and explain when you can get your money back. Last updated 5 November 2026.</p>

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
<li><b>Pro: ${P.pro} a month, or ${P.proYear} a year.</b> Everything in tender alerts, sent to up to ${PRICING.proEmails} email addresses you give us, with the list of documents to submit under each tender (read from the tender documents by software, so always check the documents), and priority support on WhatsApp.</li>
<li><b>Tender Desk: ${P.desk} a month.</b> We find suitable tenders for you, keep your CSD, tax clearance and B-BBEE documents up to date and track their expiry dates, prepare the compliance pack and returnable-documents checklist for each bid, and track deadlines and briefing sessions. We agree the monthly price with you before we start. You approve and submit every bid yourself.</li>
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
<li><b>Pro:</b> the same as tender alerts above (monthly or yearly).</li>
<li><b>Tender Desk:</b> paid monthly, before the month starts. Cancel any time before your next month starts and you won't be charged again. For the month you're in, the help-services rule below applies.</li>
<li><b>Bid Help, Tender Desk and registration help:</b> full refund if you cancel before we start. Once we've started, we refund the part of the work we haven't done. We don't refund because a bid wasn't successful or because the CSD or CIDB turned down an application: those decisions aren't ours.</li>
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

// /partners.html: for organisations that support small businesses. Bulk seats are switched on by hand for now
// (each member signs up with the partner's link; the owner adds Paying lines for them), so the page promises no more.
function partnersPage(siteUrl) {
  const wa = waLink("Hi, I'd like to talk about TenderFind alerts for our members");
  const body = `<h1 class="page-h">Give your members tender alerts</h1>
<p class="lede">For chambers of commerce, SEDA offices, enterprise development programmes, accountants and CIDB trainers. Help the small businesses you support find government work in time to bid.</p>

<div class="plans">
<section class="plan main">
<h2>Bulk seats</h2>
<p class="price"><small>from</small> ${P.partnerFrom} <small>a month</small></p>
<p class="plan-who">For up to ${P.partnerMembers} members. Bigger groups: ask us.</p>
<ul>
<li>Each member gets the morning tender email for their own trades and provinces (the normal <a href="pricing.html">Alerts plan</a>)</li>
<li>Members sign up with your own link, so we know they’re yours</li>
<li>One monthly invoice for your organisation, not one payment per member</li>
<li>Every tender in plain English, with a list of what to submit from the tender documents</li>
</ul>
${wa ? `<a class="btn wa wide" href="${wa}" target="_blank" rel="noopener">WhatsApp us</a>` : ""}
<p class="small"><a href="#request">Or send us a request</a></p>
</section>
<section class="plan">
<h2>Referral fee</h2>
<p class="price"><small>Ask us</small></p>
<p class="plan-who">If you’d rather not pay for seats.</p>
<ul>
<li>Share your own sign-up link with your members</li>
<li>Members pay for their own alerts</li>
<li>We pay you a referral fee for members who become paying subscribers. Ask us for the details</li>
</ul>
<a class="btn wide" href="#request">Ask about referrals</a>
</section>
</div>

<article class="card prose">
<h2>How it works</h2>
<ol>
<li>Tell us about your organisation and how many members you have.</li>
<li>We agree the price and send you your own sign-up link.</li>
<li>Your members sign up with that link in two minutes: their email, their trade and their provinces.</li>
<li>From the next morning, they get the new government tenders for their trade by email.</li>
</ol>
<p>Your members choose what they receive and can unsubscribe at any time. We only use their details to send the alerts (see our <a href="privacy.html">privacy notice</a>), and we never sell them.</p>
<p>TenderFind SA doesn’t sell tenders or promise wins. Your members bid themselves. If they want help, we offer <a href="help.html">Bid Help</a> and <a href="pricing.html#g-for-you">Tender Desk</a>.</p>
</article>

<h2 class="page-h" id="request">Talk to us</h2>
${helpForm("partner")}`;
  return shell({
    title: "Tender alerts for your members | TenderFind SA",
    description: `Partner with TenderFind SA: give the small businesses you support morning government tender alerts. Bulk seats ${P.partner} a month for ${P.partnerMembers} members, or a referral fee.`,
    canonical: `${siteUrl}/partners.html`,
    root: "./",
    body,
    signup: false,
    script: `<script src="help.js" defer></script>\n`,
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

module.exports = { aboutPage, privacyPage, pricingPage, helpPage, registrationHelpPage, termsPage, payPage, partnersPage };
