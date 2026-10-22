# foto.py KATALOG_WYCINKOW KATALOG_WYJ
# Zdjęcia Dawida w stylu „monochrome”: czerń-biel, mocny kontrast, ziarno, czarne tło.
# W KATALOG_WYCINKOW: lustro-, profil-, wskazuje-, w-gore-wycinek.png (z rolka3/wytnij)
# oraz gory.jpg + gory-maska.png (narzedzia-stron/maska — maska na pełnym kadrze).
import sys, os, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metal import metal   # nieruchomy płynny metal (ten sam wzór co chrom.js)

wej, wyj = sys.argv[1:3]
lustro_p, profil_p = f"{wej}/lustro-wycinek.png", f"{wej}/profil-wycinek.png"
TLO = 11 / 255   # kolor strony #0b0b0b
rng = np.random.default_rng(7)

def cz_b(im, gamma=1.0, czern=0.04, biel=0.97):
    """RGBA -> szarość (L) z krzywą S; alfa zostaje."""
    a = np.asarray(im.convert("RGBA")).astype(np.float32) / 255
    l = a[..., 0] * .30 + a[..., 1] * .60 + a[..., 2] * .10   # niebieskie okulary/kabel wychodzą ciemne
    l = np.clip((l - czern) / (biel - czern), 0, 1) ** gamma
    l = l - .18 * np.sin(2 * np.pi * l) / (2 * np.pi) * 1.6       # krzywa S
    return np.clip(l, 0, 1), a[..., 3]

def na_tlo(l, alfa, W, H, x, y, skala, tlo=.03, wygas_dol=None, wygas_prawo=None, zjedz=0):
    h, w = l.shape
    nw, nh = int(w * skala), int(h * skala)
    li = Image.fromarray((l * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)
    am = Image.fromarray((alfa * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)
    if zjedz:   # zjada brzeg wycinka — tam zostaje jasna poświata z dawnego tła
        am = am.filter(ImageFilter.MinFilter(zjedz * 2 + 1))
    ai = np.asarray(am.filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
    ai = np.clip((ai - .08) / .92, 0, 1)            # bez jasnej obwódki z dawnego tła
    if wygas_dol:   # łagodne wygaszenie płaskiej krawędzi wycinka
        r = np.linspace(0, 1, nh)[:, None]
        ai = ai * np.clip((1 - r) / wygas_dol, 0, 1)
    if wygas_prawo:
        c = np.linspace(0, 1, nw)[None, :]
        ai = ai * np.clip((1 - c) / wygas_prawo, 0, 1)
    plotno = np.full((H, W), tlo, np.float32) if np.isscalar(tlo) else tlo.astype(np.float32).copy()
    maska = np.zeros((H, W), np.float32)
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + nw, W), min(y + nh, H)
    sl = (slice(y0 - y, y1 - y), slice(x0 - x, x1 - x))
    maska[y0:y1, x0:x1] = ai[sl]
    plotno[y0:y1, x0:x1] = np.asarray(li).astype(np.float32)[sl] / 255
    return plotno * maska + tlo * (1 - maska)

def winieta(img, sila=.55):
    H, W = img.shape
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H * .42) / (H / 2)) ** 2)
    return img * np.clip(1 - sila * np.clip(d - .55, 0, 1) ** 1.4, 0, 1)

def ziarno(img, sila=.035):
    return np.clip(img + rng.normal(0, sila, img.shape).astype(np.float32), 0, 1)

def zapisz(img, nazwa, q=84):
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).convert("RGB").save(f"{wyj}/{nazwa}", quality=q, optimize=True, progressive=True)

# --- O MNIE (wzór MONOCHROME): lustro, kadr od czubka głowy do piersi, szeroki 16:9 ---
l, a = cz_b(Image.open(lustro_p), gamma=1.45, czern=.06)
W, H = 2400, 1350
skala = H * 1.62 / l.shape[0]                    # widać ok. 60% wysokości postaci
x = int(W * .5 - l.shape[1] * skala * .40)      # twarz mniej więcej na środku kadru
tlo_metal = .035 + np.maximum(metal(W, H, 72.0) - 11 / 255, 0) * .6     # przygaszony, żeby nie walczył z twarzą
img = na_tlo(l, a, W, H, x, int(H * .05), skala, tlo=tlo_metal)
img = winieta(img, .85)
yy = np.linspace(0, 1, H)[:, None]
img = img * (1 - .25 * yy)                       # światło z góry
r = np.linspace(0, 1, H)[:, None]               # dół przyciemniony pod wielki napis
img = img * (1 - .55 * np.clip((r - .45) / .55, 0, 1) ** 1.3)
zapisz(ziarno(img, .03), "omnie.jpg")

# --- HERO (wzór z ikonami): profil, czerń-biel, mocno rozmyty ---
l, a = cz_b(Image.open(profil_p), gamma=1.05)
W, H = 2400, 1500
skala = H * 1.0 / l.shape[0]
x = int(W * .5 - l.shape[1] * skala * .52)
img = na_tlo(l, a, W, H, x, H - int(l.shape[0] * skala), skala, tlo=.03, wygas_prawo=.35)
ostry = winieta(img, .5)
roz = np.asarray(Image.fromarray((ostry * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(26))).astype(np.float32) / 255
zapisz(ziarno(roz * .92, .02), "profil-rozmyty.jpg", q=80)

# --- REALIZACJE: wskazuje palcem na nagłówek (na stronie mix-blend-mode: lighten) ---
l, a = cz_b(Image.open(f"{wej}/wskazuje-wycinek.png"), gamma=1.05, czern=.0)
l = .06 + l * .94                                # ciemne włosy odcinają się od czerni
W, H = 1200, 1050
skala = W * .98 / l.shape[1]
img = na_tlo(l, a, W, H, int(W * .01), int(H * .03), skala, tlo=TLO, wygas_dol=.3, zjedz=1)
zapisz(ziarno(np.maximum(img, TLO), .02), "wskazuje.jpg")

# --- KONTAKT: profil z głową w górę, low-key; szyja gaśnie w czerń ---
l, a = cz_b(Image.open(f"{wej}/w-gore-wycinek.png"), gamma=1.5, czern=.08)
W, H = 1500, 1500
skala = H * 1.02 / l.shape[0]
img = na_tlo(l, a, W, H, int(W * .5 - l.shape[1] * skala * .45), 0, skala, tlo=TLO, wygas_prawo=.25, zjedz=3)
yy = np.linspace(0, 1, H)[:, None]
xx = np.linspace(0, 1, W)[None, :]
swiatlo = np.clip(1 - np.clip((yy - .34) / .32, 0, 1) ** 1.1, 0, 1)      # od połowy szyi w dół — ciemność
swiatlo = swiatlo * (0.55 + 0.45 * np.clip(1 - xx * .6, 0, 1))          # światło z lewej, od twarzy
img = TLO + (img - TLO) * swiatlo
zapisz(ziarno(np.maximum(img, TLO), .025), "kontakt.jpg")
# --- KONTAKT: siedzi na wielkim numerze telefonu (przezroczyste tło) ---
rgb = Image.open(f"{wej}/gory.jpg").convert("RGB")
alfa = np.asarray(Image.open(f"{wej}/gory-maska.png").convert("RGBA"))[..., 3]
ys, xs = np.where(alfa > 128)
x0, x1, y0, y1 = xs.min() - 12, xs.max() + 12, max(ys.min() - 12, 0), ys.max() + 1
wyc = Image.fromarray(np.dstack([np.asarray(rgb), alfa])).crop((x0, y0, x1, y1))
l, a = cz_b(wyc, gamma=.86, czern=.03, biel=.8)                   # pod słońce: cienie podniesione, mocniejsze światła
l = .03 + l * .97
am = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8))
l = ziarno(l, .025)
Image.fromarray(np.dstack([(l * 255).astype(np.uint8)] * 3 + [np.asarray(am)])).save(f"{wyj}/siedzi.webp", quality=86, method=6)
print("siedzi: siedzisko na %.3f wysokości" % ((940 - y0) / (y1 - y0)))
# --- USŁUGI: tło — nieruchomy metal na całym kadrze ---
W, H = 2400, 1350
m = .035 + np.maximum(metal(W, H, 47.0) - 11 / 255, 0) * .5
yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
m = winieta(m, .8) * (1 - .5 * np.clip((yy - .55) / .45, 0, 1))
zapisz(ziarno(m, .022), "uslugi-tlo.jpg", q=82)
print("ok")
