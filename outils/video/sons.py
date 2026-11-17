"""
Bande son de la vidéo : voix, bruitages, musique. Tout est synthétisé ici,
sans banque de sons ni licence : des sinus, du bruit filtré, des enveloppes.

Entrées : donnees.json (où commence chaque phrase), sons.json (chaque bruitage
et son instant, sortis de la scène elle-même), voix/N.mp3.
Sortie : mix.wav (48 kHz, stéréo).
"""
import json, subprocess, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
donnees = json.load(open("donnees.json"))
TOTAL = donnees["total"] + 0.4
N = int(TOTAL * SR)


def t_(d):
    return np.arange(int(d * SR)) / SR


def bande(x, lo=None, hi=None):
    """Filtre passe-bande doux, dans le domaine fréquentiel."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-6
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / f) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def bruit(d):
    return rng.standard_normal(int(d * SR))


def env(d, attaque=0.005, chute=0.2, forme=1.0):
    t = t_(d)
    a = np.clip(t / max(attaque, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(0, t - attaque) / chute) ** forme


def norm(x, pic=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * pic


def sinus_glisse(f0, f1, d, courbe=0.03):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t / courbe)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def cloche(f0, d=1.2, partiels=((1, 1, 1.0), (2.76, 0.35, 0.45), (5.4, 0.12, 0.22), (2.0, 0.2, 0.6))):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (dec * d * 0.6)) for r, a, dec in partiels)
    return norm(x * np.clip(t / 0.003, 0, 1))


# ------------------------------------------------------------------ bruitages
def whoosh(d=0.62, aigu=1.0):
    t = t_(d)
    x = np.zeros(len(t))
    for (lo, hi), c in zip(((250, 900), (900, 2600), (2600, 7000)), (0.42, 0.5, 0.56)):
        couche = bande(bruit(d), lo * aigu, hi * aigu)
        x += norm(couche) * np.exp(-((t / d - c) ** 2) / (2 * 0.13 ** 2))
    return norm(x)


def pop(d=0.18):
    x = sinus_glisse(330, 880, d, 0.018) * env(d, 0.002, 0.05)
    clic = bande(bruit(d), 2000, 9000) * env(d, 0.0005, 0.004) * 0.25
    return norm(x + clic)


def clic(d=0.05):
    return norm(bande(bruit(d), 2500, 10000) * env(d, 0.0003, 0.004) + 0.6 * np.sin(2 * np.pi * 2400 * t_(d)) * env(d, 0.001, 0.008))


def tic(d=0.08):
    t = t_(d)
    return norm((np.sin(2 * np.pi * 1850 * t) + 0.5 * np.sin(2 * np.pi * 2770 * t)) * env(d, 0.001, 0.014))


def papier(d=0.4):
    b = bande(bruit(d), 1200, 7000)
    grains = (rng.random(len(b)) < 0.004).astype(float)
    grains = np.convolve(grains, np.exp(-np.arange(600) / 120), "same")
    return norm(b * (0.25 + grains) * env(d, 0.03, 0.12))


def souffle(d=1.6):
    t = t_(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return norm(bande(bruit(d), 200, 1600) * e)


def trait(d=0.28):
    t = t_(d)
    return norm(bande(bruit(d), 1800, 7500) * np.clip(t / 0.01, 0, 1) * np.exp(-t / 0.12) * (1 + 0.5 * np.sin(2 * np.pi * 30 * t)))


def voiture(d=1.7):
    t = t_(d)
    e = np.exp(-((t / d - 0.45) ** 2) / (2 * 0.2 ** 2))
    moteur = np.sin(2 * np.pi * np.cumsum(95 - 25 * (t / d)) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(190 - 50 * (t / d)) / SR)
    pneus = bande(bruit(d), 80, 700)
    return norm((0.6 * moteur + norm(pneus)) * e)


def scan(d=0.6):
    t = t_(d)
    x = np.sin(2 * np.pi * np.cumsum(650 + 900 * (t / d)) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return norm(x * np.sin(np.pi * t / d) ** 1.5)


def bip(d=0.1):
    t = t_(d)
    x = np.sin(2 * np.pi * 1650 * t) + 0.18 * np.sin(2 * np.pi * 4950 * t)
    return norm(x * np.clip(t / 0.004, 0, 1) * np.clip((d - t) / 0.02, 0, 1))


def erreur(d=0.3):
    t = t_(d)
    f = np.where(t < 0.13, 420, 315)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    return norm(bande(x, None, 2500) * np.clip(t / 0.005, 0, 1) * np.where(t < 0.13, 1, np.exp(-(t - 0.13) / 0.08)) * ((t < 0.115) | (t > 0.14)))


def stylo(d=0.95):
    t = t_(d)
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(9 + 5 * rng.random(len(t))) / SR) ** 2
    return norm(bande(bruit(d), 2200, 6000) * mod * np.sin(np.pi * t / d) ** 0.6)


def monte(d=0.38, hauteur=1.0):
    t = t_(d)
    f = 330 * hauteur * (1 + 0.5 * np.clip(t / 0.12, 0, 1))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.004, 0.11))


def choc(d=0.7):
    x = sinus_glisse(120, 42, d, 0.06) * env(d, 0.002, 0.22)
    x += 0.5 * bande(bruit(d), 40, 400) * env(d, 0.001, 0.05)
    return norm(x)


def frappe(d=0.04):
    return norm(bande(bruit(d), 900 + 600 * rng.random(), 5000) * env(d, 0.0005, 0.006))


def tampon(d=0.5):
    x = sinus_glisse(160, 70, d, 0.04) * env(d, 0.001, 0.09)
    x += 0.7 * bande(bruit(d), 300, 3500) * env(d, 0.0005, 0.02)
    return norm(x)


def declencheur(d=0.22):
    x = np.zeros(int(d * SR))
    for debut in (0.0, 0.075):
        i = int(debut * SR)
        c = bande(bruit(0.03), 900, 9000) * env(0.03, 0.0003, 0.006) + 0.4 * np.sin(2 * np.pi * 210 * t_(0.03)) * env(0.03, 0.001, 0.01)
        x[i:i + len(c)] += c
    return norm(x)


def arpege(notes, ecart=0.08, d=1.6):
    x = np.zeros(int((d + ecart * len(notes)) * SR))
    for k, f in enumerate(notes):
        c = cloche(f, d) * (0.85 ** k)
        i = int(k * ecart * SR)
        x[i:i + len(c)] += c
    return norm(x)


BRUITAGES = {
    "whoosh": lambda: whoosh(),
    "whooshCourt": lambda: whoosh(0.36, 1.3),
    "pop": pop, "clic": clic, "tic": tic, "papier": papier, "souffle": souffle,
    "trait": trait, "voiture": voiture, "scan": scan, "bip": bip, "erreur": erreur,
    "stylo": stylo, "choc": choc, "frappe": frappe, "tampon": tampon, "declencheur": declencheur,
    "ding": lambda: cloche(1318.5, 1.1), "ding2": lambda: cloche(1568.0, 1.1), "ding3": lambda: cloche(1760.0, 1.2),
    "carillon": lambda: arpege([1046.5, 1318.5, 1568.0], 0.07, 1.3),
    "final": lambda: arpege([523.25, 659.25, 783.99, 1046.5], 0.09, 2.2),
}


def placer(piste, son, debut, gain, pan=0.0):
    i = int(debut * SR)
    son = son[: max(0, piste.shape[1] - i)]
    g = gain * np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2)
    piste[:, i:i + len(son)] += g[:, None] * son[None, :]


# ------------------------------------------------------------------- musique
def musique():
    """Un lit discret : accords tenus, arpège pincé, pulsation douce. 100 bpm."""
    temps = 0.6
    accords = [  # Cmaj7, Am7, Fmaj7, G6
        [130.81, 164.81, 196.0, 246.94], [110.0, 130.81, 164.81, 196.0],
        [87.31, 130.81, 174.61, 220.0], [98.0, 146.83, 196.0, 246.94],
    ]
    m = np.zeros((2, N))
    duree_accord = 8 * temps
    t = np.arange(N) / SR
    for k in range(int(TOTAL / duree_accord) + 1):
        notes = accords[k % 4] if TOTAL - k * duree_accord > 4 else [130.81, 164.81, 196.0, 261.63]
        a = k * duree_accord
        i0, i1 = int(max(0, a - 0.4) * SR), min(N, int((a + duree_accord + 0.4) * SR))
        tt = t[i0:i1] - a
        enveloppe = np.clip((tt + 0.4) / 0.8, 0, 1) * np.clip((duree_accord + 0.4 - tt) / 0.8, 0, 1)
        for j, f in enumerate(notes):
            for c, desacc in enumerate((-0.0018, 0.0018)):
                v = np.sin(2 * np.pi * f * (1 + desacc) * tt + j) + 0.25 * np.sin(2 * np.pi * 2 * f * (1 + desacc) * tt)
                m[c, i0:i1] += 0.11 * v * enveloppe
        # Arpège : croches sur les notes de l'accord, une octave plus haut.
        for n in range(16):
            debut = a + n * temps / 2
            if debut >= TOTAL - 2.6: break
            f = notes[[0, 2, 1, 3, 2, 1, 3, 2][n % 8]] * 4
            d = 0.35
            x = np.sin(2 * np.pi * f * t_(d)) * env(d, 0.003, 0.09) + 0.3 * np.sin(2 * np.pi * 2 * f * t_(d)) * env(d, 0.002, 0.04)
            placer(m, x * 0.07, debut, 1, -0.35 if n % 2 else 0.35)
    # Pulsation : une grosse caisse feutrée sur chaque temps, un shaker à contretemps.
    k = 0
    while k * temps < TOTAL - 2.6:
        placer(m, sinus_glisse(110, 48, 0.25, 0.03) * env(0.25, 0.002, 0.07) * 0.22, k * temps, 1)
        placer(m, bande(bruit(0.05), 6000, 14000) * env(0.05, 0.004, 0.012) * 0.05, k * temps + temps / 2, 1, 0.2)
        k += 1
    m *= np.clip(t / 1.8, 0, 1) * np.clip((TOTAL - t) / 2.5, 0, 1)
    return m


# ---------------------------------------------------------------------- voix
def lire_mp3(chemin):
    brut = subprocess.check_output(["ffmpeg", "-v", "error", "-i", chemin, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"])
    return np.frombuffer(brut, dtype=np.float32).astype(np.float64)


voix = np.zeros(N)
for s in donnees["scenes"]:
    v = lire_mp3(f"voix/{s['i']}.mp3")
    i = int(s["debut"] * SR)
    v = v[: N - i]
    voix[i:i + len(v)] += v
voix = norm(voix, 0.89)

# Le lit musical s'efface sous la voix (enveloppe lissée de la voix).
fenetre = int(0.25 * SR)
niveau = np.sqrt(np.convolve(voix ** 2, np.ones(fenetre) / fenetre, "same"))
presence = np.clip(niveau / 0.05, 0, 1)
lisse = np.convolve(presence, np.hanning(int(0.4 * SR)) / (0.2 * SR), "same")
canard = 1 - 0.55 * np.clip(lisse, 0, 1)

m = musique()
m = m / (np.max(np.abs(m)) or 1) * 0.12 * canard[None, :]

sfx = np.zeros((2, N))
cues = json.load(open("sons.json"))
hauteurs = iter([1.0, 1.26, 1.5])
for c in cues:
    if c["nom"] == "monte":
        son = monte(hauteur=next(hauteurs, 1.5))
    else:
        son = BRUITAGES[c["nom"]]()
    placer(sfx, son, c["t"], 0.32 * c["gain"], c.get("pan", 0))

mix = voix[None, :] + m + sfx
mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # limiteur doux
mix = norm(mix, 0.95)

with wave.open("mix.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print("mix.wav", round(N / SR, 2), "s,", len(cues), "bruitages")

if __name__ == "__main__":
    db = lambda x: round(20 * np.log10(max(x, 1e-9)), 1)
    actif = presence > 0.5
    rms = lambda x, masque: np.sqrt(np.mean(x[..., masque] ** 2))
    print("voix RMS (parole)", db(rms(voix, actif)), "dB")
    print("musique RMS sous la voix", db(rms(m, actif)), "dB ; hors voix", db(rms(m, ~actif)), "dB")
    print("bruitages crête", db(np.max(np.abs(sfx))), "dB ; voix crête", db(np.max(np.abs(voix))), "dB")
    pics = [db(np.max(np.abs(sfx[:, int(c['t'] * SR): int(c['t'] * SR) + SR // 4]))) for c in cues]
    print("crêtes bruitages min/médiane/max", min(pics), sorted(pics)[len(pics) // 2], max(pics))
