// Checks scripts/lib/match.js against a real alerts file with made-up subscribers.
//   node scripts/test-match.js [data/alerts/<date>.json]   (default: a fixed sample, so the test never depends on the day)
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { matchSubscribers, normalisePhone, parseRow, applyStatus } = require("./lib/match");

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
assert.strictEqual(normalisePhone("123"), null);
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
const reason = (phone) => (skipped.find((s) => s.phone === phone) || {}).reason;

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

console.log(`${path.basename(file)} (today = ${today}): ${messages.length} messages for ${rows.length} rows — all checks passed`);
for (const m of messages) console.log(`  → ${m.phone} ${m.template}${m.more ? ` (+${m.more} more)` : ""}`);
for (const s of skipped) console.log(`  ✗ ${s.phone} ${s.reason}`);
