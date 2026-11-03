// Help-request form (help.html, registration-help.html): ?service=bid|csd|cidb preselects the service and
// ?tender=<id> names the tender. Posts as a plain form (no preflight) to the n8n webhook, which emails the owner.
(function () {
  var form = document.getElementById("help-form");
  if (!form) return;
  var msg = document.getElementById("help-msg");
  var q = new URLSearchParams(location.search);
  var service = q.get("service");
  if (service && form.service.querySelector('option[value="' + service + '"]')) form.service.value = service;

  var tender = (q.get("tender") || "").replace(/[^\w-]/g, "");
  if (tender) {
    form.tender.value = tender;
    var note = document.getElementById("help-tender");
    note.hidden = false;
    note.textContent = "Tender: " + tender;
    fetch("data/t/" + tender + ".json").then(function (r) { return r.ok ? r.json() : null; }).then(function (t) {
      if (!t) return;
      note.textContent = "Tender: " + t.title + (t.buyer ? " (" + t.buyer + ")" : "");
      form.tender.value = tender + " | " + t.title + (t.buyer ? " | " + t.buyer : "") + " | https://tenderfind.co.za/tender/" + tender + ".html";
    }).catch(function () {});
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = [].find.call(form.querySelectorAll("[required]"), function (el) { return el.type === "checkbox" ? !el.checked : !el.value.trim(); });
    if (!bad && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) bad = form.email;
    if (bad) { msg.textContent = bad.type === "checkbox" ? "Please tick the box so we may contact you." : "Please fill in " + (bad.closest("label").querySelector("span") || {}).textContent + "."; bad.focus(); return; }
    var button = form.querySelector("button");
    button.disabled = true;
    msg.textContent = "Sending…";
    var data = new URLSearchParams(new FormData(form));
    data.set("page", location.pathname);
    fetch(form.dataset.endpoint, { method: "POST", body: data })
      .then(function (r) { if (!r.ok) throw new Error(r.status); })
      .then(function () {
        form.innerHTML = '<h2>Thanks, we’ve got your request ✅</h2><p>We’ll reply to <b></b> within one working day with what we need from you and how to pay. Check your Spam folder if you don’t see it.</p>';
        form.querySelector("b").textContent = data.get("email");
      })
      .catch(function () {
        button.disabled = false;
        msg.textContent = "Sorry, that didn’t go through. Please try again, or email jobkgope1@gmail.com.";
      });
  });
})();
