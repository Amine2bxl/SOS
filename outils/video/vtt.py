"""Sous-titres WebVTT, calés sur l'instant de chaque mot (alignement de la voix)."""
import json, re

def hms(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"

d = json.load(open("donnees.json"))
cues = []
for s in d["scenes"]:
    bloc = []
    for k, m in enumerate(s["mots"]):
        bloc.append(m)
        texte = " ".join(x["mot"] for x in bloc)
        coupe = re.search(r"[.?!…:,]$", m["mot"]) and len(texte) >= 14
        dernier = k == len(s["mots"]) - 1
        if coupe or len(texte) >= 38 or dernier:
            cues.append((bloc[0]["t"], bloc[-1]["f"] + 0.25, texte))
            bloc = []
lignes = ["WEBVTT", ""]
for i, (a, b, texte) in enumerate(cues, 1):
    b = min(b, cues[i][0]) if i < len(cues) else b
    lignes += [str(i), f"{hms(a)} --> {hms(b)}", texte.replace(" ?", " ?").replace(" :", " :"), ""]
open("video.vtt", "w").write("\n".join(lignes))
print(len(cues), "sous-titres")
