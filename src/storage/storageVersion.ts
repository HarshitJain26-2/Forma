export const STORAGE_VERSION = 1;

export interface StorageDataPayload {
  version: number;
  exportedAt: string;
  workouts: any[];
  prs: any[];
  measurements: any[];
  settings: any;
  achievements?: any[];
  activeWorkoutSession?: any;
}

export function migrateStorageIfNeeded(): void {
  try {
    const rawVersion = localStorage.getItem('forma_storage_version');
    const currentVer = rawVersion ? parseInt(rawVersion, 10) : 0;
    
    if (currentVer < STORAGE_VERSION) {
      // Perform migrations if needed (v0 -> v1)
      localStorage.setItem('forma_storage_version', STORAGE_VERSION.toString());
    }
  } catch (err) {
    console.warn('Storage migration check error:', err);
  }
}
