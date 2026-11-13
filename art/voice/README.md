# Sprachaufnahmen

Hier liegen die Rohaufnahmen, eine Datei je Satz, benannt nach dem Textschlüssel
(z. B. `hint.add_stepwise.1.m4a`). Welche Sätze es gibt, steht in `docs/aufnahmeliste.md`.

`python3 art/build_voice.py` bereitet sie für das Spiel auf (`public/assets/audio/voice/`)
und trägt die Schlüssel in `src/data/voice.json` ein. Die Rohdateien selbst kommen nicht ins
Repository (siehe `.gitignore`), nur die aufbereiteten MP3-Dateien.
