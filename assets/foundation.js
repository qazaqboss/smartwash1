/* Анимация «что под полом»: слои фундамента и пола появляются по шагам. */
(function () {
  var root = document.getElementById("foundation");
  if (!root) return;
  var NS = "http://www.w3.org/2000/svg";
  var svg = root.querySelector(".fs-svg"), defs = svg.querySelector("defs"), stage = root.querySelector(".fs-stage");
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STEPS = [
    { t: "Котлован", d: "до −2,1 м", x: "Грунт снимают до отметки −2,1 м под ленту и до низа песчаной подушки под полом. Зимой грунт промерзает и пучится, поэтому подошву ставят ниже границы промерзания — тогда пучение не поднимет и не разорвёт ленту." },
    { t: "Уплотнённое основание", d: "трамбовка слоями", x: "Дно котлована трамбуют виброплитой слоями. Без этого основание даст осадку, и плита пола пойдёт трещинами под весом машин." },
    { t: "Арматурный каркас ленты", d: "4 стержня + хомуты", x: "В опалубку ставят каркас: продольные стержни по углам сечения и хомуты. В подошве — нижняя сетка. Арматура держит изгиб, когда грунт под лентой проседает неравномерно." },
    { t: "Бетонирование ленты", d: "стенка 500 мм · подошва 900 мм", x: "Монолитная лента по периметру здания. Широкая подошва 900 мм распределяет нагрузку на грунт, стенка 500 мм несёт каркас и стену." },
    { t: "Анкеры и опорные плиты колонн", d: "плита на 4 анкерных болтах", x: "Анкерные болты заливают в ленту при бетонировании. На них ставят опорную плиту, а на неё — стальную колонну каркаса 100×100. Сэндвич-панели крепятся к каркасу." },
    { t: "Гидроизоляция и утепление цоколя", d: "ЭППС 100 мм до −1 м", x: "Снаружи ленту покрывают обмазочной гидроизоляцией и закрывают ЭППС 100 мм на глубину 1 м — край пола и фундамент не промерзают. Затем пазухи котлована засыпают и трамбуют." },
    { t: "Песчаная подушка", d: "300 мм", x: "Песок выравнивает основание и не держит воду. В нём укладывают коллектор канализации Ø110 с уклоном 2 % к середине здания и ревизиями по концам." },
    { t: "Щебень", d: "150 мм", x: "Несущий слой из щебня. Крупные зёрна разрывают капиллярный подъём влаги из грунта к плите." },
    { t: "Бетонная подготовка B7,5", d: "100 мм", x: "Тонкая «черновая» плита: ровная и чистая база, на которую можно аккуратно уложить гидроизоляцию." },
    { t: "Гидроизоляция", d: "2 слоя внахлёст ≈5 мм", x: "Два слоя рулонной гидроизоляции с нахлёстом и заведением на стенку ленты. Влага снизу не доходит до утеплителя и плиты." },
    { t: "ЭППС под плитой", d: "100 мм", x: "Экструдированный пенополистирол. Тепло тёплого пола уходит вверх, в бокс, а не в грунт — это главная экономия газа зимой." },
    { t: "Трубы тёплого пола", d: "PEX Ø16–20, шаг 150–200 мм", x: "По утеплителю раскладывают контуры PEX: по два контура в боксе по обе стороны от лотка. Подача и обратка идут вдоль задней стены к коллектору в котельной." },
    { t: "Плита B25 с лотком", d: "≈200 мм, 2 сетки, уклон 1–2 %", x: "Заливают несущую плиту с двумя арматурными сетками. Верх делают с уклоном 1–2 % к лотку-трапу по оси бокса, сам лоток с решёткой бетонируют в плиту." },
    { t: "Упрочнённый верх (топпинг)", d: "износостойкий слой", x: "По свежему бетону втирают упрочняющую смесь. Пол не истирается шинами и не разъедается автохимией." },
    { t: "Пол в работе", d: "машина · тепло · вода", x: "Плита держит машину, тёплый пол греет снизу, вода стекает по уклону в лоток и уходит в коллектор. Влага и холод снизу отрезаны щебнем, гидроизоляцией и ЭППС." }
  ];
  var LAST = STEPS.length - 1;

  // layers
  var layers = [].map.call(svg.querySelectorAll("[data-s]"), function (g, i) {
    var L = { g: g, s: +g.getAttribute("data-s"), until: g.hasAttribute("data-until") ? +g.getAttribute("data-until") : 1e9, a: g.getAttribute("data-a") || "fade", v: 0, to: 0 };
    if (L.a === "pour" || L.a === "sweep") {
      var bb = g.getBBox(), cp = document.createElementNS(NS, "clipPath"), r = document.createElementNS(NS, "rect");
      cp.setAttribute("id", "fsc" + i); cp.appendChild(r); defs.appendChild(cp);
      g.setAttribute("clip-path", "url(#fsc" + i + ")");
      L.r = r; L.bb = { x: bb.x - 4, y: bb.y - 4, w: bb.width + 8, h: bb.height + 8 };
    }
    if (L.a === "draw") L.paths = [].slice.call(g.querySelectorAll("path[pathLength]"));
    return L;
  });
  var labels = [].slice.call(svg.querySelectorAll("[data-l]"));

  function apply(L) {
    var v = L.v, e = v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
    L.g.style.visibility = v > 0 ? "visible" : "hidden";
    if (L.a === "pour") { L.r.setAttribute("x", L.bb.x); L.r.setAttribute("width", L.bb.w); L.r.setAttribute("y", L.bb.y + L.bb.h * (1 - e)); L.r.setAttribute("height", L.bb.h * e); }
    else if (L.a === "sweep") { L.r.setAttribute("x", L.bb.x); L.r.setAttribute("y", L.bb.y); L.r.setAttribute("height", L.bb.h); L.r.setAttribute("width", L.bb.w * e); }
    else if (L.a === "draw") { L.paths.forEach(function (p) { p.style.strokeDashoffset = String(1 - e); }); L.g.querySelector(".fs-bars").style.opacity = Math.max(0, (e - .6) / .4); }
    else if (L.a === "drop") { L.g.style.opacity = e; L.g.style.transform = "translateY(" + ((1 - e) * -40).toFixed(1) + "px)"; }
    else { L.g.style.opacity = e; }
  }

  var cur = -1, raf = 0, last = 0;
  function tick(now) {
    var dt = Math.min(64, now - (last || now)); last = now; var busy = false;
    layers.forEach(function (L) {
      if (L.v === L.to) return;
      var dur = L.to > L.v ? (L.a === "fade" ? 600 : L.a === "drop" ? 700 : 1100) : 260;
      L.v = L.to > L.v ? Math.min(L.to, L.v + dt / dur) : Math.max(L.to, L.v - dt / dur);
      apply(L); busy = true;
    });
    raf = busy ? requestAnimationFrame(tick) : 0; if (!busy) last = 0;
  }

  var nEl = root.querySelector("[data-fs-n]"), titleEl = root.querySelector("[data-fs-title]"), thickEl = root.querySelector("[data-fs-thick]"), textEl = root.querySelector("[data-fs-text]");
  var range = root.querySelector("[data-fs-range]"), list = root.querySelector("[data-fs-steps]"), playBtn = root.querySelector("[data-fs-play]");
  root.querySelector("[data-fs-total]").textContent = STEPS.length; range.max = LAST;
  var items = STEPS.map(function (s, i) {
    var li = document.createElement("li"); li.tabIndex = 0; li.innerHTML = "<b>" + (i + 1) + "</b><span></span>"; li.lastChild.textContent = s.t;
    li.addEventListener("click", function () { stop(); go(i); });
    li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stop(); go(i); } });
    list.appendChild(li); return li;
  });

  function go(k, instant) {
    k = Math.max(0, Math.min(LAST, k)); cur = k;
    layers.forEach(function (L) { L.to = (L.s <= k && k < L.until) ? 1 : 0; if (instant || still) { L.v = L.to; apply(L); } });
    labels.forEach(function (g) { var s = +g.getAttribute("data-l"); g.style.opacity = s <= k ? 1 : 0; s === k ? g.setAttribute("data-cur", "") : g.removeAttribute("data-cur"); });
    items.forEach(function (li, i) { i <= k ? li.setAttribute("data-done", "") : li.removeAttribute("data-done"); i === k ? li.setAttribute("data-cur", "") : li.removeAttribute("data-cur"); });
    var live = svg.querySelector(".fs-live"); k === LAST ? live.setAttribute("data-on", "") : live.removeAttribute("data-on");
    k >= 12 ? svg.setAttribute("data-heat", "") : svg.removeAttribute("data-heat");
    var s = STEPS[k]; nEl.textContent = k + 1; titleEl.textContent = s.t; thickEl.textContent = s.d; textEl.textContent = s.x; range.value = k;
    if (!raf && !still) raf = requestAnimationFrame(tick);
  }

  // autoplay
  var timer = 0, playing = false, played = false;
  function setPlayUI() { playBtn.textContent = playing ? "❚❚ Пауза" : (cur >= LAST ? "↺ Заново" : "▶ Играть"); playBtn.setAttribute("aria-label", playing ? "Пауза" : "Запустить анимацию"); }
  function play() {
    if (cur >= LAST) go(0, true);
    playing = true; played = true; clearInterval(timer);
    timer = setInterval(function () { if (document.hidden) return; if (cur >= LAST) { stop(); return; } go(cur + 1); }, still ? 3200 : 2300);
    setPlayUI();
  }
  function stop() { playing = false; clearInterval(timer); setPlayUI(); }

  playBtn.addEventListener("click", function () { playing ? stop() : play(); });
  root.querySelector("[data-fs-prev]").addEventListener("click", function () { stop(); go(cur - 1); });
  root.querySelector("[data-fs-next]").addEventListener("click", function () { stop(); go(cur + 1); });
  root.querySelector("[data-fs-all]").addEventListener("click", function () { stop(); go(LAST); });
  range.addEventListener("input", function () { stop(); go(+range.value); });
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { stop(); go(cur + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { stop(); go(cur - 1); e.preventDefault(); }
    else if (e.key === " ") { playing ? stop() : play(); e.preventDefault(); }
  });

  // на узком экране — кадрируем по ленте и полу, подписи прячем (описание есть в карточке)
  var mq = matchMedia("(max-width: 640px)");
  function frame() { svg.setAttribute("viewBox", mq.matches ? "200 20 700 560" : "0 0 1200 640"); }
  frame(); try { mq.addEventListener("change", frame); } catch (e) { mq.addListener(frame); }

  go(0, true); setPlayUI();
  if ("IntersectionObserver" in window && !still) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting && !played) { play(); } else if (!en.isIntersecting && playing) { stop(); } });
    }, { threshold: .45 });
    io.observe(stage);
  } else { go(LAST, true); setPlayUI(); }

  // ссылка из других мест страницы: #foundation-play
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-fs-jump]"); if (!a) return;
    setTimeout(function () { go(0, true); play(); }, 500);
  });
})();
