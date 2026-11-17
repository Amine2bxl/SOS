"""Ligne de temps de la vidéo : début de chaque scène, et chaque mot avec son instant."""
import json, subprocess, re

DEBUT = 0.6      # avant la première phrase
ECART = 0.55     # silence entre deux phrases
FIN = 3.2        # écran de fin, après la dernière phrase

script = json.load(open("script.json"))
scenes, t = [], DEBUT
for i, phrase in enumerate(script, 1):
    duree = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"voix/{i}.mp3"]))
    a = json.load(open(f"voix/{i}.json"))
    car, deb, fin = a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]
    mots, courant = [], None
    for c, d, f in zip(car, deb, fin):
        if c.isspace():
            if courant: mots.append(courant); courant = None
            continue
        if courant is None: courant = {"mot": "", "t": round(t + d, 3)}
        courant["mot"] += c
        courant["f"] = round(t + f, 3)
    if courant: mots.append(courant)
    parle = max(m["f"] for m in mots) - t
    scenes.append({"i": i, "debut": round(t, 3), "voix": round(duree, 3), "parle": round(parle, 3), "texte": phrase, "mots": mots})
    t += parle + ECART
total = scenes[-1]["debut"] + scenes[-1]["parle"] + FIN
json.dump({"total": round(total, 3), "scenes": scenes}, open("donnees.json", "w"), ensure_ascii=False)
open("donnees.js", "w").write("window.DONNEES = " + json.dumps({"total": round(total, 3), "scenes": scenes}, ensure_ascii=False) + ";\n")
print("total", round(total, 2))
for s in scenes: print(s["i"], s["debut"], s["parle"], " ".join(m["mot"] for m in s["mots"])[:70])
