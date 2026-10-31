// Checks scripts/lib/match.js against today's alerts file with made-up subscribers.
//   node scripts/test-match.js [data/alerts/2026-10-31.json]
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { matchSubscribers, normalisePhone, parseRow, applyStatus } = require("./lib/match");

const dir = path.join(__dirname, "..", "data", "alerts");
const file = process.argv[2] || path.join(dir, fs.readdirSync(dir).sort().pop());
const alerts = JSON.parse(fs.readFileSync(file, "utf8"));

// Rows shaped like the Google Sheet Tally fills in (column = question title).
const row = (o) => ({
  "Your name": "Test Person",
  "Business name": "Test Co",
  "Your trade(s)": "Cleaning",
  "Province(s) you can work in": "Gauteng",
  "WhatsApp number": "+27 82 000 0001",
  "Consent": "I agree to receive tender alerts on WhatsApp. Reply STOP anytime.",
  ...o,
});

assert.strictEqual(normalisePhone("082 000 0001"), "27820000001");
assert.strictEqual(normalisePhone("+27 82 000 0001"), "27820000001");
assert.strictEqual(normalisePhone("123"), null);
assert.deepStrictEqual(parseRow(row({ "Your trade(s)": "Maintenance & repairs, IT" })).trades, ["Maintenance & repairs", "IT"]);

const rows = [
  row({ "Your name": "Thandi Mokoena" }),
  row({ "WhatsApp number": "0820000002", "Your trade(s)": "Construction, Maintenance & repairs", "Province(s) you can work in": "Limpopo, Mpumalanga", "Also remind me 3 days before matching tenders close?": "Yes, send reminders" }),
  row({ "WhatsApp number": "0820000003" }), // replied STOP (see Status tab below)
  row({ "WhatsApp number": "0820000004", Consent: "" }),
  row({ "WhatsApp number": "+27820000001", "Your trade(s)": "Cleaning, Security" }), // signed up again to add a trade: this one wins
  row({ "WhatsApp number": "0820000005", "Your trade(s)": "Catering", "Province(s) you can work in": "Northern Cape", "Also remind me 3 days before matching tenders close?": "No, just the morning alerts" }),
];
// Status tab: last line per number wins, so 0820000001 stopped and then came back.
const status = [
  { Phone: "27820000003", Status: "Stopped" },
  { Phone: "27820000001", Status: "Stopped" },
  { Phone: "27820000001", Status: "Active" },
];
const { messages, skipped } = matchSubscribers(alerts, applyStatus(rows, status), ["27820000009"]);
assert.ok(messages.some((m) => m.phone === "27820000001" && m.button_suffix === "?province=Gauteng&new=1"), "newest sign-up (two trades) should win");

for (const m of messages) {
  assert.ok(m.params.length <= 7, "too many params");
  for (const p of m.params) assert.ok(!/[\n\t]| {4}/.test(p) && p.length <= 230, `bad param: ${p}`);
  assert.strictEqual(m.template, `tender_${m.kind === "new" ? "alert" : "closing"}_${m.tender_ids.length}`);
}
const reasons = skipped.map((s) => s.reason);
assert.ok(reasons.includes("status Stopped"));
assert.ok(reasons.includes("no consent"));
assert.ok(reasons.includes("duplicate sign-up"));

console.log(`${file}: ${messages.length} messages for ${rows.length} rows`);
for (const m of messages) console.log(`\n→ ${m.phone} ${m.template}${m.more ? ` (+${m.more} more)` : ""} ${m.button_suffix || ""}\n  ${m.params.join("\n  ")}`);
console.log("\nSkipped:", skipped);
