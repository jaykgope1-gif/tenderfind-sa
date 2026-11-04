// Sign-up box: the Tally form (about 300KB) only loads when someone taps the button,
// so pages stay light on 3G. Tally sends each submission to the n8n sign-ups workflow.
(function () {
  var FORM_ID = "EqKWVX"; // https://tally.so/r/EqKWVX

  function loadTally(done) {
    if (window.Tally) return done();
    var s = document.createElement("script");
    s.src = "https://tally.so/widgets/embed.js";
    s.async = true;
    s.onload = done;
    s.onerror = done;
    document.head.appendChild(s);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-signup]");
    if (!btn) return;
    var box = btn.closest(".signup");
    var wrap = box.querySelector(".signup-form");
    var frame = wrap.querySelector("iframe");
    btn.hidden = true;
    wrap.hidden = false;
    if (frame.dataset.tallySrc) return;
    // Hidden fields in the form: "page" (where they signed up) and "ref" (who sent them, from ?ref= on the link).
    var ref = (location.search.match(/[?&]ref=([^&#]*)/) || [])[1] || "";
    var url = "https://tally.so/embed/" + FORM_ID + "?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&page=" + encodeURIComponent(location.pathname) + (ref ? "&ref=" + ref : "");
    frame.dataset.tallySrc = url;
    loadTally(function () {
      if (window.Tally) window.Tally.loadEmbeds();
      else frame.src = url; // embed script blocked: plain iframe still works, just a fixed height
    });
  });
})();
