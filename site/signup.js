// Sign-up box: the Tally form (about 300KB) only loads when someone taps the button,
// so pages stay light on 3G. Submissions go to Tally, which forwards them to the Google Sheet.
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
    // "page" is a hidden field in the form: which page the person signed up from.
    var url = "https://tally.so/embed/" + FORM_ID + "?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&page=" + encodeURIComponent(location.pathname);
    frame.dataset.tallySrc = url;
    loadTally(function () {
      if (window.Tally) window.Tally.loadEmbeds();
      else frame.src = url; // embed script blocked: plain iframe still works, just a fixed height
    });
  });
})();
