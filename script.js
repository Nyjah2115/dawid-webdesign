/* Dawid Webdesign — portfolio */
(function () {
  var cichy = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var precyzyjny = window.matchMedia("(pointer: fine)").matches;
  var nav = document.getElementById("nav");

  /* ---------- wejście ---------- */
  document.querySelectorAll(".ik").forEach(function (ik, i) {
    ik.style.setProperty("--opozn", (0.5 + i * 0.05).toFixed(2) + "s");
    ik.style.setProperty("--faza", (-Math.random() * 6).toFixed(2) + "s");
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add("zaladowane"); });
  });


  /* ---------- płynne przewijanie (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && !cichy) {
    lenis = window.lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    (function petla(t) { lenis.raf(t); requestAnimationFrame(petla); })(performance.now());
  }

  /* ---------- menu ---------- */
  var burger = document.getElementById("burger");
  function zamknijMenu() {
    nav.classList.remove("nav--otwarte");
    burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", function () {
    var otwarte = nav.classList.toggle("nav--otwarte");
    burger.setAttribute("aria-expanded", String(otwarte));
    if (lenis) otwarte ? lenis.stop() : lenis.start();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") zamknijMenu(); });

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var cel = id === "#top" ? document.body : document.querySelector(id);
      if (!cel) return;
      e.preventDefault();
      zamknijMenu();
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : cel, { offset: id === "#top" ? 0 : -70, duration: 1.5 });
      else (id === "#top" ? window.scrollTo({ top: 0, behavior: "smooth" }) : cel.scrollIntoView({ behavior: "smooth" }));
    });
  });

  /* aktywna sekcja w menu */
  var linki = Array.prototype.slice.call(document.querySelectorAll(".nav__menu a[href^='#']"));
  var sekcje = linki.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  var obsMenu = new IntersectionObserver(function (wpisy) {
    wpisy.forEach(function (w) {
      if (!w.isIntersecting) return;
      linki.forEach(function (a, i) { a.classList.toggle("aktywny", sekcje[i] === w.target); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sekcje.forEach(function (s) { if (s) obsMenu.observe(s); });

  /* ---------- wielkie napisy MONOCHROME („WEBDESIGN”, „USŁUGI”) rozbite na litery ---------- */
  var slowa = Array.prototype.slice.call(document.querySelectorAll("[data-glitch]"));
  slowa.forEach(function (sl) {
    sl.setAttribute("data-tekst", sl.textContent);     // kopie do glitcha (::before / ::after)
    sl.innerHTML = sl.textContent.split("").map(function (z, i) {
      return '<span class="l" style="--i:' + i + '">' + z + "</span>";
    }).join("");
    sl.setAttribute("aria-hidden", "true");
  });

  /* ---------- wejścia przy przewijaniu ---------- */
  var obs = new IntersectionObserver(function (wpisy) {
    wpisy.forEach(function (w) {
      if (!w.isIntersecting) return;
      w.target.classList.add("widac");
      obs.unobserve(w.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
  document.querySelectorAll(".reveal, .projekt").forEach(function (el) { obs.observe(el); });
  var monos = Array.prototype.slice.call(document.querySelectorAll(".mono"));
  var obsMono = new IntersectionObserver(function (wpisy) {
    wpisy.forEach(function (w) {
      if (w.isIntersecting) { w.target.classList.add("widac"); obsMono.unobserve(w.target); }
    });
  }, { threshold: 0.35 });
  monos.forEach(function (m) { obsMono.observe(m); });

  /* glitch: co kilka sekund napis na ułamek sekundy rwie się na plastry (każdy napis we własnym rytmie) */
  function glitch(sl) {
    var pas = sl.closest(".mono");
    function raz() {
      sl.classList.remove("glitch");
      void sl.offsetWidth;                           // restart animacji
      sl.classList.add("glitch");
      setTimeout(function () { sl.classList.remove("glitch"); }, 480);
    }
    if (!document.hidden && pas.classList.contains("widac")) {
      raz();
      if (Math.random() < .35) setTimeout(raz, 620); // czasem krótka „dogrywka”
    }
    setTimeout(function () { glitch(sl); }, 3200 + Math.random() * 3800);
  }
  if (!cichy) slowa.forEach(function (sl, i) { setTimeout(function () { glitch(sl); }, 2800 + i * 1300); });

  /* ---------- przewijanie: tło, monochrome, kroki ---------- */
  var pulpit = document.getElementById("pulpit");
  var chrom = document.getElementById("chrom");
  var dlonie = document.getElementById("dlonie");
  var kroki = document.getElementById("kroki");
  var krokiEl = kroki ? Array.prototype.slice.call(kroki.children) : [];
  var ograniczy = function (v) { return Math.max(0, Math.min(1, v)); };

  function przyPrzewijaniu() {
    var vh = window.innerHeight;
    nav.classList.toggle("nav--tlo", window.scrollY > vh * 0.6);

    if (!cichy) {
      var p = pulpit.getBoundingClientRect();
      pulpit.style.setProperty("--s", ograniczy(-p.top / p.height).toFixed(4));

    }
    monos.forEach(function (m) {
      var r = m.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      if (!cichy) m.style.setProperty("--z", ograniczy((vh - r.top) / (vh + r.height)).toFixed(4));
      m.style.setProperty("--pk", ograniczy((vh - r.top) / r.height).toFixed(4));   // pierścień przy „DALEJ”
    });

    // dłonie dojeżdżają, gdy sekcja chromu wchodzi na ekran; stykają się, zanim dojdzie do góry
    if (dlonie) {
      var c = chrom.getBoundingClientRect();
      var pd = ograniczy((vh * .95 - c.top) / (vh * .8));
      dlonie.style.setProperty("--d", (1 - (1 - Math.pow(1 - pd, 3))).toFixed(4));
      dlonie.classList.toggle("dotyk", pd > .97);
    }

    if (kroki) {
      var k = kroki.getBoundingClientRect();
      var srodek = vh * 0.55;
      kroki.style.setProperty("--postep", ograniczy((srodek - k.top - 22) / (k.height - 44)).toFixed(4));
      krokiEl.forEach(function (el) {
        var nr = el.querySelector(".krok__nr").getBoundingClientRect();
        el.classList.toggle("aktywny", nr.top + nr.height / 2 < srodek);
      });
    }
  }
  var czeka = false;
  function zaplanuj() {
    if (czeka) return;
    czeka = true;
    requestAnimationFrame(function () { czeka = false; przyPrzewijaniu(); });
  }
  window.addEventListener("scroll", zaplanuj, { passive: true });
  window.addEventListener("resize", zaplanuj);
  przyPrzewijaniu();

  /* ---------- ikony na pulpicie: przeciąganie (mysz) ---------- */
  if (precyzyjny) {
    document.querySelectorAll(".ik").forEach(function (ik) {
      var start = null, przesunieto = false;
      ik.addEventListener("dragstart", function (e) { e.preventDefault(); });
      ik.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        start = {
          x: e.clientX, y: e.clientY,
          dx: parseFloat(ik.style.getPropertyValue("--dx")) || 0,
          dy: parseFloat(ik.style.getPropertyValue("--dy")) || 0,
          r: ik.getBoundingClientRect(), p: pulpit.getBoundingClientRect()
        };
        przesunieto = false;
        ik.setPointerCapture(e.pointerId);
      });
      ik.addEventListener("pointermove", function (e) {
        if (!start) return;
        var x = e.clientX - start.x, y = e.clientY - start.y;
        if (!przesunieto && Math.hypot(x, y) < 5) return;
        przesunieto = true;
        ik.classList.add("ciagnie");
        // nie wypuszczaj ikony poza pulpit
        x = Math.max(start.p.left - start.r.left, Math.min(start.p.right - start.r.right, x));
        y = Math.max(start.p.top + 70 - start.r.top, Math.min(start.p.bottom - 110 - start.r.bottom, y));
        ik.style.setProperty("--dx", (start.dx + x) + "px");
        ik.style.setProperty("--dy", (start.dy + y) + "px");
      });
      function koniec() { start = null; ik.classList.remove("ciagnie"); }
      ik.addEventListener("pointerup", koniec);
      ik.addEventListener("pointercancel", koniec);
      ik.addEventListener("click", function (e) { if (przesunieto) { e.preventDefault(); przesunieto = false; } });
    });
  }

  /* ---------- dock: powiększanie jak w macOS ---------- */
  var dock = document.getElementById("dock");
  var dockEl = Array.prototype.slice.call(dock.querySelectorAll(".dock__el"));
  if (precyzyjny && !cichy) {
    dock.addEventListener("mousemove", function (e) {
      dockEl.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        var m = 1 + 0.42 * Math.max(0, 1 - d / 130);
        el.style.setProperty("--m", m.toFixed(3));
      });
    });
    dock.addEventListener("mouseleave", function () {
      dockEl.forEach(function (el) { el.style.setProperty("--m", 1); });
    });
  }

  /* ---------- taśma konceptów ---------- */
  var tasma = document.getElementById("tasma");
  var wstecz = document.getElementById("konceptyWstecz");
  var dalej = document.getElementById("konceptyDalej");
  function krokTasmy() {
    var el = tasma.querySelector(".koncept");
    return el ? el.getBoundingClientRect().width + 24 : 400;
  }
  function stanStrzalek() {
    wstecz.disabled = tasma.scrollLeft <= 2;
    dalej.disabled = tasma.scrollLeft >= tasma.scrollWidth - tasma.clientWidth - 2;
  }
  wstecz.addEventListener("click", function () { tasma.scrollBy({ left: -krokTasmy(), behavior: "smooth" }); });
  dalej.addEventListener("click", function () { tasma.scrollBy({ left: krokTasmy(), behavior: "smooth" }); });
  tasma.addEventListener("scroll", stanStrzalek, { passive: true });
  window.addEventListener("resize", stanStrzalek);
  stanStrzalek();
})();
