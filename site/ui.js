// Small UI helpers for every page: scroll reveals, number count-up, header shadow, the sticky
// "Start free trial" button on phones, and "Start free trial" links that open the sign-up form.
// No library. With "reduce motion" switched on, nothing animates and everything shows straight away.
(function () {
  var reduce = (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || /[?&]shot=/.test(location.search); // shot: still screenshots
  var canObserve = "IntersectionObserver" in window;
  var root = document.documentElement;

  // ---------- reveal on scroll ----------
  var watch = function () {};
  if (!reduce && canObserve) {
    root.classList.add("anim");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    watch = function () { document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { io.observe(el); }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
  }

  // ---------- count-up numbers ----------
  function countUp(el, to) {
    if (!el) return;
    var fmt = function (n) { return Math.round(n).toLocaleString("en-ZA").replace(/\s/g, ","); };
    if (reduce || !to) { el.textContent = fmt(to || 0); return; }
    var start = null, dur = 1100;
    var run = function () {
      var step = function (t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dur);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); // ease-out
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!canObserve) return run();
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); run(); } });
    o.observe(el);
  }

  // ---------- header shadow + sticky CTA ----------
  function onReady() {
    var head = document.querySelector(".site-head");
    var sticky = document.querySelector(".sticky-cta");
    var signup = document.getElementById("signup");
    var signupVisible = false;
    if (signup && sticky && canObserve) {
      new IntersectionObserver(function (es) { signupVisible = es[0].isIntersecting; update(); }, { threshold: 0.15 }).observe(signup);
    }
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || 0;
      if (head) head.classList.toggle("scrolled", y > 8);
      if (sticky) {
        // Only after the top section is out of view, never on top of the sign-up box, and one button at a time.
        var hero = document.querySelector(".hero");
        var past = hero ? hero.getBoundingClientRect().bottom < 0 : y > 420;
        var on = past && !signupVisible;
        sticky.classList.toggle("show", on);
        document.body.classList.toggle("sticky-on", on);
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    // Jump to a spot on this page. Sections below the first screen only take their real height once
    // they are drawn (content-visibility in style.css), so a smooth scroll would stop short. Jump straight
    // there instead, then keep correcting for a few frames until the target stops moving.
    function jumpTo(el) {
      var last = null, still = 0, frames = 0;
      el.scrollIntoView({ behavior: "instant", block: "start" });
      (function settle() {
        requestAnimationFrame(function () {
          var top = Math.round(el.getBoundingClientRect().top);
          if (top === last) still++; else { still = 0; el.scrollIntoView({ behavior: "instant", block: "start" }); }
          last = Math.round(el.getBoundingClientRect().top);
          if (still < 3 && ++frames < 60) settle();
        });
      })();
    }

    window.TFUI = window.TFUI || {};
    window.TFUI.jumpTo = jumpTo;
    // Once the live tenders are on the page (app.js), land on the #spot in the address again, because content
    // above it may have grown. Only if the visitor hasn't started scrolling or tapping themselves.
    var userMoved = false;
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true }); });
    window.TFUI.settleHash = function () {
      if (userMoved || location.hash.length < 2) return;
      var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el && !el.closest(".card")) jumpTo(el);
    };

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // "Try it free" links: go to the sign-up box on this page and open the form.
      var a = e.target.closest("[data-signup-jump]");
      if (a) {
        var box = document.getElementById("signup");
        if (!box) return; // no box on this page: the link goes to the home page's box
        e.preventDefault();
        jumpTo(box);
        var btn = box.querySelector("[data-signup]");
        if (btn && !btn.hidden) btn.click();
        if (history.replaceState) history.replaceState(null, "", "#signup");
        return;
      }
      // Any other link to a spot on this page (#board, #search, #pricing...).
      var link = e.target.closest('a[href*="#"]');
      if (!link || link.origin !== location.origin || link.pathname !== location.pathname) return;
      var id = decodeURIComponent(link.hash.slice(1));
      var target = id && document.getElementById(id);
      if (!target || target.closest(".card")) return; // tender cards: app.js opens them from the address (#t…)
      e.preventDefault();
      jumpTo(target);
      if (history.pushState) history.pushState(null, "", "#" + id);
    });

    // Arriving with a #spot in the address (from another page): land on it properly, and open the form for #signup.
    if (location.hash.length > 1) {
      var start = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (start) jumpTo(start);
      if (location.hash === "#signup") {
        var b = document.querySelector("#signup [data-signup]");
        if (b) setTimeout(function () { b.click(); jumpTo(document.getElementById("signup")); }, 300);
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady); else onReady();

  window.TFUI = window.TFUI || {};
  window.TFUI.countUp = countUp;
  window.TFUI.watch = function () { watch(); };
})();
