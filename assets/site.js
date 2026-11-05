/* Тема (авто → светлая → тёмная), подсветка раздела в меню, кнопка «наверх». */
(function () {
  var r = document.documentElement, btn = document.querySelector("[data-theme-btn]");
  var ICON = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'
  };
  var NAME = { auto: "как в системе", light: "светлая", dark: "тёмная" };
  function mode() { var t = r.getAttribute("data-theme"); return t === "light" || t === "dark" ? t : "auto"; }
  function paint() { var m = mode(); btn.innerHTML = ICON[m]; btn.setAttribute("aria-label", "Тема: " + NAME[m]); btn.title = "Тема: " + NAME[m]; }
  btn.addEventListener("click", function () {
    var next = { auto: "light", light: "dark", dark: "auto" }[mode()];
    if (next === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", next);
    try { next === "auto" ? localStorage.removeItem("sw-theme") : localStorage.setItem("sw-theme", next); } catch (e) {}
    paint();
  });
  paint();

  // текущий раздел в меню
  var links = [].slice.call(document.querySelectorAll(".nav a"));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function spy() {
    var y = 120, best = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= y) best = i; });
    links.forEach(function (a, i) { i === best ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"); });
    var up = document.querySelector("[data-to-top]"); if (up) window.scrollY > 900 ? up.setAttribute("data-show", "") : up.removeAttribute("data-show");
  }
  var ticking = false;
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); } }, { passive: true });
  spy();
})();
