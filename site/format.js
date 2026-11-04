// Display rules shared by the browser (window.TF) and the Node page generator (require).
(function (root) {
  const NOT_STATED = "Not stated — check the tender documents";
  const TZ = "Africa/Johannesburg";
  const AUTO = { regex: 1, ai: 1 };

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // field: { value, source }; docUrl: where to send people when it's missing
  function fieldHtml(field, docUrl, format) {
    if (!field || field.value == null || field.value === "") {
      const link = docUrl ? ` <a href="${esc(docUrl)}" rel="nofollow noopener" target="_blank">Open documents</a>` : "";
      return `<span class="missing">${esc(NOT_STATED)}</span>${link}`;
    }
    const v = format ? format(field.value) : field.value;
    const note = AUTO[field.source] ? ` <small class="auto">auto-extracted, confirm before bidding</small>` : "";
    return `${esc(v)}${note}`;
  }

  const dayFmt = new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
  const fullFmt = new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // YYYY-MM-DD in SA time

  // "2026-11-06" (a date with no time) -> "Fri 6 Nov"
  function shortDate(isoDate) {
    return dayFmt.format(new Date(`${isoDate}T12:00:00+02:00`));
  }

  function closingText(iso) {
    const d = new Date(iso);
    return `${fullFmt.format(d)}, ${timeFmt.format(d)}`;
  }

  function briefingText(b) {
    if (b.held === false) return "No briefing session";
    const kind = b.compulsory === true ? "Compulsory briefing" : b.compulsory === false ? "Non-compulsory briefing" : "Briefing";
    return [kind, b.date && shortDate(b.date), b.time, b.venue].filter(Boolean).join(" · ");
  }

  // { text: "Closes in 3 days", soon: true, closed: false }
  function countdown(iso, now = new Date()) {
    const end = new Date(iso);
    const ms = end - now;
    if (ms <= 0) return { text: "Closed", soon: false, closed: true };
    const days = Math.round((Date.parse(ymd.format(end)) - Date.parse(ymd.format(now))) / 864e5);
    const at = timeFmt.format(end);
    let text;
    if (ms < 36e5) text = `Closes in ${Math.max(1, Math.round(ms / 6e4))} min`;
    else if (days === 0) text = `Closes today at ${at}`;
    else if (days === 1) text = `Closes tomorrow at ${at}`;
    else text = `Closes in ${days} days`;
    return { text, soon: days <= 3, closed: false };
  }

  // The tender's details, built only from stated facts.
  function detailHtml(d) {
    const docUrl = d.documents[0]?.url;
    // Evidence snippets start at an arbitrary character; begin at the next whole word.
    const why = (f) => (f.snippet ? `<span class="why">From the documents: “…${esc(f.snippet.replace(/^\S*\s/, "").slice(0, 160))}…”</span>` : "");
    const where = d.location.value
      ? fieldHtml(d.location, docUrl)
      : fieldHtml(d.province, docUrl) + (d.province.source === "buyer-mapping" ? ` <small class="auto">${d.province.value === "National" ? "national buyer, site may be anywhere" : "based on who is buying"}</small>` : "");
    const reqs = [
      ["CIDB grade", d.cidb_grade],
      ["B-BBEE minimum level", d.bbbee_level],
      ["CSD registration", d.csd_required, () => "Required"],
    ];
    const docs = d.documents.length
      ? `<ol class="docs">${d.documents.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="nofollow noopener">${esc(x.title || "Document")}</a></li>`).join("")}</ol>`
      : `<p class="missing">${esc(NOT_STATED)}</p>`;
    const updated = d.updated
      ? `<p class="upd-note">Updated ${esc(shortDate(d.updated))}: ${esc((d.changes || []).join(" and ") || "details")} changed since first published.</p>`
      : "";
    return `${updated}<dl>
      <dt>What they want</dt><dd>${esc(d.description || NOT_STATED)}</dd>
      <dt>Who is buying</dt><dd>${esc(d.buyer || NOT_STATED)}${d.type ? ` · ${esc(d.type)}` : ""}${d.reference ? ` · Ref ${esc(d.reference)}` : ""}</dd>
      <dt>Where</dt><dd>${where}</dd>
      <dt>Closing date</dt><dd>${esc(closingText(d.closing))}</dd>
      <dt>Briefing session</dt><dd>${fieldHtml(d.briefing, docUrl, briefingText)}${why(d.briefing)}</dd>
      ${reqs.map(([label, f, fmt]) => `<dt>${label}</dt><dd>${fieldHtml(f, docUrl, fmt)}${why(f)}</dd>`).join("")}
      <dt>Tender documents</dt><dd>${docs}</dd>
      <dt>Check it on eTenders</dt><dd>${d.reference ? `Search for <b>${esc(d.reference)}</b> on ` : ""}<a href="https://www.etenders.gov.za/" target="_blank" rel="noopener">etenders.gov.za</a>, the official portal</dd>
    </dl>`;
  }

  const api = { NOT_STATED, esc, fieldHtml, briefingText, shortDate, closingText, countdown, detailHtml, ymd };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TF = api;
})(typeof window !== "undefined" ? window : globalThis);
