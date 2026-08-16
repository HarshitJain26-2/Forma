import { Achievement, BodyMeasurement, PersonalRecord, UserSettings, WorkoutSession } from '../types/workout';
import { STORAGE_VERSION, StorageDataPayload } from './storageVersion';

const KEYS = {
  SESSIONS: 'forma_sessions_v1',
  ACTIVE_SESSION: 'forma_active_session_v1',
  PRS: 'forma_prs_v1',
  MEASUREMENTS: 'forma_measurements_v1',
  ACHIEVEMENTS: 'forma_achievements_v1',
  SETTINGS: 'forma_settings_v1',
  REST_TIMER_STATE: 'forma_rest_timer_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  units: 'kg',
  defaultRestSeconds: 90,
  soundEnabled: true,
  hapticsEnabled: true,
  userName: 'Athlete',
  hasSeenOnboarding: true,
  demoDataActive: true,
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const storage = {
  // SESSIONS
  getSessions(): WorkoutSession[] {
    return safeParse<WorkoutSession[]>(KEYS.SESSIONS, []);
  },
  saveSessions(sessions: WorkoutSession[]): void {
    safeSet(KEYS.SESSIONS, sessions);
  },
  addSession(session: WorkoutSession): void {
    const current = this.getSessions();
    // Prepend new session
    const updated = [session, ...current.filter(s => s.id !== session.id)];
    this.saveSessions(updated);
  },

  // ACTIVE WORKOUT SESSION (For refresh persistence)
  getActiveSession(): WorkoutSession | null {
    return safeParse<WorkoutSession | null>(KEYS.ACTIVE_SESSION, null);
  },
  saveActiveSession(session: WorkoutSession | null): void {
    if (session === null) {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
    } else {
      safeSet(KEYS.ACTIVE_SESSION, session);
    }
  },

  // PERSONAL RECORDS
  getPRs(): PersonalRecord[] {
    return safeParse<PersonalRecord[]>(KEYS.PRS, []);
  },
  savePRs(prs: PersonalRecord[]): void {
    safeSet(KEYS.PRS, prs);
  },
  addPR(pr: PersonalRecord): void {
    const current = this.getPRs();
    if (!current.some(p => p.id === pr.id)) {
      this.savePRs([pr, ...current]);
    }
  },

  // MEASUREMENTS
  getMeasurements(): BodyMeasurement[] {
    return safeParse<BodyMeasurement[]>(KEYS.MEASUREMENTS, []);
  },
  saveMeasurements(measurements: BodyMeasurement[]): void {
    safeSet(KEYS.MEASUREMENTS, measurements);
  },
  addMeasurement(measurement: BodyMeasurement): void {
    const current = this.getMeasurements();
    this.saveMeasurements([measurement, ...current.filter(m => m.id !== measurement.id)]);
  },

  // ACHIEVEMENTS
  getAchievements(): Achievement[] {
    return safeParse<Achievement[]>(KEYS.ACHIEVEMENTS, []);
  },
  saveAchievements(achievements: Achievement[]): void {
    safeSet(KEYS.ACHIEVEMENTS, achievements);
  },

  // SETTINGS
  getSettings(): UserSettings {
    return { ...DEFAULT_SETTINGS, ...safeParse<Partial<UserSettings>>(KEYS.SETTINGS, {}) };
  },
  saveSettings(settings: UserSettings): void {
    safeSet(KEYS.SETTINGS, settings);
  },

  // REST TIMER STATE
  getRestTimerState(): { secondsRemaining: number; totalSeconds: number; targetTimestamp: number; isRunning: boolean } | null {
    return safeParse(KEYS.REST_TIMER_STATE, null);
  },
  saveRestTimerState(state: any): void {
    if (state === null) {
      localStorage.removeItem(KEYS.REST_TIMER_STATE);
    } else {
      safeSet(KEYS.REST_TIMER_STATE, state);
    }
  },

  // EXPORT FULL BACKUP
  exportBackup(): string {
    const payload: StorageDataPayload = {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      workouts: this.getSessions(),
      prs: this.getPRs(),
      measurements: this.getMeasurements(),
      settings: this.getSettings(),
      achievements: this.getAchievements(),
    };
    return JSON.stringify(payload, null, 2);
  },

  // IMPORT BACKUP
  importBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid JSON file format' };
      }
      if (!Array.isArray(data.workouts)) {
        return { success: false, error: 'Backup is missing valid workouts list' };
      }

      if (data.workouts) this.saveSessions(data.workouts);
      if (data.prs) this.savePRs(data.prs);
      if (data.measurements) this.saveMeasurements(data.measurements);
      if (data.settings) this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.achievements) this.saveAchievements(data.achievements);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse backup JSON' };
    }
  },

  // CLEAR DEMO DATA (Keep real user workouts or reset all to blank)
  clearDemoData(): void {
    const currentSessions = this.getSessions();
    const realSessions = currentSessions.filter(s => !s.isDemo);
    this.saveSessions(realSessions);

    // Filter demo PRs
    const realSessionIds = new Set(realSessions.map(s => s.id));
    const currentPRs = this.getPRs();
    const realPRs = currentPRs.filter(p => realSessionIds.has(p.workoutSessionId));
    this.savePRs(realPRs);

    const currentSettings = this.getSettings();
    this.saveSettings({ ...currentSettings, demoDataActive: false });
  },

  // RESET ALL DATA
  resetAll(): void {
    localStorage.removeItem(KEYS.SESSIONS);
    localStorage.removeItem(KEYS.ACTIVE_SESSION);
    localStorage.removeItem(KEYS.PRS);
    localStorage.removeItem(KEYS.MEASUREMENTS);
    localStorage.removeItem(KEYS.ACHIEVEMENTS);
    localStorage.removeItem(KEYS.REST_TIMER_STATE);
    this.saveSettings({ ...DEFAULT_SETTINGS, demoDataActive: false });
  }
};
