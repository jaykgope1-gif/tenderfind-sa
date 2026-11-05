// Subscriber matching for the morning tender alerts, by email (now) or WhatsApp (once Meta approves).
// Plain JavaScript with no require(): paste the whole file into an n8n Code node (see docs/n8n-alerts.md).
// Tested locally by scripts/test-match.js.

const MATCH = {
  MAX_NEW: 5, // tenders per WhatsApp message (template variables)
  MAX_EMAIL: 10, // tenders per email; the rest are behind "See all"
  MAX_REMIND: 3, // "closing in 3 days" reminders
  TRADES: ["Cleaning", "Security", "Construction", "Maintenance & repairs", "Catering", "IT", "Transport", "Supplies", "Professional services", "Other"],
  PROVINCES: ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"],
  // National buyers' tenders are only sent when the work is nationwide, or the buyer's head office is in one of the
  // subscriber's provinces and no other place is named. "Not stated" (a local body we couldn't place) is never sent.
  NATIONAL: "National",
  TRIAL_DAYS: 14, // free days from the first sign-up (sign-up day is day 1)
  PRO_EMAILS: 3, // Pro: the morning email goes to the sign-up address plus up to 2 "Team emails" (cc)
  SITE: "https://tenderfind.co.za",
  // Prices: copies of PRICING in scripts/lib/config.js (this file can't read it inside n8n). npm test fails if they differ.
  ALERTS_PRICE: 149, // Alerts, rand a month (trial-ended email)
  BID_HELP: "from R1,500", // Bid Help per tender, linked under every tender in the email (help.html)
  UNSUBSCRIBE_TO: "jobkgope1@gmail.com", // where "UNSUBSCRIBE" replies go (the sending Gmail)
};

// Tally writes ticked boxes as "Cleaning, Security"; keep only known values so typos can't match.
function pickKnown(cell, known) {
  const text = String(cell || "").toLowerCase();
  return known.filter((k) => text.includes(k.toLowerCase()));
}

// "+27 82 123 4567" / "082 123 4567" -> "27821234567" (the WhatsApp API wants digits only).
function normalisePhone(cell) {
  let d = String(cell || "").replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) d = "27" + d.slice(1);
  if (d.length === 12 && d.startsWith("270")) d = "27" + d.slice(3); // typed 082… after the form's +27
  return /^\d{10,15}$/.test(d) ? d : null;
}

function normaliseEmail(cell) {
  const e = String(cell || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

// Pro "Team emails" cell: "a@x.co.za, b@y.co.za" -> valid, unique addresses. The cap (PRO_EMAILS in all, counting
// the sign-up email) is applied when the message is built, after the sign-up email itself is left out.
function teamEmails(cell) {
  const out = [];
  for (const part of String(cell || "").split(/[,;\s]+/)) {
    const e = normaliseEmail(part);
    if (e && !out.includes(e)) out.push(e);
  }
  return out;
}

// "2026-11-01 14:23:11", "2026-11-01T12:23:11Z" -> "2026-11-01" (SA date)
function dayOf(cell) {
  const s = String(cell || "").trim();
  if (/^\d{4}-\d{2}-\d{2}( |$)/.test(s)) return s.slice(0, 10);
  const t = Date.parse(s);
  return isNaN(t) ? "" : new Date(t + 2 * 36e5).toISOString().slice(0, 10);
}
const addDays = (day, n) => new Date(Date.parse(day + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

const yes = (cell) => /^(true|yes|y|1|✓|checked)$/i.test(String(cell || "").trim()) || /i agree/i.test(String(cell || ""));

// One sheet row -> subscriber. Column names are the form's question titles.
function parseRow(row) {
  const get = (...names) => {
    for (const n of names) if (row[n] != null && row[n] !== "") return row[n];
    return "";
  };
  return {
    name: String(get("Your name", "Name")).trim(),
    business: String(get("Business name")).trim(),
    email: normaliseEmail(get("Email address", "Email")),
    phone: normalisePhone(get("WhatsApp number (optional)", "WhatsApp number", "Phone")),
    trades: pickKnown(get("Your trade(s)", "Trades"), MATCH.TRADES),
    provinces: pickKnown(get("Province(s) you can work in", "Provinces"), MATCH.PROVINCES),
    consent: yes(get("Consent")) || Object.keys(row).some((k) => /^i agree/i.test(k) && yes(row[k])),
    reminders: /^yes/i.test(String(get("Reminders", "Also remind me 3 days before matching tenders close?")).trim()), // blank = not asked = no
    signedUp: dayOf(get("Submitted at", "Created at", "Timestamp")),
    access: row._access || { status: "Trial", paidUntil: "", cancelled: false, plan: "Alerts", team: [] },
  };
}

// Who a row belongs to, for the chosen channel: their email or their WhatsApp number.
const keyOf = (sub, channel) => (channel === "email" ? sub.email : sub.phone);
const rowKey = (r, channel) =>
  channel === "email" ? normaliseEmail(r["Email address"] || r.Email) : normalisePhone(r["WhatsApp number (optional)"] || r["WhatsApp number"] || r.Phone);

// alerts.new / alerts.closing_soon -> tenders for this subscriber, own provinces first, then national.
function pick(grouped, sub, max) {
  const own = [];
  const wide = [];
  for (const trade of sub.trades) {
    const byProvince = (grouped || {})[trade] || {};
    for (const p of sub.provinces) own.push(...(byProvince[p] || []));
    wide.push(...(byProvince[MATCH.NATIONAL] || []).filter((t) => t.nationwide || (t.hq && sub.provinces.includes(t.hq))));
  }
  const seen = new Set();
  const all = [...own.sort(byClosing), ...wide.sort(byClosing)].filter((t) => !seen.has(t.id) && seen.add(t.id));
  return { list: all.slice(0, max), total: all.length };
}
const byClosing = (a, b) => a.closing.localeCompare(b.closing);

// WhatsApp template parameters can't contain line breaks, tabs or 4+ spaces in a row.
const clean = (s, max) => {
  s = String(s || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : s;
};
const shortDate = (closingText) => closingText.replace(/ \d{4},/, ",").replace(/^(\w+),/, "$1"); // "Tue, 03 Nov 2026, 10:00" -> "Tue 03 Nov, 10:00"
// First name from the sign-up, capitalised ("jay" -> "Jay"), or "" (the greeting then just says "Good morning,").
// Placeholder names are ignored.
const firstName = (sub) => {
  const n = clean(sub.name.split(" ")[0] || "", 30);
  return /^(test|testing|n\/?a|none|-)$/i.test(n) ? "" : n.charAt(0).toUpperCase() + n.slice(1);
};
const greet = (word, sub) => `${word}${firstName(sub) ? " " + firstName(sub) : ""},`;

// One line per tender, e.g. "Cleaning, Gauteng: Cleaning of Polokwane clinics… Closes 06 Nov, 11:00. Compulsory briefing. https://…"
function tenderLine(t) {
  const facts = [`Closes ${shortDate(t.closing_text)}`];
  if (t.compulsory_briefing) facts.push("Compulsory briefing");
  if (t.cidb) facts.push(`CIDB ${t.cidb}`);
  return clean(`${t.trade}, ${t.province}: ${clean(t.title, 80)} ${facts.join(". ")}. ${t.url}`, 230);
}

// The "See all" link: the search page filtered to the subscriber's trade and province when there's just one.
function seeAllSuffix(sub) {
  const q = [];
  if (sub.trades.length === 1) q.push(`trade=${encodeURIComponent(sub.trades[0])}`);
  if (sub.provinces.length === 1) q.push(`province=${encodeURIComponent(sub.provinces[0])}`);
  q.push("new=1");
  return `?${q.join("&")}`;
}

// ---------- email ----------

const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const prettyDay = (day) => new Date(day + "T12:00:00Z").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

const UNSUBSCRIBE_TEXT = `Don't want these emails? Reply with UNSUBSCRIBE, or email ${MATCH.UNSUBSCRIBE_TO}, and we'll stop them.`;
const unsubscribeHtml = () =>
  `Don't want these emails? <a href="mailto:${MATCH.UNSUBSCRIBE_TO}?subject=UNSUBSCRIBE">Unsubscribe</a> (or just reply with UNSUBSCRIBE).`;

// Pro only: "You'll need: SBD 4 form, CSD registration report, …" from the tender's checklist (alerts.js), or why
// there's no list. Only what the documents say; the tender page has the full list with the documents' own words.
const MAX_CHECK = 6;
function checklistLine(t) {
  const c = t.checklist;
  if (!c || c.status === "unreadable") return "What to submit: check the tender documents. We couldn't read them automatically.";
  if (c.status === "none-found" || !c.items.length) return "What to submit: we didn't find a list in the documents. Check the tender documents.";
  const more = c.items.length - MAX_CHECK;
  return `You'll need (from the documents, confirm before bidding): ${c.items.slice(0, MAX_CHECK).join("; ")}${more > 0 ? `; and ${more} more on the tender page` : ""}.`;
}

// Title, buyer, closing date, link, and a Bid Help request link: nothing else, so it reads well on a phone.
// Pro emails add the checklist line under each tender.
const helpUrl = (t) => `${MATCH.SITE}/help.html?service=bid&tender=${encodeURIComponent(t.id)}`;
function emailItem(t, pro) {
  const check = pro ? checklistLine(t) : "";
  return {
    text: `${t.title}\n${t.buyer || "Buyer not stated"}\nCloses ${shortDate(t.closing_text)}${check ? `\n${check}` : ""}\n${t.url}\nNeed help with this tender? ${helpUrl(t)}`,
    html: `<p style="margin:0 0 16px"><b>${escHtml(t.title)}</b><br>` +
      `${escHtml(t.buyer || "Buyer not stated")}<br>Closes ${escHtml(shortDate(t.closing_text))}<br>` +
      (check ? `<span style="color:#545b5e;font-size:13px">${escHtml(check)}</span><br>` : "") +
      `<a href="${escHtml(t.url)}" style="color:#0b5d3b;font-weight:bold">View tender</a>` +
      ` · <a href="${escHtml(helpUrl(t))}" style="color:#545b5e">Need help with this tender? Bid Help (${MATCH.BID_HELP})</a></p>`,
  };
}

function emailMessage(sub, today, fresh, soon, pro = false) {
  const day = prettyDay(today);
  const sections = [];
  if (fresh.list.length) {
    const more = fresh.total - fresh.list.length;
    sections.push({
      heading: `New today (${fresh.total})`,
      items: fresh.list.map((t) => emailItem(t, pro)),
      footText: `See all new tenders: ${MATCH.SITE}/${seeAllSuffix(sub)}`,
      footHtml: `<a href="${escHtml(MATCH.SITE + "/" + seeAllSuffix(sub))}">${more > 0 ? `See all ${fresh.total} new tenders on TenderFind SA` : "Open TenderFind SA"}</a>`,
    });
  }
  if (soon.list.length) sections.push({ heading: "Closing in 3 days", items: soon.list.map((t) => emailItem(t, pro)) });

  const subject = fresh.total
    ? `${fresh.total} new tender${fresh.total === 1 ? "" : "s"} for you, ${day}`
    : `Tenders closing in 3 days, ${day}`;
  const text = [
    greet("Good morning", sub),
    "",
    ...sections.flatMap((s) => [s.heading.toUpperCase(), "", ...s.items.map((i) => i.text + "\n"), ...(s.footText ? [s.footText, ""] : [])]),
    "Always read the tender documents before you bid.",
    "",
    "--",
    "TenderFind SA, Pretoria: new government tenders for your trade, every morning.",
    UNSUBSCRIBE_TEXT,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.45;color:#16191a;max-width:560px">` +
    `<p>${escHtml(greet("Good morning", sub))}</p>` +
    sections.map((s) => `<h3 style="font-size:15px;margin:18px 0 8px">${escHtml(s.heading)}</h3>${s.items.map((i) => i.html).join("")}${s.footHtml ? `<p>${s.footHtml}</p>` : ""}`).join("") +
    `<p style="color:#545b5e">Always read the tender documents before you bid.</p>` +
    `<hr style="border:0;border-top:1px solid #d9ddd7;margin:18px 0">` +
    `<p style="font-size:12px;color:#545b5e"><a href="${MATCH.SITE}/" style="color:#545b5e">TenderFind SA</a>, Pretoria: new government tenders for your trade, every morning. <a href="${MATCH.SITE}/terms.html" style="color:#545b5e">Terms</a> · <a href="${MATCH.SITE}/privacy.html" style="color:#545b5e">Privacy</a><br>${unsubscribeHtml()}</p></div>`;
  return { subject, text, html };
}

function trialEndedEmail(sub) {
  const subject = "Your free trial of TenderFind SA alerts has ended";
  const ended = `Your ${MATCH.TRIAL_DAYS}-day free trial of TenderFind SA tender alerts has ended. To keep getting new tenders for your trade every morning, it's R${MATCH.ALERTS_PRICE} a month. Nothing is charged automatically.`;
  const text = [
    greet("Hi", sub),
    "",
    ended,
    "",
    "To subscribe, reply to this email or see Pricing on TenderFind SA.",
    "",
    "--",
    UNSUBSCRIBE_TEXT,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.45;color:#16191a;max-width:560px">` +
    `<p>${escHtml(greet("Hi", sub))}</p><p>${escHtml(ended)}</p>` +
    `<p><a href="${MATCH.SITE}/pricing.html">See how to subscribe</a>, or just reply to this email.</p>` +
    `<hr style="border:0;border-top:1px solid #d9ddd7;margin:18px 0"><p style="font-size:12px;color:#545b5e">${unsubscribeHtml()}</p></div>`;
  return { subject, text, html };
}

// ---------- status, trial and payments ----------

// The "Status" tab: Email | Phone | Status | Paid until | Changed | Note. Lines are read top to bottom:
//   Trial     back to the free trial (it still ends 14 days after the first sign-up)
//   Paying    paid; alerts run until "Paid until" (YYYY-MM-DD; blank = no end date)
//   Cancelled no more messages (unsubscribe / STOP; "Stopped" means the same)
//   Resumed   undo Cancelled and carry on as before
// Someone with no lines is on the free trial. A line can name the email, the phone or both.
// Pro: a Paying line with Plan = "Pro" and, optionally, "Team emails" (up to 2 more addresses, comma-separated).
// The plan and team emails stay until a later Paying or Trial line changes them.
function applyStatus(rows, statusRows) {
  const acc = {};
  const keysOf = (email, phone) => [email && `e:${email}`, phone && `p:${phone}`].filter(Boolean);
  for (const s of statusRows || []) {
    const keys = keysOf(normaliseEmail(s.Email), normalisePhone(s.Phone));
    if (!keys.length) continue;
    const st = String(s.Status || "").trim().toLowerCase();
    const pro = /^pro$/i.test(String(s.Plan || "").trim());
    for (const k of keys) {
      const a = (acc[k] ||= { status: "Trial", paidUntil: "", cancelled: false, plan: "Alerts", team: [] });
      if (st === "paying") Object.assign(a, { status: "Paying", paidUntil: dayOf(s["Paid until"]), cancelled: false, plan: pro ? "Pro" : "Alerts", team: pro ? teamEmails(s["Team emails"]) : [] });
      else if (st === "trial") Object.assign(a, { status: "Trial", paidUntil: "", cancelled: false, plan: "Alerts", team: [] });
      else if (st === "cancelled" || st === "stopped" || st === "unsubscribed") a.cancelled = true;
      else if (st === "resumed" || st === "active") a.cancelled = false;
    }
  }
  return rows.map((r) => {
    const keys = keysOf(rowKey(r, "email"), rowKey(r, "whatsapp"));
    const found = keys.map((k) => acc[k]).filter(Boolean);
    if (!found.length) return r;
    // Cancelled on either channel stops both; a paid period on either counts.
    const merged = { ...found[found.length - 1], cancelled: found.some((a) => a.cancelled) };
    const paying = found.find((a) => a.status === "Paying");
    if (paying) Object.assign(merged, { status: "Paying", paidUntil: paying.paidUntil, plan: paying.plan, team: paying.team });
    return { ...r, _access: merged };
  });
}

// Can this subscriber get alerts today? { ok } or { trialEnded } or { why }.
function access(sub, firstSignup, today) {
  const a = sub.access;
  if (a.cancelled) return { why: "cancelled" };
  if (a.status === "Paying") return !a.paidUntil || today <= a.paidUntil ? { ok: true } : { why: `payment due (paid until ${a.paidUntil})` };
  if (!firstSignup) return { ok: true }; // no sign-up date in the sheet: don't cut them off
  const end = addDays(firstSignup, MATCH.TRIAL_DAYS); // first day without free alerts
  if (today < end) return { ok: true };
  if (today === end) return { trialEnded: true };
  return { why: `trial ended ${end}` };
}

// ---------- matching ----------

// rows: sheet rows (objects keyed by column name), oldest first. Returns one entry per message to send.
// channel: "email" (one digest per person) or "whatsapp" (approved templates).
// If someone signed up more than once, the newest sign-up is used (people re-sign to change trades),
// but the free trial counts from their first sign-up.
// sentToday: emails/numbers already sent a morning or trial-ended message today (from the Log),
// so a re-run never double-sends.
function matchSubscribers(alerts, rows, sentToday = [], today = alerts.date, channel = "whatsapp") {
  const norm = channel === "email" ? normaliseEmail : normalisePhone;
  const already = new Set(sentToday.map(norm));
  const firstSignup = {};
  for (const r of rows) {
    const k = rowKey(r, channel);
    const d = dayOf(r["Submitted at"] || r["Created at"] || r.Timestamp);
    if (k && d && (!firstSignup[k] || d < firstSignup[k])) firstSignup[k] = d;
  }
  const seen = new Set();
  const messages = [];
  const skipped = [];
  for (const row of [...rows].reverse()) {
    const sub = parseRow(row);
    const key = keyOf(sub, channel);
    const why =
      !key ? (channel === "email" ? "no valid email" : "no valid WhatsApp number") :
      !sub.consent ? "no consent" :
      !sub.trades.length ? "no trades" :
      seen.has(key) ? "duplicate sign-up" :
      already.has(key) ? "already sent today" : null;
    if (why) { skipped.push({ to: key, reason: why }); continue; }
    seen.add(key);

    const can = access(sub, firstSignup[key], today);
    if (can.why) { skipped.push({ to: key, reason: can.why }); continue; }

    if (channel === "email") {
      if (can.trialEnded) { messages.push({ to: key, kind: "trial_ended", ...trialEndedEmail(sub) }); continue; }
      const fresh = pick(alerts.new, sub, MATCH.MAX_EMAIL);
      const soon = sub.reminders ? pick(alerts.closing_soon, sub, MATCH.MAX_REMIND) : { list: [], total: 0 };
      if (!fresh.list.length && !soon.list.length) { skipped.push({ to: key, reason: "nothing new for their trades today" }); continue; }
      // Pro (paid): the same email also goes to their team addresses. `cc` is "" or "a@x.co.za, b@y.co.za",
      // ready for the CC field of n8n's Gmail node.
      const pro = sub.access.status === "Paying" && sub.access.plan === "Pro";
      // team: a list (Status lines) or the subscribers table's team_emails text, as n8n's "Shape subscriber rows" passes it.
      const team = Array.isArray(sub.access.team) ? sub.access.team : teamEmails(sub.access.team);
      const cc = (pro ? team.filter((e) => e !== key).slice(0, MATCH.PRO_EMAILS - 1) : []).join(", ");
      messages.push({ to: key, cc, plan: pro ? "Pro" : "Alerts", kind: "new", tender_ids: [...fresh.list, ...soon.list].map((t) => t.id), ...emailMessage(sub, today, fresh, soon, pro) });
      continue;
    }

    // WhatsApp: one approved template per message.
    if (can.trialEnded) {
      messages.push({ to: key, phone: key, kind: "trial_ended", template: "trial_ended", params: [firstName(sub) || "there"] });
      continue;
    }
    const fresh = pick(alerts.new, sub, MATCH.MAX_NEW);
    if (fresh.list.length) {
      messages.push({
        to: key,
        phone: key,
        kind: "new",
        template: `tender_alert_${fresh.list.length}`,
        params: [firstName(sub) || "there", String(fresh.total), ...fresh.list.map(tenderLine)],
        button_suffix: seeAllSuffix(sub),
        tender_ids: fresh.list.map((t) => t.id),
        more: fresh.total - fresh.list.length,
      });
    }
    const soon = sub.reminders ? pick(alerts.closing_soon, sub, MATCH.MAX_REMIND) : { list: [] };
    if (soon.list.length) {
      messages.push({ to: key, phone: key, kind: "reminder", template: `tender_closing_${soon.list.length}`, params: soon.list.map(tenderLine), tender_ids: soon.list.map((t) => t.id) });
    }
    if (!fresh.list.length && !soon.list.length) skipped.push({ to: key, reason: "nothing new for their trades today" });
  }
  return { messages, skipped };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MATCH, parseRow, normalisePhone, normaliseEmail, teamEmails, dayOf, applyStatus, access, matchSubscribers, tenderLine };
}
