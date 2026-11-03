// Checks scripts/lib/match.js against a real alerts file with made-up subscribers.
//   node scripts/test-match.js [data/alerts/<date>.json]   (default: a fixed sample, so the test never depends on the day)
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { matchSubscribers, normalisePhone, normaliseEmail, dayOf, parseRow, applyStatus } = require("./lib/match");

const file = process.argv[2] || path.join(__dirname, "fixtures", "alerts-sample.json");
const alerts = JSON.parse(fs.readFileSync(file, "utf8"));
const today = alerts.date;
const day = (n) => new Date(Date.parse(`${today}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

// Rows shaped like the Google Sheet Tally fills in (column = question title).
const row = (phone, o = {}) => ({
  "Submitted at": `${day(-3)} 09:15:00`,
  "Your name": "Test Person",
  "Business name": "Test Co",
  "Your trade(s)": "Cleaning",
  "Province(s) you can work in": "Gauteng",
  "WhatsApp number": phone,
  "Consent": "I agree to receive tender alerts on WhatsApp. Reply STOP anytime.",
  ...o,
});

assert.strictEqual(normalisePhone("082 000 0001"), "27820000001");
assert.strictEqual(normalisePhone("+27 82 000 0001"), "27820000001");
assert.strictEqual(normalisePhone("+27 08 200 00000"), "27820000000"); // typed 082… after the form's +27
assert.strictEqual(normalisePhone("123"), null);
assert.strictEqual(normaliseEmail(" Thandi@Example.CO.ZA "), "thandi@example.co.za");
assert.strictEqual(normaliseEmail("not-an-email"), null);
assert.strictEqual(dayOf("2026-11-01 23:30:00"), "2026-11-01", "a late sign-up must not move to the next day");
assert.deepStrictEqual(parseRow(row("1", { "Your trade(s)": "Maintenance & repairs, IT" })).trades, ["Maintenance & repairs", "IT"]);

const rows = [
  row("+27 82 000 0001", { "Your name": "Thandi Mokoena" }),                                   // on trial, day 4
  row("0820000002", { "Your trade(s)": "Construction, Maintenance & repairs", "Province(s) you can work in": "Limpopo, Mpumalanga",
    "Also remind me 3 days before matching tenders close?": "Yes, send reminders" }),          // on trial, wants reminders
  row("0820000003"),                                                                          // replied STOP
  row("0820000004", { Consent: "" }),                                                         // never consented
  row("0820000005", { "Submitted at": `${day(-14)} 08:00:00`, "Your name": "Sipho" }),         // trial over today
  row("0820000006", { "Submitted at": `${day(-20)} 08:00:00` }),                               // trial over, didn't pay
  row("0820000007", { "Submitted at": `${day(-40)} 08:00:00` }),                               // paying
  row("0820000008", { "Submitted at": `${day(-40)} 08:00:00` }),                               // paid period ran out
  row("0820000009", { "Submitted at": `${day(-2)} 08:00:00` }),                                // stopped, then START
  row("0820000001", { "Submitted at": `${day(-1)} 10:00:00`, "Your trade(s)": "Cleaning, Security" }), // re-signed to add a trade
];
// Status tab, top to bottom.
const status = [
  { Phone: "27820000003", Status: "Cancelled" },
  { Phone: "27820000007", Status: "Paying", "Paid until": day(10) },
  { Phone: "27820000008", Status: "Paying", "Paid until": day(-1) },
  { Phone: "27820000009", Status: "Cancelled" },
  { Phone: "27820000009", Status: "Resumed" },
];
const { messages, skipped } = matchSubscribers(alerts, applyStatus(rows, status), ["27820000010"]);
const sentTo = (phone, kind) => messages.some((m) => m.phone === phone && m.kind === kind);
const reason = (phone) => (skipped.find((s) => s.to === phone) || {}).reason;

// Newest sign-up wins (two trades), but the trial still counts from the first sign-up.
assert.ok(messages.some((m) => m.phone === "27820000001" && m.button_suffix === "?province=Gauteng&new=1"));
assert.ok(sentTo("27820000002", "new"));
assert.strictEqual(reason("27820000003"), "cancelled");
assert.strictEqual(reason("27820000004"), "no consent");
assert.ok(sentTo("27820000005", "trial_ended") && !sentTo("27820000005", "new"), "trial ends on day 15 with one message");
assert.strictEqual(reason("27820000006"), `trial ended ${day(-6)}`);
assert.ok(sentTo("27820000007", "new"), "paying gets alerts");
assert.strictEqual(reason("27820000008"), `payment due (paid until ${day(-1)})`);
assert.ok(sentTo("27820000009", "new"), "START after STOP resumes");

for (const m of messages) {
  assert.ok(m.params.length <= 7, "too many params");
  for (const p of m.params) assert.ok(!/[\n\t]| {4}/.test(p) && p.length <= 230, `bad param: ${p}`);
  if (m.kind !== "trial_ended") assert.strictEqual(m.template, `tender_${m.kind === "new" ? "alert" : "closing"}_${m.tender_ids.length}`);
}

// ---------- email channel: same rules, keyed by email; WhatsApp is optional ----------
const erow = (email, o = {}) => row("", { "Email address": email, "WhatsApp number (optional)": "",
  "Consent": "I agree to receive tender alerts by email, and on WhatsApp if I gave my number. I can unsubscribe at any time.", ...o });
const erows = [
  erow("thandi@example.co.za", { "Your name": "Thandi Mokoena", "Your trade(s)": "Cleaning, Construction" }),
  erow("NoMail"),                                                                             // invalid email
  erow("gone@example.co.za"),                                                                 // unsubscribed
  erow("late@example.co.za", { "Submitted at": `${day(-14)} 08:00:00` }),                    // trial over today
  erow("remind@example.co.za", { "Your trade(s)": "Maintenance & repairs", "Province(s) you can work in": "Limpopo",
    "Also remind me 3 days before matching tenders close?": "Yes, send reminders" }),
  erow("both@example.co.za", { "WhatsApp number (optional)": "+27820000020" }),                // cancelled via WhatsApp STOP
];
const estatus = [{ Email: "gone@example.co.za", Status: "Cancelled" }, { Phone: "27820000020", Status: "Cancelled" }];
const em = matchSubscribers(alerts, applyStatus(erows, estatus), [], today, "email");
const mail = (to) => em.messages.find((m) => m.to === to);
const eskip = (to) => (em.skipped.find((s) => s.to === to) || {}).reason;
const t = mail("thandi@example.co.za");
assert.ok(t && /^\d+ new tenders? for you, /.test(t.subject), "digest subject");
assert.ok(t.tender_ids.length <= 10, "at most 10 tenders per email");
for (const body of [t.text, t.html]) assert.ok(/unsubscribe/i.test(body), "every email has an unsubscribe line");
assert.ok(!/<script/i.test(t.html) && t.html.includes("Closes "), "html: title, buyer, closing date, link");
assert.ok(t.html.includes(">View tender</a>") && !/>[^<]*github\.io/.test(t.html), "friendly link text, no raw address shown");
assert.ok(/help\.html\?service=bid&amp;tender=\w+/.test(t.html) && t.html.includes("Need help with this tender? Bid Help (R550)"), "every tender has a Bid Help request link");
assert.ok(/^Good morning Thandi,/.test(t.text));
const noName = matchSubscribers(alerts, [erow("anon@example.co.za", { "Your name": "" }), erow("t@example.co.za", { "Your name": "TEST Person" })], [], today, "email").messages;
const lower = matchSubscribers(alerts, [erow("lower@example.co.za", { "Your name": "jay kgope" })], [], today, "email").messages[0];
assert.ok(/^Good morning Jay,/.test(lower.text), "lower-case names are capitalised");
assert.ok(noName.length === 2 && noName.every((m) => m.text.split("\n")[0] === "Good morning," && !/test/i.test(m.subject)), "no name or a test name: plain 'Good morning,'");
assert.strictEqual(eskip(null), "no valid email");
assert.strictEqual(eskip("gone@example.co.za"), "cancelled");
assert.strictEqual(mail("late@example.co.za").kind, "trial_ended");
assert.ok(/unsubscribe/i.test(mail("late@example.co.za").text));
assert.ok(/Closing in 3 days/.test(mail("remind@example.co.za").html), "reminders go in the same email");
assert.strictEqual(eskip("both@example.co.za"), "cancelled", "STOP on WhatsApp also stops email");

console.log(`${path.basename(file)} (today = ${today}): WhatsApp ${messages.length} messages for ${rows.length} rows, email ${em.messages.length} for ${erows.length} — all checks passed`);
for (const m of messages) console.log(`  → ${m.to} ${m.template}${m.more ? ` (+${m.more} more)` : ""}`);
for (const s of skipped) console.log(`  ✗ ${s.to} ${s.reason}`);
for (const m of em.messages) console.log(`  ✉ ${m.to} "${m.subject}" (${m.kind})`);
for (const s of em.skipped) console.log(`  ✗ ${s.to} ${s.reason}`);
console.log("\n--- sample email (text version) ---\n" + t.text);
