import { Audio } from 'expo-av';

// Generate a clean PCM WAV base64 string
function generateSineWaveWavBase64(frequencies: { freq: number; durationMs: number; volume?: number }[]): string {
  const sampleRate = 22050;
  let totalSamples = 0;
  frequencies.forEach(f => {
    totalSamples += Math.floor((sampleRate * f.durationMs) / 1000);
  });

  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // format chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  frequencies.forEach(f => {
    const samples = Math.floor((sampleRate * f.durationMs) / 1000);
    const vol = f.volume !== undefined ? f.volume : 0.8;
    for (let i = 0; i < samples; i++) {
      // Fade envelope at edges to prevent clicking
      const envelope = Math.min(1, Math.min(i / 100, (samples - i) / 100));
      const sample = Math.sin((2 * Math.PI * f.freq * i) / sampleRate) * vol * envelope;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  });

  // Convert binary buffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate sound base64 URIs
const START_BEEP_URI = `data:audio/wav;base64,${generateSineWaveWavBase64([
  { freq: 880, durationMs: 90, volume: 0.8 },
  { freq: 0, durationMs: 30, volume: 0 },
  { freq: 1320, durationMs: 120, volume: 0.9 },
])}`;

const COUNTDOWN_TICK_URI = `data:audio/wav;base64,${generateSineWaveWavBase64([
  { freq: 700, durationMs: 80, volume: 0.6 },
])}`;

const TIMER_END_URI = `data:audio/wav;base64,${generateSineWaveWavBase64([
  { freq: 659.25, durationMs: 100, volume: 0.8 }, // E5
  { freq: 0, durationMs: 20, volume: 0 },
  { freq: 880, durationMs: 120, volume: 0.85 },   // A5
  { freq: 0, durationMs: 20, volume: 0 },
  { freq: 1318.51, durationMs: 250, volume: 1.0 }, // E6
])}`;

async function playAudioUri(uri: string) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (e) {
    // Graceful fallback if audio is muted or not available
  }
}

export const soundEffects = {
  playTimerStart: () => playAudioUri(START_BEEP_URI),
  playCountdownTick: () => playAudioUri(COUNTDOWN_TICK_URI),
  playTimerEnd: () => playAudioUri(TIMER_END_URI),
};
