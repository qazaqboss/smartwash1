/* Схема инженерных сетей: системы, слои, виды, масштаб и сдвиг, полноэкранный режим. */
(function () {
  // тема для блока схемы (переменные --anatomy-*)
  var b = document.body, w = document.querySelector("[data-iso-wrap]"), r = document.documentElement, m = matchMedia("(prefers-color-scheme: dark)");
  function theme() { var t = r.getAttribute("data-theme"); var v = t === "light" || t === "dark" ? t : (m.matches ? "dark" : "light"); b.setAttribute("data-theme", v); w.setAttribute("data-theme", v); }
  theme(); try { m.addEventListener("change", theme); } catch (e) {}
  new MutationObserver(theme).observe(r, { attributes: true, attributeFilter: ["data-theme"] });

  var SYS=[{"id":"all","name":"Все системы","text":"Все сети вместе. Выберите систему, чтобы проследить её путь от начала до конца."},{"id":"water","name":"Вода","text":"Скважина → песчаный фильтр Ø500 → картридж → бак 220 л → насос повышения давления → умягчитель → 8 силовых блоков (помпа AR RK 15/20, 15 л/мин) → по стойке на задней стене → 2 Z-консоли в каждом боксе."},{"id":"ro","name":"Осмос","text":"Умягчённая вода → станция обратного осмоса → накопительный бак → вторая магистраль с клапанами в каждый силовой блок → кнопка «ОСМОС» на терминале: финишное ополаскивание без разводов. Концентрат осмоса уходит в трап техпомещения."},{"id":"drain","name":"Канализация","text":"Лоток с решёткой по оси бокса → приямок-грязеотстойник 2 × 2 × 2 м под боксом (песок и грязь оседают на дне) → выпуск → коллектор под полом с уклоном 2 % к середине → очистные из 4 камер (пескоуловитель, отстойник, нефтемаслоотделитель, сорбционный фильтр) → септик 1 (30 м³) → септик 2 (30 м³) → колодец КК → городская канализация."},{"id":"heat","name":"Тепло и газ","text":"Газ с улицы → надземная труба на опорах → шкаф учёта во дворе → напольный газовый котёл → бойлер косвенного нагрева (тёплая вода в силовые блоки зимой) и коллектор тёплого пола → контуры в стяжке каждого бокса."},{"id":"power","name":"Электрика","text":"Ввод кабелем с улицы → ВРУ в техпомещении → автомат и тепловая защита фаз на каждый силовой блок (8 × 5,5 кВт) + осмос, насос, компрессор, котёл → лоток по задней стене → терминал и светофор каждого бокса."},{"id":"air","name":"Воздух","text":"Компрессор в техпомещении (в КП не входит) → общий коллектор по задней стене → клапан на каждый пост → спиральный шланг 10 м с продувочным пистолетом у правой стены бокса."}];
  var stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg"), viewer = document.querySelector("[data-viewer]");
  var path = document.querySelector("[data-path]"), ro = document.querySelector("[data-readout]");
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- системы + автотур ----
  var chips = [].slice.call(document.querySelectorAll("[data-chip]")), cur = 0, touched = false, timer = 0;
  function show(i) {
    cur = (i + SYS.length) % SYS.length; var s = SYS[cur];
    stage.setAttribute("data-focus", s.id);
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-chip") === s.id)); });
    caption();
  }
  function stopTour() { touched = true; clearInterval(timer); }
  chips.forEach(function (c, i) { c.addEventListener("click", function () { stopTour(); show(i); }); });
  if (!still) timer = setInterval(function () { if (!touched && !document.hidden && layer === "all") show(cur + 1); }, 6500);

  // ---- слои ----
  var LAYER = {
    lo: ["Низ", "Под полом и под землёй: ленточный фундамент с опорными плитами колонн, пирог пола и тёплый пол, приямки 2 × 2 × 2 м под каждым боксом, коллектор канализации, очистные из 4 камер, два септика, колодец КК, скважина."],
    hi: ["Верх", "Над полом: 8 боксов с терминалами, Z-консолями и светофорами, техпомещение с силовыми блоками, котельной и водоподготовкой, газ и пылесос. Машины заезжают с улицы, светофор загорается красным, идёт мойка — пена и вода, — и машина выезжает."]
  };
  var layer = "all", lbtns = [].slice.call(document.querySelectorAll("[data-layer-btn]"));
  function caption() {
    var s = SYS[cur];
    if (layer !== "all" && s.id === "all") { path.textContent = LAYER[layer][1]; ro.textContent = LAYER[layer][0]; }
    else { path.textContent = s.text; ro.textContent = (layer !== "all" ? LAYER[layer][0] + " · " : "") + s.name; }
  }
  function setLayer(ly) {
    layer = ly; stage.setAttribute("data-layer", ly);
    lbtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-layer-btn") === ly)); });
    caption();
  }
  lbtns.forEach(function (x) { x.addEventListener("click", function () { stopTour(); setLayer(x.getAttribute("data-layer-btn")); }); });

  // ---- номера ----
  var pt = document.querySelector("[data-pins-toggle]");
  pt.addEventListener("click", function () { var on = stage.getAttribute("data-pins") !== "on"; stage.setAttribute("data-pins", on ? "on" : "off"); pt.setAttribute("aria-pressed", String(on)); });

  // ---- вид: viewBox с плавным переходом, масштаб, сдвиг ----
  var FULL = [0, 0, 1000, 551];
  var VIEWS = { all: FULL, tech: [316.3, 197, 345.9, 190.6], bay: [21.8, 100.4, 326.7, 180], fnd: [552.2, 337.9, 397.8, 219.2], yard: [370.9, 96.1, 396.8, 218.6] };
  var vb = FULL.slice(), anim = 0;
  var pins = [].map.call(stage.querySelectorAll("[data-pin]"), function (g) { var q = g.getAttribute("transform").match(/[-0-9.]+/g); return { g: g, x: +q[0], y: +q[1] }; });
  function clamp() {
    var minW = 90, maxW = FULL[2] * 1.15;
    if (vb[2] < minW) { var k = minW / vb[2]; vb[0] -= (vb[2] * k - vb[2]) / 2; vb[1] -= (vb[3] * k - vb[3]) / 2; vb[2] *= k; vb[3] *= k; }
    if (vb[2] > maxW) { var k2 = maxW / vb[2]; vb[0] += (vb[2] - vb[2] * k2) / 2; vb[1] += (vb[3] - vb[3] * k2) / 2; vb[2] *= k2; vb[3] *= k2; }
    var padX = vb[2] * .5, padY = vb[3] * .5;
    vb[0] = Math.min(FULL[2] - padX, Math.max(-padX, vb[0]));
    vb[1] = Math.min(FULL[3] - padY, Math.max(-padY, vb[1]));
  }
  function paint() {
    svg.setAttribute("viewBox", vb.map(function (v) { return v.toFixed(1); }).join(" "));
    var s = Math.min(1, vb[2] / FULL[2]);
    pins.forEach(function (p) { p.g.setAttribute("transform", "translate(" + p.x + " " + (p.y + 7 - 7 * s) + ") scale(" + s.toFixed(3) + ")"); });
    stage.classList.toggle("is-zoomed", vb[2] < FULL[2] * .98);
  }
  function animateTo(to, dur) {
    var from = vb.slice(), t0 = performance.now(); dur = still ? 0 : (dur == null ? 650 : dur); cancelAnimationFrame(anim);
    (function f(now) { var t = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - t, 3); vb = from.map(function (v, i) { return v + (to[i] - v) * e; }); paint(); if (t < 1) anim = requestAnimationFrame(f); })(t0);
  }
  var vbtns = [].slice.call(document.querySelectorAll("[data-view]"));
  function markView(name) { vbtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-view") === name)); }); }
  vbtns.forEach(function (x) { x.addEventListener("click", function () { markView(x.getAttribute("data-view")); animateTo(VIEWS[x.getAttribute("data-view")].slice()); }); });

  function toSvg(cx, cy) { var p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function zoomAt(k, cx, cy) {
    cancelAnimationFrame(anim);
    var rc = svg.getBoundingClientRect(); if (cx == null) { cx = rc.left + rc.width / 2; cy = rc.top + rc.height / 2; }
    var p = toSvg(cx, cy);
    vb = [p.x - (p.x - vb[0]) / k, p.y - (p.y - vb[1]) / k, vb[2] / k, vb[3] / k]; clamp(); paint(); markView("");
  }
  function zoomBtn(k) { var to = vb.slice(), c = [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2]; to[2] = vb[2] / k; to[3] = vb[3] / k; to[0] = c[0] - to[2] / 2; to[1] = c[1] - to[3] / 2; var keep = vb; vb = to; clamp(); to = vb; vb = keep; markView(""); animateTo(to, 300); }
  document.querySelector('[data-zoom="in"]').addEventListener("click", function () { zoomBtn(1.6); });
  document.querySelector('[data-zoom="out"]').addEventListener("click", function () { zoomBtn(1 / 1.6); });
  document.querySelector('[data-zoom="fit"]').addEventListener("click", function () { markView("all"); animateTo(FULL.slice()); });

  stage.addEventListener("wheel", function (e) {
    if (!e.ctrlKey && !viewer.classList.contains("is-full")) return;
    e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0025)), e.clientX, e.clientY);
  }, { passive: false });

  // перетаскивание и щипок
  var ptrs = {}, last = null, moved = false;
  function pts() { return Object.keys(ptrs).map(function (k) { return ptrs[k]; }); }
  stage.addEventListener("pointerdown", function (e) {
    if (e.button && e.button !== 0) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = false; last = null;
    if (e.pointerType !== "touch" || stage.classList.contains("is-zoomed") || pts().length > 1) { try { stage.setPointerCapture(e.pointerId); } catch (er) {} }
  });
  stage.addEventListener("pointermove", function (e) {
    if (!ptrs[e.pointerId]) return;
    var prev = ptrs[e.pointerId]; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var P = pts();
    if (P.length === 2) {
      var d = Math.hypot(P[0].x - P[1].x, P[0].y - P[1].y), mx = (P[0].x + P[1].x) / 2, my = (P[0].y + P[1].y) / 2;
      if (last) { zoomAt(d / last.d, mx, my); var s = vb[2] / svg.getBoundingClientRect().width; vb[0] -= (mx - last.mx) * s; vb[1] -= (my - last.my) * s; clamp(); paint(); }
      last = { d: d, mx: mx, my: my }; moved = true; e.preventDefault(); return;
    }
    if (P.length === 1) {
      if (e.pointerType === "touch" && !stage.classList.contains("is-zoomed")) return; // на целом виде палец листает страницу
      var dx = e.clientX - prev.x, dy = e.clientY - prev.y; if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      if (!moved) return;
      var sc = vb[2] / svg.getBoundingClientRect().width * (FULL[2] / FULL[2]);
      // учёт полей при preserveAspectRatio: берём масштаб из CTM
      var ctm = svg.getScreenCTM(); sc = 1 / ctm.a;
      cancelAnimationFrame(anim); vb[0] -= dx * sc; vb[1] -= dy * sc; clamp(); paint(); markView("");
      stage.classList.add("is-dragging");
    }
  });
  function up(e) { delete ptrs[e.pointerId]; last = null; if (!pts().length) stage.classList.remove("is-dragging"); }
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  stage.addEventListener("click", function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  stage.addEventListener("dblclick", function (e) { zoomAt(1.8, e.clientX, e.clientY); });

  // клавиатура
  stage.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowRight") { stopTour(); show(cur + 1); e.preventDefault(); }
    else if (k === "ArrowLeft") { stopTour(); show(cur - 1); e.preventDefault(); }
    else if (k === "+" || k === "=") { zoomBtn(1.6); e.preventDefault(); }
    else if (k === "-") { zoomBtn(1 / 1.6); e.preventDefault(); }
    else if (k === "0") { markView("all"); animateTo(FULL.slice()); e.preventDefault(); }
  });

  // на весь экран (CSS-режим — работает и на iPhone)
  var fb = document.querySelector("[data-full]");
  function setFull(on) {
    viewer.classList.toggle("is-full", on); document.documentElement.classList.toggle("vw-lock", on);
    fb.setAttribute("aria-label", on ? "Свернуть" : "На весь экран"); fb.title = fb.getAttribute("aria-label"); fb.setAttribute("aria-pressed", String(on));
    if (on) stage.focus({ preventScroll: true });
  }
  fb.addEventListener("click", function () { setFull(!viewer.classList.contains("is-full")); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && viewer.classList.contains("is-full")) setFull(false); });

  // номера ↔ список
  function mark(n, on) {
    var p = stage.querySelector('[data-pin="' + n + '"]'), li = document.querySelector('[data-pin-item="' + n + '"]');
    if (p) { on ? p.setAttribute("data-on", "") : p.removeAttribute("data-on"); } if (li) { on ? li.setAttribute("data-on", "") : li.removeAttribute("data-on"); }
  }
  [].forEach.call(document.querySelectorAll("[data-pin-item]"), function (li) {
    var n = li.getAttribute("data-pin-item");
    li.addEventListener("mouseenter", function () { mark(n, true); }); li.addEventListener("mouseleave", function () { mark(n, false); });
  });
  [].forEach.call(stage.querySelectorAll("[data-pin]"), function (p) {
    var n = p.getAttribute("data-pin");
    p.addEventListener("mouseenter", function () { mark(n, true); }); p.addEventListener("mouseleave", function () { mark(n, false); });
    p.addEventListener("click", function () { mark(n, true); setTimeout(function () { mark(n, false); }, 1600); });
  });

  setLayer("all"); show(0); paint();
})();
