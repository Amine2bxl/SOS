# Vidéo « Comprendre en 1 minute »

Une vidéo explicative en motion design, avec voix off, bruitages et musique,
publiée dans `public/video/`. Chaque mouvement est calé sur le mot prononcé.

- `script.json` : le texte de la voix off, une phrase par scène.
- `voix.py` : la voix (ElevenLabs, voix « George », modèle multilingue v2),
  avec l'instant de chaque caractère.
- `donnees.py` : la ligne de temps — début de chaque scène, instant de chaque mot.
- `scene.html` : les huit scènes. `rendre(t)` dessine l'image à l'instant `t`
  (fonction pure du temps) ; `SONS` liste les bruitages sur la même ligne de temps.
- `rendu.js` : capture les images (1920 × 1080, 30 i/s) avec Playwright.
- `sons.py` : bruitages et musique synthétisés (numpy, aucune banque de sons),
  mixés sous la voix (la musique s'efface quand on parle).
- `vtt.py` : les sous-titres, calés mot à mot.
- `apercu.js` : quelques images fixes pour juger une mise en page (`node apercu.js 5.5 12`).

La voix vient d'ElevenLabs : le crédit « Voix : ElevenLabs » figure sur
l'écran de fin. Vérifier que l'offre utilisée autorise la diffusion.

## Refaire la vidéo

```bash
cd outils/video
npm i
python3 voix.py        # clé ElevenLabs dans l'en-tête xi-api-key ; écrit voix/N.mp3 et voix/N.json
python3 donnees.py     # donnees.json et donnees.js
node rendu.js          # images/ et sons.json
python3 sons.py        # mix.wav
python3 vtt.py         # video.vtt
ffmpeg -framerate 30 -i images/%05d.jpg -i mix.wav -c:v libx264 -preset slow -crf 20 \
  -pix_fmt yuv420p -c:a aac -b:a 160k -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 \
  -movflags +faststart -shortest comprendre-en-1-minute.mp4
ffmpeg -ss 5.8 -i comprendre-en-1-minute.mp4 -frames:v 1 -vf scale=1280:720 -q:v 3 comprendre-en-1-minute.jpg
```

Python : numpy. Node : Playwright (Chromium). ffmpeg.
