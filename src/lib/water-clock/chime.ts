/**
 * Synthesized Temple Gong / Bell (Ghaṇṭā) Chime
 * Uses Web Audio API to produce an authentic resonant bronze strike
 * without external audio assets.
 */

export function playGhatikaChime(volume: number = 0.5) {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Harmonic series of a tuned bronze temple bell:
    // Fundamental + strike tone + overtone resonance
    const freqs = [329.63, 659.25, 987.77, 1318.51, 1975.53]; // E4 harmonic series
    const gainWeights = [0.5, 0.3, 0.15, 0.08, 0.04];
    const decays = [3.5, 2.8, 1.9, 1.2, 0.8];
    
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), now);
    masterGain.connect(ctx.destination);
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Slight detune for metallic chime timbre
      osc.frequency.setValueAtTime(freq * (1 + (i % 2 === 0 ? 0.003 : -0.003)), now);
      
      const initialGain = gainWeights[i];
      gain.gain.setValueAtTime(initialGain, now);
      // Bell strike exponential decay
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[i]);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + decays[i]);
    });
  } catch {
    // Ignore audio context autoplay restrictions gracefully
  }
}
