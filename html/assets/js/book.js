/* Hành vi dùng chung: theme, cỡ chữ, TOC scroll-spy, progress bar, nút copy code. */
(function () {
  var root = document.documentElement;
  var THEMES = ["auto", "light", "sepia", "dark"];
  var LABEL = { auto: "Tự động", light: "Sáng", sepia: "Sepia", dark: "Tối" };

  function load(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function applyTheme(t) {
    if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    var b = document.getElementById("theme-btn");
    if (b) b.textContent = "◐ " + LABEL[t];
  }
  function applyScale(s) {
    root.style.setProperty("--font-scale", s);
  }

  var theme = load("spe-theme", "auto");
  var scale = parseFloat(load("spe-scale", "1")) || 1;

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(theme); applyScale(scale);

    var tb = document.getElementById("theme-btn");
    if (tb) tb.addEventListener("click", function () {
      theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
      save("spe-theme", theme); applyTheme(theme);
    });
    function bump(d) { scale = Math.min(1.5, Math.max(.8, Math.round((scale + d) * 100) / 100)); save("spe-scale", scale); applyScale(scale); }
    var m = document.getElementById("font-minus"), p = document.getElementById("font-plus");
    if (m) m.addEventListener("click", function () { bump(-.05); });
    if (p) p.addEventListener("click", function () { bump(.05); });

    var tt = document.getElementById("toc-toggle");
    if (tt) tt.addEventListener("click", function () { document.body.classList.toggle("toc-open"); });
    document.querySelectorAll(".sidebar-toc a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("toc-open"); });
    });

    // Progress bar
    var bar = document.querySelector(".progress");
    function onScroll() {
      if (!bar) return;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // Scroll-spy
    var links = {};
    document.querySelectorAll(".sidebar-toc a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var heads = Array.prototype.filter.call(document.querySelectorAll("main h2[id], main h3[id]"), function (h) { return links[h.id]; });
    if (heads.length && "IntersectionObserver" in window) {
      var cur = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (cur) cur.classList.remove("active");
            cur = links[e.target.id]; cur.classList.add("active");
            if (cur.scrollIntoView && getComputedStyle(cur.closest(".sidebar-toc")).position !== "static") cur.scrollIntoView({ block: "nearest" });
          }
        });
      }, { rootMargin: "-10% 0px -80% 0px" });
      heads.forEach(function (h) { io.observe(h); });
    }

    // Copy buttons
    document.querySelectorAll(".code").forEach(function (box) {
      var pre = box.querySelector("pre"); if (!pre) return;
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "copy"; btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        var text = pre.innerText.replace(/^\$ /gm, "");
        var done = function () { btn.textContent = "Đã copy"; setTimeout(function () { btn.textContent = "Copy"; }, 1400); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
      });
      box.appendChild(btn);
    });
  });
})();
