// Subscriber matching for the morning WhatsApp alerts.
// Plain JavaScript with no require(): paste the whole file into an n8n Code node (see docs/n8n-alerts.md).
// Tested locally by scripts/test-match.js.

const MATCH = {
  MAX_NEW: 5, // tenders per morning message
  MAX_REMIND: 3, // "closing in 3 days" reminders
  TRADES: ["Cleaning", "Security", "Construction", "Maintenance & repairs", "Catering", "IT", "Transport", "Supplies", "Professional services", "Other"],
  PROVINCES: ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"],
  EVERYWHERE: ["National", "Not stated"], // sent to subscribers in every province
  TRIAL_DAYS: 14, // free days from the first sign-up (sign-up day is day 1)
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

// "2026-11-01 14:23:11", "2026-11-01T12:23:11Z" -> "2026-11-01" (SA date)
function dayOf(cell) {
  const s = String(cell || "").trim();
  if (/^d{4}-d{2}-d{2}( |$)/.test(s)) return s.slice(0, 10);
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
    phone: normalisePhone(get("WhatsApp number", "Phone")),
    trades: pickKnown(get("Your trade(s)", "Trades"), MATCH.TRADES),
    provinces: pickKnown(get("Province(s) you can work in", "Provinces"), MATCH.PROVINCES),
    consent: yes(get("Consent", "I agree to receive tender alerts on WhatsApp. Reply STOP anytime.")),
    reminders: /^yes/i.test(String(get("Reminders", "Also remind me 3 days before matching tenders close?")).trim()), // blank = not asked = no
    signedUp: dayOf(get("Submitted at", "Created at", "Timestamp")),
    access: row._access || { status: "Trial", paidUntil: "", cancelled: false },
  };
}

// alerts.new / alerts.closing_soon -> tenders for this subscriber, own provinces first, then national.
function pick(grouped, sub, max) {
  const own = [];
  const wide = [];
  for (const trade of sub.trades) {
    const byProvince = (grouped || {})[trade] || {};
    for (const p of sub.provinces) own.push(...(byProvince[p] || []));
    for (const p of MATCH.EVERYWHERE) wide.push(...(byProvince[p] || []));
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

// One line per tender, e.g. "Cleaning, Gauteng: Cleaning of Polokwane clinics… Closes 06 Nov, 11:00. Compulsory briefing. https://…"
function tenderLine(t) {
  const facts = [`Closes ${shortDate(t.closing_text)}`];
  if (t.compulsory_briefing) facts.push("Compulsory briefing");
  if (t.cidb) facts.push(`CIDB ${t.cidb}`);
  return clean(`${t.trade}, ${t.province}: ${clean(t.title, 80)} ${facts.join(". ")}. ${t.url}`, 230);
}

// The "See all" button: the search page filtered to the subscriber's first trade and province.
function seeAllSuffix(sub) {
  const q = [];
  if (sub.trades.length === 1) q.push(`trade=${encodeURIComponent(sub.trades[0])}`);
  if (sub.provinces.length === 1) q.push(`province=${encodeURIComponent(sub.provinces[0])}`);
  q.push("new=1");
  return `?${q.join("&")}`;
}

// The "Status" tab: Phone | Status | Paid until | Changed | Note. Lines are read top to bottom:
//   Trial     back to the free trial (it still ends 14 days after the first sign-up)
//   Paying    paid; alerts run until "Paid until" (YYYY-MM-DD; blank = no end date)
//   Cancelled no more messages (the STOP workflow writes this; "Stopped" means the same)
//   Resumed   undo Cancelled and carry on as before (the START workflow writes this)
// A number with no lines is on the free trial.
function applyStatus(rows, statusRows) {
  const acc = {};
  for (const s of statusRows || []) {
    const phone = normalisePhone(s.Phone);
    if (!phone) continue;
    const a = (acc[phone] ||= { status: "Trial", paidUntil: "", cancelled: false });
    const st = String(s.Status || "").trim().toLowerCase();
    if (st === "paying") Object.assign(a, { status: "Paying", paidUntil: dayOf(s["Paid until"]), cancelled: false });
    else if (st === "trial") Object.assign(a, { status: "Trial", paidUntil: "", cancelled: false });
    else if (st === "cancelled" || st === "stopped") a.cancelled = true;
    else if (st === "resumed" || st === "active") a.cancelled = false;
  }
  return rows.map((r) => {
    const phone = normalisePhone(r["WhatsApp number"] || r.Phone);
    return phone && acc[phone] ? { ...r, _access: acc[phone] } : r;
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

// rows: sheet rows (objects keyed by column name), oldest first. Returns one entry per message to send.
// If a number signed up more than once, the newest sign-up is used (people re-sign to change trades).
// sentToday: phones already sent a morning or trial-ended message today (from the Log), so a re-run never double-sends.
function matchSubscribers(alerts, rows, sentToday = [], today = alerts.date) {
  const already = new Set(sentToday.map(normalisePhone));
  const firstSignup = {}; // the trial runs from someone's first sign-up, not a later re-sign-up
  for (const r of rows) {
    const p = normalisePhone(r["WhatsApp number"] || r.Phone);
    const d = dayOf(r["Submitted at"] || r["Created at"] || r.Timestamp);
    if (p && d && (!firstSignup[p] || d < firstSignup[p])) firstSignup[p] = d;
  }
  const seenPhones = new Set();
  const messages = [];
  const skipped = [];
  for (const row of [...rows].reverse()) {
    const sub = parseRow(row);
    const why =
      !sub.phone ? "no valid WhatsApp number" :
      !sub.consent ? "no consent" :
      !sub.trades.length ? "no trades" :
      seenPhones.has(sub.phone) ? "duplicate sign-up" :
      already.has(sub.phone) ? "already sent today" : null;
    if (why) { skipped.push({ phone: sub.phone, reason: why }); continue; }
    seenPhones.add(sub.phone);

    const can = access(sub, firstSignup[sub.phone], today);
    if (can.why) { skipped.push({ phone: sub.phone, reason: can.why }); continue; }
    if (can.trialEnded) {
      // One message on the first day after the trial; the button opens the pricing page.
      messages.push({ phone: sub.phone, kind: "trial_ended", template: "trial_ended", params: [clean(sub.name.split(" ")[0] || "there", 30)] });
      continue;
    }

    const fresh = pick(alerts.new, sub, MATCH.MAX_NEW);
    if (fresh.list.length) {
      messages.push({
        phone: sub.phone,
        kind: "new",
        template: `tender_alert_${fresh.list.length}`,
        params: [clean(sub.name.split(" ")[0] || "there", 30), String(fresh.total), ...fresh.list.map(tenderLine)],
        button_suffix: seeAllSuffix(sub),
        tender_ids: fresh.list.map((t) => t.id),
        more: fresh.total - fresh.list.length,
      });
    }
    if (sub.reminders) {
      const soon = pick(alerts.closing_soon, sub, MATCH.MAX_REMIND);
      if (soon.list.length) {
        messages.push({
          phone: sub.phone,
          kind: "reminder",
          template: `tender_closing_${soon.list.length}`,
          params: soon.list.map(tenderLine),
          tender_ids: soon.list.map((t) => t.id),
        });
      }
    }
    if (!fresh.list.length && !(sub.reminders && pick(alerts.closing_soon, sub, 1).list.length)) {
      skipped.push({ phone: sub.phone, reason: "nothing new for their trades today" });
    }
  }
  return { messages, skipped };
}

if (typeof module !== "undefined" && module.exports) module.exports = { MATCH, parseRow, normalisePhone, applyStatus, access, matchSubscribers, tenderLine };
