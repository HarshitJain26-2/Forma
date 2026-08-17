/**
 * Native Mobile & Web Share Dispatcher.
 * Handles system OS native share sheet, Web Share API Level 2 (Files),
 * and desktop browser fallback downloads.
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  file?: File;
  dataUrl?: string;
}

/**
 * Detects if the current platform supports native file sharing.
 */
export function isNativeShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.share) return false;
  if (typeof navigator.canShare === 'function') {
    try {
      const dummyFile = new File([''], 'test.png', { type: 'image/png' });
      return navigator.canShare({ files: [dummyFile] });
    } catch (e) {
      return false;
    }
  }
  return true;
}

/**
 * Downloads a base64 / blob URL as a PNG file on desktop / web browsers.
 */
export function downloadShareImage(dataUrl: string, filename = `forma-workout-${Date.now()}.png`): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Native Mobile & Web Share Dispatcher.
 */
export async function shareWorkoutImageNative(options: ShareOptions): Promise<{ shared: boolean; method: 'native' | 'download' }> {
  const {
    title = 'Forma Workout Complete',
    text = 'Crushed another training session on Forma — Progressive Gym Intelligence.',
    file,
    dataUrl,
  } = options;

  // 1. Attempt Native System Share Sheet with File (Web Share API Level 2)
  if (typeof navigator !== 'undefined' && navigator.share && file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        return { shared: true, method: 'native' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { shared: true, method: 'native' };
        }
        console.warn('Native file share error:', err);
      }
    }
  }

  // 2. Attempt Text / Title Native Share
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return { shared: true, method: 'native' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { shared: true, method: 'native' };
      }
    }
  }

  // 3. Desktop / Web Fallback: Direct Download
  if (dataUrl) {
    downloadShareImage(dataUrl, file?.name || `forma-workout-${Date.now()}.png`);
    return { shared: true, method: 'download' };
  }

  return { shared: false, method: 'download' };
}
