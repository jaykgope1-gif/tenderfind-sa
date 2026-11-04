// TenderFind SA search page. Plain JS, no framework: loads data/tenders.json once and filters in memory.
(function () {
  const { esc, shortDate, closingText, countdown, detailHtml, ymd } = window.TF;

  const TRADES = ["Cleaning", "Security", "Construction", "Maintenance & repairs", "Catering", "IT", "Transport", "Supplies", "Professional services", "Other", "Sales & auctions"];
  const PAGE = 5; // results shown at first on the home page; "Show more tenders" adds 5 more
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

  // Days from today (SA time) to a date. Formatting dates in SA time is slow on cheap phones and this runs
  // thousands of times while the page loads, so answers are kept until today's date is re-checked (once a minute).
  let todayStr = "", todayAt = 0;
  const dayCache = new Map();
  const today = () => {
    const n = Date.now();
    if (n - todayAt > 60000) { const t = ymd.format(new Date(n)); if (t !== todayStr) dayCache.clear(); todayStr = t; todayAt = n; }
    return todayStr;
  };
  const daysUntil = (iso) => {
    const td = today();
    let v = dayCache.get(iso);
    if (v === undefined) { v = Math.round((Date.parse(ymd.format(new Date(iso))) - Date.parse(td)) / 864e5); dayCache.set(iso, v); }
    return v;
  };
  // Scroll to a spot on the page (ui.js corrects for sections that are drawn late).
  const jump = (el) => (window.TFUI && window.TFUI.jumpTo ? window.TFUI.jumpTo(el) : el.scrollIntoView({ block: "start" }));
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
      other: tokens([t.o, t.b, t.r, t.p, t.ty, t.l, t.g && `cidb ${t.g}`].filter(Boolean).join(" ")),
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
        <a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(whatsappText(t))}" target="_blank" rel="noopener"><svg class="icon icon-sm" aria-hidden="true"><use href="icons.svg#share"/></svg>Share on WhatsApp</a>
      </div>
      <div class="detail" hidden></div>
    </li>`;
  }

  function render() {
    const list = apply();
    el.results.innerHTML = list.length ? list.slice(0, shown).map(card).join("") : emptyState();
    el.more.hidden = list.length <= shown;
    const seeAll = $("see-all"); if (seeAll) seeAll.hidden = list.length <= shown;
    el.status.textContent = list.length
      ? `${list.length} open tender${list.length === 1 ? "" : "s"}`
      : "No matches";
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
    jump(li);
    const btn = li.querySelector("[data-view]");
    if (btn.getAttribute("aria-expanded") === "false") toggleView(btn);
  }

  // ---------- setup ----------

  // Links from tender pages and alerts: ?trade=Cleaning, ?province=Gauteng, ?new=1
  function fromQuery() {
    const q = new URLSearchParams(location.search);
    if (q.get("q")) { el.q.value = q.get("q").slice(0, 80); el.sort.value = "relevance"; }
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
      if (e.target.closest("[data-clear]")) {
        el.q.value = ""; trade = ""; el.province.value = ""; el.closing.value = ""; el.buyer.value = "";
        el.isNew.checked = el.briefing.checked = false; syncChips(); shown = PAGE; render(); el.q.focus();
      }
      if (e.target.closest("[data-retry]")) { el.status.textContent = "Loading today’s tenders…"; init(); }
    });
    el.missed.addEventListener("click", (e) => {
      if (!e.target.closest("[data-week]")) return;
      e.preventDefault();
      el.closing.value = "7";
      shown = PAGE;
      render();
      jump(el.status);
    });
    window.addEventListener("hashchange", openFromHash);
    if (CONTACT_WHATSAPP) {
      $("contact-link").href = `https://wa.me/${CONTACT_WHATSAPP}`;
      $("contact").hidden = false;
    }
  }

  // ---------- home page: everything below is live from data/tenders.json, so it is always real and current ----------

  const SHORT = { "ESKOM": "Eskom", "Transnet SOC Ltd": "Transnet", "Passenger Rail Agency of South Africa": "PRASA", "Airports Company of South Africa": "ACSA",
    "South African National Roads Agency": "SANRAL", "Road Accident Fund": "the Road Accident Fund" };
  const short = (b) => SHORT[b] || b;
  const tradeFile = (tr) => "tenders/" + tr.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "") + "-tenders.html";
  const set = (id, text) => { const e = $(id); if (e) e.textContent = text; };
  function briefingWords(t) {
    if (t.bc === "none") return "No briefing session";
    if (t.bc === true) return "Compulsory" + (t.bd ? ", " + shortDate(t.bd) : "") + ". Miss it and you can’t bid.";
    if (t.bc === false) return "Not compulsory" + (t.bd ? ", " + shortDate(t.bd) : "");
    if (t.bc === null) return "Yes, see the documents";
    return "Check the documents";
  }
  function closesWords(t) {
    const d = daysUntil(t.c);
    const time = closingText(t.c).split(", ").pop();
    return d <= 0 ? "Closes today, " + time : d === 1 ? "Closes tomorrow, " + time : "Closes in " + d + " days";
  }

  function showProof() {
    if (!$("notice") && !$("board-list")) return;
    const open = all.filter((t) => Date.parse(t.c) > Date.now());
    const week = open.filter((t) => t.pu && -daysUntil(t.pu) < 7);
    const count = (id, n) => { const e = typeof id === "string" ? $(id) : id; if (e) (window.TFUI ? window.TFUI.countUp(e, n) : (e.textContent = n)); };
    const byTradeAll = {};
    for (const t of open) byTradeAll[t.tr] = (byTradeAll[t.tr] || 0) + 1;
    const clean = byTradeAll.Cleaning || 0, sec = byTradeAll.Security || 0;
    count("stat-open", open.length);
    count("stat-cs", clean + sec);
    set("stat-cs-label", clean + " cleaning and " + sec + " security tenders open right now");
    count("stat-week", week.length);
    document.querySelectorAll("[data-trade-count]").forEach((e) => { e.textContent = byTradeAll[e.dataset.tradeCount] || 0; });

    const now = new Date();
    set("dateline", new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Johannesburg" }).format(now).replace(",", "") + " · " + open.length + " open tenders");

    // The notice: a real tender closing in 1 to 5 days. Gauteng cleaning or security first, then a compulsory briefing, then anything.
    const soon = open.filter((t) => { const d = daysUntil(t.c); return d >= 1 && d <= 5 && t.tr !== "Sales & auctions"; }).sort((a, b) => a.c.localeCompare(b.c));
    const known = (t) => t.bc !== undefined; // briefing details stated in the documents
    const gpCS = (t) => t.p === "Gauteng" && (t.tr === "Cleaning" || t.tr === "Security");
    const cs = (t) => t.tr === "Cleaning" || t.tr === "Security";
    const pick = soon.find((t) => gpCS(t) && known(t)) || soon.find(gpCS) || soon.find((t) => cs(t) && known(t)) || soon.find(cs)
      || soon.find((t) => t.p === "Gauteng" && t.bc === true) || soon.find((t) => t.bc === true) || soon[0] || open[0];
    if (pick && $("notice")) {
      set("n-stamp", closesWords(pick));
      set("n-ref", pick.r ? "Ref " + pick.r : "Reference not stated");
      set("n-title", pick.t);
      set("n-buyer", pick.b || "Not stated");
      set("n-where", pick.l || pick.p || "Not stated");
      set("n-closes", closingText(pick.c));
      set("n-brief", briefingWords(pick));
      if (pick.g) { set("n-cidb", pick.g); $("n-cidb-row").hidden = false; }
      $("n-link").href = "tender/" + pick.id + ".html";
      $("notice").setAttribute("aria-busy", "false");
      const st = $("n-stamp"); st.classList.toggle("calm", daysUntil(pick.c) > 3);
      if (pick.bc === true) $("n-brief").classList.add("must");
      const frame = $("page-frame");
      const theme = (location.search.match(/theme=w+/) || [""])[0]; // preview only: keep the chosen colour option
      if (frame) { frame.src = "tender/" + pick.id + ".html" + (theme ? "?" + theme + "&shot=1" : ""); $("page-open").href = "tender/" + pick.id + ".html"; }
    }


    // The morning email as readable text, built from this week's real tenders for a Gauteng cleaning or security company.
    const body = $("mail-body");
    if (body) {
      const fresh = week.filter((t) => t.tr !== "Sales & auctions" && daysUntil(t.c) >= 1).sort((a, b) => (b.pu || "").localeCompare(a.pu || ""));
      const gpcs = fresh.filter(gpCS), gp = fresh.filter((t) => t.p === "Gauteng"), anyCs = fresh.filter(cs);
      const [list, who] = gpcs.length >= 2 ? [gpcs, "a cleaning and security company in Gauteng"] : anyCs.length >= 2 ? [anyCs, "a cleaning and security company"] : [gp, "a business in Gauteng"];
      const items = list.slice(0, 3);
      const day = new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Johannesburg" }).format(now).replace(",", "");
      set("mail-subject", items.length + " new tender" + (items.length === 1 ? "" : "s") + " for you, " + day);
      body.innerHTML = "<p>Good morning,</p><p class=\"mail-h\"><b>New this week (" + items.length + ")</b></p>" + items.map((t) =>
        '<p class="mail-item"><b>' + esc(t.t) + "</b>" + esc(t.b || "Buyer not stated") + (t.p ? " · " + esc(t.p) : "") + "<br>Closes " + esc(closingText(t.c)) +
        (t.bc === true ? '<br><span class="brief">Compulsory briefing' + (t.bd ? " " + esc(shortDate(t.bd)) : "") + "</span>" : "") +
        '<br><a href="tender/' + esc(t.id) + '.html">View tender</a></p>').join("") +
        '<p class="mail-foot">Always read the tender documents before you bid. Don’t want these emails? Reply UNSUBSCRIBE.</p>';
      set("mail-caption", "Built from this week’s real tenders: what the email looks like for " + who + ".");
    }

    // Trade picker: filter the search to that trade and jump to it.
    const picker = $("picker");
    if (picker) picker.addEventListener("click", (e) => {
      const a = e.target.closest("[data-pick]");
      if (!a) return;
      e.preventDefault();
      trade = a.dataset.pick; syncChips(); shown = PAGE; render();
      jump(document.getElementById("search"));
    });

    // The notice board: up to 7 of this week's tenders, one per buyer, well-known buyers first.
    const KNOWN = /tshwane|johannesburg|joburg|ekurhuleni|eskom|prasa|passenger rail|transnet|rand water|gauteng|cape town|ethekwini|airports|sanral|health|education|police|correctional|public works/i;
    const seen = new Set();
    const rows = week.filter((t) => t.tr !== "Sales & auctions" && daysUntil(t.c) >= 2)
      .sort((a, b) => (cs(b) - cs(a)) || (KNOWN.test(b.b) - KNOWN.test(a.b)) || (b.p === "Gauteng") - (a.p === "Gauteng") || a.c.localeCompare(b.c))
      .filter((t) => !seen.has(t.b) && seen.add(t.b)).slice(0, 7);
    const list = $("board-list");
    if (list) {
      list.innerHTML = rows.map((t, i) => {
        const d = daysUntil(t.c);
        const tags = [t.bc === true ? "Compulsory briefing" : "", t.g ? "CIDB " + t.g : ""].filter(Boolean);
        return '<li class="board-row"><a href="tender/' + esc(t.id) + '.html">' +
          '<span class="b-buyer">' + esc(short(t.b || "Buyer not stated")) + '<small>' + esc(t.p || "") + '</small></span>' +
          '<span class="b-what">' + esc(t.t) + (tags.length ? '<small>' + tags.map(esc).join(" · ") + '</small>' : "") + '</span>' +
          '<span class="b-close' + (d <= 7 ? " soon" : "") + '">' + esc(closesWords(t)) + '<small>' + esc(t.r ? "Ref " + t.r : t.ty || "") + '</small></span></a></li>';
      }).join("");
      if (window.TFUI && window.TFUI.watch) window.TFUI.watch();
      const byBuyer = {};
      for (const t of week) byBuyer[t.b] = (byBuyer[t.b] || 0) + 1;
      const top = Object.entries(byBuyer).filter(([b]) => b).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([b, n]) => short(b) + " (" + n + ")");
      set("board-intro", week.length + " new tenders were published in the last 7 days, from " + new Set(week.map((t) => t.b)).size + " buyers. The busiest: " + top.slice(0, -1).join(", ") + " and " + top.slice(-1) + ". Here are a few:");
    }

    // Trades as a line of words, with live counts.
    const byTrade = {};
    for (const t of open) byTrade[t.tr] = (byTrade[t.tr] || 0) + 1;
    const line = $("trade-line");
    if (line) line.insertAdjacentHTML("beforeend", ["Cleaning", "Security", "Construction", "Maintenance & repairs", "Catering", "Supplies", "Transport", "IT", "Professional services"]
      .filter((tr) => byTrade[tr]).map((tr) => ' <a href="' + tradeFile(tr) + '">' + esc(tr) + ' <small>' + byTrade[tr] + '</small></a>').join(""));
  }

  // Nothing matched: say so plainly and offer a way out.
  function emptyState() {
    const q = el.q.value.trim();
    return '<li class="state"><svg class="icon" aria-hidden="true"><use href="icons.svg#empty"/></svg><h3>' + (q ? "No open tenders match “" + esc(q) + "”" : "No open tenders match these filters") + '</h3>' +
      '<p>Try a shorter word (“clean” instead of “cleaning services”), a town or a department, or clear the filters.</p>' +
      '<button class="btn" type="button" data-clear>Clear search and filters</button></li>';
  }
  // The data didn't load: explain and let them try again.
  function errorState() {
    el.status.textContent = "";
    el.results.innerHTML = '<li class="state error"><svg class="icon" aria-hidden="true"><use href="icons.svg#offline"/></svg><h3>We couldn’t load today’s tenders</h3>' +
      '<p>Your connection may have dropped. Your filters are kept.</p><button class="btn" type="button" data-retry><svg class="icon icon-sm" aria-hidden="true"><use href="icons.svg#refresh"/></svg>Try again</button></li>';
  }

  let bound = false;
  async function init() {
    if (!bound) { bind(); bound = true; }
    try {
      const res = await fetch("data/tenders.json");
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      all = data.tenders;
      el.updated.textContent = `Updated ${closingText(data.updated)}.`;
      const yieldNow = () => new Promise((r) => setTimeout(r, 0)); // let the browser paint between steps
      showProof();
      await yieldNow();
      setupFilters();
      fromQuery();
      await yieldNow();
      render();
      openFromHash();
      if (window.TFUI && window.TFUI.settleHash) window.TFUI.settleHash();
    } catch {
      errorState();
      const n = $("notice"); if (n) { n.setAttribute("aria-busy", "false"); set("n-stamp", "Offline"); set("n-title", "Couldn’t load this morning’s tenders"); }
    }
  }

  init();
})();
