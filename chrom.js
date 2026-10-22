/* Płynny chrom w tle: metal rozlewa się po całej szerokości jak rtęć (WebGL, liczony na żywo).
   Kształt = cienkie grzbiety szumu (1 − |szum|) na mocno wykrzywionej, płynącej przestrzeni.
   Wysokość z progu grzbietów, normalna z różnic skończonych, odbicia z wymyślonego studia,
   lekka tęcza na brzegach (każdy kanał RGB ma trochę inną normalną). */
(function () {
  var sekcja = document.getElementById("chrom");
  var plotno = document.getElementById("chromPlotno");
  if (!sekcja || !plotno) return;
  var cichy = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var gl = plotno.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) { sekcja.classList.add("chrom--brak"); return; }
  var pochodne = !!gl.getExtension("OES_standard_derivatives");

  var VS = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }";
  var FS = (pochodne ? "#extension GL_OES_standard_derivatives : enable\n#define POCHODNE\n" : "") + [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uT; uniform vec2 uMysz; uniform float uSila;",
    "vec3 h3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));",
    "  return -1. + 2. * fract(sin(p) * 43758.5453); }",
    "float szum(vec3 p){",
    "  vec3 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);",
    "  return mix(mix(mix(dot(h3(i), f), dot(h3(i + vec3(1, 0, 0)), f - vec3(1, 0, 0)), u.x),",
    "                 mix(dot(h3(i + vec3(0, 1, 0)), f - vec3(0, 1, 0)), dot(h3(i + vec3(1, 1, 0)), f - vec3(1, 1, 0)), u.x), u.y),",
    "             mix(mix(dot(h3(i + vec3(0, 0, 1)), f - vec3(0, 0, 1)), dot(h3(i + vec3(1, 0, 1)), f - vec3(1, 0, 1)), u.x),",
    "                 mix(dot(h3(i + vec3(0, 1, 1)), f - vec3(0, 1, 1)), dot(h3(i + vec3(1, 1, 1)), f - vec3(1, 1, 1)), u.x), u.y), u.z);",
    "}",
    // pole metalu: >0 = metal; wartość = wysokość
    "float pole(vec2 p){",
    "  float t = uT;",
    "  vec2 d = p - uMysz;",
    "  p -= d * uSila * .55 * exp(-dot(d, d) * 1.6);",                                     // kursor rozpycha metal
    "  vec2 q = p + 1.25 * vec2(szum(vec3(p * .55, t * .045)), szum(vec3(p * .55 + 7.3, t * .045)));",
    "  q += .35 * vec2(szum(vec3(q * 1.3 + 2.1, t * .07)), szum(vec3(q * 1.3 + 9.7, t * .07)));",
    "  float n = szum(vec3(q * 1.05, t * .06)) + .3 * szum(vec3(q * 2.4 + 4.2, t * .09));",
    "  float zyly = 1. - abs(n);",                                                           // grzbiety = żyły
    "  float grub = .958 + .018 * szum(vec3(q * .7 + 11., t * .05));",                     // cienkie żyłki, raz cieńsze, raz grubsze
        "  return zyly - grub;",
    "}",
    "float pas(vec3 r, float x, float s){ return exp(-pow((r.x - x) / s, 2.)); }",
    "float studio(vec3 r){",
    "  float s = .03;",
    "  s += 1.6 * smoothstep(.16, .3, r.y);",                                                // softbox u góry
    "  s += 1.3 * pas(r, -.38, .05) * smoothstep(-.5, .1, r.y);",                             // pionowe świetlówki
    "  s += .9 * pas(r, .46, .04) * smoothstep(-.5, .1, r.y);",
    "  s += .45 * exp(-dot(r.xy, r.xy) * 7.);",                                              // płaskie szczyty: szary połysk
    "  s += .25 * smoothstep(-.12, -.4, r.y);",                                              // jasna podłoga
    "  return s;",
    "}",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / uRes.y;",
    "  vec2 p = uv * 2.1;",
    "  float px = 2.1 / uRes.y;",                                                              // ile pola na piksel
    "  float f0 = pole(p);",
    "  vec3 tlo = vec3(11. / 255.);",
    "  vec3 col = tlo;",
    "  #ifdef POCHODNE",
    "  float aa = max(fwidth(f0), 1e-4) * 1.3;",
    "  #else",
    "  float aa = .006;",
    "  #endif",
    "  float maska = smoothstep(-aa, aa, f0);",
    "  float wys = sqrt(max(f0, 0.) / .042);",                                                     // zaokrąglony profil
    "  if (maska > 0.) {",
    // normalna z dokładnych różnic — liczona tylko na pikselach żyłek (ok. 15% kadru), czerń kosztuje jedno pole
    "    float e = px;",
    "    vec2 g = vec2(sqrt(max(pole(p + vec2(e, 0.)), 0.) / .042) - wys, sqrt(max(pole(p + vec2(0., e)), 0.) / .042) - wys) / e * .018;",
    "    g /= max(1., length(g) / 2.6);",                                                          // brzeg: stromo, ale bez szpikulców
    "    vec3 rd = normalize(vec3((uv - vec2(.5 * uRes.x / uRes.y, .5)) * .5, -1.));",
    "    vec3 nr = normalize(vec3(-g * .88, 1.)), ng = normalize(vec3(-g, 1.)), nb = normalize(vec3(-g * 1.14, 1.));",
    "    vec3 c = vec3(studio(reflect(rd, nr)), studio(reflect(rd, ng)), studio(reflect(rd, nb)));",
    "    float fr = pow(1. - abs(ng.z), 2.);",
    "    c *= .85 + .6 * fr;",
    "    c = c / (1. + .7 * c) * 1.2;",
    "    col = mix(tlo, c, maska);",
    "  }",
    "  gl_FragColor = vec4(col, 1.);",
    "}"
  ].join("\n");

  function shader(typ, kod) {
    var s = gl.createShader(typ);
    gl.shaderSource(s, kod);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  function program(kodFS) {
    var v = shader(gl.VERTEX_SHADER, VS), f = shader(gl.FRAGMENT_SHADER, kodFS);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "a");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    return p;
  }
  // drugi, lekki program: przenikanie dwóch gotowych klatek metalu
  var FS_POKAZ = "precision mediump float; uniform sampler2D uA, uB; uniform float uK; uniform vec2 uRes;" +
    "void main(){ vec2 st = gl_FragCoord.xy / uRes; gl_FragColor = mix(texture2D(uA, st), texture2D(uB, st), uK); }";
  var progMetal = program(FS), progPokaz = program(FS_POKAZ);
  if (!progMetal || !progPokaz) { sekcja.classList.add("chrom--brak"); return; }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var um = {
    res: gl.getUniformLocation(progMetal, "uRes"), t: gl.getUniformLocation(progMetal, "uT"),
    mysz: gl.getUniformLocation(progMetal, "uMysz"), sila: gl.getUniformLocation(progMetal, "uSila")
  };
  var up = { k: gl.getUniformLocation(progPokaz, "uK"), res: gl.getUniformLocation(progPokaz, "uRes") };
  gl.useProgram(progPokaz);
  gl.uniform1i(gl.getUniformLocation(progPokaz, "uA"), 0);
  gl.uniform1i(gl.getUniformLocation(progPokaz, "uB"), 1);

  /* Jakość bez zacinania: pełna klatka metalu liczy się po kawałku — jeden poziomy pasek (1/6) na klatkę
     ekranu — do zapasowej tekstury. Na ekranie przenika się poprzednia i bieżąca gotowa klatka, więc ruch
     jest płynny, a karta w każdej klatce robi tylko 1/6 ciężkiej pracy, zawsze tyle samo. */
  var PASKI = 6;
  var cele = [], W = 0, H = 0;
  var stary = 0, biezacy = 1, nastepny = 2, pasek = 0, gotowyOd = 0, startBudowy = 0, interwal = 100;
  var budowa = { t: 0, x: -9, y: -9, sila: 0 }, odNowa = true;

  function nowyCel() {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex: tex, fb: fb };
  }
  // prawie pełna rozdzielczość (ostre krawędzie żyłek); gęstość pikseli przycięta do 1.5
  function rozmiar() {
    var skala = Math.min(window.devicePixelRatio || 1, 1.5) * 0.9;
    var w = Math.max(2, Math.round(plotno.clientWidth * skala)), h = Math.max(2, Math.round(plotno.clientHeight * skala));
    if (w === W && h === H && cele.length) return;
    W = plotno.width = w; H = plotno.height = h;
    cele.forEach(function (c) { gl.deleteTexture(c.tex); gl.deleteFramebuffer(c.fb); });
    cele = [nowyCel(), nowyCel(), nowyCel()];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    odNowa = true;
  }

  // reakcja na kursor wyłączona (Dawid: ma płynąć sam) — uSila zostaje 0
  var mysz = { x: -9, y: -9 }, sila = 0;

  var widac = false, t0 = performance.now(), klatka = null;
  function czas(teraz) { return cichy ? 20 : (teraz - t0) / 1000 + 20; }

  function licz(c, y0, h) {                         // jeden pasek (albo cała klatka) metalu do tekstury
    gl.bindFramebuffer(gl.FRAMEBUFFER, c.fb);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, y0, W, h);
    gl.useProgram(progMetal);
    gl.uniform2f(um.res, W, H);
    gl.uniform1f(um.t, budowa.t);
    gl.uniform2f(um.mysz, budowa.x, budowa.y);
    gl.uniform1f(um.sila, budowa.sila);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
  }
  function zapamietaj(teraz) {                      // parametry jednej klatki — stałe dla wszystkich jej pasków
    budowa.t = czas(teraz); budowa.x = mysz.x; budowa.y = mysz.y; budowa.sila = sila;
  }
  function pokaz(k) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(progPokaz);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cele[stary].tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cele[biezacy].tex);
    gl.uniform1f(up.k, k);
    gl.uniform2f(up.res, W, H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function rysuj(teraz) {
    rozmiar();
    if (odNowa) {                                   // start / zmiana rozmiaru: jedna pełna klatka od razu
      zapamietaj(teraz);
      licz(cele[stary], 0, H);
      licz(cele[biezacy], 0, H);
      gotowyOd = teraz - interwal; pasek = 0; odNowa = false;
    } else if (!cichy) {
      if (pasek === 0) { zapamietaj(teraz); startBudowy = teraz; }
      var h = Math.ceil(H / PASKI), y0 = pasek * h;
      licz(cele[nastepny], y0, Math.min(h, H - y0));
      if (++pasek >= PASKI) {                       // nowa klatka gotowa: przesuń kolejkę
        var s = stary; stary = biezacy; biezacy = nastepny; nastepny = s;
        interwal = Math.max(30, teraz - startBudowy + 16);
        gotowyOd = teraz; pasek = 0;
      }
    }
    pokaz(Math.min(1, (teraz - gotowyOd) / interwal));
    if (widac && !cichy) klatka = requestAnimationFrame(rysuj);
  }
  new IntersectionObserver(function (wpisy) {
    widac = wpisy[0].isIntersecting;
    if (widac) {
      sekcja.classList.add("chrom--gotowe");
      odNowa = true;                                // po powrocie od razu świeża klatka, bez przenikania sprzed minuty
      cancelAnimationFrame(klatka);
      klatka = requestAnimationFrame(rysuj);
    } else cancelAnimationFrame(klatka);
  }, { rootMargin: "100px 0px" }).observe(sekcja);
  window.addEventListener("resize", function () { if (cichy && widac) requestAnimationFrame(rysuj); });
})();
