/**
 * Web Audio API synthesizer for clean, pleasant classroom alerts
 * No external sound files or internet connection required.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext not available:', err);
    return null;
  }
}

/**
 * Short crisp tick for group roulette/shuffle animation
 */
export function playTick(volume = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.2 * volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.045);
}

/**
 * Multi-harmonic crystal bell chime for time-up alerts
 */
export function playChime(volume = 0.8): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Harmonious chord: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
  const frequencies = [523.25, 659.25, 783.99, 1046.50];
  const startTime = ctx.currentTime;

  frequencies.forEach((freq, idx) => {
    const noteStart = startTime + idx * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    // Subtle pitch vibrato for organic bell resonance
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.35 * volume, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 1.85);
  });
}

/**
 * Gentle 1-minute warning chime
 */
export function playWarningChime(volume = 0.6): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [659.25, 880.00]; // E5, A5
  const startTime = ctx.currentTime;

  freqs.forEach((freq, idx) => {
    const noteStart = startTime + idx * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.25 * volume, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.95);
  });
}

/**
 * Celebratory short fanfare when picking a group or all finished
 */
export function playFanfare(volume = 0.7): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Upbeat arpeggio: G4, C5, E5, G5
  const notes = [392.00, 523.25, 659.25, 783.99];
  const startTime = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const noteStart = startTime + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    const duration = idx === notes.length - 1 ? 1.2 : 0.3;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.3 * volume, noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + duration + 0.05);
  });
}
