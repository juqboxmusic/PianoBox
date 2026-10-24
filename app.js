'use strict';
(() => {
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ======================= Music theory ======================= */
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NAT_PC = [0, 2, 4, 5, 7, 9, 11];
const SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const ACC = { '-2': '♭♭', '-1': '♭', '0': '', '1': '♯', '2': '♯♯' };
const BLACK = new Set([1, 3, 6, 8, 10]);

// Spell a pitch class on a given letter (0=C .. 6=B), e.g. spell(1, 1) -> "D♭"
function spell(letter, pc) {
  let a = ((pc - NAT_PC[letter]) % 12 + 12) % 12;
  if (a > 6) a -= 12;
  return Math.abs(a) > 2 ? SHARP[pc] : LETTERS[letter] + ACC[a];
}

const DEG_LETTER = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 9: 1 };
const DEG_REF = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14 };
function ivLabel(semi, deg) {
  if (deg === 1) return 'R';
  const d = semi - DEG_REF[deg];
  return (d === -2 ? '♭♭' : d === -1 ? '♭' : d === 1 ? '♯' : d === 2 ? '♯♯' : '') + deg;
}

const TONE_COLORS = { 1: '#ff2bd6', 3: '#00e5ff', 5: '#39ff14', 7: '#ff9500', 9: '#b26bff', 2: '#b26bff', 4: '#ffe600', 6: '#3d8bff' };
const TONE_NAMES = { 1: 'Root', 3: '3rd', 5: '5th', 7: '7th', 9: '9th', 2: '2nd', 4: '4th', 6: '6th' };
const MONO = '#00e5ff';
const RAINBOW = ['#ff2bd6', '#ff3b7a', '#ff6a3c', '#ff9500', '#ffd000', '#b6ff1a', '#39ff14', '#1affb2', '#00e5ff', '#3d8bff', '#7a5cff', '#c04dff'];

// [semitones, chord degree]
const QUALS = [
  { id: 'maj',  chip: 'Major', sfx: '',     iv: [[0, 1], [4, 3], [7, 5]] },
  { id: 'min',  chip: 'Minor', sfx: 'm',    iv: [[0, 1], [3, 3], [7, 5]] },
  { id: 'dim',  chip: 'Dim',   sfx: 'dim',  iv: [[0, 1], [3, 3], [6, 5]] },
  { id: 'aug',  chip: 'Aug',   sfx: 'aug',  iv: [[0, 1], [4, 3], [8, 5]] },
  { id: 'sus2', chip: 'Sus2',  sfx: 'sus2', iv: [[0, 1], [2, 2], [7, 5]] },
  { id: 'sus4', chip: 'Sus4',  sfx: 'sus4', iv: [[0, 1], [5, 4], [7, 5]] },
  { id: '7',    chip: '7',     sfx: '7',    iv: [[0, 1], [4, 3], [7, 5], [10, 7]] },
  { id: 'maj7', chip: 'Maj7',  sfx: 'maj7', iv: [[0, 1], [4, 3], [7, 5], [11, 7]] },
  { id: 'm7',   chip: 'm7',    sfx: 'm7',   iv: [[0, 1], [3, 3], [7, 5], [10, 7]] },
  { id: 'm7b5', chip: 'm7♭5',  sfx: 'm7♭5', iv: [[0, 1], [3, 3], [6, 5], [10, 7]] },
  { id: 'dim7', chip: 'Dim7',  sfx: 'dim7', iv: [[0, 1], [3, 3], [6, 5], [9, 7]] },
  { id: '6',    chip: '6',     sfx: '6',    iv: [[0, 1], [4, 3], [7, 5], [9, 6]] },
  { id: 'm6',   chip: 'm6',    sfx: 'm6',   iv: [[0, 1], [3, 3], [7, 5], [9, 6]] },
  { id: 'add9', chip: 'Add9',  sfx: 'add9', iv: [[0, 1], [4, 3], [7, 5], [14, 9]] },
  { id: '9',    chip: '9',     sfx: '9',    iv: [[0, 1], [4, 3], [7, 5], [10, 7], [14, 9]] },
  { id: 'maj9', chip: 'Maj9',  sfx: 'maj9', iv: [[0, 1], [4, 3], [7, 5], [11, 7], [14, 9]] },
  { id: 'm9',   chip: 'm9',    sfx: 'm9',   iv: [[0, 1], [3, 3], [7, 5], [10, 7], [14, 9]] },
];
const QMAP = Object.fromEntries(QUALS.map((q) => [q.id, q]));
// Order matters for chord detection: earlier = preferred name
const DETECT = ['maj', 'min', '7', 'maj7', 'm7', 'dim', 'aug', 'sus4', 'sus2', '6', 'm6', 'm7b5', 'dim7', 'add9', '9', 'maj9', 'm9']
  .map((id) => QMAP[id])
  .concat([
    { sfx: '5', iv: [[0, 1], [7, 5]] },
    { sfx: '7sus4', iv: [[0, 1], [5, 4], [7, 5], [10, 7]] },
    { sfx: 'm(maj7)', iv: [[0, 1], [3, 3], [7, 5], [11, 7]] },
  ]);

// Preferred spellings for chord roots / major keys / minor keys: [pc, letter]
const ROOTS = [[0, 0], [1, 1], [2, 1], [3, 2], [4, 2], [5, 3], [6, 3], [7, 4], [8, 5], [9, 5], [10, 6], [11, 6]];
const MINOR_KEYS = [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2], [5, 3], [6, 3], [7, 4], [8, 4], [9, 5], [10, 6], [11, 6]];
const rootName = (pc) => spell(ROOTS[pc][1], pc);

// steps: [semitones from tonic, letter steps from tonic, quality, numeral]
const PROGS = [
  { id: 'pop', name: 'Pop · I – V – vi – IV', steps: [[0, 0, 'maj', 'I'], [7, 4, 'maj', 'V'], [9, 5, 'min', 'vi'], [5, 3, 'maj', 'IV']] },
  { id: 'fifties', name: "50s · I – vi – IV – V", steps: [[0, 0, 'maj', 'I'], [9, 5, 'min', 'vi'], [5, 3, 'maj', 'IV'], [7, 4, 'maj', 'V']] },
  { id: 'emo', name: 'Emotional · vi – IV – I – V', steps: [[9, 5, 'min', 'vi'], [5, 3, 'maj', 'IV'], [0, 0, 'maj', 'I'], [7, 4, 'maj', 'V']] },
  { id: 'scale', name: 'Scale chords · I ii iii IV V vi vii°', steps: [[0, 0, 'maj', 'I'], [2, 1, 'min', 'ii'], [4, 2, 'min', 'iii'], [5, 3, 'maj', 'IV'], [7, 4, 'maj', 'V'], [9, 5, 'min', 'vi'], [11, 6, 'dim', 'vii°']] },
  { id: 'scale7', name: 'Scale 7ths · Imaj7 … viiø7', steps: [[0, 0, 'maj7', 'Imaj7'], [2, 1, 'm7', 'ii7'], [4, 2, 'm7', 'iii7'], [5, 3, 'maj7', 'IVmaj7'], [7, 4, '7', 'V7'], [9, 5, 'm7', 'vi7'], [11, 6, 'm7b5', 'viiø7']] },
  { id: 'jazz', name: 'Jazz · ii7 – V7 – Imaj7', steps: [[2, 1, 'm7', 'ii7'], [7, 4, '7', 'V7'], [0, 0, 'maj7', 'Imaj7']] },
  { id: 'turn', name: 'Turnaround · Imaj7 – vi7 – ii7 – V7', steps: [[0, 0, 'maj7', 'Imaj7'], [9, 5, 'm7', 'vi7'], [2, 1, 'm7', 'ii7'], [7, 4, '7', 'V7']] },
  { id: 'canon', name: 'Pachelbel Canon', steps: [[0, 0, 'maj', 'I'], [7, 4, 'maj', 'V'], [9, 5, 'min', 'vi'], [4, 2, 'min', 'iii'], [5, 3, 'maj', 'IV'], [0, 0, 'maj', 'I'], [5, 3, 'maj', 'IV'], [7, 4, 'maj', 'V']] },
  { id: 'royal', name: 'Royal Road · IVmaj7 – V7 – iii7 – vi', steps: [[5, 3, 'maj7', 'IVmaj7'], [7, 4, '7', 'V7'], [4, 2, 'm7', 'iii7'], [9, 5, 'min', 'vi']] },
  { id: 'blues', name: '12-Bar Blues', steps: [[0, 0, '7', 'I7'], [0, 0, '7', 'I7'], [0, 0, '7', 'I7'], [0, 0, '7', 'I7'], [5, 3, '7', 'IV7'], [5, 3, '7', 'IV7'], [0, 0, '7', 'I7'], [0, 0, '7', 'I7'], [7, 4, '7', 'V7'], [5, 3, '7', 'IV7'], [0, 0, '7', 'I7'], [7, 4, '7', 'V7']] },
  { id: 'epic', name: 'Epic minor · i – VI – III – VII', minor: true, steps: [[0, 0, 'min', 'i'], [8, 5, 'maj', 'VI'], [3, 2, 'maj', 'III'], [10, 6, 'maj', 'VII']] },
  { id: 'andalusian', name: 'Andalusian · i – VII – VI – V', minor: true, steps: [[0, 0, 'min', 'i'], [10, 6, 'maj', 'VII'], [8, 5, 'maj', 'VI'], [7, 4, 'maj', 'V']] },
  { id: 'minjazz', name: 'Minor jazz · iiø7 – V7 – i', minor: true, steps: [[2, 1, 'm7b5', 'iiø7'], [7, 4, '7', 'V7'], [0, 0, 'min', 'i']] },
];
const PMAP = Object.fromEntries(PROGS.map((p) => [p.id, p]));

/* ======================= Sounds ======================= */
// [id, label, oscillator type]
const WAVES = [['saw', 'Sawtooth', 'sawtooth'], ['square', 'Square', 'square'], ['triangle', 'Triangle', 'triangle'], ['sine', 'Sine', 'sine']];
// Sampled instruments: [id, label, release style]. 'grand' is the Salamander Grand Piano,
// everything else is the FluidR3 General MIDI soundfont (both CC BY 3.0).
const SAMPLED = [
  ['Pianos & keys', [['grand', 'Grand Piano', 'piano'], ['bright_acoustic_piano', 'Bright Piano', 'piano'], ['electric_piano_1', 'Electric Piano', 'piano'],
    ['electric_piano_2', 'FM Electric Piano', 'piano'], ['harpsichord', 'Harpsichord', 'piano'], ['clavinet', 'Clavinet', 'piano']]],
  ['Mallets & bells', [['vibraphone', 'Vibraphone', 'ring'], ['marimba', 'Marimba', 'ring'], ['celesta', 'Celesta', 'ring'],
    ['music_box', 'Music Box', 'ring'], ['kalimba', 'Kalimba', 'ring'], ['steel_drums', 'Steel Drums', 'ring']]],
  ['Organs', [['drawbar_organ', 'Drawbar Organ', 'hold'], ['church_organ', 'Church Organ', 'hold'], ['accordion', 'Accordion', 'hold']]],
  ['Guitar & bass', [['acoustic_guitar_nylon', 'Nylon Guitar', 'ring'], ['acoustic_guitar_steel', 'Steel Guitar', 'ring'],
    ['electric_guitar_clean', 'Clean Electric Guitar', 'ring'], ['acoustic_bass', 'Upright Bass', 'ring']]],
  ['Strings', [['string_ensemble_1', 'String Ensemble', 'hold'], ['violin', 'Violin', 'hold'], ['cello', 'Cello', 'hold'],
    ['orchestral_harp', 'Harp', 'ring'], ['pizzicato_strings', 'Pizzicato Strings', 'ring']]],
  ['Brass & wind', [['trumpet', 'Trumpet', 'hold'], ['french_horn', 'French Horn', 'hold'], ['brass_section', 'Brass Section', 'hold'],
    ['alto_sax', 'Alto Sax', 'hold'], ['flute', 'Flute', 'hold'], ['clarinet', 'Clarinet', 'hold']]],
  ['Voices & pads', [['choir_aahs', 'Choir', 'hold'], ['pad_2_warm', 'Warm Pad', 'hold']]],
];
const SOUNDS = {};
WAVES.forEach(([id, name, type]) => { SOUNDS[id] = { id, name, type, synth: true }; });
SAMPLED.forEach(([, items]) => items.forEach(([id, name, kind]) => { SOUNDS[id] = { id, name, kind }; }));
const RELEASE = { piano: 0.09, ring: 0.45, hold: 0.12 };

/* ======================= State ======================= */
// Practice state and the sound (Grand Piano) start fresh on every launch; the other Settings are remembered.
const DEFAULTS = {
  mode: 'free', source: 'single', root: 0, quality: 'maj', inversion: 0,
  keyPc: 0, progId: 'pop', step: 0, arpPattern: 'up', arpSpan: 1,
  sound: 'grand', volume: 0.8, octave: 3, labels: 'white', colorMode: 'tone',
  voicing: 'smooth', autoAdvance: true, tempo: 96, hidePanel: false, sustain: false,
};
const PREFS = ['volume', 'octave', 'labels', 'colorMode', 'voicing', 'autoAdvance', 'tempo'];
const STORE_KEY = 'pianobox.prefs.v2';
let S = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  PREFS.forEach((k) => { if (k in saved) S[k] = saved[k]; });
} catch (e) {}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(PREFS.map((k) => [k, S[k]])))); } catch (e) {}
}

const G = { chord: null, voicing: [], arp: [], arpIdx: 0, solved: false, misses: 0, streak: 0, done: new Set(), numeral: '', timer: 0 };
const held = new Map();          // display midi -> press count
const pointers = new Map();      // pointerId -> midi
let keyEls = {};

/* ======================= Sample loading ======================= */
// One sample every minor third from A0 to C8; notes in between are pitch-shifted by at most a semitone.
const GRID = [];
for (let m = 21; m <= 108; m += 3) GRID.push(m);
const FLAT_FILE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SAL_FILE = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
function sampleUrl(id, m) {
  const o = Math.floor(m / 12) - 1, pc = m % 12;
  return id === 'grand'
    ? `https://tonejs.github.io/audio/salamander/${SAL_FILE[pc]}${o}.mp3`
    : `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${id}-mp3/${FLAT_FILE[pc]}${o}.mp3`;
}

// Sustained instruments (organ, strings, winds…) are only 3 s recordings: loop their steady middle,
// cutting at upward zero crossings to avoid clicks.
function setLoop(buf) {
  const d = buf.getChannelData(0), sr = buf.sampleRate;
  const zeroUp = (i) => { for (let k = i; k < d.length - 1; k++) if (d[k] <= 0 && d[k + 1] > 0) return k + 1; return i; };
  const a = zeroUp(Math.floor(sr * 0.8)), b = zeroUp(Math.floor(sr * Math.max(1.2, Math.min(2.8, buf.duration - 0.2))));
  if (b - a > sr * 0.3) buf._loop = [a / sr, b / sr];
}

// The Salamander recordings ring for up to 16 s; keep 9 s (with a fade) to save a lot of memory on tablets.
const MAX_SECS = 9, FADE_SECS = 2;
function trim(c, buf) {
  if (buf.duration <= MAX_SECS) return buf;
  const sr = buf.sampleRate, len = Math.floor(MAX_SECS * sr), fade = Math.floor(FADE_SECS * sr);
  const out = c.createBuffer(buf.numberOfChannels, len, sr);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch).slice(0, len);
    for (let i = 0; i < fade; i++) d[len - fade + i] *= 1 - i / fade;
    out.copyToChannel(d, ch);
  }
  return out;
}

// Samples whose notes are within a semitone of a key on screen
function visibleGrid() { const [lo, hi] = range(); return GRID.filter((m) => m >= lo - 2 && m <= hi + 2); }

const Samples = {
  banks: new Map(), // id -> { id, buffers: Map(midi -> AudioBuffer), jobs: Map(midi -> Promise), failed: Set, need: [] }

  fetchOne(b, m) {
    if (b.jobs.has(m) && !b.failed.has(m)) return b.jobs.get(m);
    b.failed.delete(m);
    const c = AudioEng.init();
    const p = fetch(sampleUrl(b.id, m), { mode: 'cors' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)))
      .then((buf) => {
        buf = trim(c, buf);
        if (SOUNDS[b.id].kind === 'hold') setLoop(buf);
        b.buffers.set(m, buf);
      })
      .catch(() => { b.failed.add(m); })
      .finally(renderSoundStatus);
    b.jobs.set(m, p);
    return p;
  },

  // Load what the on-screen keys need first (about a third of the set), then the rest quietly.
  load(id) {
    let b = this.banks.get(id);
    if (!b) { b = { id, buffers: new Map(), jobs: new Map(), failed: new Set() }; this.banks.set(id, b); }
    if (!AudioEng.init()) return b;
    b.need = visibleGrid();
    b.ready = Promise.all(b.need.map((m) => this.fetchOne(b, m)));
    b.ready.then(() => this.fillRest(b));
    renderSoundStatus();
    return b;
  },

  async fillRest(b) {
    const center = range()[0] + 12;
    const rest = GRID.filter((m) => !b.jobs.has(m) || b.failed.has(m))
      .sort((x, y) => Math.abs(x - center) - Math.abs(y - center));
    for (let i = 0; i < rest.length; i += 2) {
      if (S.sound !== b.id) return; // picks up again next time this instrument is chosen
      await Promise.all(rest.slice(i, i + 2).map((m) => this.fetchOne(b, m)));
    }
  },

  progress(id) {
    const b = this.banks.get(id);
    if (!b || !b.need) return null;
    const done = b.need.filter((m) => b.buffers.has(m) || b.failed.has(m)).length;
    return { done, total: b.need.length, ok: b.buffers.size > 0 };
  },

  nearest(id, m) {
    const bank = this.banks.get(id);
    if (!bank) return null;
    let best = null, bd = 99;
    for (const [sm, buf] of bank.buffers) {
      const d = Math.abs(sm - m);
      if (d < bd) { bd = d; best = [sm, buf]; }
    }
    return bd <= 6 ? best : null;
  },
};

/* ======================= Audio ======================= */
const AudioEng = {
  ctx: null,
  voices: new Map(),
  active: [],

  init() {
    if (this.ctx) return this.ctx;
    // iOS 17+: play through the ringer/silent switch like a real instrument app
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const c = this.ctx = new AC({ latencyHint: 'interactive' });

    this.master = c.createGain();
    this.master.gain.value = S.volume;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3.5;
    comp.attack.value = 0.003; comp.release.value = 0.2;

    this.bus = c.createGain();
    const dry = c.createGain(); dry.gain.value = 0.9;
    const verb = c.createConvolver(); verb.buffer = this.makeIR(c, 2.4);
    const wet = c.createGain(); wet.gain.value = 0.18;
    this.bus.connect(dry).connect(this.master);
    this.bus.connect(verb).connect(wet).connect(this.master);
    this.master.connect(comp).connect(c.destination);
    return c;
  },

  makeIR(c, sec) {
    const len = Math.floor(c.sampleRate * sec);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  },

  unlock() {
    const c = this.init();
    if (!c) return;
    if (c.state !== 'running') c.resume();
    const b = c.createBufferSource();
    b.buffer = c.createBuffer(1, 1, 22050);
    b.connect(c.destination);
    b.start(0);
  },

  setVolume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03); },

  noteOn(midi, vel = 0.8) {
    const c = this.init();
    if (!c) return;
    if (c.state !== 'running') c.resume();
    const t = c.currentTime;
    const prev = this.voices.get(midi);
    if (prev) prev.release(t, 0.015);
    vel = clamp(vel, 0.05, 1);
    const snd = SOUNDS[S.sound];
    const v = snd.synth ? this.synth(c, midi, vel, t, snd.type) : this.sampler(c, midi, vel, t, snd);
    this.voices.set(midi, v);
    this.active = this.active.filter((x) => !x.ended);
    this.active.push(v);
    if (this.active.length > 36) this.active.shift().release(t, 0.03);
  },

  noteOff(midi) {
    const v = this.voices.get(midi);
    if (!v) return;
    if (S.sustain) { v.sustained = true; return; }
    this.voices.delete(midi);
    v.release(this.ctx.currentTime);
  },

  sustainOff(isHeld) {
    if (!this.ctx) return;
    for (const [m, v] of this.voices) {
      if (v.sustained && !isHeld(m)) { this.voices.delete(m); v.release(this.ctx.currentTime); }
    }
  },

  allOff() {
    if (!this.ctx) return;
    for (const v of this.voices.values()) v.release(this.ctx.currentTime);
    this.voices.clear();
  },

  // Wrap sources + amp envelope into a releasable voice
  voice(srcs, env, out, relTc) {
    const v = {
      ended: false,
      release(t, tc = relTc) {
        if (v.released) return;
        v.released = true;
        const g = env.gain;
        if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
        else { const cur = g.value; g.cancelScheduledValues(t); g.setValueAtTime(cur, t); }
        g.setTargetAtTime(0, t, tc);
        srcs.forEach((o) => { try { o.stop(t + tc * 8 + 0.05); } catch (e) {} });
      },
    };
    srcs[0].onended = () => { v.ended = true; out.disconnect(); };
    return v;
  },

  // Plain oscillator: sine / square / sawtooth / triangle
  synth(c, midi, vel, t, type) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const out = c.createGain(); out.connect(this.bus);
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.frequency.value = Math.min(16000, 2500 + f * 12);
    const lvl = { sine: 0.2, triangle: 0.2, square: 0.075, sawtooth: 0.085 }[type] * (0.35 + 0.65 * vel);
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(lvl, t + 0.006);
    env.gain.setTargetAtTime(lvl * 0.7, t + 0.006, 0.2);
    o.connect(lp).connect(env).connect(out);
    o.start(t);
    return this.voice([o], env, out, 0.06);
  },

  // Recorded instrument: nearest loaded sample, pitch-shifted to the note
  sampler(c, midi, vel, t, snd) {
    const hit = Samples.nearest(snd.id, midi);
    if (!hit) return this.synth(c, midi, vel * 0.6, t, 'triangle'); // still loading
    const [sm, buf] = hit;
    const out = c.createGain(); out.connect(this.bus);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (midi - sm) / 12);
    if (buf._loop) { src.loop = true; [src.loopStart, src.loopEnd] = buf._loop; }
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.value = 1800 + vel * vel * 18000;
    const env = c.createGain();
    const peak = (snd.id === 'grand' ? 1 : 2.4) * (0.3 + 0.7 * vel); // the soundfont is recorded ~2.5x quieter
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.003);
    src.connect(lp).connect(env).connect(out);
    src.start(t);
    return this.voice([src], env, out, RELEASE[snd.kind]);
  },
};

/* ======================= Chords & voicings ======================= */
function range() { const lo = 12 * (S.octave + 1); return [lo, lo + 24]; }
const byMidi = (a, b) => a.midi - b.midi;

function makeChord(rootPc, rootLetter, qid) {
  const q = QMAP[qid];
  const root = spell(rootLetter, rootPc);
  const tones = q.iv.map(([semi, deg]) => {
    const pc = (rootPc + semi) % 12;
    return {
      semi, deg, pc,
      name: spell((rootLetter + DEG_LETTER[deg]) % 7, pc),
      iv: ivLabel(semi, deg),
      color: S.colorMode === 'mono' ? MONO : TONE_COLORS[deg],
    };
  });
  return { rootPc, q, root, name: root + q.sfx, tones };
}

function rootVoicing(ch) {
  const base = range()[0] + ch.rootPc;
  return ch.tones.map((t) => ({ midi: base + t.semi, t }));
}

function invert(v, k) {
  v = v.map((x) => ({ ...x })).sort(byMidi);
  for (let i = 0; i < k; i++) { v[0].midi += 12; v.sort(byMidi); }
  return v;
}

// Shift / fold a voicing so every note sits on the visible keyboard
function fit(v) {
  const [lo, hi] = range();
  v = v.map((x) => ({ ...x }));
  const mn = () => Math.min(...v.map((x) => x.midi));
  const mx = () => Math.max(...v.map((x) => x.midi));
  while (mx() > hi && mn() - 12 >= lo) v.forEach((x) => { x.midi -= 12; });
  while (mn() < lo) v.forEach((x) => { x.midi += 12; });
  v.forEach((x) => { while (x.midi > hi) x.midi -= 12; });
  return v.sort(byMidi);
}

const maxInv = (ch) => Math.min(ch.tones.length, 4) - 1;

// Voice-leading: pick the inversion of each chord closest to the previous one
function smoothVoicings(chords) {
  const [lo, hi] = range();
  const center = lo + 11;
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  let prev = null;
  return chords.map((ch) => {
    const base = rootVoicing(ch);
    const cands = [];
    for (let k = 0; k <= maxInv(ch); k++) {
      const inv = invert(base, k);
      if (inv[0].t.deg === 9) continue;
      for (const sh of [-24, -12, 0, 12, 24]) {
        const c = inv.map((x) => ({ ...x, midi: x.midi + sh }));
        if (c.every((x) => x.midi >= lo && x.midi <= hi)) cands.push({ v: c, k, m: c.map((x) => x.midi) });
      }
    }
    if (!cands.length) { const f = fit(base); prev = f.map((x) => x.midi); return f; }
    const score = (c) => {
      if (!prev) return Math.abs(mean(c.m) - center) + (c.k ? 4 : 0);
      const d = prev.length === c.m.length
        ? c.m.reduce((s, m, i) => s + Math.abs(m - prev[i]), 0)
        : Math.abs(mean(c.m) - mean(prev)) * Math.max(prev.length, c.m.length) + 2;
      return d + Math.abs(mean(c.m) - center) * 0.25;
    };
    const best = cands.reduce((b, c) => (score(c) < score(b) ? c : b));
    prev = best.m;
    return best.v;
  });
}

function arpSeq(ch) {
  const [, hi] = range();
  const base = range()[0] + ch.rootPc;
  const seen = new Set();
  const ts = ch.tones
    .map((t) => ({ ...t, semi: t.semi % 12 }))
    .sort((a, b) => a.semi - b.semi)
    .filter((t) => !seen.has(t.semi) && seen.add(t.semi));
  const asc = [];
  for (let o = 0; o < S.arpSpan; o++) ts.forEach((t) => asc.push({ midi: base + t.semi + 12 * o, t }));
  asc.push({ midi: base + 12 * S.arpSpan, t: ts[0] });
  const a = asc.filter((x) => x.midi <= hi);
  switch (S.arpPattern) {
    case 'down': return a.slice().reverse();
    case 'updown': return a.concat(a.slice(0, -1).reverse());
    case 'alberti': {
      const find = (...degs) => { for (const d of degs) { const x = a.find((n) => n.t.deg === d); if (x) return x; } return a[1]; };
      const r = a[0], m = find(3, 2, 4), f = find(5);
      return [r, f, m, f, r, f, m, f];
    }
    default: return a;
  }
}

function detectChord(midis) {
  if (!midis.length) return '';
  const pcs = [...new Set(midis.map((m) => m % 12))];
  const bass = Math.min(...midis) % 12;
  if (pcs.length === 1) return rootName(pcs[0]);
  let best = null;
  DETECT.forEach((q, qi) => {
    const qs = [...new Set(q.iv.map((x) => x[0] % 12))];
    if (qs.length !== pcs.length) return;
    for (const r of pcs) {
      if (qs.every((s) => pcs.includes((r + s) % 12))) {
        const sc = qi + (r === bass ? 0 : 100);
        if (!best || sc < best.sc) best = { sc, r, q };
      }
    }
  });
  if (!best) return '';
  return rootName(best.r) + best.q.sfx + (best.r !== bass ? '/' + rootName(bass) : '');
}

/* ======================= Keyboard view ======================= */
const kbd = $('#kbd');
const BOFF = { 1: -0.12, 3: 0.12, 6: -0.16, 8: 0, 10: 0.16 };

function buildKeyboard() {
  const [lo, hi] = range();
  kbd.innerHTML = '';
  keyEls = {};
  const ww = 100 / 15;
  let wi = 0;
  for (let m = lo; m <= hi; m++) {
    const pc = m % 12;
    const black = BLACK.has(pc);
    const el = document.createElement('div');
    el.className = 'key ' + (black ? 'black' : 'white');
    el.dataset.midi = m;
    if (black) {
      const bw = ww * 0.6;
      el.style.width = bw + '%';
      el.style.left = (wi * ww - bw / 2 + BOFF[pc] * bw) + '%';
    } else {
      el.style.left = wi * ww + '%';
      el.style.width = ww + '%';
      wi++;
    }
    el.innerHTML = '<span class="base"></span><span class="lab"><b class="nm"></b><i class="dg"></i></span><span class="led"></span>';
    kbd.appendChild(el);
    keyEls[m] = el;
  }
  for (const m of held.keys()) keyEls[m]?.classList.add('down');
}

function baseLabel(m) {
  const pc = m % 12, oct = Math.floor(m / 12) - 1;
  if (S.labels === 'off') return '';
  if (S.labels === 'c') return pc === 0 ? 'C' + oct : '';
  if (BLACK.has(pc)) return S.labels === 'all' ? `${SHARP[pc]}<br>${rootName(pc)}` : '';
  return pc === 0 ? 'C' + oct : SHARP[pc];
}

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((x, i) => Math.round(x * (1 - t) + b[i] * t));
function setGlow(el, hex) {
  const c = rgb(hex);
  el.style.setProperty('--g', hex);
  el.style.setProperty('--ga', `rgba(${c},.6)`);
  el.style.setProperty('--gb', `rgb(${mix([255, 255, 255], c, 0.62)})`);
  el.style.setProperty('--gc', `rgb(${mix([255, 255, 255], c, 0.2)})`);
  el.style.setProperty('--gd', `rgb(${mix([22, 23, 31], c, 0.5)})`);
}

function renderKeys() {
  const show = new Map();
  if (S.mode === 'chords') {
    G.voicing.forEach((v) => show.set(v.midi, { t: v.t }));
  } else if (S.mode === 'arp') {
    G.arp.forEach((v) => { if (!show.has(v.midi)) show.set(v.midi, { t: v.t, faint: true }); });
    const nx = G.arp[G.arpIdx];
    if (nx && !G.solved) show.set(nx.midi, { t: nx.t, next: true });
  }
  for (const [m, el] of Object.entries(keyEls)) {
    const s = show.get(+m);
    el.classList.toggle('lit', !!s);
    el.classList.toggle('faint', !!(s && s.faint));
    el.classList.toggle('next', !!(s && s.next));
    if (s) {
      setGlow(el, s.t.color);
      el.querySelector('.nm').textContent = s.t.name;
      el.querySelector('.dg').textContent = s.t.iv;
    }
    el.querySelector('.base').innerHTML = baseLabel(+m);
  }
}

function flash(m, ok, color) {
  const el = keyEls[m];
  if (!el) return;
  if (color) setGlow(el, color);
  const cls = ok ? 'hit' : 'miss';
  el.classList.remove('hit', 'miss');
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(el._ft);
  el._ft = setTimeout(() => el.classList.remove(cls), 460);
  if (ok) ripple(el, color || getComputedStyle(el).getPropertyValue('--g') || MONO);
}

function ripple(el, color) {
  const kr = kbd.getBoundingClientRect(), r = el.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'ripple';
  d.style.setProperty('--g', color);
  d.style.left = (r.left - kr.left + r.width / 2) + 'px';
  d.style.top = (r.bottom - kr.top - (el.classList.contains('black') ? 16 : 20)) + 'px';
  kbd.appendChild(d);
  setTimeout(() => d.remove(), 650);
}

/* ======================= Display ======================= */
const PRAISE = ['Perfect!', 'Nice!', 'Great!', 'Nailed it!', 'Beautiful!', 'Lovely!'];
const ORD = ['', '1st inversion', '2nd inversion', '3rd inversion'];
const heldMidis = () => [...held.keys()].sort((a, b) => a - b);
const heldPcs = () => new Set([...held.keys()].map((m) => m % 12));

function chordLabel() {
  const ch = G.chord;
  if (S.mode !== 'chords' || !G.voicing.length) return { name: ch.name, inv: '' };
  const bass = G.voicing[0].t;
  if (bass.deg === 1) return { name: ch.name, inv: '' };
  const k = ch.tones.indexOf(bass);
  return { name: `${ch.name}/${bass.name}`, inv: ORD[k] || '' };
}

function renderDisplay() {
  const nm = $('#dName'), nu = $('#dNumeral'), tn = $('#dTones'), st = $('#dStatus'), sk = $('#dStreak');
  const hn = $('#hudName'), hnu = $('#hudNumeral'), hst = $('#hudStatus');
  if (S.mode === 'free') {
    const hm = heldMidis();
    const name = detectChord(hm);
    $('#fName').textContent = name;
    $('#fNotes').textContent = [...new Set(hm.map((m) => rootName(m % 12)))].join(' · ');
    hn.textContent = name || '—'; hnu.textContent = ''; hst.textContent = '';
    return;
  }
  const ch = G.chord;
  const lab = chordLabel();
  const prog = S.source === 'prog' ? PMAP[S.progId] : null;
  nu.textContent = [prog ? `${G.numeral}  ·  ${S.step + 1}/${prog.steps.length}` : '', lab.inv].filter(Boolean).join('  ·  ');
  nm.textContent = lab.name;
  sk.textContent = G.streak > 1 ? `🔥 ${G.streak} in a row` : '';
  const hp = heldPcs();
  tn.innerHTML = ch.tones.map((t) =>
    `<span class="tone${hp.has(t.pc) ? ' held' : ''}" style="color:${t.color}"><span>${t.name}</span><i>${t.iv}</i></span>`).join('');

  let status, short;
  if (S.mode === 'chords') {
    const n = ch.tones.length;
    const got = ch.tones.filter((t) => hp.has(t.pc)).length;
    if (G.solved) { status = short = `<b class="good">✓ ${G.praise}</b>`; }
    else { status = `Hold all ${n} keys together · ${got}/${n}`; short = `${got}/${n}`; }
  } else {
    const n = G.arp.length;
    if (G.solved) { status = short = `<b class="good">✓ Arpeggio complete!</b>`; }
    else {
      status = `Play the pulsing key · ${G.arpIdx + 1}/${n}<div class="pbar"><div style="width:${(G.arpIdx / n) * 100}%"></div></div>`;
      short = `note ${G.arpIdx + 1}/${n}`;
    }
  }
  st.innerHTML = status;
  hn.textContent = lab.name; hnu.textContent = prog ? G.numeral : ''; hst.innerHTML = short;
}

function winFx() {
  const d = $('#display');
  d.classList.remove('win'); void d.offsetWidth; d.classList.add('win');
  kbd.classList.remove('win'); void kbd.offsetWidth; kbd.classList.add('win');
  setTimeout(() => kbd.classList.remove('win'), 850);
  const ms = S.mode === 'chords' ? G.voicing : G.arp;
  [...new Set(ms.map((v) => v.midi))].forEach((m, i) => {
    const v = ms.find((x) => x.midi === m);
    setTimeout(() => keyEls[m] && ripple(keyEls[m], v.t.color), i * 50);
  });
}

/* ======================= Guide logic ======================= */
function success() {
  G.solved = true;
  G.praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  G.streak = G.misses === 0 ? G.streak + 1 : 1;
  if (S.source === 'prog') G.done.add(S.step);
  winFx();
  renderKeys();
  renderDisplay();
  renderStrip();
  clearTimeout(G.timer);
  if (S.source === 'prog' && S.autoAdvance) {
    G.timer = setTimeout(() => setStep(S.step + 1, { auto: true }), S.mode === 'arp' ? 500 : 750);
  } else if (S.mode === 'arp') {
    G.timer = setTimeout(() => { G.solved = false; G.arpIdx = 0; G.misses = 0; renderKeys(); renderDisplay(); }, 900);
  }
}

function guidePress(m, src) {
  if (S.mode === 'free') {
    flash(m, true, RAINBOW[m % 12]);
    renderDisplay();
    return;
  }
  if (G.solved) return;
  if (S.mode === 'chords') {
    const t = G.chord.tones.find((x) => x.pc === m % 12);
    flash(m, !!t, t && t.color);
    if (!t) G.misses++;
    const hp = heldPcs();
    if (G.chord.tones.every((x) => hp.has(x.pc))) { success(); return; }
  } else {
    const target = G.arp[G.arpIdx];
    if (!target) return;
    const ok = m === target.midi || (src === 'midi' && m % 12 === target.midi % 12);
    flash(m, ok, ok ? target.t.color : null);
    if (ok) {
      G.arpIdx++;
      if (G.arpIdx >= G.arp.length) { success(); return; }
      renderKeys();
    } else G.misses++;
  }
  renderDisplay();
}

function guideRelease() {
  if (S.mode === 'chords' && G.solved && held.size === 0 && !(S.source === 'prog' && S.autoAdvance)) {
    G.solved = false; G.misses = 0;
  }
  renderDisplay();
}

function press(m, src, vel = 0.8, audioMidi = m) {
  AudioEng.noteOn(audioMidi, vel);
  held.set(m, (held.get(m) || 0) + 1);
  keyEls[m]?.classList.add('down');
  guidePress(m, src);
}

function release(m, audioMidi = m) {
  const c = (held.get(m) || 0) - 1;
  if (c > 0) { held.set(m, c); return; }
  if (!held.has(m)) return;
  held.delete(m);
  AudioEng.noteOff(audioMidi);
  keyEls[m]?.classList.remove('down');
  guideRelease();
}

function releaseAll() {
  pointers.clear();
  for (const m of [...held.keys()]) { held.set(m, 1); release(m); }
}

/* ======================= Touch / pointer input ======================= */
function keyAt(x, y) {
  const el = document.elementFromPoint(x, y);
  const k = el && el.closest && el.closest('.key');
  return k && kbd.contains(k) ? +k.dataset.midi : null;
}
function velAt(m, y) {
  const el = keyEls[m];
  if (!el) return 0.8;
  const r = el.getBoundingClientRect();
  return 0.55 + 0.45 * clamp((y - r.top) / r.height, 0, 1);
}

kbd.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  AudioEng.unlock();
  const m = keyAt(e.clientX, e.clientY);
  if (m == null) return;
  try { kbd.releasePointerCapture(e.pointerId); } catch (_) {}
  pointers.set(e.pointerId, m);
  press(m, 'touch', velAt(m, e.clientY));
});
window.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const m = keyAt(e.clientX, e.clientY);
  const old = pointers.get(e.pointerId);
  if (m === old) return;
  pointers.set(e.pointerId, m);
  if (old != null) release(old);
  if (m != null) press(m, 'touch', velAt(m, e.clientY));
});
const pointerEnd = (e) => {
  if (!pointers.has(e.pointerId)) return;
  const old = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (old != null) release(old);
};
window.addEventListener('pointerup', pointerEnd);
window.addEventListener('pointercancel', pointerEnd);
kbd.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => { if (e.target.closest('#kbdWrap')) e.preventDefault(); }, { passive: false });

/* ======================= Computer keyboard ======================= */
const KEYMAP = { z: 0, s: 1, x: 2, d: 3, c: 4, v: 5, g: 6, b: 7, h: 8, n: 9, j: 10, m: 11, ',': 12,
  q: 12, '2': 13, w: 14, '3': 15, e: 16, r: 17, '5': 18, t: 19, '6': 20, y: 21, '7': 22, u: 23, i: 24 };
const kbDown = new Map();
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === 'arrowright') { setStep(S.step + 1); return; }
  if (k === 'arrowleft') { setStep(S.step - 1); return; }
  if (k === ' ') { e.preventDefault(); if (!e.repeat) toggleDemo(); return; }
  if (e.repeat || !(k in KEYMAP) || kbDown.has(k)) return;
  AudioEng.unlock();
  hideSplash();
  const m = range()[0] + KEYMAP[k];
  kbDown.set(k, m);
  press(m, 'kbd');
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (!kbDown.has(k)) return;
  release(kbDown.get(k));
  kbDown.delete(k);
});

/* ======================= MIDI (Android / desktop Chrome) ======================= */
function foldMidi(n) { const [lo, hi] = range(); while (n < lo) n += 12; while (n > hi) n -= 12; return n; }
function onMidi(ev) {
  const [st, d1, d2] = ev.data;
  const cmd = st & 0xf0;
  if (cmd === 0x90 && d2 > 0) press(foldMidi(d1), 'midi', d2 / 127, d1);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) release(foldMidi(d1), d1);
  else if (cmd === 0xb0 && d1 === 64) setSustain(d2 >= 64);
}
async function connectMidi() {
  const out = $('#midiStatus');
  if (!navigator.requestMIDIAccess) { out.textContent = 'Not supported in this browser (iPad Safari has no Web MIDI)'; return; }
  try {
    const acc = await navigator.requestMIDIAccess();
    const hook = () => {
      let n = 0;
      acc.inputs.forEach((inp) => { inp.onmidimessage = onMidi; n++; });
      out.textContent = n ? `${n} device${n > 1 ? 's' : ''} connected` : 'No MIDI devices found';
    };
    hook();
    acc.onstatechange = hook;
  } catch (e) { out.textContent = 'MIDI permission was denied'; }
}

/* ======================= Demo playback ======================= */
let demoTok = 0, demoing = false;
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

function demoNote(m, dur, tok) {
  AudioEng.noteOn(m, 0.72);
  const el = keyEls[m];
  el?.classList.add('down');
  flash(m, true);
  setTimeout(() => {
    if (!held.has(m)) { AudioEng.noteOff(m); el?.classList.remove('down'); }
  }, dur * 1000);
}

function stopDemo() {
  demoTok++;
  demoing = false;
  const b = $('#demoBtn');
  b.classList.remove('playing');
  b.innerHTML = '&#9654; Demo';
}

async function toggleDemo() {
  if (S.mode === 'free') return;
  if (demoing) { stopDemo(); return; }
  AudioEng.unlock();
  const tok = ++demoTok;
  demoing = true;
  const b = $('#demoBtn');
  b.classList.add('playing');
  b.innerHTML = '&#9632; Stop';
  const beat = 60 / S.tempo;
  const n = S.source === 'prog' ? PMAP[S.progId].steps.length : 1;
  const start = S.source === 'prog' ? S.step : 0;
  for (let i = 0; i < n; i++) {
    if (tok !== demoTok) return;
    if (S.source === 'prog') setStep(start + i, { keepDemo: true });
    if (S.mode === 'chords') {
      G.voicing.forEach((v, j) => setTimeout(() => tok === demoTok && demoNote(v.midi, beat * 1.9, tok), j * 28));
      await wait(beat * 2);
    } else {
      for (let j = 0; j < G.arp.length; j++) {
        if (tok !== demoTok) return;
        G.arpIdx = j; renderKeys(); renderDisplay();
        demoNote(G.arp[j].midi, beat * 0.48, tok);
        await wait(beat * 0.5);
      }
      G.arpIdx = 0; renderKeys(); renderDisplay();
      await wait(beat * 0.5);
    }
  }
  if (tok === demoTok) {
    stopDemo();
    if (S.source === 'prog') setStep(start);
  }
}

/* ======================= Controls ======================= */
function setStep(i, opts = {}) {
  if (S.source !== 'prog' || S.mode === 'free') return;
  const n = PMAP[S.progId].steps.length;
  const ni = ((i % n) + n) % n;
  if (!opts.keepDemo && demoing) stopDemo();
  if (opts.auto && ni === 0) G.done.clear();
  S.step = ni;
  save();
  refresh();
  const on = $('#progStrip .pchip.on');
  if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}

function previewSound() {
  AudioEng.unlock();
  [60, 64, 67].forEach((m, i) => setTimeout(() => {
    AudioEng.noteOn(m, 0.7);
    setTimeout(() => { if (!held.has(m)) AudioEng.noteOff(m); }, 650);
  }, i * 70));
}

function setSound(id) {
  if (!SOUNDS[id]) return;
  S.sound = id;
  save();
  AudioEng.allOff();
  $('#soundSel').value = $('#soundQuick').value = id;
  if (SOUNDS[id].synth) { renderSoundStatus(); previewSound(); return; }
  const bank = Samples.load(id);
  if (bank.ready) bank.ready.then(() => { if (S.sound === id && bank.buffers.size) previewSound(); });
}

function renderSoundStatus() {
  const snd = SOUNDS[S.sound];
  const p = !snd.synth && Samples.progress(snd.id);
  let txt = '';
  if (p) {
    if (p.done < p.total) txt = `Loading ${Math.round((p.done / p.total) * 100)}%`;
    else if (!p.ok) txt = 'Couldn’t load: check your connection';
  }
  document.querySelectorAll('.sstat').forEach((el) => { el.textContent = txt; });
}

function setSustain(on) {
  S.sustain = on;
  $('#sustainBtn').setAttribute('aria-pressed', String(on));
  if (!on) AudioEng.sustainOff((m) => held.has(m) || held.has(foldMidi(m)));
}

function refresh() {
  clearTimeout(G.timer);
  const body = document.body;
  body.classList.remove('mode-free', 'mode-chords', 'mode-arp', 'src-single', 'src-prog');
  body.classList.add('mode-' + S.mode, 'src-' + S.source);
  body.classList.toggle('hidepanel', S.hidePanel);

  if (S.source === 'single') {
    const [pc, l] = ROOTS[S.root];
    G.chord = makeChord(pc, l, S.quality);
    const inv = Math.min(S.inversion, maxInv(G.chord));
    G.voicing = fit(invert(rootVoicing(G.chord), inv));
    G.numeral = '';
  } else {
    const p = PMAP[S.progId];
    const [kpc, kl] = (p.minor ? MINOR_KEYS : ROOTS)[S.keyPc];
    const chords = p.steps.map(([semi, lets, q]) => makeChord((kpc + semi) % 12, (kl + lets) % 7, q));
    const voicings = S.voicing === 'smooth' ? smoothVoicings(chords) : chords.map((c) => fit(rootVoicing(c)));
    S.step = clamp(S.step, 0, chords.length - 1);
    G.chord = chords[S.step];
    G.voicing = voicings[S.step];
    G.numeral = p.steps[S.step][3];
    G.chords = chords;
  }
  G.arp = arpSeq(G.chord);
  G.arpIdx = 0;
  G.solved = false;
  G.misses = 0;
  renderControls();
  renderKeys();
  renderDisplay();
}

function setSeg(sel, val) {
  document.querySelectorAll(sel + ' button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(val)));
}

function renderStrip() {
  const strip = $('#progStrip');
  if (S.source !== 'prog') return;
  const p = PMAP[S.progId];
  strip.innerHTML = p.steps.map((s, i) =>
    `<button class="pchip${i === S.step ? ' on' : ''}${G.done.has(i) ? ' done' : ''}" data-i="${i}"><span class="pn">${s[3]}</span><span class="pc">${G.chords[i].name}</span></button>`).join('');
}

function renderControls() {
  setSeg('#modeSeg', S.mode);
  setSeg('#srcSeg', S.source);
  $('#demoBtn').style.visibility = S.mode === 'free' ? 'hidden' : '';
  $('#singleCtl').classList.toggle('show', S.mode !== 'free' && S.source === 'single');
  $('#progCtl').classList.toggle('show', S.mode !== 'free' && S.source === 'prog');

  // Arpeggio options live in the inversion row (single) or under the progression (prog)
  const arp = $('#arpCtl');
  arp.classList.toggle('show', S.mode === 'arp');
  if (S.source === 'single') $('#invRow').insertBefore(arp, $('#randBtn'));
  else $('.controls').appendChild(arp);
  $('#invRow > label').style.display = $('#invChips').style.display = S.mode === 'arp' ? 'none' : '';

  setSeg('#rootChips', S.root);
  setSeg('#qualChips', S.quality);
  const mi = maxInv(G.chord);
  document.querySelectorAll('#invChips button').forEach((b) => {
    b.disabled = +b.dataset.v > mi;
    b.classList.toggle('on', +b.dataset.v === Math.min(S.inversion, mi));
  });
  setSeg('#patChips', S.arpPattern);
  setSeg('#spanChips', S.arpSpan);

  const p = PMAP[S.progId];
  $('#progSel').value = S.progId;
  const keySel = $('#keySel');
  const names = (p.minor ? MINOR_KEYS : ROOTS).map(([pc, l]) => `${spell(l, pc)} ${p.minor ? 'minor' : 'major'}`);
  if (keySel.dataset.minor !== String(!!p.minor)) {
    keySel.innerHTML = names.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    keySel.dataset.minor = String(!!p.minor);
  }
  keySel.value = S.keyPc;
  renderStrip();

  $('#soundSel').value = $('#soundQuick').value = S.sound;
  renderSoundStatus();
  setSeg('#octSeg', S.octave);
  setSeg('#labelSeg', S.labels);
  setSeg('#colorSeg', S.colorMode);
  setSeg('#voiceSeg', S.voicing);
  setSeg('#advSeg', S.autoAdvance ? 1 : 0);
  $('#volRange').value = S.volume;
  $('#tempoRange').value = S.tempo;
  $('#tempoVal').textContent = `(${S.tempo} bpm)`;
  $('#legend').innerHTML = [1, 3, 5, 7, 9, 4, 6]
    .map((d) => `<span style="color:${S.colorMode === 'mono' ? MONO : TONE_COLORS[d]}">${TONE_NAMES[d]}</span>`).join('');
}

function buildControls() {
  $('#rootChips').innerHTML = ROOTS.map(([pc, l], i) => `<button class="chip" data-v="${i}">${spell(l, pc)}</button>`).join('');
  $('#qualChips').innerHTML = QUALS.map((q) => `<button class="chip" data-v="${q.id}">${q.chip}</button>`).join('');
  $('#invChips').innerHTML = ['Root', '1st', '2nd', '3rd'].map((n, i) => `<button class="chip" data-v="${i}">${n}</button>`).join('');
  $('#patChips').innerHTML = [['up', 'Up'], ['down', 'Down'], ['updown', 'Up & Down'], ['alberti', 'Alberti']]
    .map(([v, n]) => `<button class="chip" data-v="${v}">${n}</button>`).join('');
  $('#spanChips').innerHTML = [[1, '1 oct'], [2, '2 oct']].map(([v, n]) => `<button class="chip" data-v="${v}">${n}</button>`).join('');
  $('#progSel').innerHTML = PROGS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
  const soundOpts = `<optgroup label="Synth waveforms">${WAVES.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</optgroup>`
    + SAMPLED.map(([g, items]) => `<optgroup label="${g}">${items.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</optgroup>`).join('');
  ['#soundSel', '#soundQuick'].forEach((s) => {
    $(s).innerHTML = soundOpts;
    $(s).addEventListener('change', (e) => { setSound(e.target.value); e.target.blur(); });
  });

  const bind = (sel, fn) => $(sel).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (demoing) stopDemo();
    fn(b.dataset.v, b);
    save();
  });
  bind('#modeSeg', (v) => { S.mode = v; refresh(); });
  bind('#srcSeg', (v) => { S.source = v; G.done.clear(); refresh(); });
  bind('#rootChips', (v) => { S.root = +v; refresh(); });
  bind('#qualChips', (v) => { S.quality = v; refresh(); });
  bind('#invChips', (v) => { S.inversion = +v; refresh(); });
  bind('#patChips', (v) => { S.arpPattern = v; refresh(); });
  bind('#spanChips', (v) => { S.arpSpan = +v; refresh(); });
  bind('#progStrip', (v, b) => setStep(+b.dataset.i));
  bind('#octSeg', (v) => {
    releaseAll(); S.octave = +v; buildKeyboard(); refresh();
    if (!SOUNDS[S.sound].synth) Samples.load(S.sound);
  });
  bind('#labelSeg', (v) => { S.labels = v; refresh(); });
  bind('#colorSeg', (v) => { S.colorMode = v; refresh(); });
  bind('#voiceSeg', (v) => { S.voicing = v; refresh(); });
  bind('#advSeg', (v) => { S.autoAdvance = v === '1'; renderControls(); });

  $('#randBtn').addEventListener('click', () => {
    if (demoing) stopDemo();
    const common = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', '7', 'maj7', 'm7', 'm7b5', '6', 'm6'];
    let r, q;
    do { r = Math.floor(Math.random() * 12); q = common[Math.floor(Math.random() * common.length)]; } while (r === S.root && q === S.quality);
    S.root = r; S.quality = q; S.inversion = 0;
    save(); refresh();
    const on = $('#qualChips .chip.on'); on && on.scrollIntoView && on.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
  $('#keySel').addEventListener('change', (e) => { S.keyPc = +e.target.value; G.done.clear(); save(); refresh(); });
  $('#progSel').addEventListener('change', (e) => { S.progId = e.target.value; S.step = 0; G.done.clear(); save(); refresh(); });
  ['#prevBtn', '#hudPrev'].forEach((s) => $(s).addEventListener('click', () => setStep(S.step - 1)));
  ['#nextBtn', '#hudNext'].forEach((s) => $(s).addEventListener('click', () => setStep(S.step + 1)));
  $('#demoBtn').addEventListener('click', toggleDemo);
  $('#sustainBtn').addEventListener('click', () => setSustain(!S.sustain));

  const sheet = $('#sheet');
  $('#settingsBtn').addEventListener('click', () => { sheet.hidden = false; });
  $('#sheetClose').addEventListener('click', () => { sheet.hidden = true; });
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidden = true; });
  $('#volRange').addEventListener('input', (e) => { S.volume = +e.target.value; AudioEng.setVolume(S.volume); save(); });
  $('#tempoRange').addEventListener('input', (e) => { S.tempo = +e.target.value; $('#tempoVal').textContent = `(${S.tempo} bpm)`; save(); });
  $('#midiBtn').addEventListener('click', connectMidi);

  const togglePanel = (hide) => {
    S.hidePanel = hide;
    save();
    document.body.classList.toggle('hidepanel', hide);
    const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
    if (!standalone) {
      const d = document, el = d.documentElement;
      try {
        if (hide && !(d.fullscreenElement || d.webkitFullscreenElement)) (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
        else if (!hide && (d.fullscreenElement || d.webkitFullscreenElement)) (d.exitFullscreen || d.webkitExitFullscreen)?.call(d)?.catch?.(() => {});
      } catch (e) {}
    }
  };
  $('#hideBtn').addEventListener('click', () => togglePanel(true));
  $('#hudShow').addEventListener('click', () => togglePanel(false));
}

/* ======================= App lifecycle ======================= */
let wakeLock = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
function hideSplash() {
  const s = $('#splash');
  if (s.classList.contains('gone')) return;
  s.classList.add('gone');
  setTimeout(() => { s.style.display = 'none'; }, 400);
  keepAwake();
}
$('#splash').addEventListener('pointerdown', (e) => { e.preventDefault(); AudioEng.unlock(); hideSplash(); });
$('#rotateDismiss').addEventListener('click', () => document.body.classList.add('rotate-ok'));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { releaseAll(); AudioEng.allOff(); if (demoing) stopDemo(); }
  else { if (AudioEng.ctx && AudioEng.ctx.state !== 'running') AudioEng.ctx.resume(); keepAwake(); }
});
window.addEventListener('blur', () => { releaseAll(); for (const m of kbDown.values()) AudioEng.noteOff(m); kbDown.clear(); });

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

buildControls();
buildKeyboard();
refresh();
if (!SOUNDS[S.sound].synth) Samples.load(S.sound);
})();
