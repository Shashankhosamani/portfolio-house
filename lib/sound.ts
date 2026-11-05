/** A short synthesized printer run: stepper-motor buzz over a soft hum. Only ever called from a click. */
export function printerSound(seconds = 3.2) {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const t0 = ctx.currentTime + 0.05;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t0);
  out.gain.linearRampToValueAtTime(0.09, t0 + 0.15);
  out.gain.setValueAtTime(0.09, t0 + seconds - 0.3);
  out.gain.linearRampToValueAtTime(0, t0 + seconds);
  out.connect(ctx.destination);

  // paper feed: band-passed noise, chopped by a stepper-motor rhythm
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = buf;
  const band = ctx.createBiquadFilter(); band.type = "bandpass"; band.frequency.value = 1400; band.Q.value = 1.4;
  const chop = ctx.createGain(); chop.gain.value = 0.5;
  const lfo = ctx.createOscillator(); lfo.type = "square"; lfo.frequency.value = 14;
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.45;
  lfo.connect(lfoAmt).connect(chop.gain);
  noise.connect(band).connect(chop).connect(out);

  // motor hum
  const hum = ctx.createOscillator(); hum.type = "sawtooth"; hum.frequency.value = 118;
  const humLp = ctx.createBiquadFilter(); humLp.type = "lowpass"; humLp.frequency.value = 380;
  const humGain = ctx.createGain(); humGain.gain.value = 0.25;
  hum.connect(humLp).connect(humGain).connect(out);

  [noise, lfo, hum].forEach((n) => { n.start(t0); n.stop(t0 + seconds + 0.05); });
  setTimeout(() => ctx.close().catch(() => {}), (seconds + 0.5) * 1000);
}

/* ───────── boombox: a gentle lo-fi loop made from oscillators ───────── */
let music: { ctx: AudioContext; timer: number; master: GainNode } | null = null;

export function startMusic() {
  if (music) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
  master.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.2);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; lp.connect(master);

  const bpm = 78, beat = 60 / bpm;
  // Dm9 – G13 – Cmaj9 – Am7, as frequencies
  const chords = [[146.8, 174.6, 220.0, 261.6, 329.6], [196.0, 246.9, 293.7, 349.2, 440.0], [130.8, 164.8, 196.0, 246.9, 293.7], [110.0, 130.8, 164.8, 196.0, 261.6]];
  const bass = [73.4, 98.0, 65.4, 55.0];
  let bar = 0, next = ctx.currentTime + 0.1;

  const note = (f: number, t: number, len: number, type: OscillatorType, vol: number, dest: AudioNode = lp) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(dest); o.start(t); o.stop(t + len + 0.05);
  };
  const noiseBuf = (() => { const b = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const hat = (t: number, vol: number) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(hp).connect(g).connect(master); s.start(t); s.stop(t + 0.1);
  };
  const kick = (t: number) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.32);
  };

  const schedule = () => {
    while (next < ctx.currentTime + 1.5) {
      const c = chords[bar % 4];
      c.forEach((f, i) => note(f, next + i * 0.012, beat * 3.6, "triangle", 0.05));
      note(bass[bar % 4], next, beat * 1.8, "sine", 0.22);
      note(bass[bar % 4], next + beat * 2.5, beat * 1.2, "sine", 0.16);
      for (let s = 0; s < 8; s++) hat(next + s * beat / 2 + (s % 2 ? 0.03 : 0), s % 2 ? 0.05 : 0.08);
      kick(next); kick(next + beat * 2.5);
      // a little melody on top
      [0, 1.5, 2.5, 3].forEach((p, i) => note(c[(i + bar) % c.length] * 2, next + p * beat, beat * 0.9, "sine", 0.035));
      next += beat * 4; bar++;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 400);
  music = { ctx, timer, master };
}

export function stopMusic() {
  if (!music) return;
  const m = music; music = null;
  clearInterval(m.timer);
  m.master.gain.cancelScheduledValues(m.ctx.currentTime);
  m.master.gain.setValueAtTime(m.master.gain.value, m.ctx.currentTime);
  m.master.gain.exponentialRampToValueAtTime(0.0001, m.ctx.currentTime + 0.6);
  setTimeout(() => m.ctx.close().catch(() => {}), 800);
}
