/* Слои изометрической схемы: «низ» (под полом и под землёй) и «верх» (боксы, оборудование, машины). */
(function () {
  var stage = document.querySelector(".iso-stage"); if (!stage) return;
  var btns = [].slice.call(document.querySelectorAll("[data-layer-btn]"));
  var path = document.querySelector("[data-path]"), ro = document.querySelector("[data-readout]");
  var TEXT = {
    lo: ["Низ", "Под полом и под землёй: ленточный фундамент с опорными плитами колонн, пирог пола и тёплый пол, приямки 2 × 2 × 2 м под каждым боксом, коллектор канализации, очистные из 4 камер, два септика, колодец КК, скважина, ввод кабеля."],
    hi: ["Верх", "Над полом: 8 боксов с терминалами, Z-консолями и светофорами, техпомещение с силовыми блоками, котельной и водоподготовкой, газ и пылесос. Машины заезжают с улицы, светофор переключается на красный, идёт мойка — пена, вода, — и машина выезжает."]
  };
  var saved = null;
  function set(ly) {
    stage.setAttribute("data-layer", ly);
    btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-layer-btn") === ly)); });
    if (ly === "all") { if (saved) { path.textContent = saved[0]; ro.textContent = saved[1]; saved = null; } return; }
    if (!saved) saved = [path.textContent, ro.textContent];
    path.textContent = TEXT[ly][1]; ro.textContent = TEXT[ly][0];
  }
  btns.forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-layer-btn")); }); });
  // выбор системы возвращает свои подписи
  [].forEach.call(document.querySelectorAll("[data-chip]"), function (c) { c.addEventListener("click", function () { saved = null; }); });
  set("all");
})();
