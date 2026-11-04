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
