// Daily social card: the same tenders as the social post, drawn as a phone-sized picture
// (1080x1920) for WhatsApp Status / Facebook. n8n attaches it to the owner's 06:45 email.
//
//   node scripts/social-card.js [--chrome <path>]
//
// Writes site/social/card.png and site/social/card.json ({ day, ids }). No web address goes on
// the picture: the sign-up link belongs in the caption, where it can be tapped.
// Never fails the daily run: with no Chrome or no suitable tenders it just leaves no card.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { ROOT } = require("./lib/store");
const { buildSocialPost, shortTitle, shortBuyer, dayLabel, dayKey } = require("./lib/social-post");

const OUT_DIR = path.join(ROOT, "site", "social");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function findChrome() {
  const i = process.argv.indexOf("--chrome");
  const candidates = [
    i > 0 && process.argv[i + 1],
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ];
  return candidates.find((p) => p && fs.existsSync(p));
}

// "Supply of Office Lights" -> "Office lights": the card has room for what, not how.
function cardTitle(title) {
  let s = shortTitle(title).replace(/^supply of (the )?/i, "");
  if (/^([A-Z][a-z]*\s*){2,}$/.test(s)) s = s.charAt(0) + s.slice(1).toLowerCase(); // Title Case -> Sentence case
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cardHtml(tenders, now) {
  const soonDay = dayKey(new Date(now.getTime() + 864e5)); // closing tomorrow -> red
  const five = tenders.length >= 5;
  const items = tenders.map((t) => `<div class="t${dayKey(new Date(t.c)) <= soonDay ? " soon" : ""}">
  <div class="what">${esc(cardTitle(t.t))}</div>
  <div class="meta"><span>${esc(shortBuyer(t.b))}</span><span class="close">Closes ${esc(dayLabel(t.c))}</span></div></div>`).join("\n");
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; }
  body { background: #0b5d3b; font-family: "Noto Sans", "Segoe UI", "DejaVu Sans", Arial, sans-serif; color: #16191a;
         display: flex; flex-direction: column; padding: ${five ? "80px" : "110px"} 72px ${five ? "70px" : "100px"}; }
  .kicker { color: #f2b705; font-size: 42px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
  h1 { color: #fff; font-size: ${five ? 80 : 92}px; line-height: 1.05; font-weight: 800; margin: 16px 0 ${five ? 36 : 52}px; }
  .list { display: flex; flex-direction: column; gap: ${five ? 20 : 28}px; flex: 1; }
  .t { background: #fff; border-radius: 28px; padding: ${five ? "24px 34px" : "34px 40px"}; border-left: 16px solid #f2b705; }
  .t.soon { border-left-color: #b42318; }
  .what { font-size: ${five ? 44 : 50}px; font-weight: 700; line-height: 1.15; }
  .meta { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-top: 14px; font-size: ${five ? 33 : 36}px; color: #545b5e; }
  .close { flex: none; font-weight: 700; color: #0b5d3b; background: #e8f1ec; padding: 6px 20px; border-radius: 40px; }
  .soon .close { color: #b42318; background: #fdecea; }
  .trust { margin-top: ${five ? 30 : 44}px; border: 3px solid #f2b705; border-radius: 24px; padding: 22px 30px;
           color: #fff; font-size: 34px; line-height: 1.35; text-align: center; }
  .trust b { color: #f2b705; }
  .foot { margin-top: ${five ? 30 : 40}px; color: #fff; text-align: center; }
  .foot .cta { font-size: 38px; font-weight: 600; line-height: 1.3; }
  .foot .brand { margin-top: 14px; font-size: 60px; font-weight: 800; }
  .foot .brand span { color: #f2b705; }
  .foot .free { margin-top: 4px; font-size: 34px; color: #cfe3d8; }
</style></head>
<body>
  <div class="kicker">Public government tenders</div>
  <h1>Gauteng tenders closing this week</h1>
  <div class="list">
${items}
  </div>
  <div class="trust">Public tenders from National Treasury’s eTenders.<br><b>We don’t sell tenders.</b> You bid yourself.</div>
  <div class="foot">
    <div class="cta">Tenders for your trade, emailed every morning</div>
    <div class="brand">TenderFind <span>SA</span></div>
    <div class="free">Free for 14 days · link in caption</div>
  </div>
</body></html>`;
}

function main() {
  const now = new Date();
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, "site", "data", "tenders.json"), "utf8"));
  const all = index.tenders || [];
  const post = buildSocialPost(all, now);
  fs.rmSync(path.join(OUT_DIR, "card.png"), { force: true }); // never leave yesterday's card behind
  if (!post.count) return console.log("Social card: no suitable tenders today, no card.");
  const chosen = post.ids.map((id) => all.find((t) => t.id === id)).filter(Boolean);

  const chrome = findChrome();
  if (!chrome) return console.log("Social card: Chrome not found, no card.");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = path.join(OUT_DIR, "card.html");
  fs.writeFileSync(html, cardHtml(chosen, now));
  const png = path.join(OUT_DIR, "card.png");
  try {
    execFileSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--window-size=1080,1920", "--virtual-time-budget=8000",
      `--screenshot=${png}`, "file://" + html.replace(/\\/g, "/").replace(/^(?=[A-Za-z]:)/, "/")], { stdio: "pipe", timeout: 60000 });
  } finally {
    fs.rmSync(html, { force: true }); // only the picture is published
  }
  if (!fs.existsSync(png)) return console.log("Social card: Chrome made no picture.");
  fs.writeFileSync(path.join(OUT_DIR, "card.json"), JSON.stringify({ day: dayKey(now), ids: post.ids }) + "\n");
  console.log(`Social card: ${chosen.length} tenders, ${fs.statSync(png).size} bytes.`);
}

try { main(); } catch (e) { console.log("Social card skipped:", e.message); }
