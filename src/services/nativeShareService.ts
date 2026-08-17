/**
 * Native Mobile & Web Share Dispatcher.
 * Handles system OS native share sheet, Web Share API Level 2 (Files),
 * and clean offline file distribution.
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  file?: File;
  dataUrl?: string;
}

export async function shareWorkoutImageNative(options: ShareOptions): Promise<{ shared: boolean; method: 'native' | 'fallback' }> {
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
          // User closed the share sheet
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

  return { shared: false, method: 'fallback' };
}
