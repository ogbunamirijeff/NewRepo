/* =========================================================================
   VELOUR GHOST — ATMOSPHERE
   Generative ambient drone built with the Web Audio API. No audio files.
   Starts ONLY after an explicit user gesture, fades in quietly, and the
   visitor's choice is remembered for the session.
   ========================================================================= */
(function () {
  'use strict';
  let ctx = null, master = null, on = false, bellTimer = null;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -24;
    master.connect(comp).connect(ctx.destination);

    // simple feedback delay as a "room"
    const delay = ctx.createDelay(2); delay.delayTime.value = .42;
    const fb = ctx.createGain(); fb.gain.value = .45;
    const wet = ctx.createGain(); wet.gain.value = .5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    delay.connect(lp).connect(fb).connect(delay); lp.connect(wet).connect(master);

    // low drone — two detuned oscillators through a breathing filter
    const droneF = ctx.createBiquadFilter(); droneF.type = 'lowpass'; droneF.frequency.value = 220; droneF.Q.value = 6;
    const droneG = ctx.createGain(); droneG.gain.value = .32;
    [[55, 'sawtooth'], [55.35, 'sawtooth'], [82.4, 'triangle'], [27.5, 'sine']].forEach(([f, t]) => {
      const o = ctx.createOscillator(); o.type = t; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = t === 'sine' ? .9 : .22; o.connect(g).connect(droneF); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = .045; const lfoG = ctx.createGain(); lfoG.gain.value = 140; lfo.connect(lfoG).connect(droneF.frequency); lfo.start();
    droneF.connect(droneG).connect(master); droneG.connect(delay);

    // wind — filtered noise
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = .7;
    const nG = ctx.createGain(); nG.gain.value = .14;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = .07; const l2g = ctx.createGain(); l2g.gain.value = 300; lfo2.connect(l2g).connect(bp.frequency); lfo2.start();
    noise.connect(bp).connect(nG).connect(master); noise.start();

    ctx.__delay = delay;
  }

  function bell() {
    if (!ctx || !on) return;
    const t = ctx.currentTime, base = [392, 466.2, 587.3, 698.5, 233.1][Math.floor(Math.random() * 5)];
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 / (i + 1), t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 4.5 / (i + 1));
      o.connect(g); g.connect(master); g.connect(ctx.__delay); o.start(t); o.stop(t + 5);
    });
    bellTimer = setTimeout(bell, 7000 + Math.random() * 11000);
  }

  function start() {
    try {
      if (!ctx) build();
      ctx.resume();
      on = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(.16, ctx.currentTime, 2.2);
      clearTimeout(bellTimer); bellTimer = setTimeout(bell, 3500);
      try { sessionStorage.setItem('vg-sound', '1'); } catch (e) { }
    } catch (e) { on = false; }
    emit();
  }
  function stop() {
    on = false; clearTimeout(bellTimer);
    if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, .5); setTimeout(() => { if (!on && ctx) ctx.suspend(); }, 1600); }
    try { sessionStorage.setItem('vg-sound', '0'); } catch (e) { }
    emit();
  }
  function emit() { document.dispatchEvent(new CustomEvent('vg:sound', { detail: { on } })); }
  function chime() { // tiny UI tick, only when sound is on
    if (!ctx || !on) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(700, t + .12);
    g.gain.setValueAtTime(.03, t); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g).connect(master); o.start(t); o.stop(t + .3);
  }

  window.VGAudio = { start, stop, toggle: () => (on ? stop() : start()), isOn: () => on, chime };
})();
