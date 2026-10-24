# PianoBox

A two-octave touch piano that runs in the browser. It has neon chord and arpeggio guides and can be installed to an iPad or Android home screen.

There's no build step: it's plain HTML, CSS and JS.

## Run locally

```bash
python3 -m http.server 8765 --bind 0.0.0.0
```

Then open `http://localhost:8765`. On an iPad or phone on the same Wi‑Fi, use `http://<your-mac-ip>:8765`.

## Install as an app

Offline mode and a proper install need **HTTPS**. Put this folder on any static host, such as GitHub Pages, Netlify Drop or Cloudflare Pages. Then:

- **iPad / iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** ⋮ menu → *Install app*

Over plain HTTP on your LAN, *Add to Home Screen* still works on iOS, but the app won't work offline.

## Auto Chords (Free Play)

Turn on **Auto Chords** and pick a key (any major or minor) and Triads or 7ths. Each key in the scale then plays the chord built on that scale degree, lit up in neon. Dots mark the scale notes (pink is the key's home note). Keys outside the scale play a single note. The chips show every chord in the key; hold one to play it.

## Songs

Pick a song (tap the song name), then follow the falling notes and the glowing key.

- **Wait for me:** the song waits until you press the right key. Press Play to let the roll scroll in time between notes.
- **Play along:** the song keeps going at the chosen speed (50% / 75% / 100%). Notes you miss turn red.
- **Listen:** PianoBox plays the song for you, lighting each key.
- **Practising sections:** tap the timeline to jump, or drag across it to loop that section. The **A** and **B** buttons set a loop at the current note, and ✕ clears it. ⏮ goes back to the start (or to the loop start).
- **Library:** 21 public-domain melodies (`songs.js`) with search and Beginner / Easy / Intermediate filters.
- **Import MIDI:** load any `.mid` file, for example one you've downloaded from Online Sequencer. You choose which part is the melody, and PianoBox takes the top note of that part (one note at a time) and fits it to the keyboard. Imported songs are stored only on that device, under *My songs*.

## Sounds

- **Synth waveforms:** Sawtooth, Square, Triangle and Sine, generated live with Web Audio.
- **Recorded instruments:** 31 instruments; the Grand Piano is the default on every launch, loaded the first time you pick one (about 1–3 MB each). The service worker then saves them for offline use.
  - Grand Piano: [Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm (CC BY 3.0), via `tonejs.github.io`.
  - Everything else: [FluidR3 GM soundfont](https://github.com/gleitz/midi-js-soundfonts) by Frank Wen, rendered by Benjamin Gleitzman (CC BY 3.0), via `gleitz.github.io`.

Only the Settings preferences (volume, range, labels, colours, voicing, auto-advance, tempo) are remembered. Every launch starts in Free Play, with Single Chord selected and the Pop progression ready.

## Files

| File | Purpose |
|---|---|
| `index.html` | Layout |
| `style.css` | Neon theme, keyboard, responsive layout |
| `songs.js` | Built-in song library (compact note notation) |
| `app.js` | Synth engine (Web Audio), music theory, guide logic, touch/keyboard/MIDI input |
| `manifest.json`, `sw.js`, `icons/` | PWA install + offline cache |

When you change any file, bump `CACHE` in `sw.js` (`pianobox-v2`, …) so installed copies pick up the update.
