# klatki.py KATALOG_KLATEK KATALOG_WYJ nazwa1 nazwa2 ...
# Stopklatki z filmu Dawida w stylu strony: wycięte z tła (nazwa-maska.png z narzedzia-stron/maska),
# czerń-biel z krzywą S, lekko podniesione cienie, ziarno, przezroczyste tło -> nazwa.webp
import sys, numpy as np
from PIL import Image, ImageFilter

wej, wyj, nazwy = sys.argv[1], sys.argv[2], sys.argv[3:]
rng = np.random.default_rng(11)

for n in nazwy:
    rgb = np.asarray(Image.open(f"{wej}/{n}.jpg").convert("RGB")).astype(np.float32) / 255
    alfa = np.asarray(Image.open(f"{wej}/{n}-maska.png").convert("RGBA"))[..., 3]
    ys, xs = np.where(alfa > 128)
    x0, x1 = max(xs.min() - 8, 0), min(xs.max() + 8, alfa.shape[1])
    y0, y1 = max(ys.min() - 8, 0), min(ys.max() + 1, alfa.shape[0])

    l = rgb[..., 0] * .30 + rgb[..., 1] * .60 + rgb[..., 2] * .10
    l = np.clip((l - .06) / (.97 - .06), 0, 1) ** 1.12
    l = l - .18 * np.sin(2 * np.pi * l) / (2 * np.pi) * 1.6                 # krzywa S
    l = np.clip(l * .94, 0, 1)                                              # biała koszulka nie świeci na czysto
    l = np.clip(l + rng.normal(0, .022, l.shape), 0, 1)                      # ziarno

    a = Image.fromarray(alfa).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
    g = (l * 255).astype(np.uint8)
    out = np.dstack([g, g, g, np.asarray(a)])[y0:y1, x0:x1]
    Image.fromarray(out).save(f"{wyj}/{n}.webp", quality=88, method=6)
    print(n, out.shape[1], "x", out.shape[0])
