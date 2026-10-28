/* ============================================================
   HAPPY BIRTHDAY, AKSHAYA — a birthday film in five acts
   plus an interactive keepsake gift & hero golden wish star.
   Vanilla canvas 2D + GSAP 3.15 + Web Audio API lookahead synth.

   PART A  Hero Golden Wish Star (#wishStar cloned from #wishStarTpl):
           starts small (scale 0.15, ~24px), rises along a gentle curve
           over 3.2s, spins 720° around its true centre (50% 53.6%),
           settles upright with a gentle overshoot and glow pulse,
           and reveals her wish in Great Vibes rose-to-gold script.
   PART B  Strict Still End State: cancels all rAF loops, kills all
           tweens except the settled star, stops all particles & CSS
           animations, fades music over 2s then suspends AudioContext,
           hides gift/mute buttons, and leaves a static "replay" link.
   PART C  Overhauled Web Audio Engine: sfxBus (1.0) & musicBus (0.6) ->
           masterBus (0.9) -> DynamicsCompressor (-14 dB, 4:1) -> -1 dBFS
           ceiling, 25ms lookahead clock scheduler, C–Am–F–G progression
           in 300–2000 Hz range, prominent music-box Happy Birthday melody,
           sidechain ducking, continuous bow creak, and ?debug=audio mode.
   ============================================================ */

/* Fonts are bundled from npm (no CDN, works offline). Vite rewrites the
   woff2 URLs against the configured base, so they also work on a subpath. */
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/latin-700.css';
import '@fontsource/fraunces/latin-900.css';

import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import {
  RECIPIENT_NAME,
  SENDER_NAME,
  GIFT_TYPE,
  COLORS,
  WISH_STYLE,
  TEXTS,
  NOTES,
  GIFT_EXTRAS,
} from './config.js';

gsap.registerPlugin(MotionPathPlugin);

/* ============================================================
   CANVAS POLYFILL — roundRect for older browsers (Safari <15.4, Firefox)
   ============================================================ */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 0 || h < 0) return;
    if (typeof r === 'undefined') r = 0;
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    else if (Array.isArray(r)) {
      r = { tl: r[0] || 0, tr: r[1] || 0, br: r[2] || 0, bl: r[3] || 0 };
    } else {
      const dr = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (const k in dr) r[k] = r[k] || dr[k];
    }
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  };
}

/* the pen-stroke plugin: a `drawn` 0..1 property for the underline */
gsap.registerPlugin({
  name: 'drawn',
  init(target, value) {
    const len = target.getTotalLength();
    target.style.strokeDasharray = len;
    this.target = target; this.len = len; this.value = value;
  },
  render(ratio, data) {
    data.target.style.strokeDashoffset = data.len * (1 - data.value * ratio);
  },
});

const $ = (id) => document.getElementById(id);

/* ACCESSIBILITY: Screen reader announcements */
function announce(message) {
  const announcer = $('actAnnouncer');
  if (announcer) announcer.textContent = message;
}

/* ============================================================
   DOM REFERENCES & PERSONALIZATION HYDRATION
   ============================================================ */
const canvas = $('tree');
const scene  = $('sceneRoot') || document.querySelector('.scene');
const ctx    = canvas.getContext('2d');
const wishEl = $('wish');

const hero         = $('hero');
const eyebrow      = $('eyebrow');
const hint         = $('hint');
const motes        = $('motes');
const target       = $('target');
const targetHeart  = $('targetHeart');
const heartGlow    = target.querySelector('.heart__glow');
const aim          = $('aim');
const archeryPulse = $('archeryPulse');

const archery   = $('archery');
const bow       = $('bow');
const bowLimb   = $('bowLimb');
const bowLimbHi = $('bowLimbHi');
const bowTipL   = $('bowTipL');
const bowTipR   = $('bowTipR');
const arrow     = $('arrow');
const strL      = $('strL');
const strR      = $('strR');
const serving   = $('serving');

const flood       = $('flood');
const impactFlash = $('impactFlash');
const field       = $('field');
const camera      = $('camera');
const fgrid       = $('fgrid');
const kEyebrow    = $('kEyebrow');
const kSub        = $('kSub');
const barTop      = $('barTop');
const barBot      = $('barBot');
const uline       = $('uline').querySelector('.uline__path');
const bloom       = $('bloom');
const finaleDock  = $('finaleDock');
const endNote     = $('endNote');
const envelopeEl  = $('envelope');
const envBody     = $('envBody');
const butterfliesEl = $('butterflies');
const cakeCanvas  = $('cakeCanvas');
const cakeCtx     = cakeCanvas.getContext('2d');
const sparkleCanvas = $('sparkleCanvas');
const sparkleCtx    = sparkleCanvas.getContext('2d');
const rippleRing1 = $('rippleRing1');
const rippleRing2 = $('rippleRing2');

const openGiftBtn   = $('openGiftBtn');
const openGiftLabel = $('openGiftLabel');
const finalReplayLink = $('finalReplayLink');
const giftModal     = $('giftModal');
const giftBackdrop  = $('giftBackdrop');
const giftCard      = $('giftCard');
const closeGiftBtn  = $('closeGiftBtn');
const notesGrid     = $('notesGrid');
const notesProgress = $('notesProgress');
const noteReader    = $('noteReader');
const notePaper     = $('notePaper');
const closeNoteBtn  = $('closeNoteBtn');
const noteReaderTitle = $('noteReaderTitle');
const noteReaderBody  = $('noteReaderBody');
const noteReaderSign  = $('noteReaderSign');
const wishForm      = $('wishForm');
const wishInput     = $('wishInput');
const wishStatus    = $('wishStatus');
const replayBtn     = $('replayBtn');
const muteBtn       = $('muteBtn');
const wishStarTpl   = $('wishStarTpl');

function applyPersonalization() {
  document.title = TEXTS.pageTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', TEXTS.metaDescription);

  const nameIds = [
    'envForName',
    'envFrontName',
    'heroName',
    'act3Name',
    'act4Name',
    'closingName',
    'giftEyebrowName',
    'giftTitleName',
  ];
  nameIds.forEach((id) => {
    const el = $(id);
    if (el) { el.textContent = RECIPIENT_NAME; el.dataset.text = RECIPIENT_NAME; }
  });

  if (canvas) canvas.setAttribute('aria-label', `A blossom tree grows and blooms into a heart made of petals for ${RECIPIENT_NAME}`);
  if (envelopeEl) envelopeEl.setAttribute('aria-label', `Tap to open ${RECIPIENT_NAME}'s birthday card`);
  if (hero) hero.setAttribute('aria-label', `Draw the bow to open ${RECIPIENT_NAME}'s birthday card`);
  if (cakeCanvas) cakeCanvas.setAttribute('aria-label', `${RECIPIENT_NAME}'s birthday cake. Tap or press Enter or Space to blow out candles.`);
  if (openGiftBtn) openGiftBtn.setAttribute('aria-label', `Open your birthday gift, ${RECIPIENT_NAME}`);
  if (wishInput) {
    wishInput.setAttribute('placeholder', `Write a birthday wish, ${RECIPIENT_NAME}…`);
    wishInput.setAttribute('maxlength', String(WISH_STYLE.maxChars));
  }
  const srSummary = $('srSummary');
  if (srSummary) srSummary.textContent = `Happy Birthday, ${RECIPIENT_NAME}. Here’s to a wonderful year ahead.`;
}
applyPersonalization();

const searchParams = new URLSearchParams(location.search);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isRecord     = searchParams.has('record');
const debugAudio   = searchParams.get('debug') === 'audio';

const ANIM = {
  floodFadeIn: 0.18,
  floodScale: 0.42,
  cakeEntry: 0.88,
  cakeGlow: 0.36,
  arcLift: 16,
};
/* Low-end / small phones get fewer particles (DPR is already capped at 2). */
const LOW_END = (navigator.deviceMemory && navigator.deviceMemory <= 4)
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  || Math.min(window.innerWidth, window.innerHeight) < 400;
const MOBILE = {
  minPhoneWidth: 320,
  confettiCap: LOW_END ? 60 : 100,
  blossomScale: LOW_END ? 0.7 : 1,
};

/* ============================================================
   MATH HELPERS
   ============================================================ */
const rand  = (a, b) => a + Math.random() * (b - a);
const pick  = (a)    => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack  = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/* ============================================================
   PART C — OVERHAULED WEB AUDIO ENGINE
   - Buses: sfxBus (1.0) & musicBus (0.6) -> masterBus (0.9) ->
     DynamicsCompressor (-14 dB, ratio 4, attack 0.003, release 0.2) ->
     ceiling gain (-1 dBFS = 0.891) -> destination.
   - 25ms lookahead audio-clock scheduler (100ms window, zero setTimeout drift).
   - Phone-audible 300–2000 Hz C–Am–F–G chord progression + 800–2000 Hz bells.
   - Prominent music-box Happy Birthday melody on the cake scene.
   - 30% sidechain ducking of musicBus during major SFX.
   ============================================================ */
export const AUDIO_LEVELS = {
  MASTER_BUS: 0.90,
  SFX_BUS:    1.00,
  MUSIC_BUS:  0.60,
  CEILING:    0.891, // -1.0 dBFS hard peak ceiling
};

/* Shared mix constants: used by BOTH the live engine and measureMix(), so the
   measurement is truthful. Change a level here and both follow. */
export const MIX = {
  MAKEUP:           1.9,   // make-up gain before the compressor
  PAD:              0.079, // pad voice gain (bed alone)
  PAD_UNDER_MELODY: 0.048, // pad voice gain while the melody plays
  BELL:             0.075,
  BELL_UNDER_MELODY:0.034,
  MELODY:           0.78,
  FX:               0.235,   // trim for twang / whoosh / impact (peak target ~ -6 dBFS)
  LIMITER_DB:      -3,
  CLIP:             0.84,  // hard peak ceiling (~ -1.5 dBFS)
};

/* Visual timings the audio must follow. The arrow tweens in buildFilm() use
   these same numbers, so the impact sound is derived from the real flight. */
const ARROW_RISE = 0.18, ARROW_SETTLE = 0.08;
export const ARROW_FLIGHT = ARROW_RISE + ARROW_SETTLE;
/* Heart pulse: "lub" at 0, "dub" starts at 0.30 (see startBeat) */
export const BEAT_DUB_AT = 0.30;

const STORAGE_MUTE_KEY = 'bday_akshaya_muted';

const audio = (() => {
  let actx = null;
  let sfxBus = null;
  let musicBus = null;
  let masterBus = null;
  let compressor = null;
  let ceilingGain = null;
  let noiseBuf = null;
  let muted = false;
  let unlocked = false;
  let endedStill = false;
  let unlockClockT0 = 0;
  let releaseClockT0 = 0;
  let impactPre = false;
  let whooshPre = false;

  /* Lookahead scheduler state (25ms interval, 100ms lookahead window) */
  let schedulerTimer = 0;
  let bedRunning = false;
  let nextChordTime = 0;
  let chordIndex = 0;
  let nextBellTime = 0;
  let bellStep = 0;

  let melodyPlaying = false;
  let melodyIndex = 0;
  let nextMelodyTime = 0;

  /* Continuous bow creak state */
  let creakOsc = null;
  let creakFilter = null;
  let creakGain = null;
  let lastCreakStepAt = 0;
  let lastSparkleAt = 0;

  /* C–Am–F–G progression in the 300–2000 Hz phone-audible register */
  const CHORDS = [
    [261.63, 329.63, 392.00, 523.25], // C major (C4, E4, G4, C5)
    [220.00, 261.63, 329.63, 440.00], // A minor (A3, C4, E4, A4)
    [174.61, 261.63, 349.23, 440.00], // F major (F3, C4, F4, A4)
    [196.00, 246.94, 392.00, 493.88], // G major (G3, B3, G4, B4)
  ];
  const BELL_NOTES = [
    [1046.50, 1318.51, 1567.98, 1318.51], // C6, E6, G6, E6
    [880.00,  1046.50, 1318.51, 1760.00], // A5, C6, E6, A6
    [873.07,  1046.50, 1396.91, 1760.00], // F5, C6, F6, A6
    [987.77,  1174.66, 1567.98, 1975.53], // B5, D6, G6, B6
  ];

  /* Bright music-box "Happy Birthday" melody (clearly stands out at ~ -14 dBFS RMS) */
  const MELODY_SEQ = [
    [392.00, 0.34], [392.00, 0.22], [440.00, 0.52], [392.00, 0.52], [523.25, 0.52], [493.88, 0.92],
    [392.00, 0.34], [392.00, 0.22], [440.00, 0.52], [392.00, 0.52], [587.33, 0.52], [523.25, 0.92],
    [392.00, 0.34], [392.00, 0.22], [783.99, 0.52], [659.25, 0.52], [523.25, 0.48], [493.88, 0.48], [440.00, 0.88],
    [698.46, 0.34], [698.46, 0.22], [659.25, 0.52], [523.25, 0.52], [587.33, 0.52], [523.25, 1.25],
  ];

  try {
    muted = localStorage.getItem(STORAGE_MUTE_KEY) === '1';
  } catch (_) {}

  function syncMuteUI() {
    if (!muteBtn) return;
    muteBtn.classList.toggle('is-muted', muted);
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }
  syncMuteUI();

  function logCue(name, schedTime, extra = '') {
    if (!debugAudio || !actx) return;
    const relUnlock = (schedTime - unlockClockT0).toFixed(3);
    const relShot = releaseClockT0 ? ` | fromRelease: ${(schedTime - releaseClockT0).toFixed(3)}s` : '';
    console.log(`[audio-clock] cue="${name}" at=${schedTime.toFixed(3)}s (+${relUnlock}s${relShot}) ${extra}`);
  }

  function buildGraph(targetCtx) {
    const sfx = targetCtx.createGain();
    const music = targetCtx.createGain();
    const master = targetCtx.createGain();
    const makeup = targetCtx.createGain();
    const comp = targetCtx.createDynamicsCompressor();
    const limiter = targetCtx.createDynamicsCompressor();
    const ceiling = targetCtx.createWaveShaper();

    sfx.gain.value = AUDIO_LEVELS.SFX_BUS;
    music.gain.value = AUDIO_LEVELS.MUSIC_BUS;
    master.gain.value = AUDIO_LEVELS.MASTER_BUS;

    comp.threshold.value = -14;
    comp.knee.value = 6;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;

    makeup.gain.value = MIX.MAKEUP;

    /* Fast limiter just below the ceiling, then a hard clip as a safety net */
    limiter.threshold.value = MIX.LIMITER_DB;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    const N = 2049, curve = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * 2 - 1;
      curve[i] = Math.max(-MIX.CLIP, Math.min(MIX.CLIP, x));
    }
    ceiling.curve = curve;

    sfx.connect(master);
    music.connect(master);
    master.connect(makeup);
    makeup.connect(comp);
    comp.connect(limiter);
    limiter.connect(ceiling);
    ceiling.connect(targetCtx.destination);

    /* Pre-render 2s noise buffer at unlock time */
    const len = targetCtx.sampleRate * 2;
    const nBuf = targetCtx.createBuffer(1, len, targetCtx.sampleRate);
    const data = nBuf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return { sfx, music, master, comp, ceiling, nBuf };
  }

  function ensureCtx() {
    if (!actx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      actx = new Ctx();
      const g = buildGraph(actx);
      sfxBus = g.sfx;
      musicBus = g.music;
      masterBus = g.master;
      compressor = g.comp;
      ceilingGain = g.ceiling;
      noiseBuf = g.nBuf;
      masterBus.gain.value = muted || document.hidden ? 0.0001 : AUDIO_LEVELS.MASTER_BUS;
      unlockClockT0 = actx.currentTime;
    }
    if (actx.state === 'suspended' && !endedStill && !document.hidden) {
      actx.resume().catch(() => {});
    }
    return actx;
  }

  function getLatencyOffset() {
    if (!actx) return 0;
    const baseL = typeof actx.baseLatency === 'number' ? actx.baseLatency : 0;
    const outL  = typeof actx.outputLatency === 'number' ? actx.outputLatency : 0;
    return Math.min(0.04, baseL + outL);
  }

  function nowTime(offset = 0) {
    if (!actx) return 0;
    const compOffset = Math.max(0, offset - getLatencyOffset());
    return actx.currentTime + compOffset;
  }

  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    endedStill = false;
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }
    /* Play a 1-sample silent buffer synchronously to unlock iOS WebKit audio */
    try {
      const silent = c.createBuffer(1, 1, c.sampleRate);
      const src = c.createBufferSource();
      src.buffer = silent;
      src.connect(c.destination);
      src.start(0);
    } catch (_) {}

    unlocked = true;
    setMasterGain(muted || document.hidden ? 0.0001 : AUDIO_LEVELS.MASTER_BUS, 0.06);
  }

  function setMasterGain(val, ramp = 0.18) {
    if (!actx || !masterBus) return;
    const t = actx.currentTime;
    masterBus.gain.cancelScheduledValues(t);
    masterBus.gain.setValueAtTime(Math.max(0.0001, masterBus.gain.value), t);
    masterBus.gain.linearRampToValueAtTime(Math.max(0.0001, val), t + ramp);
  }

  /* Sidechain ducking: duck musicBus by ~30% during big SFX, then release smoothly */
  function duckMusic(duckRatio = 0.70, hold = 0.25, release = 0.55) {
    if (!actx || !musicBus) return;
    const baseLevel = melodyPlaying ? AUDIO_LEVELS.MUSIC_BUS * 0.65 : AUDIO_LEVELS.MUSIC_BUS;
    const t = actx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(baseLevel * duckRatio, t + 0.025);
    musicBus.gain.linearRampToValueAtTime(baseLevel, t + hold + release);
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem(STORAGE_MUTE_KEY, muted ? '1' : '0');
    } catch (_) {}
    syncMuteUI();
    if (!muted) ensureCtx();
    setMasterGain(muted || document.hidden ? 0.0001 : AUDIO_LEVELS.MASTER_BUS, 0.12);
  }

  document.addEventListener('visibilitychange', () => {
    if (!actx || endedStill) return;
    if (document.hidden) {
      setMasterGain(0.0001, 0.16);
    } else if (!muted) {
      actx.resume().catch(() => {});
      setMasterGain(AUDIO_LEVELS.MASTER_BUS, 0.22);
    }
  });

  /* Low-level scheduled tone on target bus (sfxBus or musicBus) */
  function schedTone(targetCtx, bus, freq, t0, {
    type = 'triangle',
    dur = 0.4,
    gain = 0.18,
    attack = 0.012,
    freqEnd = null,
    lowpass = 0,
  } = {}) {
    const osc = targetCtx.createOscillator();
    const g = targetCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqEnd), t0 + dur);
    }
    const atk = Math.min(attack, dur * 0.45);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    if (lowpass > 0) {
      const flt = targetCtx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(lowpass, t0);
      osc.connect(flt);
      flt.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /* Rich warm pad voice (triangle + octave-up sine through gentle lowpass in 300–2000 Hz) */
  function schedPadChord(targetCtx, bus, freqs, t0, dur = 2.6, voiceGain = 0.115) {
    freqs.forEach((f) => {
      /* Main warm triangle in 300–1000 Hz range */
      const fMid = f < 240 ? f * 2 : f;
      schedTone(targetCtx, bus, fMid, t0, {
        type: 'triangle',
        dur,
        gain: voiceGain,
        attack: 0.35,
        lowpass: 1750,
      });
      /* Octave-up harmonic shimmer in 600–2000 Hz range for phone speaker clarity */
      schedTone(targetCtx, bus, fMid * 2, t0, {
        type: 'sine',
        dur: dur * 0.92,
        gain: voiceGain * 0.58,
        attack: 0.4,
      });
    });
  }

  /* Gentle bell arpeggio note in 800–2000 Hz range */
  function schedBellNote(targetCtx, bus, freq, t0, gain = 0.115) {
    schedTone(targetCtx, bus, freq, t0, {
      type: 'sine',
      dur: 0.85,
      gain,
      attack: 0.008,
    });
    schedTone(targetCtx, bus, freq * 2, t0, {
      type: 'triangle',
      dur: 0.32,
      gain: gain * 0.35,
      attack: 0.005,
    });
  }

  /* Bright music-box note for the Happy Birthday melody (stands out clearly) */
  function schedMelodyNote(targetCtx, bus, freq, t0, dur, gain = 0.27) {
    /* Fundamental in 400–800 Hz + octave-up 800–1600 Hz + bright chime attack */
    schedTone(targetCtx, bus, freq, t0, {
      type: 'triangle',
      dur: dur * 1.35,
      gain: gain * 0.78,
      attack: 0.008,
      lowpass: 2400,
    });
    schedTone(targetCtx, bus, freq * 2, t0, {
      type: 'sine',
      dur: dur * 1.15,
      gain: gain * 0.72,
      attack: 0.006,
    });
    schedTone(targetCtx, bus, freq * 3, t0, {
      type: 'sine',
      dur: dur * 0.38,
      gain: gain * 0.22,
      attack: 0.004,
    });
  }

  function schedNoise(targetCtx, bus, nBuf, t0, {
    dur = 0.26,
    gain = 0.22,
    filterType = 'bandpass',
    freq = 1000,
    freqEnd = null,
    Q = 1.2,
    attack = 0.015,
  } = {}) {
    if (!nBuf) return;
    const src = targetCtx.createBufferSource();
    src.buffer = nBuf;
    const flt = targetCtx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.setValueAtTime(freq, t0);
    if (freqEnd) {
      flt.frequency.exponentialRampToValueAtTime(Math.max(80, freqEnd), t0 + dur);
    }
    flt.Q.value = Q;

    const g = targetCtx.createGain();
    const atk = Math.min(attack, dur * 0.45);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(flt);
    flt.connect(g);
    g.connect(bus);
    src.start(t0, (t0 * 0.37) % 1.2);
    src.stop(t0 + dur + 0.02);
  }

  /* Shared one-shots: the live engine AND measureMix() both call these. */
  function sfxTwang(c, bus, t0) {
    schedTone(c, bus, 240, t0, { type: 'sawtooth', dur: 0.28, gain: 0.32 * MIX.FX, attack: 0.003, freqEnd: 118, lowpass: 1600 });
    schedTone(c, bus, 480, t0, { type: 'triangle', dur: 0.18, gain: 0.22 * MIX.FX, attack: 0.003, freqEnd: 220 });
  }
  function sfxWhoosh(c, bus, nb, t0, dur = ARROW_FLIGHT) {
    schedNoise(c, bus, nb, t0, { dur, gain: 0.30 * MIX.FX, filterType: 'bandpass', freq: 520, freqEnd: 3200, Q: 1.5, attack: 0.02 });
  }
  function sfxImpact(c, bus, t0) {
    schedTone(c, bus, 185, t0, { type: 'triangle', dur: 0.18, gain: 0.38 * MIX.FX, attack: 0.003, freqEnd: 62, lowpass: 650 });
    schedTone(c, bus, 95,  t0, { type: 'sine', dur: 0.20, gain: 0.34 * MIX.FX, attack: 0.003, freqEnd: 45 });
    [1046.50, 1318.51, 1567.98, 2093.00].forEach((f, i) => {
      schedTone(c, bus, f, t0 + 0.015 + i * 0.038, { type: 'sine', dur: 0.44, gain: 0.16 * MIX.FX, attack: 0.005 });
    });
  }

  /* 25ms Lookahead Audio-Clock Scheduler (schedules next 100ms of notes on actx.currentTime) */
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD_SEC = 0.11;

  function schedulerTick() {
    if (!actx || !bedRunning || endedStill) return;
    const horizon = actx.currentTime + SCHEDULE_AHEAD_SEC;

    while (nextChordTime < horizon) {
      const chord = CHORDS[chordIndex % CHORDS.length];
      /* Softer bed when the Happy Birthday melody is playing so the melody leads */
      const padGain = melodyPlaying ? MIX.PAD_UNDER_MELODY : MIX.PAD;
      schedPadChord(actx, musicBus, chord, nextChordTime, 2.55, padGain);
      nextChordTime += 2.4;
      chordIndex++;
    }

    while (nextBellTime < horizon) {
      const cIdx = Math.max(0, (chordIndex - 1) % BELL_NOTES.length);
      const bellGroup = BELL_NOTES[cIdx];
      const bf = bellGroup[bellStep % bellGroup.length];
      const bellGain = melodyPlaying ? MIX.BELL_UNDER_MELODY : MIX.BELL;
      schedBellNote(actx, musicBus, bf, nextBellTime, bellGain);
      nextBellTime += 0.60;
      bellStep++;
    }

    if (melodyPlaying) {
      while (melodyIndex < MELODY_SEQ.length && nextMelodyTime < horizon) {
        const [mFreq, mDur] = MELODY_SEQ[melodyIndex];
        schedMelodyNote(actx, sfxBus, mFreq, nextMelodyTime, mDur, MIX.MELODY);
        nextMelodyTime += mDur;
        melodyIndex++;
      }
      if (melodyIndex >= MELODY_SEQ.length && actx.currentTime > nextMelodyTime + 0.4) {
        /* Loop the Happy Birthday melody gently after a 1.6s pause until final wish star */
        melodyIndex = 0;
        nextMelodyTime = actx.currentTime + 1.6;
      }
    }
  }

  function startLookaheadBed() {
    if (!actx || endedStill) return;
    if (schedulerTimer) clearInterval(schedulerTimer);
    bedRunning = true;
    chordIndex = 0;
    bellStep = 0;
    nextChordTime = actx.currentTime + 0.12;
    nextBellTime  = actx.currentTime + 0.36;
    schedulerTick();
    schedulerTimer = window.setInterval(schedulerTick, LOOKAHEAD_MS);
  }

  function startCakeMelody() {
    if (!actx || endedStill) return;
    melodyPlaying = true;
    melodyIndex = 0;
    nextMelodyTime = actx.currentTime + 0.22;
    if (!bedRunning) startLookaheadBed();
    schedulerTick();
  }

  function stopCreak() {
    if (!actx) return;
    if (creakGain) {
      try {
        const t = actx.currentTime;
        creakGain.gain.cancelScheduledValues(t);
        creakGain.gain.setValueAtTime(creakGain.gain.value, t);
        creakGain.gain.linearRampToValueAtTime(0.0001, t + 0.015);
      } catch (_) {}
    }
    if (creakOsc) {
      try { creakOsc.stop(actx.currentTime + 0.02); } catch (_) {}
      creakOsc = null;
      creakGain = null;
      creakFilter = null;
    }
  }

  function updateCreak(ratio) {
    if (!unlocked || muted || document.hidden || endedStill) return;
    const c = ensureCtx();
    if (!c) return;
    const r = clamp01(ratio);
    const now = c.currentTime;

    /* Continuous pitch-tracking bow creak + throttled wood grain pulses */
    const targetF = 185 + r * 280;
    const targetG = 0.03 + r * 0.075;
    if (!creakOsc) {
      creakOsc = c.createOscillator();
      creakFilter = c.createBiquadFilter();
      creakGain = c.createGain();
      creakOsc.type = 'sawtooth';
      creakOsc.frequency.setValueAtTime(targetF, now);
      creakFilter.type = 'bandpass';
      creakFilter.frequency.setValueAtTime(targetF * 2.2, now);
      creakFilter.Q.value = 3.2;
      creakGain.gain.setValueAtTime(0.0001, now);
      creakOsc.connect(creakFilter);
      creakFilter.connect(creakGain);
      creakGain.connect(sfxBus);
      creakOsc.start(now);
    }
    creakOsc.frequency.setTargetAtTime(targetF, now, 0.02);
    creakFilter.frequency.setTargetAtTime(targetF * 2.2, now, 0.02);
    creakGain.gain.setTargetAtTime(targetG, now, 0.02);
    /* Auto-decay if pointer stops moving */
    creakGain.gain.setTargetAtTime(0.0001, now + 0.08, 0.04);

    const ms = performance.now();
    if (ms - lastCreakStepAt > 60) {
      lastCreakStepAt = ms;
      schedTone(c, sfxBus, targetF * 1.5, now, {
        type: 'triangle',
        dur: 0.045,
        gain: 0.06 + r * 0.06,
        attack: 0.004,
        freqEnd: targetF * 1.62,
      });
      logCue('draw', now, `ratio=${r.toFixed(2)} freq=${Math.round(targetF)}Hz`);
    }
  }

  function play(name, param = 0.5) {
    if (endedStill) return;
    if (!unlocked && name !== 'envelope') return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = nowTime(0);

    switch (name) {
      case 'envelope':
        unlock();
        logCue('envelope', c.currentTime);
        /* Paper rustle + crisp seal pop at tap time */
        schedNoise(c, sfxBus, noiseBuf, c.currentTime, {
          dur: 0.32, gain: 0.24, filterType: 'bandpass', freq: 1100, freqEnd: 2600, Q: 1.0, attack: 0.02,
        });
        schedTone(c, sfxBus, 380, c.currentTime + 0.05, {
          type: 'triangle', dur: 0.15, gain: 0.28, attack: 0.005, freqEnd: 155,
        });
        schedTone(c, sfxBus, 760, c.currentTime + 0.09, {
          type: 'sine', dur: 0.35, gain: 0.14, attack: 0.01,
        });
        startLookaheadBed();
        break;

      case 'draw':
        updateCreak(param);
        break;

      case 'heartbeat':
        logCue('heartbeat', t0);
        /* Audible lub-dub in 110–180 Hz + 220 Hz harmonic so phone speakers reproduce it */
        schedTone(c, sfxBus, 145, t0, { type: 'triangle', dur: 0.12, gain: 0.20, attack: 0.008, freqEnd: 82, lowpass: 420 });
        schedTone(c, sfxBus, 125, t0 + BEAT_DUB_AT, { type: 'triangle', dur: 0.14, gain: 0.16, attack: 0.008, freqEnd: 74, lowpass: 380 });
        break;

      case 'release': {
        /* Bow twang at t=0. The whoosh and the impact are scheduled NOW on the
           audio clock, derived from the real arrow flight, so frame jitter in
           the GSAP callbacks cannot shift them. */
        stopCreak();
        releaseClockT0 = t0;
        duckMusic(0.65, ARROW_FLIGHT + 0.35, 0.55);
        logCue('release', t0, 'bow-twang');
        sfxTwang(c, sfxBus, t0);
        sfxWhoosh(c, sfxBus, noiseBuf, t0, ARROW_FLIGHT);
        const tHit = nowTime(ARROW_FLIGHT);
        sfxImpact(c, sfxBus, tHit);
        logCue('hit', tHit, `impact-prescheduled flight=${ARROW_FLIGHT.toFixed(2)}s`);
        impactPre = true;
        whooshPre = true;
        break;
      }

      case 'whoosh':
        /* Already scheduled by 'release'; only play here if no release preceded it */
        if (whooshPre) { whooshPre = false; break; }
        logCue('whoosh', t0, `flight=${ARROW_FLIGHT}s`);
        sfxWhoosh(c, sfxBus, noiseBuf, t0, ARROW_FLIGHT);
        break;

      case 'hit':
        /* Visual impact frame. Sound was pre-scheduled by 'release'. */
        if (impactPre) { impactPre = false; logCue('hit-visual', t0); break; }
        duckMusic(0.65, 0.35, 0.55);
        logCue('hit', t0, 'impact-thud+sparkle');
        sfxImpact(c, sfxBus, t0);
        break;

      case 'flood':
        /* Warm rose swell starting at t=1.00s */
        duckMusic(0.70, 0.5, 0.6);
        logCue('flood', t0);
        schedTone(c, sfxBus, 261.63, t0, { type: 'triangle', dur: 1.05, gain: 0.22, attack: 0.18, freqEnd: 392.00, lowpass: 1400 });
        schedTone(c, sfxBus, 523.25, t0 + 0.05, { type: 'sine', dur: 1.0, gain: 0.16, attack: 0.22, freqEnd: 783.99 });
        schedNoise(c, sfxBus, noiseBuf, t0, {
          dur: 0.78, gain: 0.15, filterType: 'bandpass', freq: 480, freqEnd: 1500, Q: 0.9, attack: 0.18,
        });
        break;

      case 'wish':
        logCue('wish', t0);
        [392.00, 493.88, 587.33, 783.99].forEach((f, i) => {
          schedTone(c, sfxBus, f, t0 + i * 0.045, { type: 'triangle', dur: 0.75, gain: 0.13, attack: 0.03, lowpass: 2000 });
        });
        break;

      case 'wish2':
        logCue('wish2', t0);
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          schedTone(c, sfxBus, f, t0 + i * 0.045, { type: 'triangle', dur: 0.80, gain: 0.14, attack: 0.03, lowpass: 2200 });
        });
        break;

      case 'bloom':
        /* Bright chime arpeggio starting at t=3.42s */
        duckMusic(0.70, 0.4, 0.6);
        logCue('bloom', t0);
        [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => {
          schedTone(c, sfxBus, f, t0 + i * 0.055, { type: 'sine', dur: 0.88, gain: 0.16, attack: 0.008 });
        });
        break;

      case 'grow':
        logCue('grow', t0);
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          schedTone(c, sfxBus, f, t0 + 0.25 + i * 0.22, { type: 'sine', dur: 0.65, gain: 0.11, attack: 0.015 });
        });
        break;

      case 'firework':
        break;
        logCue('firework', t0);
        schedTone(c, sfxBus, 240, t0, { type: 'triangle', dur: 0.12, gain: 0.18, attack: 0.003, freqEnd: 78 });
        schedNoise(c, sfxBus, noiseBuf, t0 + 0.03, {
          dur: 0.28, gain: 0.16, filterType: 'bandpass', freq: 2600, freqEnd: 1400, Q: 1.1, attack: 0.008,
        });
        break;

      case 'cakeMelody':
        logCue('cakeMelody', t0);
        startCakeMelody();
        break;

      case 'blow':
        /* Breath noise, then smoke hiss */
        duckMusic(0.68, 0.4, 0.5);
        logCue('blow', t0);
        schedNoise(c, sfxBus, noiseBuf, t0, {
          dur: 0.46, gain: 0.28, filterType: 'bandpass', freq: 780, freqEnd: 420, Q: 0.9, attack: 0.03,
        });
        schedNoise(c, sfxBus, noiseBuf, t0 + 0.16, {
          dur: 0.58, gain: 0.18, filterType: 'highpass', freq: 2400, Q: 1.0, attack: 0.04,
        });
        break;

      case 'sparkle': {
        break;
        const nowMs = performance.now();
        if (nowMs - lastSparkleAt < 95) break;
        lastSparkleAt = nowMs;
        const sf = pick([1318.51, 1567.98, 1760.00, 2093.00]);
        schedTone(c, sfxBus, sf, t0, { type: 'sine', dur: 0.20, gain: 0.055, attack: 0.005 });
        break;
      }

      case 'gift':
      case 'note':
        logCue(name, t0);
        [659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((f, i) => {
          schedTone(c, sfxBus, f, t0 + i * 0.05, { type: 'sine', dur: 0.68, gain: 0.14, attack: 0.006 });
        });
        break;

      case 'starRise':
        /* Soft rising shimmer matching the 3.2s star ascent */
        duckMusic(0.65, 2.8, 0.8);
        logCue('starRise', t0, 'dur=3.2s');
        schedNoise(c, sfxBus, noiseBuf, t0, {
          dur: 3.1, gain: 0.12, filterType: 'bandpass', freq: 650, freqEnd: 2800, Q: 2.2, attack: 0.3,
        });
        [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98, 1975.53].forEach((f, i) => {
          schedTone(c, sfxBus, f, t0 + i * 0.36, {
            type: 'sine', dur: 0.95, gain: 0.12, attack: 0.04, freqEnd: f * 1.04,
          });
        });
        break;

      case 'starSettle':
        /* Single warm chime when the star settles, followed by silence */
        logCue('starSettle', t0, 'final-chime');
        schedTone(c, sfxBus, 523.25, t0, { type: 'triangle', dur: 2.1, gain: 0.22, attack: 0.01, lowpass: 2200 });
        schedTone(c, sfxBus, 783.99, t0 + 0.02, { type: 'sine', dur: 1.9, gain: 0.18, attack: 0.01 });
        schedTone(c, sfxBus, 1046.50, t0 + 0.04, { type: 'sine', dur: 2.2, gain: 0.24, attack: 0.008 });
        schedTone(c, sfxBus, 1567.98, t0 + 0.06, { type: 'sine', dur: 1.8, gain: 0.14, attack: 0.008 });
        break;

      default:
        break;
    }
  }

  /* Part B: Fade music & master out to silence over 2s, then suspend AudioContext */
  function fadeOutAndSuspend(fadeSec = 2.0) {
    endedStill = true;
    stopCreak();
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = 0;
    }
    bedRunning = false;
    melodyPlaying = false;
    if (!actx || !masterBus) return;
    const t = actx.currentTime;
    masterBus.gain.cancelScheduledValues(t);
    masterBus.gain.setValueAtTime(Math.max(0.0001, masterBus.gain.value), t);
    masterBus.gain.linearRampToValueAtTime(0.0001, t + fadeSec);
    const ctxRef = actx;
    window.setTimeout(() => {
      if (endedStill && ctxRef && ctxRef.state === 'running') {
        ctxRef.suspend().catch(() => {});
      }
    }, (fadeSec + 0.15) * 1000);
  }

  function stopAllAndReset() {
    endedStill = false;
    stopCreak();
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = 0;
    }
    bedRunning = false;
    melodyPlaying = false;
    impactPre = false; whooshPre = false;
    if (actx) {
      if (actx.state === 'suspended' && !document.hidden) {
        actx.resume().catch(() => {});
      }
      if (musicBus) {
        musicBus.gain.cancelScheduledValues(actx.currentTime);
        musicBus.gain.setValueAtTime(AUDIO_LEVELS.MUSIC_BUS, actx.currentTime);
      }
      setMasterGain(muted || document.hidden ? 0.0001 : AUDIO_LEVELS.MASTER_BUS, 0.08);
    }
  }

  /* Part C5: OfflineAudioContext renderer to measure exact dBFS RMS and Peak levels */
  async function measureMix() {
    const OffCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OffCtx) return null;
    const sr = 44100;
    const off = new OffCtx(1, sr * 8, sr);
    const g = buildGraph(off);

    /* Window 1 (0.0s - 2.4s): Music bed only (same gains as the live scheduler) */
    schedPadChord(off, g.music, CHORDS[0], 0.05, 2.3, MIX.PAD);
    for (let i = 0; i < 4; i++) {
      schedBellNote(off, g.music, BELL_NOTES[0][i], 0.15 + i * 0.55, MIX.BELL);
    }

    /* Window 2 (2.5s - 5.2s): Happy Birthday melody (same function + gain as live) */
    let mCursor = 2.55;
    for (let i = 0; i < 6; i++) {
      const [mf, md] = MELODY_SEQ[i];
      schedMelodyNote(off, g.sfx, mf, mCursor, md, MIX.MELODY);
      mCursor += md;
    }

    /* Window 3 (5.5s+): twang at release, whoosh across the flight, impact at flight end */
    sfxTwang(off, g.sfx, 5.50);
    sfxWhoosh(off, g.sfx, g.nBuf, 5.50, ARROW_FLIGHT);
    sfxImpact(off, g.sfx, 5.50 + ARROW_FLIGHT);

    const rendered = await off.startRendering();
    const ch = rendered.getChannelData(0);

    function calcStats(tStart, tEnd) {
      const i0 = Math.floor(tStart * sr);
      const i1 = Math.min(ch.length, Math.floor(tEnd * sr));
      let peak = 0;
      let sumSq = 0;
      for (let i = i0; i < i1; i++) {
        const a = Math.abs(ch[i]);
        if (a > peak) peak = a;
        sumSq += a * a;
      }
      const rms = Math.sqrt(sumSq / Math.max(1, i1 - i0));
      const toDb = (v) => (v > 0 ? +(20 * Math.log10(v)).toFixed(2) : -100);
      return { peakDb: toDb(peak), rmsDb: toDb(rms) };
    }

    const overall = calcStats(0, 7.8);
    const bed     = calcStats(0.2, 2.3);
    const melody  = calcStats(2.6, 5.0);
    const sfx     = calcStats(5.5, 6.4);
    const report = {
      overallPeakDbFS: overall.peakDb,
      musicBedRmsDbFS: bed.rmsDb,
      melodyRmsDbFS:   melody.rmsDb,
      sfxPeakDbFS:     sfx.peakDb,
      melodyAboveBedDb: +(melody.rmsDb - bed.rmsDb).toFixed(2),
    };
    if (debugAudio) console.table(report);
    return report;
  }

  return {
    play,
    unlock,
    toggleMute,
    stopCreak,
    fadeOutAndSuspend,
    stopAllAndReset,
    measureMix,
  };
})();

window.bdayAudio = audio;

if (muteBtn) {
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.toggleMute();
  });
}

if (isRecord) window.bdayCues = [];
let recT0 = 0;
function cue(name, param){
  if (isRecord && recT0) window.bdayCues.push({ cue: name, t: (performance.now() - recT0) / 1000 });
  audio.play(name, param);
}

/* Helper to create the rose-to-gold gradient for canvas text */
function makeNameCanvasGradient(ctx2, x0, x1, shimmerShift = 0) {
  const g = ctx2.createLinearGradient(x0 + shimmerShift, 0, x1 + shimmerShift, 0);
  COLORS.nameGradientStops.forEach(({ offset, color }) => {
    g.addColorStop(offset, color);
  });
  return g;
}

/* ============================================================
   TREE ENGINE (Act 4) — canvas
   ============================================================ */
const BLOSSOM = [
  { c0: '#ffe1ec', c1: '#ff80aa' },
  { c0: '#ffd0e0', c1: '#f4577f' },
  { c0: '#ffc4d2', c1: '#e23b67' },
  { c0: '#ffd9c4', c1: '#ff8a5b' },
  { c0: '#ffeec2', c1: '#f6b13e' },
  { c0: '#ffd2e6', c1: '#e84d9a' },
];

const T = {
  trunkStart: 0.08,
  branchSpan: 1.55,
  bloomT0:    1.05,
  bloomSpan:  1.75,
  petalT0:    2.10,
  noteStart:  0.38,
  done:       3.35,
};

const SS = 168;

function heartShape(c, x, top, w, h){
  c.beginPath();
  c.moveTo(x, top + h * 0.30);
  c.bezierCurveTo(x,           top - h * 0.04,
                  x - w * 0.5, top - h * 0.04,
                  x - w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x - w * 0.5, top + h * 0.62, x - w * 0.16, top + h * 0.82, x, top + h);
  c.bezierCurveTo(x + w * 0.16, top + h * 0.82, x + w * 0.5, top + h * 0.62, x + w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x + w * 0.5,  top - h * 0.04, x,           top - h * 0.04, x, top + h * 0.30);
  c.closePath();
}

function makeBlossom({ c0, c1 }, soft){
  const cv = document.createElement('canvas'); cv.width = cv.height = SS;
  const c = cv.getContext('2d');
  const w = SS * 0.62, h = SS * 0.58, x = SS / 2, top = SS * 0.17;

  c.save();
  c.shadowColor = 'rgba(150,38,72,0.34)';
  c.shadowBlur = SS * 0.09; c.shadowOffsetY = SS * 0.055;
  c.fillStyle = c1; heartShape(c, x, top, w, h); c.fill();
  c.restore();

  const g = c.createRadialGradient(x - w * 0.20, top + h * 0.20, h * 0.04, x, top + h * 0.42, h * 0.92);
  g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, shade(c1, -26));
  heartShape(c, x, top, w, h); c.fillStyle = g; c.fill();

  c.save(); heartShape(c, x, top, w, h); c.clip();
  const g2 = c.createLinearGradient(0, top, 0, top + h);
  g2.addColorStop(0, 'rgba(255,255,255,0)');
  g2.addColorStop(0.65, 'rgba(110,16,46,0)');
  g2.addColorStop(1, 'rgba(110,16,46,0.26)');
  c.fillStyle = g2; c.fillRect(0, 0, SS, SS);
  c.globalAlpha = 0.55; c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(x - w * 0.15, top + h * 0.24, w * 0.17, h * 0.11, -0.5, 0, Math.PI * 2); c.fill();
  c.restore();

  if (!soft) return cv;

  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = SS;
  const c2 = cv2.getContext('2d');
  try { c2.filter = 'blur(2.6px)'; } catch (_) {}
  c2.drawImage(cv, 0, 0);
  try { c2.filter = 'none'; } catch (_) {}
  c2.globalCompositeOperation = 'source-atop';
  c2.globalAlpha = 0.42; c2.fillStyle = '#fff3ea'; c2.fillRect(0, 0, SS, SS);
  return cv2;
}

function makeBokeh(rgb){
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.45, `rgba(${rgb},0.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  return cv;
}

function makeSparkle(){
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'); const m = S / 2;
  const g = c.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,255,255,0.96)'); g.addColorStop(0.25, 'rgba(255,236,200,0.5)'); g.addColorStop(1, 'rgba(255,236,200,0)');
  c.fillStyle = g; c.beginPath(); c.arc(m, m, m, 0, 6.2832); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.96)';
  c.translate(m, m);
  for (let k = 0; k < 2; k++){
    c.beginPath();
    c.moveTo(0, -m); c.quadraticCurveTo(0, 0, m, 0); c.quadraticCurveTo(0, 0, 0, m); c.quadraticCurveTo(0, 0, -m, 0); c.quadraticCurveTo(0, 0, 0, -m);
    c.fill(); c.rotate(Math.PI / 4); c.scale(0.5, 0.5);
  }
  return cv;
}

let SPR = { crisp: [], soft: [] }, BOKEH = [], SPARKLE = null;
let spritesCached = false;
function buildSprites(){
  if (spritesCached) return;
  spritesCached = true;
  SPR = { crisp: BLOSSOM.map((b) => makeBlossom(b, false)), soft: BLOSSOM.map((b) => makeBlossom(b, true)) };
  BOKEH = [makeBokeh('255,224,188'), makeBokeh('255,196,214'), makeBokeh('255,238,210'), makeBokeh('255,210,240')];
  SPARKLE = makeSparkle();
}

function drawSprite(sprite, x, y, size, rot, alpha){
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, -size * 0.5, -size * 0.47, size, size);
  ctx.restore();
}

let heartPoly = null;
function buildHeartPoly(){
  const raw = []; let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i <= 160; i++){
    const t = (i / 160) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([x, y]);
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2, hw = (maxX - minX) / 2, hh = (maxY - minY) / 2;
  heartPoly = raw.map(([x, y]) => [(x - midX) / hw, (y - midY) / hh]);
}
function pointInPoly(x, y){
  let inside = false; const p = heartPoly;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++){
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

let W = 0, H = 0, dpr = 1;
let cx = 0, cy = 0, rx = 0, ry = 0, groundY = 0, treeBaseY = 0;
let branches = [], hearts = [], petals = [], rested = [], orbs = [], floaters = [], twinkles = [];
let bgGrad = null, glowGrad = null, groundGrad = null;

const quad = (b, t) => { const m = 1 - t, a = m * m, k = 2 * m * t, d = t * t; return { x: a * b.x1 + k * b.cx + d * b.x2, y: a * b.y1 + k * b.cy + d * b.y2 }; };

function barkGrad(x1, y1, x2, y2, depth){
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, `hsl(348 26% ${26 + depth * 3}%)`);
  g.addColorStop(1, `hsl(346 24% ${40 + depth * 5}%)`);
  return g;
}

function buildScene(){
  branches = []; hearts = []; petals = []; rested = []; twinkles = []; orbs = []; floaters = [];
  buildHeartPoly();

  const aspect = W / Math.max(1, H);
  const wide = aspect > 1.2;
  const portraitMobile = aspect < 0.82 && W <= 768;

  if (portraitMobile) {
    cx = W * 0.5;
    cy = H * 0.34;
    rx = Math.min(W * 0.43, H * 0.25 * 1.16);
    ry = rx / 1.16;
    groundY = H * 0.72;
    treeBaseY = H * 0.74;
  } else {
    cx = W * (wide ? 0.57 : 0.5);
    cy = H * (wide ? 0.37 : 0.38);
    ry = Math.min(H * 0.33, W * 0.34);
    rx = ry * 1.16;
    groundY = H * 0.93;
    treeBaseY = H * 1.0;
  }

  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#fff5ec');
  bgGrad.addColorStop(0.42, '#ffe8d6');
  bgGrad.addColorStop(0.76, '#fcdac4');
  bgGrad.addColorStop(1, '#f3c4b5');
  glowGrad = ctx.createRadialGradient(cx, cy, ry * 0.1, cx, cy, ry * 1.6);
  glowGrad.addColorStop(0, 'rgba(255,225,172,0.68)');
  glowGrad.addColorStop(0.48, 'rgba(255,175,155,0.24)');
  glowGrad.addColorStop(1, 'rgba(255,175,155,0)');
  groundGrad = ctx.createRadialGradient(cx, treeBaseY, ry * 0.15, cx, treeBaseY, ry * 1.6);
  groundGrad.addColorStop(0, 'rgba(255,210,168,0.58)');
  groundGrad.addColorStop(1, 'rgba(255,210,168,0)');

  for (let i = 0; i < 13; i++){
    orbs.push({ x: rand(0, W), y: rand(0, H), r: rand(W * 0.05, W * 0.18), vy: rand(-6, -18), drift: rand(-0.3, 0.3), phase: rand(0, 6.28), alpha: rand(0.05, 0.14), sprite: pick(BOKEH) });
  }

  const FN = wide ? 20 : 16;
  for (let i = 0; i < FN; i++){
    const depth = Math.random();
    floaters.push({
      x: rand(0, W), y: rand(-H * 0.1, H * 1.1), depth,
      idx: (Math.random() * BLOSSOM.length) | 0,
      box: lerp(Math.min(W, H) * 0.025, Math.min(W, H) * 0.072, depth),
      vy: lerp(7, 20, depth), sway: rand(8, 22), phase: rand(0, 6.28),
      rot: rand(-0.4, 0.4), vrot: rand(-0.5, 0.5),
      baseA: lerp(0.16, 0.52, depth), soft: depth < 0.45,
    });
  }

  const baseX = cx, baseY = treeBaseY;
  const trunkTopY = cy + ry * 0.62;
  const trunkW = Math.max(9, Math.min(W, H) * 0.026);
  const limbLen = ry * 0.6;
  const insidePx = (x, y, m = 0.9) => pointInPoly((x - cx) / (rx * m), (cy - y) / (ry * m));

  function addBranch(x, y, ang, len, w0, depth, t0){
    let ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, clipped = false;
    if (!insidePx(ex, ey)){
      let lo = 0, hi = 1;
      for (let k = 0; k < 12; k++){ const mid = (lo + hi) / 2; (insidePx(x + Math.cos(ang) * len * mid, y + Math.sin(ang) * len * mid) ? lo = mid : hi = mid); }
      ex = x + Math.cos(ang) * len * lo; ey = y + Math.sin(ang) * len * lo; clipped = true;
    }
    const mx = (x + ex) / 2, my = (y + ey) / 2, perp = ang + Math.PI / 2, bend = rand(-1, 1) * len * 0.12, w1 = w0 * 0.66;
    branches.push({ x1: x, y1: y, cx: mx + Math.cos(perp) * bend, cy: my + Math.sin(perp) * bend, x2: ex, y2: ey, w0, w1, t0, dur: Math.max(0.14, 0.32 - depth * 0.03), depth, grad: barkGrad(x, y, ex, ey, depth) });
    return { ex, ey, w1, clipped };
  }
  function grow(x, y, ang, len, w, depth, t0){
    const r = addBranch(x, y, ang, len, w, depth, t0);
    if (r.clipped || depth >= 6 || len < ry * 0.06) return;
    const childT0 = t0 + (0.32 - depth * 0.03) * 0.6;
    const n = Math.random() < 0.55 ? 2 : 3;
    for (let i = 0; i < n; i++){
      const spread = 0.6 * (i - (n - 1) / 2) + rand(-0.22, 0.22), lift = -0.06 + rand(-0.05, 0.05);
      grow(r.ex, r.ey, ang + spread + lift, len * rand(0.74, 0.84), r.w1, depth + 1, childT0 + i * 0.03);
    }
  }
  addBranch(baseX, baseY, -Math.PI / 2, baseY - trunkTopY, trunkW, 0, T.trunkStart);
  branches[0].dur = 0.50;
  const limbT0 = T.trunkStart + 0.32, L = 3;
  for (let i = 0; i < L; i++){
    const ang = -Math.PI / 2 + 0.62 * (i - (L - 1) / 2) + rand(-0.12, 0.12);
    grow(baseX, trunkTopY, ang, limbLen, trunkW * 0.7, 1, limbT0 + i * 0.05);
  }
  const maxT0 = branches.reduce((m, b) => Math.max(m, b.t0 + b.dur), 0);
  const sc = (T.branchSpan - T.trunkStart) / (maxT0 - T.trunkStart);
  for (const b of branches) b.t0 = T.trunkStart + (b.t0 - T.trunkStart) * sc;

  const COUNT = Math.round(clamp(rx * ry / 54, 260, 460) * MOBILE.blossomScale);
  const baseBox = clamp(Math.min(W, H) * 0.115, 28, 74);
  let guard = 0;
  while (hearts.length < COUNT && guard < COUNT * 50){
    guard++;
    const u = rand(-1.06, 1.06), v = rand(-1.06, 1.06);
    if (!pointInPoly(u, v)) continue;
    const x = cx + u * rx, y = cy - v * ry;
    const d = clamp01(Math.hypot(u, v + 1) / 2.4);
    const t0 = T.bloomT0 + d * (T.bloomSpan * 0.82) + rand(0, T.bloomSpan * 0.18);
    const soft = Math.random() < 0.42;
    hearts.push({ x, y, idx: (Math.random() * BLOSSOM.length) | 0, soft, box: baseBox * (soft ? rand(0.6, 0.85) : rand(0.78, 1.12)), rot: rand(-0.55, 0.55), sway: rand(0, 6.28), t0 });
  }
  hearts.sort((a, b) => (a.soft === b.soft ? a.y - b.y : a.soft ? -1 : 1));
}

function drawBackground(){
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1; ctx.fillStyle = groundGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.save();
  const carpetGrad = ctx.createLinearGradient(0, groundY - 18, 0, H);
  carpetGrad.addColorStop(0, 'rgba(255,205,185,0)');
  carpetGrad.addColorStop(0.35, 'rgba(255,200,180,0.28)');
  carpetGrad.addColorStop(1, 'rgba(248,185,168,0.45)');
  ctx.fillStyle = carpetGrad;
  ctx.beginPath();
  ctx.ellipse(cx, H + (H - groundY) * 0.25, W * 0.85, (H - groundY) * 1.35 + 24, 0, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawGodRays(t, intensity){
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ox = cx, oy = cy - ry * 0.35, R = Math.hypot(W, H) * 1.1;
  const rays = 11, sweep = Math.sin(t * 0.07) * 0.18;
  for (let i = 0; i < rays; i++){
    const a = -Math.PI / 2 + sweep + (i - (rays - 1) / 2) * 0.19;
    const hw = 0.036 + 0.022 * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.7));
    const a1 = a - hw, a2 = a + hw;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * R, oy + Math.sin(a) * R);
    g.addColorStop(0, `rgba(255,232,190,${0.16 * intensity})`);
    g.addColorStop(0.5, `rgba(255,214,170,${0.07 * intensity})`);
    g.addColorStop(1, 'rgba(255,214,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a1) * R, oy + Math.sin(a1) * R);
    ctx.lineTo(ox + Math.cos(a2) * R, oy + Math.sin(a2) * R);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGlow(t){
  const gi = clamp01((t - T.bloomT0) / (T.bloomSpan * 0.9));
  if (gi <= 0) return;
  ctx.save(); ctx.globalAlpha = gi; ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawBokeh(t, dt){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const o of orbs){
    o.y += o.vy * dt; o.x += Math.sin(t * 0.3 + o.phase) * o.drift;
    if (o.y < -o.r){ o.y = H + o.r; o.x = rand(0, W); }
    ctx.globalAlpha = o.alpha;
    ctx.drawImage(o.sprite, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
  }
  ctx.restore();
}

function drawFloaters(t, dt, front){
  const appear = clamp01((t - 0.2) / 1.4);
  if (appear <= 0) return;
  for (const f of floaters){
    if ((f.depth >= 0.6) !== front) continue;
    f.y -= f.vy * dt;
    f.x += Math.sin(t * 0.5 + f.phase) * f.sway * dt;
    f.rot += f.vrot * dt;
    if (f.y < -f.box){ f.y = H + f.box; f.x = rand(0, W); }
    drawSprite((f.soft ? SPR.soft : SPR.crisp)[f.idx], f.x, f.y, f.box, f.rot, f.baseA * appear);
  }
}

function drawBranches(t){
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of branches){
    const f = clamp01((t - b.t0) / b.dur);
    if (f <= 0) continue;
    const e = easeOutCubic(f);
    ctx.strokeStyle = b.grad;
    const steps = 12, last = Math.max(1, Math.ceil(steps * e));
    let prev = quad(b, 0);
    for (let i = 1; i <= last; i++){
      const tt = Math.min(e, i / steps), p = quad(b, tt);
      ctx.lineWidth = lerp(b.w0, b.w1, tt);
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      prev = p;
    }
  }
}

function drawHearts(t){
  const breathe = 1 + Math.sin(t * 0.8) * 0.012;
  for (const h of hearts){
    const p = clamp01((t - h.t0) / 0.55);
    if (p <= 0) continue;
    const scale = Math.max(0, easeOutBack(p));
    let alpha = clamp01(p * 1.7); if (h.soft) alpha *= 0.8;
    const settled = clamp01((t - h.t0 - 0.55) / 0.65);
    const sway = settled * Math.sin(t * 1.5 + h.sway) * (h.box * 0.05);
    const rise = (1 - easeOutCubic(p)) * h.box * 0.45;
    const hx = cx + (h.x - cx) * breathe + sway;
    const hy = cy + (h.y - cy) * breathe - rise;
    drawSprite((h.soft ? SPR.soft : SPR.crisp)[h.idx], hx, hy, h.box * scale, h.rot + sway * 0.012, alpha);
  }
}

function updateTwinkles(t, dt){
  const active = t > T.bloomT0 + T.bloomSpan * 0.35;
  if (active && twinkles.length < 16 && Math.random() < 0.55){
    const h = hearts[(Math.random() * hearts.length) | 0];
    if (h) twinkles.push({ x: h.x, y: h.y, size: rand(0.6, 1.4) * (Math.min(W, H) * 0.05), age: 0, life: rand(0.7, 1.3), rot: rand(0, 6.28) });
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = twinkles.length - 1; i >= 0; i--){
    const s = twinkles[i]; s.age += dt;
    const k = s.age / s.life;
    if (k >= 1){ twinkles.splice(i, 1); continue; }
    const a = Math.sin(k * Math.PI);
    drawSprite(SPARKLE, s.x, s.y, s.size * (0.6 + 0.4 * a), s.rot + k * 1.2, a);
  }
  ctx.restore();
}

function spawnPetal(){
  const h = hearts[(Math.random() * hearts.length) | 0];
  if (!h) return;
  petals.push({ x: h.x + rand(-8, 8), y: h.y + rand(-8, 8), vy: rand(14, 30), vx: rand(-8, 8), sway: rand(0.6, 1.4), phase: rand(0, 6.28), box: h.box * rand(0.34, 0.6), idx: h.idx, rot: rand(0, 6.28), vrot: rand(-1.4, 1.4), age: 0, land: groundY + rand(-8, H * 0.03) });
}
function drawPetals(t, dt){
  for (let i = petals.length - 1; i >= 0; i--){
    const p = petals[i]; p.age += dt; p.vy += 8 * dt;
    p.x += (p.vx + Math.sin(t * p.sway + p.phase) * 16) * dt;
    p.y += p.vy * dt; p.rot += p.vrot * dt;
    if (p.y >= p.land){
      rested.push({ x: clamp(p.x, 6, W - 6), y: p.land, box: p.box, idx: p.idx, rot: p.rot, a: rand(0.7, 0.95) });
      if (rested.length > 100) rested.shift();
      petals.splice(i, 1); continue;
    }
    const a = p.age < 0.3 ? p.age / 0.3 : 1;
    drawSprite(SPR.crisp[p.idx], p.x, p.y, p.box, p.rot, a);
  }
}
function drawRested(){
  for (const r of rested) drawSprite(SPR.crisp[r.idx], r.x, r.y, r.box, r.rot, r.a);
}

/* Once the cake appears the Act 4 wish text must stay gone (it used to ghost
   through behind the cake, the gift card and the final frame). */
let wishRetired = false;
function showWish(on){
  if (wishRetired) return;
  wishEl.classList.toggle('is-in', on);
}
function retireWish(){
  if (wishRetired) return;
  wishRetired = true;
  gsap.killTweensOf(wishEl);
  gsap.to(wishEl, {
    opacity: 0, duration: reduceMotion ? 0.01 : 0.8, ease: 'power1.out',
    onComplete(){ wishEl.style.visibility = 'hidden'; wishEl.classList.remove('is-in'); },
  });
}
function restoreWish(){
  wishRetired = false;
  gsap.killTweensOf(wishEl);
  wishEl.style.opacity = '';
  wishEl.style.visibility = '';
  wishEl.style.transition = '';
}

/* ============================================================
   FEATURE 4 — SHOOTING STARS
   ============================================================ */
let shootingStars = [];
function spawnShootingStar(){
  const spd  = rand(W * 0.7, W * 1.4);
  const ang  = rand(-0.12, 0.22);
  const tailLen = rand(W * 0.09, W * 0.22);
  shootingStars.push({
    x: rand(-W * 0.1, W * 0.3), y: rand(H * 0.03, H * 0.30),
    vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    tailLen, age: 0, life: tailLen / spd + rand(0.08, 0.18),
    alpha: rand(0.80, 1.0), width: rand(1.5, 2.8),
  });
}
function drawShootingStars(dt){
  for (let i = shootingStars.length - 1; i >= 0; i--){
    const s = shootingStars[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.age += dt;
    if (s.x > W * 1.1 || s.age >= s.life){ shootingStars.splice(i, 1); continue; }
    const prog  = clamp01(s.age / s.life);
    const alpha = s.alpha * Math.sin(prog * Math.PI);
    const spd   = Math.hypot(s.vx, s.vy);
    const tailX = s.x - (s.vx / spd) * s.tailLen;
    const tailY = s.y - (s.vy / spd) * s.tailLen;
    const g = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.6, `rgba(255,248,220,${alpha * 0.5})`);
    g.addColorStop(1, `rgba(255,255,255,${alpha})`);
    ctx.save();
    ctx.strokeStyle = g;
    ctx.lineWidth   = s.width;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();
    const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 9);
    hg.addColorStop(0, `rgba(255,255,255,${alpha})`);
    hg.addColorStop(0.5, `rgba(255,245,200,${alpha * 0.4})`);
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
}

/* ============================================================
   FEATURE 5 — FIREWORKS
   ============================================================ */
let fireworks = [];
function spawnFirework(targetW = W, targetH = H){
  if (stillEnded) return;
  const palettes = [
    ['#ff90b0','#ff3070'], ['#ffe38c','#ffaa00'],
    ['#90e0ff','#0099ff'], ['#d4b0ff','#8844ff'],
    ['#ffb0c8','#ff4488'], ['#a0ffb0','#00cc44'],
    ['#ffffff','#ffe8c0'], ['#ffcc80','#ff6600'],
    ['#ff99cc','#cc0066'], ['#ccff99','#44aa00'],
  ];
  const [c0, c1] = pick(palettes);
  const rgb0 = hexToRgb(c0), rgb1 = hexToRgb(c1);
  const x = rand(targetW * 0.12, targetW * 0.88);
  const y = rand(targetH * 0.06, targetH * 0.34);
  const count = Math.round(rand(22, 34));
  const particles = [];
  const burstSpd = rand(Math.min(targetW, targetH) * 0.09, Math.min(targetW, targetH) * 0.20);
  for (let i = 0; i < count; i++){
    const ang = (i / count) * Math.PI * 2 + rand(-0.15, 0.15);
    const spd = burstSpd * rand(0.6, 1.3);
    particles.push({
      x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      rgb0, rgb1, age: 0, life: rand(0.8, 1.55),
      size: rand(2.8, 6.0), trail: [],
    });
  }
  fireworks.push({ x, y, particles, age: 0, life: 1.75, rgb0, rgb1 });
  cue('firework');
}
function hexToRgb(hex){ const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

function drawFireworksOn(targetCtx, dt, targetW = W){
  for (let fi = fireworks.length - 1; fi >= 0; fi--){
    const fw = fireworks[fi]; fw.age += dt;
    if (fw.age >= fw.life){ fireworks.splice(fi, 1); continue; }
    if (fw.age < 0.12){
      const fa = clamp01(1 - fw.age / 0.12);
      const [r0, g0, b0] = fw.rgb0;
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'lighter';
      const rRad = fw.age * targetW * 0.12 + 16;
      const ring = targetCtx.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, rRad);
      ring.addColorStop(0, `rgba(${r0},${g0},${b0},${fa * 0.8})`);
      ring.addColorStop(1, 'rgba(255,255,255,0)');
      targetCtx.fillStyle = ring;
      targetCtx.beginPath(); targetCtx.arc(fw.x, fw.y, rRad, 0, 6.2832); targetCtx.fill();
      targetCtx.restore();
    }
    for (let i = fw.particles.length - 1; i >= 0; i--){
      const p = fw.particles[i]; p.age += dt;
      if (p.age >= p.life){ fw.particles.splice(i, 1); continue; }
      const prog  = p.age / p.life;
      const alpha = Math.pow(1 - prog, 1.4);
      p.vx *= (1 - 2.2 * dt);
      p.vy  = p.vy * (1 - 2.2 * dt) + 80 * dt;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.shift();
      p.x += p.vx * dt; p.y += p.vy * dt;
      const [r0, g0, b0] = p.rgb0;
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'lighter';
      const tx = p.trail[0]?.x ?? p.x, ty = p.trail[0]?.y ?? p.y;
      const tg = targetCtx.createLinearGradient(tx, ty, p.x, p.y);
      tg.addColorStop(0, 'rgba(255,255,255,0)');
      tg.addColorStop(1, `rgba(${r0},${g0},${b0},${alpha})`);
      targetCtx.strokeStyle = tg;
      targetCtx.lineWidth = p.size * (1 - prog * 0.55) + 0.5;
      targetCtx.lineCap = 'round';
      targetCtx.beginPath(); targetCtx.moveTo(tx, ty); targetCtx.lineTo(p.x, p.y); targetCtx.stroke();
      const sg = targetCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.2);
      sg.addColorStop(0, `rgba(255,255,255,${alpha * 0.95})`);
      sg.addColorStop(0.35, `rgba(${p.rgb1[0]},${p.rgb1[1]},${p.rgb1[2]},${alpha * 0.8})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      targetCtx.fillStyle = sg;
      targetCtx.beginPath(); targetCtx.arc(p.x, p.y, p.size * (1 - prog * 0.45), 0, 6.2832); targetCtx.fill();
      targetCtx.restore();
    }
  }
}

/* ============================================================
   ACT 5 — BIRTHDAY CAKE (lantern removed per Part A4)
   ============================================================ */
let cakeRAF = 0, cakeStartT = 0, cakeShown = false;
let candlesLit = true, smokeParticles = [], cakeSparkles = [], skyStars = [];
let cakeState = { msgAlpha: 0, blowTime: 0, cakeFade: 1 };
let cakeLastT = 0, cakeCurrentT = 0;
let candleWaxOffsets = [];
let cachedFontKey = '', cachedTierFont = 20, cachedMsgFont = 34;

const CANDLE_COLS = [
  ['#ff90b0','#ffcce8'],
  ['#ffe38c','#fffbe0'],
  ['#b0d4ff','#e0f0ff'],
  ['#c4b0ff','#ece0ff'],
  ['#b0f0c8','#e0ffe8'],
];

function buildSkyStars(cW, cH) {
  skyStars = [];
  const count = 32;
  for (let i = 0; i < count; i++) {
    skyStars.push({
      x: rand(cW * 0.05, cW * 0.95),
      y: rand(cH * 0.04, cH * 0.48),
      r: rand(1.1, 2.4),
      phase: rand(0, 6.28),
      speed: rand(1.5, 3.2),
    });
  }
}

function drawSkyStars(cakeCtx2, t, starAlpha = 0.65, staticMode = false) {
  if (starAlpha <= 0) return;
  cakeCtx2.save();
  for (const st of skyStars) {
    const twk = staticMode ? 0.85 : (0.45 + 0.55 * Math.sin(t * st.speed + st.phase));
    const a = starAlpha * twk;
    const g = cakeCtx2.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r * 4.2);
    g.addColorStop(0, `rgba(255,250,230,${a})`);
    g.addColorStop(0.4, `rgba(255,205,115,${a * 0.55})`);
    g.addColorStop(1, 'rgba(255,180,90,0)');
    cakeCtx2.fillStyle = g;
    cakeCtx2.beginPath();
    cakeCtx2.arc(st.x, st.y, st.r * 4.2, 0, Math.PI * 2);
    cakeCtx2.fill();

    cakeCtx2.fillStyle = `rgba(255,255,255,${Math.min(1, a * 1.15)})`;
    cakeCtx2.beginPath();
    cakeCtx2.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    cakeCtx2.fill();
  }
  cakeCtx2.restore();
}

/* confetti system (ellipses, ribbons, and mini-hearts) */
let confettiPieces = [];
const CONFETTI_COLS = ['#ff4d88','#ffaa00','#44ccff','#aa44ff','#44ee88','#ffcc44','#ff88cc','#44ffdd'];
function spawnConfetti(cW, cH){
  confettiPieces = [];
  const count = Math.min(MOBILE.confettiCap, Math.max(65, Math.round((cW * cH) / 4200)));
  for (let i = 0; i < count; i++){
    confettiPieces.push({
      x: rand(0, cW),
      y: rand(-cH * 0.25, -10),
      vx: rand(-65, 65),
      vy: rand(75, 210),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-3.2, 3.2),
      w: rand(6, 13), h: rand(4, 8),
      shape: i % 5 === 0 ? 'heart' : i % 3 === 0 ? 'ribbon' : 'oval',
      col: pick(CONFETTI_COLS),
      age: 0,
      life: rand(3.6, 6.6),
      sway: rand(20, 55),
      phase: rand(0, 6.28),
    });
  }
}

function drawConfetti(cakeCtx2, dt, t, cW, cH){
  for (let i = confettiPieces.length - 1; i >= 0; i--){
    const p = confettiPieces[i];
    p.age += dt;
    if (p.age >= p.life){ confettiPieces.splice(i, 1); continue; }
    p.x += (p.vx + Math.sin(t * p.sway * 0.1 + p.phase) * 30) * dt;
    p.y += p.vy * dt;
    p.rot += p.vrot * dt;
    p.vy *= 1 + 0.02 * dt;
    if (p.y > cH + 20){ confettiPieces.splice(i, 1); continue; }
    const alpha = p.age < 0.3 ? p.age / 0.3 : Math.max(0, 1 - (p.age - p.life * 0.7) / (p.life * 0.3));
    cakeCtx2.save();
    cakeCtx2.globalAlpha = alpha * 0.92;
    cakeCtx2.translate(p.x, p.y);
    cakeCtx2.rotate(p.rot);
    cakeCtx2.fillStyle = p.col;
    if (p.shape === 'heart') {
      const hs = p.w * 0.45;
      cakeCtx2.beginPath();
      cakeCtx2.moveTo(0, hs * 0.3);
      cakeCtx2.bezierCurveTo(-hs, -hs * 0.4, -hs * 1.4, hs * 0.3, 0, hs * 1.2);
      cakeCtx2.bezierCurveTo(hs * 1.4, hs * 0.3, hs, -hs * 0.4, 0, hs * 0.3);
      cakeCtx2.fill();
    } else if (p.shape === 'ribbon') {
      cakeCtx2.fillRect(-p.w * 0.5, -p.h * 0.28, p.w, p.h * 0.56);
    } else {
      cakeCtx2.beginPath();
      cakeCtx2.ellipse(0, 0, p.w * 0.5, p.h * 0.5, 0, 0, Math.PI * 2);
      cakeCtx2.fill();
    }
    cakeCtx2.restore();
  }
}

function getCakeMetrics(cW, cH){
  const isShort = cH < 520;
  const isNarrow = cW < 520;
  const baseY = isShort ? cH * 0.80 : isNarrow ? cH * 0.75 : cH * 0.77;
  const maxWByWidth  = isNarrow ? cW * 0.78 : cW * 0.56;
  const maxWByHeight = (baseY - Math.max(68, cH * 0.18)) / 0.96;
  const cakeW = clamp(Math.min(maxWByWidth, maxWByHeight, 360), 175, 360);

  const tier1H = cakeW * 0.28, tier2H = cakeW * 0.22, tier3H = cakeW * 0.18;
  const tier1W = cakeW,        tier2W = cakeW * 0.75, tier3W = cakeW * 0.50;
  const candleW = tier3W * 0.074, candleH = tier3W * 0.28;
  const CX = cW / 2;
  const t1x = CX - tier1W / 2, t1y = baseY - tier1H;
  const t2x = CX - tier2W / 2, t2y = t1y - tier2H;
  const t3x = CX - tier3W / 2, t3y = t2y - tier3H;

  const fKey = `${Math.round(cW)}_${Math.round(cH)}_${Math.round(cakeW)}_${RECIPIENT_NAME}`;
  if (fKey !== cachedFontKey) {
    cachedFontKey = fKey;
    const tier1Text = `Happy Birthday ${RECIPIENT_NAME}`;
    let txtSz = Math.round(cakeW * 0.095);
    cakeCtx.font = `italic bold ${txtSz}px "Great Vibes",cursive`;
    while (cakeCtx.measureText(tier1Text).width > tier1W * 0.88 && txtSz > 11) {
      txtSz -= 1;
      cakeCtx.font = `italic bold ${txtSz}px "Great Vibes",cursive`;
    }
    cachedTierFont = txtSz;

    const line2Text = `of happiness, ${RECIPIENT_NAME} ♥`;
    const maxMsgW = Math.min(cW * 0.90, Math.max(cakeW * 1.24, cW * 0.78));
    let msgSize = Math.round(clamp(cakeW * 0.155, 24, 52));
    cakeCtx.font = `italic bold ${msgSize}px "Great Vibes",cursive`;
    while ((cakeCtx.measureText(TEXTS.cakeFinalLine1).width > maxMsgW ||
            cakeCtx.measureText(line2Text).width > maxMsgW) && msgSize > 15) {
      msgSize -= 1;
      cakeCtx.font = `italic bold ${msgSize}px "Great Vibes",cursive`;
    }
    cachedMsgFont = msgSize;
  }

  return {
    CX, baseY, cakeW,
    tier1H, tier2H, tier3H,
    tier1W, tier2W, tier3W,
    t1x, t1y, t2x, t2y, t3x, t3y,
    candleW, candleH,
  };
}

function resizeCakeCanvas(){
  const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
  const cw = cakeCanvas.clientWidth || W || window.innerWidth;
  const ch = cakeCanvas.clientHeight || H || window.innerHeight;
  cakeCanvas.width  = Math.round(cw * dpr2);
  cakeCanvas.height = Math.round(ch * dpr2);
  if (sparkleCanvas) {
    sparkleCanvas.width  = Math.round(cw * dpr2);
    sparkleCanvas.height = Math.round(ch * dpr2);
  }
}

/* Render a clean, still sky frame on cakeCanvas for the final settled star state */
function drawStillSkyFrame() {
  const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
  const cW   = cakeCanvas.width  / dpr2;
  const cH   = cakeCanvas.height / dpr2;
  cakeCtx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
  cakeCtx.clearRect(0, 0, cW, cH);

  const backdrop = cakeCtx.createRadialGradient(cW * 0.5, cH * 0.34, 0, cW * 0.5, cH * 0.45, Math.max(cW, cH) * 0.78);
  backdrop.addColorStop(0, 'rgba(255,252,246,0.98)');
  backdrop.addColorStop(0.55, 'rgba(255,244,232,0.97)');
  backdrop.addColorStop(1, 'rgba(245,216,204,0.96)');
  cakeCtx.fillStyle = backdrop;
  cakeCtx.fillRect(0, 0, cW, cH);

  drawSkyStars(cakeCtx, 0, 0.78, true);
}

function drawCake(now){
  if (stillEnded) return;
  if (!cakeStartT){ cakeStartT = now; cakeLastT = now; }
  const realDt = Math.min(0.05, (now - cakeLastT) / 1000);
  cakeLastT = now;
  const t = (now - cakeStartT) / 1000;
  cakeCurrentT = t;

  const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
  const cW   = cakeCanvas.width  / dpr2;
  const cH   = cakeCanvas.height / dpr2;
  cakeCtx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
  cakeCtx.clearRect(0, 0, cW, cH);

  const m = getCakeMetrics(cW, cH);
  const { CX, baseY, cakeW, tier1H, tier2H, tier3H, tier1W, tier2W, tier3W, t1x, t1y, t2x, t2y, t3x, t3y, candleW, candleH } = m;

  const backdrop = cakeCtx.createRadialGradient(CX, baseY * 0.58, 0, CX, baseY * 0.58, Math.max(cW, cH) * 0.72);
  backdrop.addColorStop(0, 'rgba(255,252,246,0.98)');
  backdrop.addColorStop(0.58, 'rgba(255,246,235,0.96)');
  backdrop.addColorStop(1, 'rgba(247,221,210,0.94)');
  cakeCtx.fillStyle = backdrop;
  cakeCtx.fillRect(0, 0, cW, cH);

  drawSkyStars(cakeCtx, t, candlesLit ? 0.25 : 0.68, false);

  cakeCtx.save();
  cakeCtx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < orbs.length; i++){
    const o = orbs[i];
    const oy = (o.y - t * 10 * (0.5 + (i % 3) * 0.25)) % (cH + o.r * 2);
    const drawY = oy < -o.r ? oy + cH + o.r * 2 : oy;
    const drawX = o.x + Math.sin(t * 0.35 + o.phase) * 12;
    cakeCtx.globalAlpha = o.alpha * 0.85 * cakeState.cakeFade;
    cakeCtx.drawImage(o.sprite, drawX - o.r, drawY - o.r, o.r * 2, o.r * 2);
  }
  cakeCtx.restore();

  if (!candlesLit && cakeState.cakeFade > 0.5 && Math.random() < realDt * 0.40) {
    spawnFirework(cW, cH);
  }
  if (fireworks.length > 0) {
    drawFireworksOn(cakeCtx, realDt, cW);
  }

  /* Fade out cake tiers when the Hero Wish Star takes over the sky */
  if (cakeState.cakeFade > 0.01) {
    cakeCtx.save();
    cakeCtx.globalAlpha = cakeState.cakeFade;

    /* BASE PLATE */
    const platW = tier1W * 0.62;
    const shadowGrad = cakeCtx.createRadialGradient(CX, baseY + 12, platW * 0.1, CX, baseY + 12, platW * 0.95);
    shadowGrad.addColorStop(0, 'rgba(102,30,55,0.22)');
    shadowGrad.addColorStop(0.55, 'rgba(102,30,55,0.09)');
    shadowGrad.addColorStop(1, 'rgba(102,30,55,0)');
    cakeCtx.save();
    cakeCtx.translate(CX, baseY + 12);
    cakeCtx.scale(1, 0.24);
    cakeCtx.fillStyle = shadowGrad;
    cakeCtx.beginPath(); cakeCtx.arc(0, 0, platW * 0.95, 0, Math.PI * 2); cakeCtx.fill();
    cakeCtx.restore();

    cakeCtx.fillStyle = 'rgba(238,208,188,0.92)';
    cakeCtx.beginPath(); cakeCtx.ellipse(CX, baseY + 7, platW * 0.58, 12, 0, 0, Math.PI * 2); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(255,255,255,0.45)';
    cakeCtx.beginPath(); cakeCtx.ellipse(CX, baseY + 4, platW * 0.40, 5, 0, 0, Math.PI * 2); cakeCtx.fill();

    /* TIER 1 */
    const gt1 = cakeCtx.createLinearGradient(t1x, t1y, t1x + tier1W, t1y);
    gt1.addColorStop(0, '#ffaacb'); gt1.addColorStop(0.5, '#ffe0ee'); gt1.addColorStop(1, '#ffaacb');
    cakeCtx.fillStyle = gt1;
    cakeCtx.beginPath(); cakeCtx.roundRect(t1x, t1y, tier1W, tier1H + 4, 12); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(175,55,95,0.11)';
    cakeCtx.beginPath(); cakeCtx.roundRect(t1x, t1y + tier1H * 0.58, tier1W, tier1H * 0.42 + 4, [0, 0, 12, 12]); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(255,255,255,0.93)';
    for (let d = 0; d < 10; d++){
      const dx = t1x + tier1W * 0.052 + d * (tier1W * 0.096);
      const dh = 9 + Math.sin(t * 0.62 + d * 1.05) * 4;
      cakeCtx.beginPath(); cakeCtx.ellipse(dx, t1y + dh, 6.2, dh, 0, 0, Math.PI * 2); cakeCtx.fill();
    }
    cakeCtx.fillStyle = 'rgba(255,160,200,0.40)';
    cakeCtx.beginPath(); cakeCtx.roundRect(t1x, t1y + tier1H * 0.44, tier1W, tier1H * 0.12, 2); cakeCtx.fill();
    const dotCols = ['#ff4488','#ffaa00','#44aaff','#aa44ff','#ff4488'];
    for (let d = 0; d < 14; d++){
      const dotX = t1x + tier1W * 0.050 + d * (tier1W * 0.069);
      const dotY = t1y + tier1H * 0.66;
      const pulseSz = Math.max(3.2, cakeW * 0.014) + Math.sin(t * 2 + d) * 0.7;
      cakeCtx.fillStyle = dotCols[d % 5];
      cakeCtx.beginPath(); cakeCtx.arc(dotX, dotY, pulseSz, 0, Math.PI * 2); cakeCtx.fill();
      cakeCtx.save(); cakeCtx.globalCompositeOperation = 'lighter';
      const dg = cakeCtx.createRadialGradient(dotX, dotY, 0, dotX, dotY, pulseSz * 2.4);
      dg.addColorStop(0, `${dotCols[d % 5]}88`); dg.addColorStop(1, 'rgba(255,255,255,0)');
      cakeCtx.fillStyle = dg;
      cakeCtx.beginPath(); cakeCtx.arc(dotX, dotY, pulseSz * 2.4, 0, Math.PI * 2); cakeCtx.fill();
      cakeCtx.restore();
    }

    cakeCtx.save();
    cakeCtx.font = `italic bold ${cachedTierFont}px "Great Vibes",cursive`;
    cakeCtx.textAlign = 'center';
    const shimmerShift1 = Math.sin(t * 1.5) * (cakeW * 0.12);
    const tg = makeNameCanvasGradient(cakeCtx, CX - cakeW * 0.38, CX + cakeW * 0.38, shimmerShift1);
    cakeCtx.shadowColor = 'rgba(255,255,255,0.96)';
    cakeCtx.shadowBlur = 10;
    cakeCtx.fillStyle = tg;
    cakeCtx.fillText(`Happy Birthday ${RECIPIENT_NAME}`, CX, t1y + tier1H * 0.37);
    /* fine deep-rose outline so the script stays readable on the pink tier */
    cakeCtx.shadowBlur = 0;
    cakeCtx.lineJoin = 'round';
    cakeCtx.lineWidth = Math.max(0.8, cachedTierFont * 0.02);
    cakeCtx.strokeStyle = 'rgba(120,12,48,0.5)';
    cakeCtx.strokeText(`Happy Birthday ${RECIPIENT_NAME}`, CX, t1y + tier1H * 0.37);
    cakeCtx.restore();

    /* TIER 2 */
    const gt2 = cakeCtx.createLinearGradient(t2x, t2y, t2x + tier2W, t2y);
    gt2.addColorStop(0, '#ffcce0'); gt2.addColorStop(0.5, '#fff6fb'); gt2.addColorStop(1, '#ffcce0');
    cakeCtx.fillStyle = gt2;
    cakeCtx.beginPath(); cakeCtx.roundRect(t2x, t2y, tier2W, tier2H + 4, 10); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(175,55,95,0.09)';
    cakeCtx.beginPath(); cakeCtx.roundRect(t2x, t2y + tier2H * 0.60, tier2W, tier2H * 0.40 + 4, [0, 0, 10, 10]); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(255,255,255,0.93)';
    for (let d = 0; d < 7; d++){
      const dx = t2x + tier2W * 0.08 + d * (tier2W * 0.14);
      const dh = 7 + Math.sin(t * 0.78 + d * 1.38) * 3;
      cakeCtx.beginPath(); cakeCtx.ellipse(dx, t2y + dh, 5.2, dh, 0, 0, Math.PI * 2); cakeCtx.fill();
    }
    cakeCtx.fillStyle = 'rgba(255,180,220,0.35)';
    cakeCtx.beginPath(); cakeCtx.roundRect(t2x, t2y + tier2H * 0.46, tier2W, tier2H * 0.12, 2); cakeCtx.fill();
    for (let d = 0; d < 4; d++){
      const hx = t2x + tier2W * 0.14 + d * (tier2W * 0.24);
      const hy = t2y + tier2H * 0.68;
      const hs = Math.max(5.5, cakeW * 0.022) + Math.sin(t * 1.5 + d) * 1.0;
      cakeCtx.fillStyle = 'rgba(255,100,150,0.72)';
      cakeCtx.save(); cakeCtx.translate(hx, hy); cakeCtx.scale(hs / 20, hs / 20);
      cakeCtx.beginPath();
      cakeCtx.moveTo(0, 5); cakeCtx.bezierCurveTo(-10, -5, -18, 2, -10, 10); cakeCtx.bezierCurveTo(-4, 16, 0, 18, 0, 20);
      cakeCtx.bezierCurveTo(0, 18, 4, 16, 10, 10); cakeCtx.bezierCurveTo(18, 2, 10, -5, 0, 5);
      cakeCtx.fill(); cakeCtx.restore();
    }

    /* TIER 3 */
    const gt3 = cakeCtx.createLinearGradient(t3x, t3y, t3x + tier3W, t3y);
    gt3.addColorStop(0, '#ffe0ee'); gt3.addColorStop(0.5, '#ffffff'); gt3.addColorStop(1, '#ffe0ee');
    cakeCtx.fillStyle = gt3;
    cakeCtx.beginPath(); cakeCtx.roundRect(t3x, t3y, tier3W, tier3H + 4, 8); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(175,55,95,0.07)';
    cakeCtx.beginPath(); cakeCtx.roundRect(t3x, t3y + tier3H * 0.62, tier3W, tier3H * 0.38 + 4, [0, 0, 8, 8]); cakeCtx.fill();
    cakeCtx.fillStyle = 'rgba(255,255,255,0.94)';
    for (let d = 0; d < 5; d++){
      const dx = t3x + tier3W * 0.10 + d * (tier3W * 0.20);
      const dh = 5.5 + Math.sin(t * 0.90 + d * 1.6) * 2.5;
      cakeCtx.beginPath(); cakeCtx.ellipse(dx, t3y + dh, 4.4, dh, 0, 0, Math.PI * 2); cakeCtx.fill();
    }

    /* CANDLES */
    const NC = 5;
    const cSpacing = tier3W / (NC + 1);
    for (let ci = 0; ci < NC; ci++){
      const candleCX = t3x + cSpacing * (ci + 1);
      const candleCY = t3y - candleH;
      const [cDark, cLight] = CANDLE_COLS[ci];
      const waxOff = candleWaxOffsets[ci] || 0;
      const cg = cakeCtx.createLinearGradient(candleCX - candleW / 2, 0, candleCX + candleW / 2, 0);
      cg.addColorStop(0, cDark); cg.addColorStop(0.45, cLight); cg.addColorStop(1, cDark);
      cakeCtx.fillStyle = cg;
      cakeCtx.beginPath(); cakeCtx.roundRect(candleCX - candleW / 2, candleCY, candleW, candleH, candleW * 0.45); cakeCtx.fill();
      cakeCtx.fillStyle = cLight;
      cakeCtx.beginPath(); cakeCtx.ellipse(candleCX + waxOff, candleCY, candleW * 0.38, 4.2, 0, 0, Math.PI * 2); cakeCtx.fill();
      cakeCtx.strokeStyle = '#3a1810'; cakeCtx.lineWidth = 1.8;
      cakeCtx.lineCap = 'round';
      cakeCtx.beginPath(); cakeCtx.moveTo(candleCX, candleCY); cakeCtx.lineTo(candleCX + 1, candleCY - 7); cakeCtx.stroke();

      if (candlesLit) {
        const flicker = Math.sin(t * 9 + ci * 2.1) * 0.15 + Math.sin(t * 17 + ci * 3.3) * 0.06 + 1;
        const fh = candleW * 2.9 * flicker;
        const fw = candleW * 0.84;
        cakeCtx.save();
        cakeCtx.translate(candleCX, candleCY - 7 - fh * 0.35);
        const fg = cakeCtx.createRadialGradient(0, -fh * 0.1, 0, 0, fh * 0.15, fh * 0.9);
        fg.addColorStop(0, 'rgba(255,255,230,1)');
        fg.addColorStop(0.22, 'rgba(255,200,30,0.95)');
        fg.addColorStop(0.55, 'rgba(255,90,10,0.6)');
        fg.addColorStop(1, 'rgba(255,60,0,0)');
        cakeCtx.fillStyle = fg;
        cakeCtx.beginPath();
        cakeCtx.moveTo(0, fh * 0.5);
        cakeCtx.bezierCurveTo(fw, fh * 0.2, fw * 0.6, -fh * 0.3, 0, -fh * 0.5);
        cakeCtx.bezierCurveTo(-fw * 0.6, -fh * 0.3, -fw, fh * 0.2, 0, fh * 0.5);
        cakeCtx.fill();
        cakeCtx.restore();

        cakeCtx.save();
        cakeCtx.translate(candleCX, candleCY - 7);
        for (let s = 0; s < 4; s++){
          const sAng = t * 14 + ci * 2.1 + s * 1.57;
          const sDist = 3 + Math.sin(t * 18 + ci + s * 1.3) * 10;
          const sAlpha = Math.max(0, Math.sin(t * 10 + ci + s * 2));
          const sRad = 1.0 + 0.6 * (0.5 + 0.5 * Math.cos(t * 15 + s * 2.3));
          if (sAlpha > 0){
            cakeCtx.fillStyle = `rgba(255,238,145,${sAlpha * 0.9})`;
            cakeCtx.beginPath(); cakeCtx.arc(Math.cos(sAng) * sDist, Math.sin(sAng) * sDist, sRad, 0, 6.28); cakeCtx.fill();
          }
        }
        cakeCtx.restore();

        cakeCtx.save(); cakeCtx.globalCompositeOperation = 'lighter';
        const gg = cakeCtx.createRadialGradient(candleCX, candleCY - 9, 0, candleCX, candleCY - 9, candleW * 5.0);
        gg.addColorStop(0, `rgba(255,210,90,${0.34 * flicker})`);
        gg.addColorStop(0.5, `rgba(255,140,40,${0.14 * flicker})`);
        gg.addColorStop(1, 'rgba(255,100,0,0)');
        cakeCtx.fillStyle = gg;
        cakeCtx.beginPath(); cakeCtx.arc(candleCX, candleCY - 9, candleW * 5.0, 0, 6.2832); cakeCtx.fill();
        cakeCtx.restore();
      } else {
        const emberAlpha = Math.max(0, 1 - (t - cakeState.blowTime) * 0.55);
        if (emberAlpha > 0) {
          cakeCtx.fillStyle = `rgba(255,80,20,${emberAlpha})`;
          cakeCtx.beginPath(); cakeCtx.arc(candleCX + 1, candleCY - 7, 1.8, 0, 6.28); cakeCtx.fill();
        }
      }
    }

    if (candlesLit) {
      const fadeIn = clamp01((t - 0.25) * 1.4);
      const pulse  = 0.72 + 0.28 * Math.sin(t * 2.8);
      cakeCtx.save();
      cakeCtx.globalAlpha = fadeIn * pulse * cakeState.cakeFade;
      const hintFont = Math.max(15, Math.round(cakeW * 0.072));
      cakeCtx.font = `italic 600 ${hintFont}px "Cormorant Garamond",Georgia,serif`;
      cakeCtx.textAlign = 'center';
      cakeCtx.fillStyle = '#b83258';
      cakeCtx.shadowColor = 'rgba(255,255,255,0.95)'; cakeCtx.shadowBlur = 8;
      const hintY = Math.max(36, t3y - candleH - Math.max(28, cakeW * 0.13));
      const bobY = Math.sin(t * 2.2) * 3.5;
      cakeCtx.fillText(TEXTS.cakeHint, CX, hintY + bobY);
      cakeCtx.restore();
    }

    /* Smoke particles rising naturally from the wicks (no lantern on blow-out) */
    if (smokeParticles.length > 0) {
      for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.age += realDt;
        if (p.age >= p.life) { smokeParticles.splice(i, 1); continue; }
        p.vx += Math.sin(p.age * 2.2 + p.phase) * 0.06;
        p.vy *= (1 - 0.75 * realDt);
        p.x += p.vx * realDt * 48;
        p.y += p.vy * realDt * 48;
        p.size += realDt * 5.2;
        const alpha = Math.max(0, 1 - p.age / p.life) * 0.44 * cakeState.cakeFade;
        cakeCtx.fillStyle = `rgba(185,180,192,${alpha})`;
        cakeCtx.beginPath(); cakeCtx.arc(p.x, p.y, p.size, 0, 6.28); cakeCtx.fill();
      }
    }

    if (cakeSparkles.length > 0) {
      cakeCtx.save();
      cakeCtx.globalCompositeOperation = 'lighter';
      for (let i = cakeSparkles.length - 1; i >= 0; i--) {
        const sp = cakeSparkles[i];
        sp.age += realDt;
        if (sp.age >= sp.life) { cakeSparkles.splice(i, 1); continue; }
        sp.x += sp.vx * realDt;
        sp.y += sp.vy * realDt;
        sp.vy += 45 * realDt;
        const a = Math.sin((1 - sp.age / sp.life) * Math.PI) * cakeState.cakeFade;
        cakeCtx.fillStyle = `rgba(255,230,130,${a})`;
        cakeCtx.beginPath(); cakeCtx.arc(sp.x, sp.y, sp.r * (1 - sp.age / sp.life * 0.5), 0, 6.28); cakeCtx.fill();
      }
      cakeCtx.restore();
    }

    if (confettiPieces.length > 0) {
      drawConfetti(cakeCtx, realDt, t, cW, cH);
    }

    /* FINAL MESSAGE ABOVE THE CAKE */
    if (cakeState.msgAlpha > 0) {
      cakeCtx.save();
      cakeCtx.globalAlpha = cakeState.msgAlpha * cakeState.cakeFade;
      const lineGap = Math.round(cachedMsgFont * 1.12);
      const idealMsgY = t3y - candleH - lineGap * 1.25 - Math.max(16, cakeW * 0.08);
      const msgY = Math.max(cachedMsgFont + 20, idealMsgY);
      cakeCtx.font = `italic bold ${cachedMsgFont}px "Great Vibes",cursive`;
      cakeCtx.textAlign = 'center';
      const shimmerShift2 = Math.sin(t * 1.3) * (cW * 0.10);
      const mg = makeNameCanvasGradient(cakeCtx, CX - cW * 0.36, CX + cW * 0.36, shimmerShift2);
      cakeCtx.shadowColor = 'rgba(255,252,245,0.98)';
      cakeCtx.shadowBlur = 18;
      cakeCtx.fillStyle = mg;
      cakeCtx.fillText(TEXTS.cakeFinalLine1, CX, msgY);
      cakeCtx.fillText(`of happiness, ${RECIPIENT_NAME} ♥`, CX, msgY + lineGap);
      cakeCtx.shadowBlur = 0;
      cakeCtx.lineJoin = 'round';
      cakeCtx.lineWidth = Math.max(0.8, cachedMsgFont * 0.016);
      cakeCtx.strokeStyle = 'rgba(120,12,48,0.45)';
      cakeCtx.strokeText(TEXTS.cakeFinalLine1, CX, msgY);
      cakeCtx.strokeText(`of happiness, ${RECIPIENT_NAME} ♥`, CX, msgY + lineGap);
      cakeCtx.restore();
    }

    cakeCtx.restore();
  }

  cakeRAF = requestAnimationFrame(drawCake);
}

/* ============================================================
   INTERACTIVE TOUCH SPARKLES (Golden Stardust + Heart Petals)
   ============================================================ */
let touchSparklesEnabled = false;
let giftOpen = false;
let stillEnded = false;
let touchParticles = [];
let sparkleRAF = 0;
let sparkleLastT = 0;

function spawnTouchTrail(clientX, clientY) {
  if (!touchSparklesEnabled || giftOpen || stillEnded) return;
  const maxCap = W < 640 ? 120 : 200;
  const spawnCount = reduceMotion ? 1 : 3;

  for (let i = 0; i < spawnCount; i++) {
    if (touchParticles.length >= maxCap) touchParticles.shift();
    const isHeart = i === 0 && Math.random() < 0.45;
    const ang = rand(0, Math.PI * 2);
    const spd = reduceMotion ? rand(6, 18) : rand(14, 52);
    touchParticles.push({
      x: clientX + rand(-6, 6),
      y: clientY + rand(-6, 6),
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - rand(4, 18),
      size: isHeart ? rand(8, 14) : rand(2.2, 5.2),
      rot: rand(0, 6.28),
      vrot: rand(-2.8, 2.8),
      isHeart,
      col: isHeart ? pick(['#ff5f86', '#d4235c', '#ff9ab8', '#e8a23d']) : pick(['#fff6d6', '#ffe066', '#ffcf6a', '#ffb84d']),
      age: 0,
      life: reduceMotion ? rand(0.45, 0.75) : rand(0.65, 1.25),
    });
  }
  cue('sparkle');
  if (!sparkleRAF) {
    sparkleLastT = performance.now();
    sparkleRAF = requestAnimationFrame(drawTouchSparkles);
  }
}

function drawTouchSparkles(now) {
  if (stillEnded) {
    sparkleRAF = 0;
    return;
  }
  const dt = Math.min(0.05, (now - sparkleLastT) / 1000);
  sparkleLastT = now;

  const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
  const sW = sparkleCanvas.width / dpr2;
  const sH = sparkleCanvas.height / dpr2;
  sparkleCtx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
  sparkleCtx.clearRect(0, 0, sW, sH);

  if (giftOpen || touchParticles.length === 0) {
    sparkleRAF = 0;
    return;
  }

  for (let i = touchParticles.length - 1; i >= 0; i--) {
    const p = touchParticles[i];
    p.age += dt;
    if (p.age >= p.life) {
      touchParticles.splice(i, 1);
      continue;
    }
    p.vy += (reduceMotion ? 18 : 42) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vrot * dt;

    const prog = p.age / p.life;
    const alpha = Math.sin((1 - prog) * Math.PI * 0.5);
    sparkleCtx.save();
    sparkleCtx.translate(p.x, p.y);
    sparkleCtx.rotate(p.rot);
    sparkleCtx.globalAlpha = alpha;

    if (p.isHeart) {
      const hs = p.size * 0.5;
      sparkleCtx.fillStyle = p.col;
      sparkleCtx.beginPath();
      sparkleCtx.moveTo(0, hs * 0.3);
      sparkleCtx.bezierCurveTo(-hs, -hs * 0.4, -hs * 1.35, hs * 0.3, 0, hs * 1.15);
      sparkleCtx.bezierCurveTo(hs * 1.35, hs * 0.3, hs, -hs * 0.4, 0, hs * 0.3);
      sparkleCtx.fill();
    } else {
      sparkleCtx.globalCompositeOperation = 'lighter';
      const g = sparkleCtx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, p.col);
      g.addColorStop(1, 'rgba(255,200,80,0)');
      sparkleCtx.fillStyle = g;
      sparkleCtx.beginPath();
      sparkleCtx.arc(0, 0, p.size * 2.0, 0, Math.PI * 2);
      sparkleCtx.fill();
    }
    sparkleCtx.restore();
  }

  if (touchParticles.length > 0 && !stillEnded) {
    sparkleRAF = requestAnimationFrame(drawTouchSparkles);
  } else {
    sparkleRAF = 0;
  }
}

window.addEventListener('pointermove', (e) => {
  if (!touchSparklesEnabled || giftOpen || stillEnded) return;
  spawnTouchTrail(e.clientX, e.clientY);
}, { passive: true });

window.addEventListener('pointerdown', (e) => {
  if (!touchSparklesEnabled || giftOpen || stillEnded) return;
  if (e.target.closest('button, input, form, .gift-modal')) return;
  spawnTouchTrail(e.clientX, e.clientY);
}, { passive: true });

function showCake(){
  if (cakeShown) return;
  cakeShown = true;
  retireWish();
  candlesLit = true;
  touchSparklesEnabled = false;
  cakeState.msgAlpha = 0;
  cakeState.blowTime = 0;
  cakeState.cakeFade = 1;
  smokeParticles = [];
  cakeSparkles = [];
  confettiPieces = [];
  candleWaxOffsets = Array.from({ length: 5 }, () => rand(-2.2, 2.2));
  resizeCakeCanvas();
  const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
  buildSkyStars(cakeCanvas.width / dpr2, cakeCanvas.height / dpr2);

  cakeCanvas.classList.add('is-shown');
  gsap.fromTo(cakeCanvas,
    { opacity: 0, scale: 0.96, y: 16 },
    {
      opacity: 1, scale: 1, y: 0, duration: ANIM.cakeEntry, ease: 'power2.out',
      onComplete: () => {
        if (treeRAF) { cancelAnimationFrame(treeRAF); treeRAF = 0; }
        cue('cakeMelody');
      },
    }
  );
  gsap.killTweensOf([endNote, openGiftBtn, scene]);
  gsap.set(scene, { autoAlpha: 1 });
  gsap.set(endNote, { autoAlpha: 0, y: 10 });
  openGiftBtn.classList.remove('is-ready');
  if (openGiftLabel) openGiftLabel.textContent = TEXTS.openGiftBtn;
  gsap.set(openGiftBtn, { autoAlpha: 0, y: 10, scale: 0.95 });

  cakeStartT = 0; cakeLastT = 0;
  cakeRAF = requestAnimationFrame(drawCake);
  announce(`Act Five: A three-tier birthday cake for ${RECIPIENT_NAME} with lit candles appears. Tap or press Enter to blow out the candles.`);
}

/* Blow out candles — smoke, confetti, fireworks, final message, touch sparkles, and Open Gift CTA (no lantern) */
function blowOutCandles() {
  if (!cakeShown || !candlesLit || stillEnded) return;
  candlesLit = false;
  cakeState.blowTime = cakeCurrentT;
  cue('blow');

  const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
  const cW = cakeCanvas.width / dpr2;
  const cH = cakeCanvas.height / dpr2;
  const m = getCakeMetrics(cW, cH);
  const { t3x, t3y, tier3W, candleH } = m;
  const cSpacing = tier3W / 6;

  for (let ci = 0; ci < 5; ci++){
    const candleCX = t3x + cSpacing * (ci + 1) + 1;
    const candleCY = t3y - candleH - 7;
    for (let s = 0; s < 9; s++){
      smokeParticles.push({
        x: candleCX, y: candleCY,
        vx: rand(-0.65, 0.65), vy: rand(-1.85, -0.65),
        life: rand(2.2, 4.2), age: 0,
        size: rand(1.8, 3.6), phase: rand(0, 6.28),
      });
    }
    for (let sp = 0; sp < 7; sp++) {
      const ang = rand(-Math.PI, 0);
      const spd = rand(25, 85);
      cakeSparkles.push({
        x: candleCX, y: candleCY,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - rand(10, 30),
        r: rand(1.4, 2.8), age: 0, life: rand(0.45, 0.95),
      });
    }
  }

  spawnConfetti(cW, cH);
  spawnFirework(cW, cH);
  window.setTimeout(() => { if (cakeShown && !candlesLit && !stillEnded) spawnFirework(cW, cH); }, 400);

  gsap.to(cakeState, {
    msgAlpha: 1,
    duration: 2.1,
    delay: 0.40,
    ease: 'power2.out',
    onStart: () => {
      touchSparklesEnabled = true;
    },
  });

  if (!finalFadeScheduled) {
    finalFadeScheduled = true;
    gsap.to(endNote, { autoAlpha: 1, y: 0, duration: 1.1, delay: 1.65, ease: 'power2.out' });
    gsap.to(openGiftBtn, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.9,
      delay: 2.1,
      ease: 'back.out(1.4)',
      onStart: () => openGiftBtn.classList.add('is-ready'),
    });
  }

  announce(`Candles blown out! Wish you a lifetime of happiness, ${RECIPIENT_NAME}.`);
}

cakeCanvas.addEventListener('pointerdown', () => {
  if (candlesLit) blowOutCandles();
});

cakeCanvas.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (candlesLit) blowOutCandles();
  }
});

cakeCanvas.setAttribute('tabindex', '0');
cakeCanvas.setAttribute('role', 'button');

function hideCake(){
  cakeShown = false; cakeStartT = 0; cakeLastT = 0;
  touchSparklesEnabled = false;
  if (cakeRAF){ cancelAnimationFrame(cakeRAF); cakeRAF = 0; }
  if (sparkleRAF){ cancelAnimationFrame(sparkleRAF); sparkleRAF = 0; }
  cakeCanvas.classList.remove('is-shown');
  gsap.set(cakeCanvas, { opacity: 0 });
  cakeCtx.clearRect(0, 0, cakeCanvas.width, cakeCanvas.height);
  sparkleCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
  confettiPieces = [];
  smokeParticles = [];
  cakeSparkles = [];
  touchParticles = [];
}

/* ============================================================
   PART A & PART B — HERO GOLDEN WISH STAR + STRICT STILL END STATE
   ============================================================ */
let wishStarEl = null;
let wishStarTL = null;

function removeWishStar() {
  if (wishStarTL) {
    wishStarTL.kill();
    wishStarTL = null;
  }
  const existing = $('wishStar');
  if (existing) existing.remove();
  wishStarEl = null;
}

/* Part B: Stop every loop, tween, particle, CSS animation, and audio */
function enterStillEndState() {
  stillEnded = true;
  touchSparklesEnabled = false;
  giftOpen = false;

  /* 1. Cancel every requestAnimationFrame loop */
  if (treeRAF)    { cancelAnimationFrame(treeRAF); treeRAF = 0; }
  if (cakeRAF)    { cancelAnimationFrame(cakeRAF); cakeRAF = 0; }
  if (sparkleRAF) { cancelAnimationFrame(sparkleRAF); sparkleRAF = 0; }
  if (resizeRAF)  { cancelAnimationFrame(resizeRAF); resizeRAF = 0; }

  /* 2. Clear all dynamic particles & draw one clean static sky frame */
  touchParticles = [];
  confettiPieces = [];
  fireworks = [];
  smokeParticles = [];
  cakeSparkles = [];
  twinkles = [];
  shootingStars = [];
  if (sparkleCtx && sparkleCanvas) {
    sparkleCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
  }
  drawStillSkyFrame();

  /* 3. Hide gift button, closing dock, and sound toggle */
  if (openGiftBtn) {
    openGiftBtn.classList.remove('is-ready');
    openGiftBtn.style.display = 'none';
  }
  if (finaleDock) finaleDock.style.display = 'none';
  if (muteBtn) muteBtn.style.display = 'none';
  if (giftModal) {
    giftModal.classList.remove('is-open');
    giftModal.style.display = 'none';
  }

  /* 4. Freeze all CSS keyframe animations across the scene */
  if (scene) scene.classList.add('is-frozen');

  /* 5. Kill all GSAP tweens except the settled #wishStar */
  gsap.globalTimeline.getChildren(true, true, true).forEach((tween) => {
    if (wishStarTL && (tween === wishStarTL || tween.parent === wishStarTL)) return;
    tween.kill();
  });

  /* 6. Fade the music out to silence over 2s, then suspend AudioContext */
  audio.fadeOutAndSuspend(2.0);

  /* 7. Show the static, unanimated "replay" link at the bottom */
  if (finalReplayLink) {
    finalReplayLink.classList.add('is-visible');
  }
}

export function releaseWishStar(rawWish) {
  if (stillEnded) return;
  const cleanWish = (rawWish || '').trim().slice(0, WISH_STYLE.maxChars) || `May every dream bloom bright, ${RECIPIENT_NAME}`;
  savedWishes.push(cleanWish);

  removeWishStar();

  /* Clone #wishStarTpl into fixed overlay #wishStar */
  const overlay = document.createElement('div');
  overlay.id = 'wishStar';
  overlay.className = 'wish-star-overlay';

  const actor = document.createElement('div');
  actor.className = 'wish-star__actor';

  const spinWrap = document.createElement('div');
  spinWrap.className = 'wish-star__spin';
  if (wishStarTpl && wishStarTpl.content) {
    spinWrap.appendChild(wishStarTpl.content.cloneNode(true));
  }
  actor.appendChild(spinWrap);

  const caption = document.createElement('div');
  caption.className = 'wish-star__caption';

  const wishP = document.createElement('p');
  wishP.className = 'wish-star__text';
  /* Set user's wish with textContent only — never innerHTML.
     Keep the last two words together (nbsp) so a one-word last line like
     "light" can never appear, even where text-wrap:balance is unsupported. */
  const shown = cleanWish.replace(/\s+/g, ' ').replace(/ (\S+)$/, '\u00A0$1');
  wishP.textContent = shown;
  wishP.dataset.text = shown;   /* feeds the ::before glow and ::after gradient layers */

  const labelP = document.createElement('p');
  labelP.className = 'wish-star__label';
  labelP.textContent = TEXTS.wishStarLabel;

  caption.appendChild(wishP);
  caption.appendChild(labelP);

  overlay.appendChild(actor);
  overlay.appendChild(caption);
  scene.appendChild(overlay);
  wishStarEl = overlay;

  /* Geometry: start small (~24px wide -> scale 0.15) near bottom center,
     rise along a gentle curve to upper center (starH ~150px on phones, ~200px on desktop). */
  const vW = W || window.innerWidth;
  const vH = H || window.innerHeight;
  const isPhone = vW <= 768;
  const isShort = vH < 520 && vW > vH;
  const finalStarW = isShort ? 126 : isPhone ? 150 : 200;
  const finalStarH = finalStarW * (686 / 740);

  const startY = vH * 0.78 - finalStarH * 0.5;
  const endY   = (isShort ? vH * 0.14 : vH * 0.20);
  const captionTop = endY + finalStarH + (isShort ? 8 : 16);
  caption.style.top = `${Math.round(captionTop)}px`;

  /* Close Act 6 gift card and fade out the cake & dock so the sky stays */
  giftOpen = false;
  touchSparklesEnabled = false;
  closeNoteLetter();
  if (giftModal) {
    giftModal.classList.remove('is-open');
    giftModal.setAttribute('aria-hidden', 'true');
  }

  /* Reduced-motion path: no spin or travel; fade the star in at its final spot, then stop */
  if (reduceMotion) {
    gsap.set(giftModal, { autoAlpha: 0 });
    gsap.set([finaleDock, openGiftBtn, endNote], { autoAlpha: 0 });
    cakeState.cakeFade = 0;
    gsap.set(actor, { x: 0, y: endY, scale: 1, opacity: 0 });
    gsap.set(spinWrap, { rotation: 0 });
    gsap.set(caption, { opacity: 0, y: 0 });

    wishStarTL = gsap.timeline({
      onComplete: () => {
        announce(TEXTS.wishStarAnnounce);
        enterStillEndState();
      },
    });
    wishStarTL
      .call(() => cue('starSettle'), [], 0.05)
      .to(actor, { opacity: 1, duration: 0.75, ease: 'power2.out' }, 0)
      .to(caption, { opacity: 1, duration: 0.75, ease: 'power2.out' }, 0.35);
    return;
  }

  /* Full GSAP timeline (under 6 seconds total, transforms & opacity only) */
  gsap.set(actor, { x: 0, y: startY, scale: 0.15, opacity: 0 });
  gsap.set(spinWrap, { rotation: 0 });
  gsap.set(caption, { opacity: 0, y: 12 });

  const curveOffset = Math.min(48, vW * 0.11);

  wishStarTL = gsap.timeline({
    onComplete: () => {
      enterStillEndState();
    },
  });

  /* 1. Gift card & cake fade out; sky stays */
  wishStarTL
    .to(giftModal, { autoAlpha: 0, duration: 0.42, ease: 'power2.inOut' }, 0)
    .to([finaleDock, openGiftBtn, endNote], { autoAlpha: 0, duration: 0.42, ease: 'power2.inOut' }, 0)
    .to(cakeState, { cakeFade: 0, duration: 0.65, ease: 'power2.inOut' }, 0)

    /* 2. Golden star appears small near bottom center */
    .to(actor, { opacity: 1, duration: 0.28, ease: 'power1.out' }, 0.22)
    .call(() => cue('starRise'), [], 0.25)

    /* 3, 4, 5. Rise along gentle curve (~3.2s), grow 0.15 -> 1.0, spin 720° slowing near the end */
    .to(actor, {
      motionPath: {
        path: [
          { x: 0, y: startY },
          { x: -curveOffset, y: lerp(startY, endY, 0.36) },
          { x: curveOffset * 0.65, y: lerp(startY, endY, 0.74) },
          { x: 0, y: endY },
        ],
        curviness: 1.25,
      },
      scale: 1,
      duration: 3.2,
      ease: 'power2.inOut',
    }, 0.25)
    .to(spinWrap, {
      rotation: 720,
      duration: 3.2,
      ease: 'power3.out',
    }, 0.25)

    /* 6 & 7. Settle upright at final spot: one polished scale overshoot + glow pulse */
    .call(() => cue('starSettle'), [], 3.45)
    .to(actor, { scale: 1.08, duration: 0.22, ease: 'power2.out' }, 3.45)
    .to(actor, { scale: 1.0, duration: 0.36, ease: 'sine.inOut' }, 3.67)

    /* 8. Her wish text fades in once under the star */
    .call(() => announce(TEXTS.wishStarAnnounce), [], 3.85)
    .to(caption, { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }, 3.85);
}

/* ============================================================
   ACT 6 — THE GIFT (OPEN-WHEN NOTES + MAKE-A-WISH + REPLAY)
   ============================================================ */
const openedNotes = new Set();
const savedWishes = [];

function updateNotesProgress() {
  if (notesProgress) {
    notesProgress.textContent = `${openedNotes.size} of ${NOTES.length} opened`;
  }
}

function renderGiftContent(type = GIFT_TYPE) {
  if (!notesGrid) return;
  notesGrid.innerHTML = '';

  if (type === 'notes') {
    NOTES.forEach((note, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'note-env' + (openedNotes.has(idx) ? ' is-opened' : '');
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `${note.title}${openedNotes.has(idx) ? ' (opened)' : ''}`);
      btn.innerHTML = `
        <span class="note-env__check" aria-hidden="true">✓</span>
        <span class="note-env__seal" aria-hidden="true">♥</span>
        <span class="note-env__title">${note.title}</span>
      `;
      btn.addEventListener('click', () => openNoteLetter(idx, btn));
      notesGrid.appendChild(btn);
    });
    updateNotesProgress();
  } else if (type === 'video' || type === 'voucher' || type === 'link') {
    const extra = GIFT_EXTRAS[type] || {};
    const placeholder = document.createElement('div');
    placeholder.className = 'note-env';
    placeholder.textContent = extra.title || extra.caption || extra.label || 'Special birthday gift';
    notesGrid.appendChild(placeholder);
  }
}

/* Photo letters: a framed 4:5 photo plus a one-line caption. The frame reserves
   its space up front (no layout jump) and the photo fades in when decoded. If the
   file is missing, the letter falls back to the original text instead of breaking. */
function renderNoteBody(note) {
  noteReaderBody.textContent = '';
  noteReaderBody.classList.remove('has-photo');
  if (!note.photo) {
    noteReaderBody.textContent = note.text || note.caption || '';
    return;
  }
  const fig = document.createElement('figure');
  fig.className = 'note-photo';

  const frame = document.createElement('div');
  frame.className = 'note-photo__frame';

  const img = document.createElement('img');
  img.className = 'note-photo__img';
  img.alt = note.alt || '';
  img.width = 800;
  img.height = 1000;
  img.decoding = 'async';
  img.draggable = false;
  const reveal = () => frame.classList.add('is-loaded');
  img.addEventListener('load', reveal, { once: true });
  img.addEventListener('error', () => {
    noteReaderBody.classList.remove('has-photo');
    noteReaderBody.textContent = note.text || note.caption || '';
  }, { once: true });
  img.src = note.photo;
  if (img.complete && img.naturalWidth) reveal();   /* already cached */
  frame.appendChild(img);

  const cap = document.createElement('figcaption');
  cap.className = 'note-photo__caption';
  cap.textContent = note.caption || '';

  fig.appendChild(frame);
  fig.appendChild(cap);
  noteReaderBody.appendChild(fig);
  noteReaderBody.classList.add('has-photo');
}

/* Warm the browser cache when the gift card opens, so each letter shows its photo instantly. */
let notePhotosPreloaded = false;
function preloadNotePhotos() {
  if (notePhotosPreloaded) return;
  notePhotosPreloaded = true;
  NOTES.forEach((n) => {
    if (!n.photo) return;
    const im = new Image();
    im.decoding = 'async';
    im.src = n.photo;
  });
}

function openNoteLetter(idx, envBtn) {
  const note = NOTES[idx];
  if (!note || !noteReader || stillEnded) return;

  openedNotes.add(idx);
  if (envBtn) {
    envBtn.classList.add('is-opened');
    envBtn.setAttribute('aria-label', `${note.title} (opened)`);
  }
  updateNotesProgress();
  cue('note');

  noteReaderTitle.textContent = note.title;
  renderNoteBody(note);
  noteReaderSign.textContent = `— ${SENDER_NAME}`;

  noteReader.classList.add('is-open');
  noteReader.setAttribute('aria-hidden', 'false');

  if (reduceMotion) {
    gsap.set(noteReader, { autoAlpha: 1 });
    gsap.set(notePaper, { scale: 1, rotationX: 0, y: 0 });
  } else {
    gsap.to(noteReader, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' });
    gsap.fromTo(
      notePaper,
      { scale: 0.78, rotationX: -65, y: 24, transformPerspective: 700 },
      { scale: 1, rotationX: 0, y: 0, duration: 0.55, ease: 'back.out(1.45)' }
    );
  }
  announce(`${note.title}. ${note.photo ? `${note.alt || ''} ${note.caption || ''}` : note.text} Signed ${SENDER_NAME}. (${openedNotes.size} of ${NOTES.length} opened)`);
  if (closeNoteBtn) closeNoteBtn.focus();
}

function closeNoteLetter() {
  if (!noteReader) return;
  noteReader.classList.remove('is-open');
  noteReader.setAttribute('aria-hidden', 'true');
  gsap.to(noteReader, { autoAlpha: 0, duration: 0.22, ease: 'power2.in' });
}

function openGiftModal() {
  if (!giftModal || stillEnded) return;
  giftOpen = true;
  touchParticles = [];
  if (sparkleCtx) sparkleCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);

  renderGiftContent(GIFT_TYPE);
  preloadNotePhotos();
  giftModal.style.display = 'flex';
  giftModal.classList.add('is-open');
  giftModal.setAttribute('aria-hidden', 'false');
  cue('gift');

  if (reduceMotion) {
    gsap.set(giftModal, { autoAlpha: 1 });
    gsap.set(giftCard, { scale: 1, y: 0 });
  } else {
    gsap.to(giftModal, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(
      giftCard,
      { scale: 0.92, y: 24 },
      { scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }
    );
  }
  announce(`Act Six: Gift card for ${RECIPIENT_NAME} opened. Five sealed open-when envelopes and a make-a-wish star box.`);
}

function closeGiftModal() {
  if (!giftModal || stillEnded) return;
  closeNoteLetter();
  giftOpen = false;
  giftModal.classList.remove('is-open');
  giftModal.setAttribute('aria-hidden', 'true');
  if (openGiftLabel) openGiftLabel.textContent = 'back to your gift ✦';
  gsap.to(giftModal, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' });
}

if (openGiftBtn) {
  openGiftBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openGiftModal();
  });
}
if (closeGiftBtn) {
  closeGiftBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeGiftModal();
  });
}
if (giftBackdrop) {
  giftBackdrop.addEventListener('click', () => closeGiftModal());
}
if (closeNoteBtn) {
  closeNoteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeNoteLetter();
  });
}
if (noteReader) {
  noteReader.addEventListener('click', (e) => {
    if (e.target === noteReader) closeNoteLetter();
  });
}

window.addEventListener('keydown', (e) => {
  if (stillEnded) return;
  if (e.key === 'Escape') {
    if (noteReader && noteReader.classList.contains('is-open')) {
      closeNoteLetter();
    } else if (giftOpen) {
      closeGiftModal();
    }
  }
});

/* Part 2: Make-a-Wish form -> turns typed wish into the Hero Golden Wish Star */
if (wishForm) {
  wishForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (stillEnded) return;
    const text = (wishInput.value || '').trim().slice(0, WISH_STYLE.maxChars);
    wishInput.value = '';
    releaseWishStar(text);
  });
}

/* Part 3 & Part B: Replay buttons */
if (replayBtn) {
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetAll();
  });
}
if (finalReplayLink) {
  finalReplayLink.addEventListener('click', (e) => {
    e.stopPropagation();
    resetAll();
  });
}

/* ============================================================
   ENVELOPE — 3D parallax tilt + guaranteed visibility on load/refresh
   ============================================================ */
let envelopeOpening = false;

function showEnvelopeIntro(){
  envelopeOpening = false;
  gsap.killTweensOf(envelopeEl);
  envelopeEl.classList.remove('is-opening');
  envelopeEl.style.display = 'flex';
  envelopeEl.style.opacity = '1';
  envelopeEl.style.visibility = 'visible';
  if (envBody) {
    gsap.killTweensOf(envBody);
    envBody.style.transition = '';
    envBody.style.transform = '';
    if (!reduceMotion) {
      gsap.fromTo(envBody,
        { opacity: 0, y: 22, scale: 0.88 },
        { opacity: 1, y: 0, scale: 1, duration: 0.68, ease: 'back.out(1.35)', clearProps: 'transform,opacity' }
      );
    }
  }
}

function initEnvelopeParallax(){
  if (reduceMotion) return;
  envelopeEl.addEventListener('pointermove', (e) => {
    if (envelopeOpening || stillEnded || e.pointerType === 'touch') return;
    const r = envelopeEl.getBoundingClientRect();
    const relX = (e.clientX - r.left) / r.width  - 0.5;
    const relY = (e.clientY - r.top)  / r.height - 0.5;
    const rotY =  relX * 12;
    const rotX = -relY * 9;
    if (envBody){
      envBody.style.transition = 'transform 0.1s ease-out';
      envBody.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    }
  });
  envelopeEl.addEventListener('pointerleave', () => {
    if (envelopeOpening || stillEnded) return;
    if (envBody){
      envBody.style.transition = 'transform 0.45s ease';
      envBody.style.transform = '';
    }
  });
}

/* the tree's own rAF */
let treeStartT = 0, treeLastT = 0, treeRAF = 0, lastPetal = 0, endNoteShown = false;
let finalFadeScheduled = false;
window.bdayDone = false;

function treeFrame(now){
  if (stillEnded) return;
  if (!treeStartT){ treeStartT = now; treeLastT = now; }
  const t  = (now - treeStartT) / 1000;
  const dt = Math.min(0.05, (now - treeLastT) / 1000); treeLastT = now;

  const rays = clamp01((t - T.bloomT0) / T.bloomSpan);

  drawBackground();
  drawGodRays(t, rays);
  drawGlow(t);
  drawBokeh(t, dt);
  drawFloaters(t, dt, false);
  drawBranches(t);
  drawHearts(t);
  updateTwinkles(t, dt);
  if (t > T.petalT0 && now - lastPetal > 135){ spawnPetal(); spawnPetal(); lastPetal = now; }
  drawPetals(t, dt);
  drawRested();
  drawFloaters(t, dt, true);

  if (t > T.bloomT0 + 0.6 && Math.random() < 0.007) spawnShootingStar();
  drawShootingStars(dt);

  if (t > T.done - 0.55 && Math.random() < dt / 1.6) spawnFirework(W, H);
  drawFireworksOn(ctx, dt, W);

  showWish(t >= T.noteStart);

  if (!window.bdayDone && t >= T.done) window.bdayDone = true;
  if (!endNoteShown && t >= T.done + 0.38){
    endNoteShown = true;
    showCake();
  }

  treeRAF = requestAnimationFrame(treeFrame);
}

function treeStart(){
  treeStartT = 0; treeLastT = 0; lastPetal = 0; endNoteShown = false; window.bdayDone = false;
  shootingStars = []; fireworks = [];
  announce(`Act Four: A golden dawn breaks. A tree blooms and transforms into a heart of petals for ${RECIPIENT_NAME}.`);
  cue('grow');
  buildScene();
  if (!treeRAF) treeRAF = requestAnimationFrame(treeFrame);
}
function treeStop(){
  if (treeRAF){ cancelAnimationFrame(treeRAF); treeRAF = 0; }
  ctx.clearRect(0, 0, W, H);
}

function drawFinal(){
  buildScene();
  drawBackground(); drawGodRays(0, 1); drawGlow(T.done); drawBokeh(0, 0); drawFloaters(99, 0, false);
  drawBranches(99); drawHearts(99);
  for (let i = 0; i < 40; i++){
    const h = hearts[(Math.random() * hearts.length) | 0];
    if (h) rested.push({ x: clamp(h.x + rand(-W * 0.3, W * 0.3), 6, W - 6), y: groundY + rand(-6, H * 0.03), box: h.box * 0.5, idx: h.idx, rot: rand(0, 6.28), a: 0.85 });
  }
  drawRested(); drawFloaters(99, 0, true);
  showWish(true);
  window.bdayDone = true;
}

/* ============================================================
   ACTS 1–3 (GSAP) — the bow, the shot, the wish
   ============================================================ */
function splitWord(el){
  const chars = [...el.textContent];
  el.textContent = '';
  return chars.map((c) => {
    const s = document.createElement('span');
    s.className = 'hl__ch';
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    return s;
  });
}
const line1Chars = splitWord($('wLine1'));
const line2Chars = splitWord($('wLine2'));
const kChars = [...line1Chars, ...line2Chars];

function buildMotes(){
  if (reduceMotion) return;
  motes.innerHTML = '';
  for (let i = 0; i < 18; i++){
    const m = document.createElement('span');
    m.className = 'mote';
    const s = rand(4, 14);
    m.style.width = m.style.height = `${s}px`;
    m.style.left = `${rand(4, 96)}%`;
    m.style.top  = `${rand(8, 96)}%`;
    motes.appendChild(m);
    gsap.set(m, { opacity: rand(0.2, 0.65) });
    gsap.to(m, { y: -rand(50, 160), x: rand(-36, 36), duration: rand(7, 15), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: -rand(0, 10) });
    gsap.to(m, { opacity: rand(0.08, 0.48), duration: rand(2.5, 5.5), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
}

/* ============================================================
   FEATURE 2 — BUTTERFLIES (Act 1)
   ============================================================ */
const BFLY_COLS = [
  ['#d4235c','#ffcce8','#d4235c'],
  ['#e8a23d','#fff6d0','#c07820'],
  ['#4d90d4','#e0f0ff','#2060a8'],
  ['#9b44cc','#f0e0ff','#6622aa'],
  ['#3aaa6a','#e0fff0','#1a7848'],
  ['#e84d9a','#ffd0ef','#aa1870'],
  ['#ff7040','#ffe0d0','#c04010'],
  ['#40a0d4','#d0f0ff','#1870a8'],
];
function makeButterflyEl(cols){
  const [body, wing, vein] = cols;
  return `<svg viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg">
    <g class="bfly-wing-l">
      <ellipse cx="15" cy="13" rx="15" ry="10" fill="${wing}" opacity=".90"/>
      <ellipse cx="10" cy="24" rx="10" ry="7"  fill="${wing}" opacity=".75"/>
      <ellipse cx="13" cy="11" rx="5"  ry="3"  fill="${body}"  opacity=".22"/>
      <line x1="15" y1="14" x2="30" y2="18" stroke="${vein}" stroke-width="0.7" opacity=".5"/>
      <line x1="10" y1="20" x2="25" y2="20" stroke="${vein}" stroke-width="0.5" opacity=".3"/>
    </g>
    <g class="bfly-wing-r">
      <ellipse cx="45" cy="13" rx="15" ry="10" fill="${wing}" opacity=".90"/>
      <ellipse cx="50" cy="24" rx="10" ry="7"  fill="${wing}" opacity=".75"/>
      <ellipse cx="47" cy="11" rx="5"  ry="3"  fill="${body}"  opacity=".22"/>
      <line x1="45" y1="14" x2="30" y2="18" stroke="${vein}" stroke-width="0.7" opacity=".5"/>
      <line x1="50" y1="20" x2="35" y2="20" stroke="${vein}" stroke-width="0.5" opacity=".3"/>
    </g>
    <ellipse cx="30" cy="18" rx="2.4" ry="8" fill="${body}"/>
    <circle cx="30" cy="10" r="2.2" fill="${body}"/>
    <line x1="28" y1="9" x2="22" y2="4" stroke="${body}" stroke-width="0.9" stroke-linecap="round"/>
    <line x1="32" y1="9" x2="38" y2="4" stroke="${body}" stroke-width="0.9" stroke-linecap="round"/>
  </svg>`;
}
function buildButterflies(){
  if (reduceMotion) return;
  butterfliesEl.innerHTML = '';
  const count = W < 480 ? 6 : 8;
  for (let i = 0; i < count; i++){
    const el = document.createElement('div');
    el.className = 'butterfly';
    el.innerHTML = makeButterflyEl(BFLY_COLS[i % BFLY_COLS.length]);
    butterfliesEl.appendChild(el);
    const sx = rand(10, 90), sy = rand(14, 80);
    gsap.set(el, { left: sx + '%', top: sy + '%', opacity: 0,
      scale: rand(0.65, 1.2), xPercent: -50, yPercent: -50 });
    gsap.to(el, { opacity: rand(0.60, 0.90), duration: rand(0.8, 1.5),
      delay: i * 0.25 + rand(0, 0.25), ease: 'power2.out' });
    const rangeX = rand(8, 20), rangeY = rand(5, 13);
    const durX = rand(5, 11), durY = rand(3.5, 8);
    gsap.to(el, { x: `+=${rangeX}vw`, duration: durX, repeat: -1, yoyo: true,
      ease: 'sine.inOut', delay: -rand(0, durX) });
    gsap.to(el, { y: `+=${rangeY}vh`, duration: durY, repeat: -1, yoyo: true,
      ease: 'sine.inOut', delay: -rand(0, durY) });
    gsap.to(el, { rotation: rand(-22, 22), duration: rand(2, 4.5),
      repeat: -1, yoyo: true, ease: 'sine.inOut', delay: -rand(0, 2) });
  }
}

/* --- bow geometry & live limb flexing --- */
const tip = $('tip');
let svgScale = 1, arrowBaseX = 0, arrowBaseY = 0, maxDraw = 120, curDraw = 0;
let pullUX = 0, pullUY = 1;
const REST_NOCK = 96;
const nockProxy = { val: REST_NOCK };

function applyNock(){
  const y = nockProxy.val;
  const flex = clamp((y - REST_NOCK) / 140, -0.15, 1.2);
  const tipDrop = flex * 22;
  const tipIn   = flex * 8;
  const lx = 40 + tipIn, ly = 70 + tipDrop;
  const rx2 = 420 - tipIn, ry2 = 70 + tipDrop;
  const limbEndL = 96 + tipDrop;
  const c1y = 168 + flex * 12;

  strL.setAttribute('x1', lx);  strL.setAttribute('y1', ly);
  strL.setAttribute('y2', y);
  strR.setAttribute('x1', rx2); strR.setAttribute('y1', ry2);
  strR.setAttribute('y2', y);
  serving.setAttribute('cy', y);

  if (bowLimb && bowLimbHi) {
    const dPath = `M${34 + tipIn} ${limbEndL} C 118 ${c1y}, 168 240, 230 252 C 292 240, 342 ${c1y}, ${426 - tipIn} ${limbEndL}`;
    bowLimb.setAttribute('d', dPath);
    bowLimbHi.setAttribute('d', dPath);
  }
  if (bowTipL && bowTipR) {
    bowTipL.setAttribute('d', `M${34 + tipIn} ${limbEndL} C ${22 + tipIn} ${82 + tipDrop}, ${26 + tipIn} ${70 + tipDrop}, ${lx} ${ly - 4}`);
    bowTipR.setAttribute('d', `M${426 - tipIn} ${limbEndL} C ${438 - tipIn} ${82 + tipDrop}, ${434 - tipIn} ${70 + tipDrop}, ${rx2} ${ry2 - 4}`);
  }
}

function refreshRig(){
  const isMobilePortrait = W <= 640 && H > W;
  const isShortLandscape = H < 540 && W > H;
  const gripX  = isMobilePortrait ? W * 0.22 : isShortLandscape ? W * 0.24 : W * 0.24;
  const gripY  = isMobilePortrait ? H * 0.60 : isShortLandscape ? H * 0.73 : H * 0.74;
  const tRect0 = target.getBoundingClientRect();
  const heartX = tRect0.width ? (tRect0.left + tRect0.width / 2) : W * 0.5;
  const heartY = tRect0.height ? (tRect0.top + tRect0.height / 2) : (isMobilePortrait ? H * 0.285 : H * 0.32);

  const aimRad = Math.atan2(heartX - gripX, gripY - heartY);
  pullUX = -Math.sin(aimRad); pullUY = Math.cos(aimRad);

  nockProxy.val = REST_NOCK; applyNock();
  gsap.set(archery, { rotation: 0, scale: 1, x: 0, y: 0 });
  archery.style.left = '0px'; archery.style.top = '0px';
  gsap.set(arrow, { x: 0, y: 0, rotation: 0, scaleY: 1 });

  const bR = bow.getBoundingClientRect();
  const bowW = bR.width || archery.clientWidth || 180;
  const bowH = bowW * (300 / 460);
  const arrowW = bowW * 0.22;
  const arrowH = arrowW * (220 / 64);

  svgScale = bowW / 460;
  const gripLX = 0.5 * bowW;
  const gripLY = (240 / 300) * bowH;
  const nockLX = 0.5 * bowW;
  const nockLY = (REST_NOCK / 300) * bowH;

  arrowBaseX = nockLX - 0.5 * arrowW;
  arrowBaseY = nockLY - (205 / 220) * arrowH;

  if (archeryPulse) {
    archeryPulse.style.left = `${nockLX}px`;
    archeryPulse.style.top  = `${nockLY}px`;
  }

  archery.style.left = (gripX - gripLX) + 'px';
  archery.style.top  = (gripY - gripLY) + 'px';
  gsap.set(archery, { transformOrigin: `${gripLX}px ${gripLY}px`, rotation: aimRad * 180 / Math.PI });
  gsap.set(arrow, { x: arrowBaseX, y: arrowBaseY });
  maxDraw = Math.min(bowH * 0.74, H * 0.17, 160);
  curDraw = 0;
}

function setDraw(d){
  curDraw = clamp(d, 0, maxDraw);
  const ratio = maxDraw > 0 ? curDraw / maxDraw : 0;
  gsap.set(arrow, { x: arrowBaseX, y: arrowBaseY + curDraw });
  nockProxy.val = REST_NOCK + curDraw / svgScale;
  applyNock();
  gsap.set(aim, { opacity: 0.72 * ratio });
  if (drawing && !played) {
    gsap.set(target, { scale: 1 + ratio * 0.08 });
    if (ratio > 0.03) cue('draw', ratio);
  }
}

let beatTL = null;
function startBeat(){
  if (reduceMotion || stillEnded) return;
  if (beatTL) beatTL.kill();
  gsap.set(targetHeart, { scale: 1 });
  gsap.set(heartGlow, { scale: 1, opacity: 0.7 });
  beatTL = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
  beatTL.call(() => cue('heartbeat'), [], 0)
        .to(targetHeart, { scale: 1.07, duration: 0.13, ease: 'power2.out' }, 0)
        .to(heartGlow,   { scale: 1.18, opacity: 0.95, duration: 0.13, ease: 'power2.out' }, 0)
        .to(targetHeart, { scale: 1.0, duration: 0.2, ease: 'power2.in' }, 0.13)
        .to(targetHeart, { scale: 1.05, duration: 0.12, ease: 'power2.out' }, BEAT_DUB_AT)
        .to(targetHeart, { scale: 1.0, duration: 0.5, ease: 'power2.inOut' }, BEAT_DUB_AT + 0.12)
        .to(heartGlow,   { scale: 1.0, opacity: 0.7, duration: 0.7, ease: 'power2.inOut' }, 0.3);
}
function stopBeat(){ if (beatTL){ beatTL.kill(); beatTL = null; } gsap.set(targetHeart, { scale: 1 }); }

/* ============================================================
   FEATURE 3 — GLITTER BURST + GOLDEN ARROW TRAIL
   ============================================================ */
function spawnArrowTrailDot(){
  if (reduceMotion || stillEnded) return;
  const tipR = tip.getBoundingClientRect();
  if (!tipR.width && !tipR.left) return;
  const tx = tipR.left + tipR.width / 2 + rand(-4, 4);
  const ty = tipR.top  + tipR.height / 2 + rand(-4, 4);
  const el = document.createElement('span');
  const s = rand(4, 8);
  el.className = 'glitter';
  el.style.cssText = `position:fixed;left:${tx}px;top:${ty}px;width:${s}px;height:${s}px;` +
    `margin:${-s / 2}px 0 0 ${-s / 2}px;background:#ffe38c;z-index:98;` +
    `box-shadow:0 0 ${s * 2}px #ffaa22;border-radius:50%;pointer-events:none;`;
  document.body.appendChild(el);
  gsap.to(el, {
    y: rand(8, 22), x: rand(-10, 10), scale: 0.1, opacity: 0,
    duration: rand(0.32, 0.55), ease: 'power1.out', onComplete: () => el.remove(),
  });
}

function spawnGlitter(){
  const r = target.getBoundingClientRect();
  const ox = r.left + r.width / 2;
  const oy = r.top  + r.height * 0.42;
  const glitterCols = ['#ffffff','#ffe38c','#ff6f97','#ffc4e0','#ffb14e','#cc44ff','#44eeff','#ffaa44','#ff44aa','#aaff44'];
  const frag = document.createDocumentFragment();
  const count = W < 480 ? 34 : 46;
  for (let i = 0; i < count; i++){
    const el = document.createElement('span');
    el.className = 'glitter';
    const s = rand(3, 10);
    el.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;width:${s}px;height:${s}px;` +
      `margin:${-s / 2}px 0 0 ${-s / 2}px;background:${pick(glitterCols)};z-index:99;` +
      `box-shadow:0 0 ${s * 2.2}px ${pick(glitterCols)};border-radius:50%;pointer-events:none;`;
    frag.appendChild(el);
    const ang  = rand(0, Math.PI * 2);
    const dist = rand(45, Math.min(W, H) * 0.42);
    gsap.to(el, {
      x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - rand(16, 75),
      scale: rand(0.3, 2.0), rotation: rand(-540, 540),
      duration: rand(0.6, 1.25), ease: 'power2.out',
    });
    gsap.to(el, { opacity: 0, duration: rand(0.3, 0.65), delay: rand(0.2, 0.7),
      ease: 'power1.in', onComplete: () => el.remove() });
  }
  document.body.appendChild(frag);
}

function miniHeartSVG(fill){
  return `<svg viewBox="0 0 24 22" width="100%" height="100%"><path d="M12 20C5.5 15 1.5 11.4 1.5 6.9 1.5 3.6 4 1.5 7 1.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3 0 5.5 2.1 5.5 5.4C23.5 11.4 19.5 15 12 20Z" fill="${fill}"/></svg>`;
}
function burstHearts(){
  const r = target.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  const ox = r.left - hr.left + r.width / 2;
  const oy = r.top - hr.top + r.height * 0.42;
  const cols = ['#ff6f97', '#ffb14e', '#ff8fae', '#ffd36a', '#e23b67', '#ff44cc'];
  const frag = document.createDocumentFragment();
  const nodes = [];
  for (let i = 0; i < 14; i++){
    const heart = i < 10;
    const el = document.createElement('span');
    el.className = 'burst';
    const s = heart ? rand(12, 24) : rand(4, 9);
    el.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;pointer-events:none;z-index:4;`;
    if (heart) el.innerHTML = miniHeartSVG(pick(cols));
    else { el.style.borderRadius = '50%'; el.style.background = 'radial-gradient(circle,#fff,rgba(255,210,150,0) 70%)'; }
    frag.appendChild(el); nodes.push({ el, heart });
  }
  hero.appendChild(frag);
  nodes.forEach(({ el, heart }) => {
    const ang = rand(-Math.PI, 0);
    const dist = rand(heart ? 60 : 35, heart ? 180 : 120);
    gsap.to(el, {
      x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - rand(10, 50),
      rotation: rand(-120, 120), scale: heart ? rand(0.7, 1.3) : rand(0.4, 1),
      duration: rand(0.7, 1.2), ease: 'power2.out',
    });
    gsap.to(el, { opacity: 0, duration: 0.5, delay: rand(0.35, 0.65), ease: 'power1.in', onComplete: () => el.remove() });
  });
}

function triggerRipples(){
  const r = target.getBoundingClientRect();
  const ox = r.left + r.width / 2;
  const oy = r.top  + r.height * 0.45;
  [rippleRing1, rippleRing2].forEach((ring, idx) => {
    ring.style.left = `${ox}px`;
    ring.style.top  = `${oy}px`;
    gsap.killTweensOf(ring);
    gsap.set(ring, { scale: 0.3, opacity: idx === 0 ? 0.9 : 0.7, borderWidth: idx === 0 ? 4 : 3 });
    gsap.to(ring, {
      scale: idx === 0 ? 5.2 : 7.0,
      opacity: 0,
      borderWidth: 0.5,
      duration: idx === 0 ? 0.72 : 1.05,
      delay: idx * 0.14,
      ease: 'power2.out',
    });
  });
}

function triggerImpactFlash(){
  const r = target.getBoundingClientRect();
  const fx = ((r.left + r.width / 2) / Math.max(1, W)) * 100;
  const fy = ((r.top  + r.height * 0.45) / Math.max(1, H)) * 100;
  document.documentElement.style.setProperty('--flash-x', `${fx.toFixed(1)}%`);
  document.documentElement.style.setProperty('--flash-y', `${fy.toFixed(1)}%`);
  gsap.killTweensOf(impactFlash);
  gsap.set(impactFlash, { opacity: 0 });
  gsap.to(impactFlash, { opacity: 1, duration: 0.06, ease: 'power2.out' });
  gsap.to(impactFlash, { opacity: 0, duration: 0.48, delay: 0.06, ease: 'power2.inOut' });
}

/* --- the shot + Acts 2–3 timeline ------------------------------------------ */
function shotGeom(){
  const tipR = tip.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const tipX = tipR.left + tipR.width / 2, tipY = tipR.top + tipR.height / 2;
  const tcx = tRect.left + tRect.width / 2, tcy = tRect.top + tRect.height / 2;
  const flightDist = Math.hypot(tcx - tipX, tcy - tipY);
  const fallPx = Math.min(H * 0.25, H - tcy - tRect.height * 0.4);
  const impactX = tcx, impactY = tcy + fallPx;
  const distC = Math.hypot(Math.max(impactX, W - impactX), Math.max(impactY, H - impactY));
  const reach = Math.hypot(W / 2, H / 2);
  return {
    arrowStartY: arrowBaseY + curDraw,
    arrowFlyY:   arrowBaseY + curDraw - flightDist,
    drawnNock:   REST_NOCK + curDraw / svgScale,
    fallPx, fx: impactX - W / 2, fy: impactY - H / 2,
    floodScale: (distC * 1.12) / 70, bloomScale: (reach * 1.2) / 30,
  };
}

let filmTL = null;
function buildFilm(m){
  const t = gsap.timeline({
    paused: true,
    onComplete: () => {
      gsap.set(field, { autoAlpha: 0 });
      treeStart();
      gsap.to(bloom, { autoAlpha: 0, duration: 1.1, ease: 'power2.out' });
    },
  });

  t.set(target, { y: 0, scaleX: 1, scaleY: 1, scale: 1, opacity: 1 })
   .set(arrow, { opacity: 1, x: arrowBaseX, y: m.arrowStartY, scaleY: 1 })
   .set([flood, bloom], { autoAlpha: 0, scale: 0.001, x: 0, y: 0 })
   .set(impactFlash, { autoAlpha: 0 })
   .set(flood, { x: m.fx, y: m.fy })
   .set(field, { autoAlpha: 0 })
   .set('.blob', { opacity: 0 })
   .set(camera, { scale: 1, yPercent: 0 })
   .set(fgrid, { xPercent: 0, yPercent: 0 })
   .set(barTop, { yPercent: -100 })
   .set(barBot, { yPercent: 100 })
   .set(kEyebrow, { opacity: 0, y: 12 })
   .set(kSub, { opacity: 0, y: 12 })
   .set(kChars, { transformPerspective: 620, transformOrigin: '50% 100%', yPercent: 135, rotationX: -82 })
   .set(uline, { drawn: 0 });

  /* t = 0: bow twang + arrow whoosh sweeping 0 -> 0.26s */
  t.call(cue, ['release'], 0)
   .call(cue, ['whoosh'], 0)
   .fromTo(nockProxy, { val: m.drawnNock }, { val: REST_NOCK, duration: 0.5, ease: 'elastic.out(1,0.34)', onUpdate: applyNock }, 0)
   .to(arrow, { y: m.arrowFlyY - ANIM.arcLift * 0.5, duration: ARROW_RISE, ease: 'power2.in', onUpdate: spawnArrowTrailDot }, 0)
   .to(arrow, { y: m.arrowFlyY, rotation: -3, duration: ARROW_SETTLE, ease: 'power1.out', onUpdate: spawnArrowTrailDot }, ARROW_RISE)
   .to(arrow, { scaleY: 1.16, duration: 0.14, ease: 'power2.in' }, 0)
   .to(arrow, { scaleY: 1.0, duration: 0.1, ease: 'power1.out' }, 0.16)
   .to(aim, { opacity: 0, duration: 0.18 }, 0)
   .to([eyebrow, hint], { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0);

  /* t = ARROW_FLIGHTs: exact arrow strike + impact thud & glassy sparkle */
  t.call(cue, ['hit'], ARROW_FLIGHT)
   .call(announce, ['Arrow struck! The heart bursts.'], ARROW_FLIGHT)
   .add(burstHearts, ARROW_FLIGHT)
   .add(spawnGlitter, ARROW_FLIGHT)
   .add(triggerImpactFlash, ARROW_FLIGHT)
   .add(triggerRipples, ARROW_FLIGHT)
   .to(target, { x: 7, y: -9, duration: 0.06, ease: 'power2.out' }, ARROW_FLIGHT)
   .to(target, { x: 0, y: 0, duration: 0.32, ease: 'power2.out' }, 0.32)
   .to(target, { scale: 1.14, duration: 0.06, ease: 'power2.out' }, ARROW_FLIGHT)
   .to(target, { scale: 1.0, duration: 0.26, ease: 'power2.inOut' }, 0.32)
   .to(arrow, { rotation: '+=4', duration: 0.05, yoyo: true, repeat: 4, ease: 'sine.inOut' }, 0.27)
   .set(arrow, { rotation: 0 }, 0.52)
   .to(arrow, { opacity: 0, duration: 0.16, ease: 'power1.out' }, 0.56);

  /* t = 1.00s: fall + rose flood */
  t.to(target, { y: m.fallPx, scaleX: 0.84, scaleY: 1.3, duration: 0.34, ease: 'power1.in' }, 0.64)
   .to(target, { scaleX: 1.4, scaleY: 0.6, duration: 0.07, ease: 'power2.out' }, 0.98)
   .call(cue, ['flood'], 1.00)
   .call(announce, ['Rose flood engulfing the screen.'], 1.00)
   .set(flood, { autoAlpha: 1, opacity: 0, scale: 0.02 }, 1.00)
   .to(flood, { scale: m.floodScale, opacity: 1, duration: ANIM.floodScale, ease: 'power2.inOut' }, 1.00)
   .to(target, { opacity: 0, duration: 0.12, ease: 'power1.out' }, 1.06);

  t.set(field, { autoAlpha: 1 }, 1.32)
   .set(hero, { autoAlpha: 0 }, 1.33)
   .to('.blob', { opacity: 1, duration: 0.65, ease: 'power2.out' }, 1.34)
   .to(flood, { opacity: 0, duration: 0.34, ease: 'power1.inOut' }, 1.16)
   .set(flood, { autoAlpha: 0 }, 1.52);

  /* camera push */
  t.fromTo(camera, { scale: 1.0, yPercent: 0 }, { scale: 1.07, yPercent: -1.3, duration: 2.6, ease: 'none' }, 1.38)
   .fromTo(fgrid, { xPercent: 0, yPercent: 0 }, { xPercent: -1.5, yPercent: -1.0, duration: 2.6, ease: 'none' }, 1.38);

  /* cinema bars */
  t.to(barTop, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 1.5)
   .to(barBot, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 1.5);

  /* t = 1.68s & 2.06s: kinetic wish chords */
  t.to(kEyebrow, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 1.54)
   .call(cue, ['wish'], 1.68)
   .call(announce, [`Kinetic wish appearing: Happy Birthday to ${RECIPIENT_NAME}, someone worth celebrating.`], 1.68)
   .to(line1Chars, { yPercent: 0, rotationX: 0, duration: 0.55, ease: 'power3.out', stagger: 0.033 }, 1.68)
   .call(cue, ['wish2'], 2.06)
   .to(line2Chars, { yPercent: 0, rotationX: 0, duration: 0.55, ease: 'power3.out', stagger: 0.033 }, 2.06)
   .to(uline, { drawn: 1, duration: 0.45, ease: 'power2.inOut' }, 2.54)
   .to(kSub, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 2.74);

  /* t = 3.42s: gold handoff bloom + chime arpeggio */
  t.to(barTop, { yPercent: -100, duration: 0.5, ease: 'power2.in' }, 3.32)
   .to(barBot, { yPercent: 100, duration: 0.5, ease: 'power2.in' }, 3.32)
   .call(cue, ['bloom'], 3.42)
   .call(announce, ['Golden light blooming. A tree grows into a heart of petals.'], 3.42)
   .set(bloom, { autoAlpha: 1 }, 3.42)
   .fromTo(bloom, { scale: 0.02 }, { scale: m.bloomScale, duration: 0.58, ease: 'power2.in' }, 3.42);

  return t;
}

/* --- draw / release interaction (mobile + desktop) ------------------------- */
let played = false, drawing = false, startPX = 0, startPY = 0, startDraw = 0, downTime = 0;

function fire(){
  if (played || stillEnded) return;
  played = true;
  drawing = false;
  audio.stopCreak();
  archery.classList.add('is-drawing');
  stopBeat();
  if (reduceMotion) {
    cue('release');
    gsap.set(hero, { autoAlpha: 0 });
    drawFinal();
    gsap.delayedCall(0.8, showCake);
  } else {
    filmTL = buildFilm(shotGeom());
    if (filmTL) filmTL.play(0);
  }
}

function springBack(){
  audio.stopCreak();
  const from = curDraw;
  gsap.to(target, { scale: 1, duration: 0.35, ease: 'power2.out' });
  gsap.to({ d: from }, {
    d: 0, duration: 0.55, ease: 'elastic.out(1,0.4)',
    onUpdate() { setDraw(this.targets()[0].d); },
    onComplete() { if (!played) archery.classList.remove('is-drawing'); },
  });
}

function autoFire(){
  if (played || stillEnded) return;
  archery.classList.add('is-drawing');
  recT0 = performance.now();
  if (reduceMotion) {
    fire();
    return;
  }
  gsap.to({ d: curDraw }, {
    d: maxDraw * 0.94, duration: 0.58, ease: 'power2.inOut',
    onUpdate() {
      const val = this.targets()[0].d;
      setDraw(val);
      cue('draw', val / Math.max(1, maxDraw));
    },
    onComplete: () => gsap.delayedCall(0.12, fire),
  });
}

function beginDraw(e){
  if (played || stillEnded) return;
  if (reduceMotion) {
    autoFire();
    return;
  }
  drawing = true;
  downTime = performance.now();
  if (!recT0) recT0 = downTime;
  archery.classList.add('is-drawing');
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  startPX = e.clientX; startPY = e.clientY; startDraw = curDraw;
  e.preventDefault();
}

function moveDraw(e){
  if (!drawing) return;
  const dx = e.clientX - startPX;
  const dy = e.clientY - startPY;
  const angledProj = dx * pullUX + dy * pullUY;
  const verticalPull = dy * 0.88;
  const proj = Math.max(angledProj, verticalPull);
  setDraw(startDraw + proj);
}

function endDraw(e){
  if (!drawing) return;
  drawing = false;
  audio.stopCreak();
  const elapsed = performance.now() - downTime;
  const moved = Math.hypot((e?.clientX ?? startPX) - startPX, (e?.clientY ?? startPY) - startPY);
  if (curDraw > maxDraw * 0.22) {
    fire();
  } else if (elapsed < 280 && moved < 14) {
    autoFire();
  } else {
    springBack();
  }
}

archery.addEventListener('pointerdown', beginDraw);
archery.addEventListener('pointermove', moveDraw);
archery.addEventListener('pointerup', endDraw);
archery.addEventListener('pointercancel', endDraw);

hero.addEventListener('pointerdown', (e) => {
  if (played || drawing || stillEnded || e.target.closest('#archery')) return;
  if (e.target.closest('#target')) {
    autoFire();
    return;
  }
  if (e.clientY > H * 0.42) {
    beginDraw(e);
  }
});
hero.addEventListener('pointermove', moveDraw);
hero.addEventListener('pointerup', endDraw);
hero.addEventListener('pointercancel', endDraw);

archery.addEventListener('touchmove', (e) => {
  if (drawing) e.preventDefault();
}, { passive: false });

archery.addEventListener('keydown', (e) => {
  if (played || stillEnded) return;
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); autoFire(); }
});

/* boot Act 1 */
function enter(){
  gsap.set(hero, { autoAlpha: 1 });
  archery.classList.remove('is-drawing');
  announce(`Act One: An interactive gift for ${RECIPIENT_NAME} unfolds. A beating heart awaits, and a bow is ready to fire.`);
  refreshRig();
  setDraw(0);

  if (reduceMotion) {
    gsap.set([eyebrow, hint, target, archery, arrow], { opacity: 1, y: 0, scaleX: 1, scaleY: 1, scale: 1 });
    gsap.set(heartGlow, { opacity: 0.7 });
    return;
  }

  gsap.set([eyebrow, hint], { opacity: 0, y: 14 });
  gsap.set(target, { opacity: 0, y: 10, scaleX: 0.9, scaleY: 0.9, scale: 0.9 });
  gsap.set(archery, { opacity: 0, scale: 0.85 });
  gsap.set(heartGlow, { opacity: 0, scale: 1 });
  gsap.set(arrow, { opacity: 1 });

  const tl = gsap.timeline({ onComplete: startBeat });
  tl.to(target,   { opacity: 1, y: 0, scaleX: 1, scaleY: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0.1)
    .to(heartGlow,{ opacity: 0.7, duration: 0.8, ease: 'power2.out' }, 0.2)
    .to(archery,  { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0.28)
    .to(eyebrow,  { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.4)
    .to(hint,     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.7);
}

/* Part B: resetAll() removes #wishStar and restores every stopped loop, animation, and audio state */
export function resetAll(){
  stillEnded = false;
  giftOpen = false;
  removeWishStar();
  if (scene) scene.classList.remove('is-frozen');
  if (finalReplayLink) finalReplayLink.classList.remove('is-visible');
  if (finaleDock) finaleDock.style.display = 'flex';
  if (openGiftBtn) openGiftBtn.style.display = '';
  if (muteBtn) muteBtn.style.display = 'flex';
  if (giftModal) {
    giftModal.classList.remove('is-open');
    giftModal.style.display = 'flex';
    gsap.set(giftModal, { autoAlpha: 0 });
  }
  closeNoteLetter();

  audio.stopAllAndReset();
  treeStop();
  hideCake();
  showWish(false);
  openedNotes.clear();
  restoreWish();
  showWish(false);
  if (wishStatus) wishStatus.textContent = '';
  gsap.set(scene, { autoAlpha: 1 });
  shootingStars = []; fireworks = [];
  butterfliesEl.innerHTML = '';
  window.bdayDone = false; endNoteShown = false; finalFadeScheduled = false;
  gsap.killTweensOf([endNote, openGiftBtn, finaleDock]);
  gsap.set(finaleDock, { autoAlpha: 1 });
  openGiftBtn.classList.remove('is-ready');
  gsap.set(openGiftBtn, { autoAlpha: 0, y: 10, scale: 0.95 });
  gsap.set(endNote, { autoAlpha: 0, y: 10 });
  if (filmTL){ filmTL.pause(0); }
  gsap.set([flood, bloom, impactFlash], { autoAlpha: 0 });
  gsap.set(field, { autoAlpha: 0 });
  gsap.set(hero, { autoAlpha: 1 });
  gsap.set(arrow, { opacity: 1, scaleY: 1 });
  played = false;
  drawing = false;
  recT0 = 0;
  document.querySelectorAll('.glitter, .burst').forEach((el) => el.remove());
  gsap.set([rippleRing1, rippleRing2], { scale: 0.3, opacity: 0 });
  refreshRig();
  setDraw(0);
  showEnvelopeIntro();
  announce(`Birthday experience reset to the beginning for ${RECIPIENT_NAME}.`);
}

/* ============================================================
   SIZING + BOOT
   ============================================================ */
function resize(){
  if (stillEnded) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth || window.innerWidth;
  H = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  resizeCakeCanvas();

  buildSprites();
  const treeWasRunning = !!treeRAF;
  if (treeWasRunning) { cancelAnimationFrame(treeRAF); treeRAF = 0; }
  buildScene();
  if (treeWasRunning){
    const elapsed = treeLastT - treeStartT;
    treeRAF = requestAnimationFrame((now) => {
      treeStartT = now - elapsed;
      treeLastT  = now;
      treeFrame(now);
    });
  } else if (window.bdayDone && !cakeShown) {
    drawFinal();
  }
  if (played && filmTL && filmTL.isActive()){
    const at = filmTL.time();
    refreshRig();
    filmTL = buildFilm(shotGeom());
    filmTL.play(at);
  } else if (!played) {
    refreshRig(); setDraw(0);
  }
}
let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (stillEnded || resizeRAF) return;
  resizeRAF = requestAnimationFrame(() => { resizeRAF = 0; resize(); });
});

/* Browsers stop requestAnimationFrame in hidden tabs. When the tab returns,
   shift the clocks by the time spent hidden so the film RESUMES instead of
   jumping ahead (GSAP timelines already pause with the ticker). */
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = performance.now(); return; }
  if (!hiddenAt) return;
  const gap = performance.now() - hiddenAt;
  hiddenAt = 0;
  if (treeStartT) { treeStartT += gap; treeLastT += gap; }
  if (cakeStartT) { cakeStartT += gap; cakeLastT += gap; }
  if (sparkleLastT) sparkleLastT += gap;
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    resetAll();
  }
});

/* FONT GATE: nothing visible and no canvas text is measured until every face
   we use is loaded (2.5 s cap so a slow network can never block the gift). */
const FONT_FACES = [
  '400 1em "Great Vibes"',
  '500 1em "Cormorant Garamond"',
  '600 1em "Cormorant Garamond"',
  '700 1em "Cormorant Garamond"',
  'italic 500 1em "Cormorant Garamond"',
  'italic 600 1em "Cormorant Garamond"',
  '600 1em "Fraunces"',
  '700 1em "Fraunces"',
  '900 1em "Fraunces"',
];
function loadFonts(){
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const all = Promise.all(FONT_FACES.map((f) => document.fonts.load(f, 'AaBb Akshaya ♥✦').catch(() => [])))
    .then(() => document.fonts.ready);
  const cap = new Promise((res) => window.setTimeout(res, 2500));
  return Promise.race([all, cap]).catch(() => {});
}
resize();
initEnvelopeParallax();
loadFonts().then(() => {
  /* re-measure cached canvas text now that the real faces exist */
  cachedFontKey = '';
  resize();
  document.documentElement.classList.remove('fonts-pending');
  showEnvelopeIntro();
});

if (debugAudio) {
  audio.measureMix().then((rep) => {
    console.log('[audio-debug] OfflineAudioContext mix report:', rep);
  });
}

function openEnvelope(){
  if (envelopeOpening) return;
  envelopeOpening = true;
  /* Unlock AudioContext synchronously inside user gesture */
  audio.unlock();
  cue('envelope');
  if (envBody) {
    envBody.style.transition = '';
    envBody.style.transform = '';
  }
  envelopeEl.classList.add('is-opening');
  const openDelay = reduceMotion ? 120 : 740;
  window.setTimeout(() => {
    gsap.to(envelopeEl, {
      autoAlpha: 0, duration: reduceMotion ? 0.15 : 0.52, ease: 'power2.in',
      onComplete(){ envelopeEl.style.display = 'none'; },
    });
    buildMotes();
    buildButterflies();
    enter();
  }, openDelay);
}
envelopeEl.addEventListener('click', openEnvelope);
envelopeEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openEnvelope(); }
});

/* ============================================================
   RECORDING & TEST HOOKS
   ============================================================ */
window.bdayAPI = {
  start(){ autoFire(); },
  reset(){ resetAll(); },
  releaseWishStar(text){ releaseWishStar(text); },
  measureAudio(){ return audio.measureMix(); },
  fontStatus(){ return FONT_FACES.map((f) => [f, document.fonts.check(f)]); },
};
