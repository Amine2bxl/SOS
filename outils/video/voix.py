import json, base64, urllib.request, sys
VOIX = "JBFqnCBsd6RMkjVDRZzb"  # George — conteur chaleureux
s = json.load(open("script.json"))
for i, t in enumerate(s, 1):
    corps = {
        "text": t,
        "model_id": "eleven_multilingual_v2",
        "language_code": "fr",
        "voice_settings": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True, "speed": 1.0},
        "previous_text": s[i - 2] if i > 1 else None,
        "next_text": s[i] if i < len(s) else None,
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOIX}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(corps).encode(),
        headers={"Content-Type": "application/json", "xi-api-key": "proxy-injected"},
    )
    try:
        r = json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        print(i, "ERREUR", e.code, e.read()[:300]); sys.exit(1)
    open(f"voix/{i}.mp3", "wb").write(base64.b64decode(r["audio_base64"]))
    json.dump(r.get("normalized_alignment") or r.get("alignment"), open(f"voix/{i}.json", "w"))
    print(i, "ok")
