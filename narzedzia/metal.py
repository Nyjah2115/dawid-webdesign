# metal.py — nieruchomy kadr płynnego metalu, ten sam wzór co shader w chrom.js
# (grzbiety szumu na płynącej przestrzeni, cienkie żyłki, odbicia ze studia), tylko w odcieniach szarości.
# Użycie z foto.py: metal(W, H, t) -> tablica float32 (H, W) w zakresie 0…1 (tło = 11/255).
import numpy as np

TLO = 11 / 255


def _frac(x):
    return x - np.floor(x)


def _h3(i):
    p = np.stack([i @ np.array([127.1, 311.7, 74.7]),
                  i @ np.array([269.5, 183.3, 246.1]),
                  i @ np.array([113.5, 271.9, 124.6])], -1)
    return -1 + 2 * _frac(np.sin(p) * 43758.5453)


def szum(xy, z):
    """Szum gradientowy 3D (jak w shaderze); xy: (N, 2), z: liczba."""
    p = np.concatenate([xy, np.full((len(xy), 1), z)], 1)
    i = np.floor(p)
    f = p - i
    u = f * f * (3 - 2 * f)
    def r(dx, dy, dz):
        c = np.array([dx, dy, dz], float)
        return np.sum(_h3(i + c) * (f - c), 1)
    x00 = r(0, 0, 0) + (r(1, 0, 0) - r(0, 0, 0)) * u[:, 0]
    x10 = r(0, 1, 0) + (r(1, 1, 0) - r(0, 1, 0)) * u[:, 0]
    x01 = r(0, 0, 1) + (r(1, 0, 1) - r(0, 0, 1)) * u[:, 0]
    x11 = r(0, 1, 1) + (r(1, 1, 1) - r(0, 1, 1)) * u[:, 0]
    y0 = x00 + (x10 - x00) * u[:, 1]
    y1 = x01 + (x11 - x01) * u[:, 1]
    return y0 + (y1 - y0) * u[:, 2]


def pole(p, t):
    q = p + 1.25 * np.stack([szum(p * .55, t * .045), szum(p * .55 + 7.3, t * .045)], 1)
    q = q + .35 * np.stack([szum(q * 1.3 + 2.1, t * .07), szum(q * 1.3 + 9.7, t * .07)], 1)
    n = szum(q * 1.05, t * .06) + .3 * szum(q * 2.4 + 4.2, t * .09)
    zyly = 1 - np.abs(n)
    grub = .958 + .018 * szum(q * .7 + 11, t * .05)
    return zyly - grub


def studio(r):
    def pas(x, s):
        return np.exp(-((r[..., 0] - x) / s) ** 2)
    def ss(a, b, x):
        k = np.clip((x - a) / (b - a), 0, 1)
        return k * k * (3 - 2 * k)
    s = .03
    s = s + 1.6 * ss(.16, .3, r[..., 1])
    s = s + 1.3 * pas(-.38, .05) * ss(-.5, .1, r[..., 1])
    s = s + .9 * pas(.46, .04) * ss(-.5, .1, r[..., 1])
    s = s + .45 * np.exp(-(r[..., 0] ** 2 + r[..., 1] ** 2) * 7)
    s = s + .25 * ss(-.12, -.4, r[..., 1])
    return s


def metal(W, H, t=55.0):
    # współrzędne jak gl_FragCoord (oś y w górę), w jednostkach pola: p = uv * 2.1
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    ys = H - 1 - ys
    uv = np.stack([(xs + .5) / H, (ys + .5) / H], -1)
    p = (uv * 2.1).reshape(-1, 2)
    f = np.concatenate([pole(p[k:k + 400000], t) for k in range(0, len(p), 400000)]).reshape(H, W)

    wys = np.sqrt(np.maximum(f, 0) / .042)
    px = 2.1 / H
    gy, gx = np.gradient(wys)           # na piksel; wiersze rosną w dół, a oś y pola w górę → -gy
    g = np.stack([gx, -gy], -1) / px * .018      # jak w shaderze: dFdx(wys) / px * .018
    dl = np.linalg.norm(g, axis=-1, keepdims=True)
    g = g / np.maximum(1, dl / 2.6)

    rd = np.concatenate([(uv - np.array([.5 * W / H, .5])) * .5, -np.ones((H, W, 1))], -1)
    rd /= np.linalg.norm(rd, axis=-1, keepdims=True)
    n = np.concatenate([-g, np.ones((H, W, 1))], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    r = rd - 2 * np.sum(n * rd, -1, keepdims=True) * n
    c = studio(r)
    fr = (1 - np.abs(n[..., 2])) ** 2
    c = c * (.85 + .6 * fr)
    c = c / (1 + .7 * c) * 1.2

    fy, fx = np.gradient(f)
    aa = np.maximum(np.abs(fx) + np.abs(fy), 1e-4) * 1.3
    k = np.clip((f + aa) / (2 * aa), 0, 1)
    maska = k * k * (3 - 2 * k)
    return np.clip(TLO + (c - TLO) * maska, 0, 1).astype(np.float32)


if __name__ == "__main__":
    import sys
    from PIL import Image
    W, H = int(sys.argv[2]), int(sys.argv[3])
    m = metal(W, H, float(sys.argv[4]) if len(sys.argv) > 4 else 55.0)
    Image.fromarray((m * 255).astype(np.uint8)).save(sys.argv[1])
    print("ok", m.shape)
