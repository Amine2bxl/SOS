# Vidéo « Comprendre en 1 minute »

Une vidéo explicative au style carnet dessiné, avec voix off, publiée dans
`public/video/`. Tout est gratuit et se refait sur n'importe quel ordinateur.

- `script.json` : le texte de la voix off, une phrase par scène.
- `scene.html` : les dessins (rough.js) et leur animation trait par trait.
- `rendu.js` : capture chaque image avec Playwright.

## Refaire la vidéo

```bash
cd outils/video
npm i roughjs@4.6.6 @fontsource/patrick-hand@5.2.5
python3 -m venv venv && ./venv/bin/pip install piper-tts
# Voix française « siwis » (Piper, licence libre)
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json
```

1. Voix : pour chaque phrase de `script.json`,
   `./venv/bin/piper -m fr_FR-siwis-medium.onnx --length-scale 1.06 --sentence-silence 0.3 -f voix/N.wav`.
2. Reporter la durée de chaque fichier (`ffprobe`) dans `duree` de la scène correspondante de `scene.html`.
3. Images : `mkdir images && node rendu.js` (24 images par seconde).
4. Montage : chaque voix complétée jusqu'à la durée de sa scène (+0,7 s), puis
   `ffmpeg -framerate 24 -i images/%05d.jpg -i voix.wav -c:v libx264 -crf 22 -pix_fmt yuv420p -c:a aac -movflags +faststart comprendre-en-1-minute.mp4`.
