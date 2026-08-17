/**
 * Native Mobile, Direct Social Apps & Web Share Dispatcher.
 * Supports:
 * - Direct Instagram Stories (File sharing, Clipboard Image injection, and deep-linking)
 * - Direct WhatsApp sharing with formatted performance summary
 * - Direct Twitter / X posting
 * - Direct Telegram sharing
 * - Direct Image Clipboard Copying
 * - Native OS System Share Sheet
 * - Desktop Browser Fallback Download
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  file?: File;
  blob?: Blob;
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
 * Copies a PNG Blob directly to the user's system clipboard.
 * Allows users to paste the image directly into Instagram Stories, WhatsApp, iMessage, etc.
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !window.ClipboardItem) {
    return false;
  }

  try {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * Copies plain text to clipboard.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn('Failed to copy text:', err);
    return false;
  }
}

/**
 * Direct Share to Instagram (Stories / Feed).
 * Copies high-res card to clipboard and launches Instagram.
 */
export async function shareDirectToInstagram(options: ShareOptions): Promise<{ success: boolean; message: string }> {
  const { file, blob, dataUrl } = options;

  // 1. If Web Share with files is supported, try opening native share with Instagram target
  if (typeof navigator !== 'undefined' && navigator.share && file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Instagram Story',
          text: 'Shared from Forma',
        });
        return { success: true, message: 'Opened native share sheet for Instagram' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: true, message: 'Share sheet closed' };
        }
      }
    }
  }

  // 2. Try copying image to clipboard for instant pasting in Instagram Stories
  let copied = false;
  if (blob) {
    copied = await copyImageToClipboard(blob);
  }

  // 3. Open Instagram App via URI scheme or Web
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (isMobile) {
    window.location.href = 'instagram://story-camera';
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 1500);
  } else {
    window.open('https://www.instagram.com/', '_blank');
  }

  if (copied) {
    return { success: true, message: 'Story image copied to clipboard! Paste directly into your Instagram Story.' };
  } else if (dataUrl) {
    downloadShareImage(dataUrl, 'forma-instagram-story.png');
    return { success: true, message: 'Story image downloaded! Upload to your Instagram Story.' };
  }

  return { success: true, message: 'Opening Instagram' };
}

/**
 * Direct Share to WhatsApp.
 */
export async function shareDirectToWhatsApp(text: string, file?: File, dataUrl?: string): Promise<void> {
  const encodedText = encodeURIComponent(text);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  
  if (isMobile) {
    window.open(`whatsapp://send?text=${encodedText}`, '_blank');
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  }

  if (dataUrl) {
    downloadShareImage(dataUrl, 'forma-workout.png');
  }
}

/**
 * Direct Share to Twitter / X.
 */
export function shareDirectToTwitter(text: string): void {
  const encodedText = encodeURIComponent(text);
  window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
}

/**
 * Direct Share to Telegram.
 */
export function shareDirectToTelegram(text: string): void {
  const encodedText = encodeURIComponent(text);
  window.open(`https://t.me/share/url?url=https://forma.app&text=${encodedText}`, '_blank');
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
