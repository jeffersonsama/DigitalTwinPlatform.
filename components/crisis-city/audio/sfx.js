// Sonorisation minimale — Document n°4, section 6.3 : « le tiers du ressenti pour 2 % de
// l'effort ». Sans banque de sons, les 6 sons courts d'interface sont synthétisés à la volée
// (Web Audio, zéro fichier, zéro licence à vérifier — souveraineté totale par construction).
// Les ambiances de fond (souk, port...) ne sont PAS incluses : une boucle synthétisée
// convaincante est hors de portée sans échantillons réels — mieux vaut l'absence qu'un résultat
// raté (choix documenté, voir résumé de livraison).

let ctx = null;
let enabled = true;

function getCtx() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSfxEnabled(value) {
  enabled = value;
}

function tone(freq, duration, { type = 'sine', gain = 0.12, delay = 0, glideTo } = {}) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noiseBurst(duration, { gain = 0.08, delay = 0, filterFreq = 2000 } = {}) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const amp = c.createGain();
  amp.gain.setValueAtTime(gain, t0);
  src.connect(filter).connect(amp).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  choix() {
    tone(520, 0.08, { type: 'triangle', gain: 0.1 });
  },
  validation() {
    tone(440, 0.09, { type: 'sine', gain: 0.11 });
    tone(660, 0.12, { type: 'sine', gain: 0.09, delay: 0.06 });
  },
  carte() {
    tone(523, 0.1, { type: 'sine', gain: 0.1 });
    tone(659, 0.1, { type: 'sine', gain: 0.1, delay: 0.09 });
    tone(784, 0.18, { type: 'sine', gain: 0.11, delay: 0.18 });
  },
  promotion() {
    [392, 523, 659, 784].forEach((f, i) => tone(f, 0.22, { type: 'triangle', gain: 0.1, delay: i * 0.1 }));
  },
  alerte() {
    tone(880, 0.14, { type: 'square', gain: 0.05, glideTo: 660 });
    tone(880, 0.14, { type: 'square', gain: 0.05, delay: 0.2, glideTo: 660 });
  },
  timeout() {
    tone(300, 0.35, { type: 'sawtooth', gain: 0.08, glideTo: 120 });
    noiseBurst(0.3, { gain: 0.04, filterFreq: 800 });
  },
};
