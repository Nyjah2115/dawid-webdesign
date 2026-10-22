/* =========================================================
   Glitch — monochromatyczny efekt na napisie (do glitch.css)

   Tryby (atrybut na napisie):
     data-glitch="auto"   samo, co kilka sekund (domyślnie)
     data-glitch="hover"  po najechaniu / dotknięciu / fokusie
     data-glitch="raz"    jeden raz, gdy napis pojawi się na ekranie
   Przerwa w trybie auto (sekundy):
     data-glitch-przerwa="1.5-4.5"
   Kilka napisów rwie się naraz (np. dwie linie nagłówka):
     data-glitch-grupa="hero"  na każdym z nich
   Ręcznie z JS:  glitch(element, 400)  → wybuch na 400 ms
   ========================================================= */
(() => {
  const spokoj = matchMedia('(prefers-reduced-motion: reduce)');
  const los = (a, b) => a + Math.random() * (b - a);
  const strona = () => (Math.random() < .5 ? -1 : 1);
  const trwa = new WeakSet();

  // Jedna klatka zakłóceń: nowe wycinki i przesunięcia
  function klatka(el) {
    const s = el.style;

    const g1 = los(0, 92), h1 = los(4, 26);
    s.setProperty('--g1', `${g1}% -1em ${Math.max(0, 100 - g1 - h1)}% -1em`);
    s.setProperty('--g1-x', strona() * los(.02, .12) + 'em');

    if (Math.random() < .55) {
      const g2 = los(0, 96);
      const h2 = Math.random() < .6 ? los(1.5, 6) : los(8, 22);
      s.setProperty('--g2', `${g2}% ${los(0, 45)}% ${Math.max(0, 100 - g2 - h2)}% ${los(0, 45)}%`);
      s.setProperty('--g2-x', strona() * los(0, .08) + 'em');
    } else {
      s.setProperty('--g2', '100% 0 0 0');
    }

    s.setProperty('--g-x', strona() * los(0, .035) + 'em');
    s.setProperty('--g-cien', strona() * los(.02, .06) + 'em');
    s.setProperty('--g-op', Math.random() < .15 ? los(.55, .8) : 1);
  }

  function wybuch(el, czas = 350) {
    if (spokoj.matches || trwa.has(el)) return Promise.resolve();
    trwa.add(el);
    el.classList.add('is-glitch');
    const koniec = performance.now() + czas;
    return new Promise(gotowe => {
      (function tik() {
        if (performance.now() >= koniec) {
          el.classList.remove('is-glitch');
          trwa.delete(el);
          return gotowe();
        }
        klatka(el);
        setTimeout(tik, los(40, 90));
      })();
    });
  }

  const czekaj = ms => new Promise(r => setTimeout(r, ms));

  // Tryb auto dla jednego napisu albo całej grupy (wybuchy w tym samym momencie)
  function auto(els) {
    const [od, doo] = (els[0].dataset.glitchPrzerwa || '1.5-4.5').split('-').map(Number);
    const widac = new Set();
    let zegar;
    const razem = czas => Promise.all(els.map(el => wybuch(el, czas)));
    const nastepny = () => {
      clearTimeout(zegar);
      if (!widac.size) return;
      zegar = setTimeout(async () => {
        await razem(los(180, 480));
        if (Math.random() < .3) {           // czasem szybki dubel
          await czekaj(los(80, 220));
          await razem(los(90, 200));
        }
        nastepny();
      }, los(od, doo) * 1000);
    };
    const obs = new IntersectionObserver(wpisy => {
      wpisy.forEach(w => (w.isIntersecting ? widac.add(w.target) : widac.delete(w.target)));
      widac.size ? nastepny() : clearTimeout(zegar);
    });
    els.forEach(el => obs.observe(el));
  }

  const grupy = new Map();

  function start(el) {
    if (!el.dataset.text) el.dataset.text = el.innerText;
    const tryb = el.dataset.glitch || 'auto';

    if (tryb === 'hover') {
      const odpal = () => wybuch(el, los(300, 450));
      el.addEventListener('pointerenter', odpal);
      el.addEventListener('focus', odpal);
    } else if (tryb === 'raz') {
      const obs = new IntersectionObserver(([w]) => {
        if (!w.isIntersecting) return;
        obs.disconnect();
        wybuch(el, 650);
      }, { threshold: .6 });
      obs.observe(el);
    } else {
      const g = el.dataset.glitchGrupa || el;
      grupy.has(g) ? grupy.get(g).push(el) : grupy.set(g, [el]);
    }
  }

  window.glitch = wybuch;

  const init = () => {
    document.querySelectorAll('.glitch').forEach(start);
    grupy.forEach(auto);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
