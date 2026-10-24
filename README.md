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
| `app.js` | Synth engine (Web Audio), music theory, guide logic, touch/keyboard/MIDI input |
| `manifest.json`, `sw.js`, `icons/` | PWA install + offline cache |

When you change any file, bump `CACHE` in `sw.js` (`pianobox-v2`, …) so installed copies pick up the update.
