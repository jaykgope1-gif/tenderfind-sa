// Subscriber matching for the morning WhatsApp alerts.
// Plain JavaScript with no require(): paste the whole file into an n8n Code node (see docs/n8n-alerts.md).
// Tested locally by scripts/test-match.js.

const MATCH = {
  MAX_NEW: 5, // tenders per morning message
  MAX_REMIND: 3, // "closing in 3 days" reminders
  TRADES: ["Cleaning", "Security", "Construction", "Maintenance & repairs", "Catering", "IT", "Transport", "Supplies", "Professional services", "Other"],
  PROVINCES: ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"],
  EVERYWHERE: ["National", "Not stated"], // sent to subscribers in every province
  ACTIVE: ["", "Active", "Trial", "Paying"], // Status values that get messages (Phase F adds Trial/Paying/Cancelled)
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
  return /^\d{10,15}$/.test(d) ? d : null;
}

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
    status: String(get("Status")).trim(),
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

// The "Status" tab (Phone | Status | Changed | Note) is written by the STOP/START workflow and,
// in Phase F, by hand (Trial/Paying/Cancelled). The last line for a number wins.
function applyStatus(rows, statusRows) {
  const latest = {};
  for (const s of statusRows || []) {
    const phone = normalisePhone(s.Phone);
    if (phone) latest[phone] = String(s.Status || "").trim();
  }
  return rows.map((r) => {
    const phone = normalisePhone(r["WhatsApp number"] || r.Phone);
    return phone && latest[phone] !== undefined ? { ...r, Status: latest[phone] } : r;
  });
}

// rows: sheet rows (objects keyed by column name), oldest first. Returns one entry per message to send.
// If a number signed up more than once, the newest sign-up is used (people re-sign to change trades).
// sentToday: phones already messaged today (from the log), so a re-run never double-sends.
function matchSubscribers(alerts, rows, sentToday = []) {
  const already = new Set(sentToday.map(normalisePhone));
  const seenPhones = new Set();
  const messages = [];
  const skipped = [];
  for (const row of [...rows].reverse()) {
    const sub = parseRow(row);
    const why =
      !sub.phone ? "no valid WhatsApp number" :
      !sub.consent ? "no consent" :
      !MATCH.ACTIVE.includes(sub.status) ? `status ${sub.status}` :
      !sub.trades.length ? "no trades" :
      seenPhones.has(sub.phone) ? "duplicate sign-up" :
      already.has(sub.phone) ? "already sent today" : null;
    if (why) { skipped.push({ phone: sub.phone, reason: why }); continue; }
    seenPhones.add(sub.phone);

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

if (typeof module !== "undefined" && module.exports) module.exports = { MATCH, parseRow, normalisePhone, applyStatus, matchSubscribers, tenderLine };
