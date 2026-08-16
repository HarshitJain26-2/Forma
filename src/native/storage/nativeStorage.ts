import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Achievement, 
  BodyMeasurement, 
  PersonalRecord, 
  UserSettings, 
  WorkoutSession 
} from '../../types/workout';
import { DEFAULT_SETTINGS } from '../../storage/localStorage';
import { STORAGE_VERSION } from '../../storage/storageVersion';

const KEYS = {
  SESSIONS: 'forma_sessions_native_v1',
  ACTIVE_SESSION: 'forma_active_session_native_v1',
  PRS: 'forma_prs_native_v1',
  MEASUREMENTS: 'forma_measurements_native_v1',
  ACHIEVEMENTS: 'forma_achievements_native_v1',
  SETTINGS: 'forma_settings_native_v1',
};

async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

async function safeSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

export const nativeStorage = {
  async getSessions(): Promise<WorkoutSession[]> {
    return safeGet<WorkoutSession[]>(KEYS.SESSIONS, []);
  },
  async saveSessions(sessions: WorkoutSession[]): Promise<void> {
    await safeSet(KEYS.SESSIONS, sessions);
  },
  async addSession(session: WorkoutSession): Promise<void> {
    const current = await this.getSessions();
    const updated = [session, ...current.filter(s => s.id !== session.id)];
    await this.saveSessions(updated);
  },

  async getActiveSession(): Promise<WorkoutSession | null> {
    return safeGet<WorkoutSession | null>(KEYS.ACTIVE_SESSION, null);
  },
  async saveActiveSession(session: WorkoutSession | null): Promise<void> {
    if (session === null) {
      await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
    } else {
      await safeSet(KEYS.ACTIVE_SESSION, session);
    }
  },

  async getPRs(): Promise<PersonalRecord[]> {
    return safeGet<PersonalRecord[]>(KEYS.PRS, []);
  },
  async savePRs(prs: PersonalRecord[]): Promise<void> {
    await safeSet(KEYS.PRS, prs);
  },
  async addPR(pr: PersonalRecord): Promise<void> {
    const current = await this.getPRs();
    if (!current.some(p => p.id === pr.id)) {
      await this.savePRs([pr, ...current]);
    }
  },

  async getMeasurements(): Promise<BodyMeasurement[]> {
    return safeGet<BodyMeasurement[]>(KEYS.MEASUREMENTS, []);
  },
  async saveMeasurements(measurements: BodyMeasurement[]): Promise<void> {
    await safeSet(KEYS.MEASUREMENTS, measurements);
  },
  async addMeasurement(measurement: BodyMeasurement): Promise<void> {
    const current = await this.getMeasurements();
    await this.saveMeasurements([measurement, ...current.filter(m => m.id !== measurement.id)]);
  },

  async getAchievements(): Promise<Achievement[]> {
    return safeGet<Achievement[]>(KEYS.ACHIEVEMENTS, []);
  },
  async saveAchievements(achievements: Achievement[]): Promise<void> {
    await safeSet(KEYS.ACHIEVEMENTS, achievements);
  },

  async getSettings(): Promise<UserSettings> {
    const res = await safeGet<Partial<UserSettings>>(KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...res };
  },
  async saveSettings(settings: UserSettings): Promise<void> {
    await safeSet(KEYS.SETTINGS, settings);
  },

  async clearDemoData(): Promise<void> {
    const sessions = await this.getSessions();
    const realSessions = sessions.filter(s => !s.isDemo);
    await this.saveSessions(realSessions);

    const realIds = new Set(realSessions.map(s => s.id));
    const prs = await this.getPRs();
    await this.savePRs(prs.filter(p => realIds.has(p.workoutSessionId)));

    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, demoDataActive: false });
  },

  async resetAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.SESSIONS,
      KEYS.ACTIVE_SESSION,
      KEYS.PRS,
      KEYS.MEASUREMENTS,
      KEYS.ACHIEVEMENTS,
    ]);
    await this.saveSettings({ ...DEFAULT_SETTINGS, demoDataActive: false });
  }
};
