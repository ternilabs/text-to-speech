type AudioContextConstructor = typeof AudioContext;

type BrowserAudioGlobal = typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

const getAudioContextConstructor = () => {
  const audioGlobal = globalThis as BrowserAudioGlobal;
  return audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
};

export async function validateMp3(bytes: Uint8Array): Promise<boolean> {
  const AudioContextCtor = getAudioContextConstructor();

  if (!AudioContextCtor) {
    return false;
  }

  const context = new AudioContextCtor();
  const buffer = new Uint8Array(bytes).buffer;

  try {
    await context.decodeAudioData(buffer);
    return true;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}
