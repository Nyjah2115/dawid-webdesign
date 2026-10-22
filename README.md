# Dawid Webdesign — portfolio

Czarno-biała strona-portfolio w stylu dwóch wzorów Dawida:
- **pulpit** (hero): rozmyty portret, realizacje jak ikony na pulpicie (myszką da się je przeciągać,
  klik otwiera stronę), na dole dock jak w macOS (powiększa się pod kursorem, kalendarz pokazuje dzisiejszą datę);
- **MONOCHROME** (O mnie): ciemne zdjęcie, wielki szary napis WEBDESIGN, licznik 001 / 006 i przycisk
  „DALEJ” z pierścieniem postępu.

Czysty HTML/CSS/JS. Z zewnątrz: Google Fonts (Archivo rozciągnięte 125% + Inter), Lenis, kalendarz vizita.pl.

## Podgląd

    python3 -m http.server 8766    # z folderu vizita-rolki
    → http://localhost:8766/portfolio-ciemne/

## Zdjęcia Dawida

Oryginały w `zrodla/foto/` (poza repo). Wycięcie z tła: `rolka3/wytnij` (Vision, lokalnie).
Obróbka (czerń-biel, krzywa S, winieta, ziarno, czarne tło):

    python3 narzedzia/foto.py zrodla/foto img

(wymaga numpy + Pillow; systemowy python3 nie ma numpy — użyć venv).
Wychodzą: `img/omnie.jpg` (lustro, O mnie), `img/hero-glowa.jpg` (hero: głowa z gór, przyciemniona), `img/wskazuje.jpg` (wskazuje na nagłówek Realizacji), `img/kontakt.jpg` (profil w górę, kontakt).

## Realizacje

- 2 projekty pokazowe dla istniejących firm — Lila Med i Zaplecione (sekcja „Projekty”, id `#realizacje`) + 8 konceptów.
  MP Caffe, DUL-TRANS, Multi-Tech, Tom-Par i Da Zio usunięte (Dawid, 22.10).
  ŻADNA strona nie była zamówiona ani sprzedana — nie pisać o „klientach”, „realizacjach” ani „prawdziwych firmach”; zrzuty 1600×1000 w `img/realizacje/`,
  kwadratowe ikony 192 px do pulpitu w `img/ikony/`.
- Pozycje ikon na pulpicie: `--x/--y` (komputer, luźno wokół napisu) i `--mx/--my` (telefon, siatka 4 kolumn).
- Każdy projekt ma etykietę „Projekt pokazowy”.

## Kontakt

Telefon i mail jak na vizita.pl. Instagram: @dawid_webdesign (stary profil z kodu vizita.pl).
TikTok: też @dawid_webdesign — **niepotwierdzone**, sprawdzić, czy taki profil istnieje.

## Chrom i znak

- `chrom.js` — sekcja „Od pomysłu do strony”: płynny metal w tle liczony w WebGL (grzbiety szumu na płynącej
  przestrzeni + kałuże, odbicia ze studia, lekka tęcza na brzegach).
  Rysuje się tylko, gdy sekcja jest na ekranie. Bez zacinania przy pełnej jakości: nowa klatka liczy się po
  1/6 ekranu na klatkę (pasek po pasku do zapasowej tekstury), a na ekranie przenika się poprzednia i bieżąca. Podgląd samego efektu: `zrodla/test-chrom.html`.
- Znak (logo): `<symbol id="znak">` na początku `index.html` — chromowana gwiazda jako trzon litery D + łuk jak orbita.
  Używany przez `<use href="#znak">` w menu, stopce i docku. `img/favicon.svg` to ta sama grafika na czarnym kwadracie.
- Kalendarz vizita.pl ma zarezerwowane 1060 px wysokości, bo iframe dorasta po wczytaniu (inaczej strona pod nim skakała).
- Kontakt „Porozmawiajmy o cenie”: Dawid (wycięty z `zrodla/foto/gory.jpg`, `img/siedzi.webp`) siedzi na wielkim numerze
  telefonu. Siedzisko leży na 80,4% wysokości zdjęcia — `top` w `.kontakt__siedzi` liczy się z `--h`; poprawka w `--siedzisko`.
  Cen nie podajemy — wycena po rozmowie.
- „O mnie”: za Dawidem nieruchomy płynny metal, wypalony w `img/omnie.jpg` przez `narzedzia/metal.py`
  (ten sam wzór co shader w `chrom.js`, przeniesiony do numpy; kadr t=72, przygaszony do 60%) — zero kosztu na stronie.
- Wszystko, co klikalne, jest w stylu chromu (Dawid, 2026-10-22: „chcę wszystko w tym stylu”) — blok „CHROM” na końcu `style.css`:
  obręcz = lakier w `padding-box` + `var(--chrom)` w `border-box` (w warstwie nad chromem tylko gradienty, nie gołe kolory — inaczej
  przeglądarka wyrzuca całą regułę; wnętrze ma być pełne, inaczej prześwituje środek gradientu). Główne `.btn` srebrne (`--srebro`),
  `.btn--obrys`, `.link-strzalka`, stopka, chipy — lakier + obręcz; DALEJ i strzałki — chromowany pierścień; miniatury (pulpit, okno,
  telefon, koncepty) — chromowana ramka; menu na komputerze — kapsuła, aktywny link srebrny; numer telefonu — chromowane litery.
  Ikony w przyciskach, menu, stopce i na „Napisz” to `img/dock/*.png` (klasa `.ikona-chrom`).
- Bez glitchy (Dawid, 2026-10-22: „pousuwaj te animacje glitch wszystkie”). Wielkie „WEBDESIGN” i „REZERWACJE” tylko
  wjeżdżają literami (`data-litery` → `script.js` rozbija na `.l`). Gotowy efekt glitch leży osobno w `../glitch-napis/`.
- Usługi: pas MONOCHROME (`.mono.mono--uslugi`) — tło `img/uslugi-tlo.jpg` (nieruchomy metal z `metal.py`, t=47)
  i wielkie chromowane „USŁUGI” — obraz `img/uslugi-chrom.webp` (+ `-1200`), bez animacji. Wygenerowany w OpenArt
  (Nano Banana 2.1, 2K, styl Y2K liquid chrome z iskrami wg wzorów Dawida; oryginał `zrodla/openart/uslugi-chrom/`),
  wycięty z czarnego tła: tło = czerń połączona z krawędzią obrazu, poświata iskier zostaje jako biel z alfą.
  Rozmiar w jednostkach `cq` pasa (`min(84cqw, 86cqh)`), dół `max(12%, 100px)` — nie wchodzi na opis ani pasek na dole. Bez postaci (Dawid: usunąć).
  Lista usług: chromowane ikony 3D z OpenArt (`img/uslugi/`, wycięte maską) + mały numer 01–04. Pozostałe stopklatki z filmu: `zrodla/wideo-klatki/gotowe/`.
- Podstrona `o-mnie.html` (link „Więcej o mnie” z chromowaną ikoną profilu `img/uslugi/o-mnie.png` — OpenArt Nano Banana 2,
  image2image na wzór ikon folderu, maila i tarczy; w dolnym pasku sekcji O mnie, w miejscu licznika 001/006; na telefonie zamiast
  „Zobacz projekty”): wstęp z `img/kontakt.jpg`, „Kim jestem”, „Jak pracuję” (4 zasady w `.chrom-ramka`), „Poza ekranem”
  (`img/o-mnie-gory.jpg`, `img/o-mnie-profil.jpg` — cz.-b. z ziarnem, z `zrodla/foto/`) i CTA. Tylko fakty, które są na stronie —
  żadnych lat doświadczenia, liczb ani klientów. Dawid może dopisać coś o sobie (wiek, miasto, jak zaczął).
- Podstrona `napisz.html` + `napisz.js`: formularz przez formsubmit.co (AJAX, bez przeładowania; bez JS — zwykły POST i powrót
  na `napisz.html?wyslano=1`). Adres skrzynki w DWÓCH miejscach na `<form id="formularz">`: `action` i `data-adres`.
  Teraz kontakt@vizita.pl — Dawid zakłada nowego maila dla Dawid Webdesign; po zmianie adresu pierwsza wiadomość wyśle na niego
  link „Activate Form”, który trzeba kliknąć. Wszystkie linki „mail” (dock, przycisk w Kontakcie, stopki) prowadzą na `napisz.html`.
- Uwaga: `rezerwacje.html` używa tej samej klasy pasa co USŁUGI (`.mono--uslugi`) — reguły chromowanego napisu są pod `.mono--chrom`.
- Rezerwacje vizita.pl mają własną podstronę `rezerwacje.html` (pas MONOCHROME „REZERWACJE”, „Jak to działa” w 3 krokach,
  demo kalendarza, CTA). Na stronie głównej pod usługami tylko zajawka `.rez-zajawka`; strona główna nie ładuje już embed.js.
  Wspólna klasa `.chrom-ramka` (czarny lakier, chromowana obręcz, błysk) — ramka usług, zajawka, kroki i panel kalendarza.
  `script.js` działa na obu stronach (sprawdza, czy są pulpit, dock i taśma konceptów).
