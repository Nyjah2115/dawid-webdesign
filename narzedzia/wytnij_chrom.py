# wytnij_chrom.py WEJ.png WYJ.png [x0 y0 x1 y1]
# Chromowany napis/znak na czarnym tle -> przezroczyste tło (tylko PIL, bez numpy).
# Tło = ciemne piksele połączone z krawędzią kadru. Duże zamknięte ciemne obszary (oczka liter: wnętrze
# D, A) też są tłem; małe ciemne plamy wewnątrz liter to odbicia chromu i zostają pełne.
# Poświata iskier zostaje jako biel z alfą = jasność (bez ciemnych obwódek).
# Opcjonalny prostokąt: wycina tylko ten fragment kadru (np. sam znak z arkusza z dwoma elementami).
import sys
from PIL import Image, ImageDraw, ImageChops

PROG = 26          # do tej jasności piksel może być tłem / poświatą
OCZKO = 1800       # zamknięty ciemny obszar większy niż tyle pikseli = oczko litery (przezroczyste)

wej, wyj = sys.argv[1], sys.argv[2]
im = Image.open(wej).convert('RGB')
if len(sys.argv) == 7:
    im = im.crop(tuple(int(v) for v in sys.argv[3:7]))
W, H = im.size
L = im.convert('L')
b = L.point(lambda v: 255 if v >= PROG else 0)
for xy in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    if b.getpixel(xy) == 0:
        ImageDraw.floodfill(b, xy, 128, thresh=0)
# zamknięte ciemne obszary: duże -> tło (128), małe -> część litery (200)
krok = 6
for y in range(0, H, krok):
    for x in range(0, W, krok):
        if b.getpixel((x, y)) != 0:
            continue
        ImageDraw.floodfill(b, (x, y), 64, thresh=0)
        ile = b.histogram()[64]
        b = b.point(lambda v, duze=ile > OCZKO: (128 if duze else 200) if v == 64 else v)
cialo = b.point(lambda v: 0 if v == 128 else 255)
alfa = ImageChops.lighter(cialo, L)
kolor = Image.composite(im, Image.new('RGB', im.size, (255, 255, 255)), cialo)
out = kolor.copy()
out.putalpha(alfa)
bb = alfa.point(lambda v: 255 if v > 6 else 0).getbbox()
m = 16
out = out.crop((max(0, bb[0] - m), max(0, bb[1] - m), min(W, bb[2] + m), min(H, bb[3] + m)))
out.save(wyj)
print(wyj, out.size)
