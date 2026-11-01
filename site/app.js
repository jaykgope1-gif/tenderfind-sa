// TenderFind SA search page. Plain JS, no framework: loads data/tenders.json once and filters in memory.
(function () {
  const { esc, shortDate, closingText, countdown, detailHtml, ymd } = window.TF;

  const TRADES = ["Cleaning", "Security", "Construction", "Maintenance & repairs", "Catering", "IT", "Transport", "Supplies", "Professional services", "Other"];
  const PAGE = 30;
  const NEW_DAYS = 3;
  const CONTACT_WHATSAPP = "27692898507"; // business WhatsApp, international format (also in scripts/lib/config.js)

  const $ = (id) => document.getElementById(id);
  const el = { q: $("q"), trades: $("trades"), province: $("province"), closing: $("closing"), sort: $("sort"), buyer: $("buyer"),
    isNew: $("new"), briefing: $("briefing"), status: $("status"), results: $("results"), more: $("more"),
    missed: $("missed"), missedList: $("missed-list"), updated: $("updated") };

  let all = [];
  let shown = PAGE;
  let trade = "";
  const details = {}; // id -> detail JSON (loaded on "View")

  // ---------- helpers ----------

  const today = () => ymd.format(new Date());
  const daysUntil = (iso) => Math.round((Date.parse(ymd.format(new Date(iso))) - Date.parse(today())) / 864e5);
  const isNew = (t) => -daysUntil(t.pu) < NEW_DAYS;
  const tenderUrl = (id) => `${location.origin}${location.pathname.replace(/[^/]*$/, "")}tender/${id}.html`;

  function briefingTag(t) {
    if (t.bc === undefined) return "";
    if (t.bc === "none") return "No briefing";
    const kind = t.bc === true ? "Compulsory briefing" : t.bc === false ? "Non-compulsory briefing" : "Briefing";
    return t.bd ? `${kind} ${shortDate(t.bd)}` : kind;
  }

  // ---------- search ----------
  // Any word can match. Rank by how many query words match, then by where: title (and trade) beats buyer/place.

  const STOP = new Set("a an and the of for to in on at by with from or as is are be service services provider provision appointment request quotation rfq rfp bid tender".split(" "));
  // Crude stemming so "guarding" finds "guards" and "cleaners" finds "cleaning".
  const stem = (w) => (w.length > 5 ? w.replace(/(ings?|ers?|es|ed|s)$/, "") : w.length > 3 ? w.replace(/s$/, "") : w);
  const tokens = (s) => (s || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  function queryWords(q) {
    const words = tokens(q).filter((w) => !STOP.has(w));
    return [...new Set((words.length ? words : tokens(q)).map(stem))];
  }

  function indexOf(t) {
    return (t._i ||= {
      title: tokens(`${t.t} ${t.tr}`),
      other: tokens([t.b, t.r, t.p, t.ty, t.l, t.g && `cidb ${t.g}`].filter(Boolean).join(" ")),
    });
  }

  const hit = (list, w) => list.some((x) => x.startsWith(w));

  // 0 = no match. Otherwise: matched words first (x10), title hits weigh 3, other fields 1.
  function score(t, words) {
    const ix = indexOf(t);
    let matched = 0, weight = 0;
    for (const w of words) {
      const inTitle = hit(ix.title, w);
      const inOther = !inTitle && hit(ix.other, w);
      if (inTitle || inOther) { matched++; weight += inTitle ? 3 : 1; }
    }
    return matched ? matched * 10 + weight : 0;
  }

  function whatsappText(t) {
    const lines = [`*${t.t}*`, `${t.b}${t.p ? " · " + t.p : ""}`, `Closes: ${closingText(t.c)}`];
    if (t.bc === true) lines.push(`Compulsory briefing${t.bd ? ": " + shortDate(t.bd) : " (see documents)"}`);
    if (t.g) lines.push(`CIDB: ${t.g}`);
    lines.push("", `Details: ${tenderUrl(t.id)}`);
    return lines.join("\n");
  }

  // ---------- filtering ----------

  function readFilters() {
    return {
      words: queryWords(el.q.value),
      province: el.province.value,
      closing: Number(el.closing.value) || 0,
      buyer: el.buyer.value,
      onlyNew: el.isNew.checked,
      onlyBriefing: el.briefing.checked,
      sort: el.sort.value,
    };
  }

  function apply() {
    const f = readFilters();
    const now = Date.now();
    const list = all.filter((t) => {
      if (Date.parse(t.c) <= now) return false;
      if (trade && t.tr !== trade) return false;
      if (f.province && (t.p || "Not stated") !== f.province) return false;
      if (f.buyer && t.b !== f.buyer) return false;
      if (f.closing && daysUntil(t.c) > f.closing) return false;
      if (f.onlyNew && !isNew(t)) return false;
      if (f.onlyBriefing && !(t.bc === true || t.bc === false || t.bc === null)) return false;
      t._s = f.words.length ? score(t, f.words) : 0;
      return !f.words.length || t._s > 0;
    });
    if (f.sort === "relevance" && f.words.length) list.sort((a, b) => b._s - a._s || a.c.localeCompare(b.c));
    else if (f.sort === "newest") list.sort((a, b) => b.pu.localeCompare(a.pu) || a.c.localeCompare(b.c));
    else list.sort((a, b) => a.c.localeCompare(b.c));
    return list;
  }

  // ---------- rendering ----------

  function card(t) {
    const cd = countdown(t.c);
    const tags = [`<span class="tag">${esc(t.tr)}</span>`];
    if (cd.soon) tags.push(`<span class="tag soon">Closing soon</span>`);
    if (t.u) tags.push(`<span class="tag upd">Updated ${esc(shortDate(t.u).replace(/^\w+,?\s*/, ""))}</span>`);
    else if (isNew(t)) tags.push(`<span class="tag new">New</span>`);
    const facts = [briefingTag(t), t.g && `CIDB ${t.g}`].filter(Boolean);
    return `<li class="card" id="t${esc(t.id)}">
      <div class="tags">${tags.join("")}</div>
      <h3><a href="tender/${esc(t.id)}.html">${esc(t.t)}</a></h3>
      <p class="meta">${esc(t.b || "Buyer not stated")} · ${esc(t.l || t.p || "Province not stated")}</p>
      <p class="due${cd.soon ? " soon" : ""}">${esc(cd.text)} <span class="meta">(${esc(closingText(t.c))})</span></p>
      <p class="summary">${esc([t.ty, t.r && `Ref ${t.r}`].filter(Boolean).join(" · "))}</p>
      ${facts.length ? `<ul class="facts">${facts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="actions">
        <button class="btn" data-view="${esc(t.id)}" aria-expanded="false">View</button>
        <a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(whatsappText(t))}" target="_blank" rel="noopener">Share on WhatsApp</a>
      </div>
      <div class="detail" hidden></div>
    </li>`;
  }

  function render() {
    const list = apply();
    el.results.innerHTML = list.slice(0, shown).map(card).join("");
    el.more.hidden = list.length <= shown;
    el.status.textContent = list.length
      ? `${list.length} open tender${list.length === 1 ? "" : "s"}`
      : "No open tenders match. Try fewer filters or a different word.";
    renderMissed();
  }

  function renderMissed() {
    const soon = all.filter((t) => Date.parse(t.c) > Date.now() && daysUntil(t.c) <= 7 && (!trade || t.tr === trade))
      .sort((a, b) => a.c.localeCompare(b.c));
    el.missed.hidden = !soon.length || !!el.closing.value || !!el.q.value.trim(); // out of the way while searching
    el.missedList.innerHTML = soon.slice(0, 4).map((t) =>
      `<li><a href="#t${esc(t.id)}"><b>${esc(t.t)}</b><span>${esc(countdown(t.c).text)}</span></a></li>`).join("") +
      (soon.length > 4 ? `<li><a href="#" class="all" data-week>See all ${soon.length} closing this week</a></li>` : "");
  }


  async function toggleView(btn) {
    const li = btn.closest(".card");
    const panel = li.querySelector(".detail");
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Hide" : "View";
    if (!open || panel.dataset.loaded) return;
    const id = btn.dataset.view;
    panel.innerHTML = `<p class="meta">Loading…</p>`;
    try {
      details[id] ||= await fetch(`data/t/${id}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
      panel.innerHTML = detailHtml(details[id]);
      panel.dataset.loaded = "1";
    } catch {
      panel.innerHTML = `<p class="missing">Couldn't load details. Check your connection and tap View again.</p>`;
      panel.hidden = true;
      btn.textContent = "View";
    }
  }

  // ---------- deep links (#t176127) ----------

  function openFromHash() {
    const m = location.hash.match(/^#t(\d+)$/);
    if (!m) return;
    let li = document.getElementById(`t${m[1]}`);
    if (!li && all.some((t) => t.id === m[1])) {
      // Not in the current view: clear filters so it shows.
      el.q.value = ""; trade = ""; el.province.value = ""; el.closing.value = ""; el.buyer.value = "";
      el.isNew.checked = el.briefing.checked = false;
      syncChips();
      const list = apply();
      shown = Math.max(PAGE, list.findIndex((t) => t.id === m[1]) + 1);
      render();
      li = document.getElementById(`t${m[1]}`);
    }
    if (!li) return;
    document.querySelectorAll(".card.target").forEach((c) => c.classList.remove("target"));
    li.classList.add("target");
    li.scrollIntoView({ block: "start" });
    const btn = li.querySelector("[data-view]");
    if (btn.getAttribute("aria-expanded") === "false") toggleView(btn);
  }

  // ---------- setup ----------

  // Links from tender pages and alerts: ?trade=Cleaning, ?province=Gauteng, ?new=1
  function fromQuery() {
    const q = new URLSearchParams(location.search);
    if (TRADES.includes(q.get("trade"))) { trade = q.get("trade"); syncChips(); }
    if ([...el.province.options].some((o) => o.value === q.get("province"))) el.province.value = q.get("province");
    if (q.get("new") === "1") { el.isNew.checked = true; el.isNew.closest("details").open = true; } // show that the filter is on
  }

  function syncChips() {
    el.trades.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.trade === trade)));
  }

  function setupFilters() {
    const counts = {};
    for (const t of all) counts[t.tr] = (counts[t.tr] || 0) + 1;
    el.trades.innerHTML = [`<button class="chip" data-trade="" aria-pressed="true">All trades</button>`]
      .concat(TRADES.filter((x) => counts[x]).map((x) => `<button class="chip" data-trade="${esc(x)}" aria-pressed="false">${esc(x)} <small>${counts[x]}</small></button>`))
      .join("");
    const provinces = [...new Set(all.map((t) => t.p || "Not stated"))].sort((a, b) => (a === "National") - (b === "National") || a.localeCompare(b));
    el.province.insertAdjacentHTML("beforeend", provinces.map((p) => `<option>${esc(p)}</option>`).join(""));
    const buyers = [...new Set(all.map((t) => t.b).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    el.buyer.insertAdjacentHTML("beforeend", buyers.map((b) => `<option>${esc(b)}</option>`).join(""));
  }

  function bind() {
    let timer;
    let sortTouched = false; // once someone picks a sort, typing doesn't override it
    el.q.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!sortTouched) el.sort.value = el.q.value.trim() ? "relevance" : "closing";
        shown = PAGE;
        render();
      }, 150);
    });
    el.sort.addEventListener("change", () => { sortTouched = true; });
    for (const s of [el.province, el.closing, el.sort, el.buyer, el.isNew, el.briefing]) s.addEventListener("change", () => { shown = PAGE; render(); });
    el.trades.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      trade = b.dataset.trade;
      syncChips();
      shown = PAGE;
      render();
    });
    el.more.addEventListener("click", () => { shown += PAGE; render(); });
    el.results.addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]");
      if (b) toggleView(b);
    });
    el.missed.addEventListener("click", (e) => {
      if (!e.target.closest("[data-week]")) return;
      e.preventDefault();
      el.closing.value = "7";
      shown = PAGE;
      render();
      el.status.scrollIntoView({ block: "start" });
    });
    window.addEventListener("hashchange", openFromHash);
    if (CONTACT_WHATSAPP) {
      $("contact-link").href = `https://wa.me/${CONTACT_WHATSAPP}`;
      $("contact").hidden = false;
    }
  }

  async function init() {
    bind();
    try {
      const res = await fetch("data/tenders.json");
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      all = data.tenders;
      el.updated.textContent = `Updated ${closingText(data.updated)}.`;
      setupFilters();
      fromQuery();
      render();
      openFromHash();
    } catch {
      el.status.textContent = "Couldn't load tenders. Check your connection and refresh the page.";
    }
  }

  init();
})();
