import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  Achievement, 
  BodyMeasurement, 
  ExerciseLog, 
  PersonalRecord, 
  SetLog, 
  UserSettings, 
  WorkoutDay, 
  WorkoutSession, 
  Weekday 
} from '../../types/workout';
import { WORKOUT_PROGRAM } from '../../data/workoutProgram';
import { generateSeedData, INITIAL_ACHIEVEMENTS } from '../../data/seedData';
import { DEFAULT_SETTINGS } from '../../storage/localStorage';
import { nativeStorage } from '../storage/nativeStorage';
import { checkExerciseVolumePR, checkSetForPR } from '../../engine/prEngine';
import { calculateSessionVolume } from '../../utils/calculations';
import { getCurrentWeekday } from '../../utils/dates';
import { haptic } from '../utils/haptics';

interface RestTimerState {
  isRunning: boolean;
  secondsRemaining: number;
  totalSeconds: number;
}

interface NativeWorkoutContextType {
  program: WorkoutDay[];
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  measurements: BodyMeasurement[];
  achievements: Achievement[];
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;

  activeSession: WorkoutSession | null;
  workoutDuration: number;
  startWorkout: (dayId: Weekday | number | string) => void;
  discardWorkout: () => void;
  completeWorkout: (notes?: string, overallRpe?: number, energyRating?: number) => void;
  toggleSetComplete: (exerciseId: string, setIndex: number) => void;
  updateSetValues: (exerciseId: string, setIndex: number, weightKg: number, reps: number, rpe?: number) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateExerciseNote: (exerciseId: string, note: string) => void;

  restTimer: RestTimerState;
  startRestTimer: (seconds?: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  skipRestTimer: () => void;
  addTimerSeconds: (seconds: number) => void;

  activePRCelebration: PersonalRecord | null;
  dismissPRCelebration: () => void;

  completedSummarySession: WorkoutSession | null;
  dismissCompletedSummary: () => void;

  addMeasurement: (measurement: Omit<BodyMeasurement, 'id' | 'timestamp'>) => void;
  deleteMeasurement: (id: string) => void;

  clearDemoData: () => Promise<void>;
  resetAllData: () => Promise<void>;

  todaySplitDay: WorkoutDay;
  isLoaded: boolean;
}

const NativeWorkoutContext = createContext<NativeWorkoutContextType | undefined>(undefined);

export const NativeWorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isRunning: false,
    secondsRemaining: 0,
    totalSeconds: 90,
  });

  const [activePRCelebration, setActivePRCelebration] = useState<PersonalRecord | null>(null);
  const [completedSummarySession, setCompletedSummarySession] = useState<WorkoutSession | null>(null);

  // Initialize from AsyncStorage
  useEffect(() => {
    async function init() {
      const storedSettings = await nativeStorage.getSettings();
      setSettings(storedSettings);

      let storedSessions = await nativeStorage.getSessions();
      if (storedSessions.length === 0 && storedSettings.demoDataActive) {
        const seed = generateSeedData();
        await nativeStorage.saveSessions(seed.sessions);
        await nativeStorage.savePRs(seed.prs);
        await nativeStorage.saveMeasurements(seed.measurements);
        await nativeStorage.saveAchievements(INITIAL_ACHIEVEMENTS);
        storedSessions = seed.sessions;
        setPrs(seed.prs);
        setMeasurements(seed.measurements);
      } else {
        const [storedPRs, storedMeas, storedAch] = await Promise.all([
          nativeStorage.getPRs(),
          nativeStorage.getMeasurements(),
          nativeStorage.getAchievements(),
        ]);
        setPrs(storedPRs);
        setMeasurements(storedMeas);
        setAchievements(storedAch.length > 0 ? storedAch : INITIAL_ACHIEVEMENTS);
      }

      setSessions(storedSessions);

      const active = await nativeStorage.getActiveSession();
      if (active) {
        setActiveSession(active);
        setWorkoutDuration(Math.floor((Date.now() - active.startedAt) / 1000));
      }

      setIsLoaded(true);
    }
    init();
  }, []);

  // Save active session
  useEffect(() => {
    if (isLoaded) {
      nativeStorage.saveActiveSession(activeSession);
    }
  }, [activeSession, isLoaded]);

  // Workout duration ticker
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'IN_PROGRESS') return;

    const interval = setInterval(() => {
      const dur = Math.floor((Date.now() - activeSession.startedAt) / 1000);
      setWorkoutDuration(dur);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Rest Timer ticker
  useEffect(() => {
    if (!restTimer.isRunning || restTimer.secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (!prev.isRunning || prev.secondsRemaining <= 0) return prev;
        const next = prev.secondsRemaining - 1;

        if (next === 10) {
          haptic.warning();
        }

        if (next === 0) {
          haptic.heavy();
          return { ...prev, isRunning: false, secondsRemaining: 0 };
        }

        return { ...prev, secondsRemaining: next };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isRunning, restTimer.secondsRemaining]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await nativeStorage.saveSettings(updated);
  };

  const startRestTimer = (seconds?: number) => {
    const dur = seconds || settings.defaultRestSeconds || 90;
    setRestTimer({
      isRunning: true,
      secondsRemaining: dur,
      totalSeconds: dur,
    });
  };

  const pauseRestTimer = () => setRestTimer(p => ({ ...p, isRunning: false }));
  const resumeRestTimer = () => {
    if (restTimer.secondsRemaining > 0) setRestTimer(p => ({ ...p, isRunning: true }));
  };
  const skipRestTimer = () => setRestTimer(p => ({ ...p, isRunning: false, secondsRemaining: 0 }));
  const addTimerSeconds = (sec: number) => {
    setRestTimer(p => ({
      ...p,
      secondsRemaining: Math.max(0, p.secondsRemaining + sec),
      totalSeconds: Math.max(p.totalSeconds, p.secondsRemaining + sec),
    }));
  };

  const startWorkout = (dayId: Weekday | number | string) => {
    let dayDef = WORKOUT_PROGRAM.find(d => d.weekday === dayId || d.id === dayId || d.dayNumber === dayId);
    if (!dayDef) dayDef = WORKOUT_PROGRAM[0];
    if (dayDef.isRestDay) return;

    haptic.medium();

    const exerciseLogs: ExerciseLog[] = dayDef.exercises.map(ex => {
      const prevSession = sessions
        .filter(s => s.status === 'COMPLETED')
        .find(s => s.exerciseLogs.some(e => e.exerciseId === ex.id));

      let lastWeight = ex.defaultWeightKg;
      if (prevSession) {
        const prevEx = prevSession.exerciseLogs.find(e => e.exerciseId === ex.id);
        const completedSets = prevEx?.sets.filter(s => s.completed);
        if (completedSets && completedSets.length > 0) {
          lastWeight = completedSets[completedSets.length - 1].weightKg;
        }
      }

      const sets: SetLog[] = Array.from({ length: ex.targetSets }).map((_, idx) => ({
        id: `set-${Date.now()}-${ex.id}-${idx + 1}`,
        setNumber: idx + 1,
        weightKg: ex.isFailureBased ? 0 : lastWeight,
        reps: ex.isFailureBased ? 0 : ex.targetRepMax,
        completed: false,
      }));

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetSets: ex.targetSets,
        targetRepMin: ex.targetRepMin,
        targetRepMax: ex.targetRepMax,
        sets,
        completed: false,
        isFailureBased: ex.isFailureBased,
      };
    });

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      workoutDayId: dayDef.id,
      weekday: dayDef.weekday,
      dayNumber: dayDef.dayNumber,
      title: `${dayDef.displayName.toUpperCase()} — ${dayDef.title}`,
      variation: dayDef.variation,
      status: 'IN_PROGRESS',
      startedAt: Date.now(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      totalSets: 0,
      totalReps: 0,
      exerciseLogs,
      prsAchieved: [],
    };

    setActiveSession(newSession);
    setWorkoutDuration(0);
  };

  const discardWorkout = () => {
    haptic.warning();
    setActiveSession(null);
    nativeStorage.saveActiveSession(null);
    setWorkoutDuration(0);
    skipRestTimer();
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    if (!activeSession) return;

    const dayDef = WORKOUT_PROGRAM.find(
      d => d.id === activeSession.workoutDayId || d.weekday === activeSession.weekday || d.dayNumber === activeSession.dayNumber
    );
    const exerciseDef = dayDef?.exercises.find(e => e.id === exerciseId);

    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;

      const updatedSets = exLog.sets.map((set, idx) => {
        if (idx !== setIndex) return set;
        const newCompleted = !set.completed;
        return {
          ...set,
          completed: newCompleted,
          timestamp: newCompleted ? Date.now() : undefined,
        };
      });

      return {
        ...exLog,
        sets: updatedSets,
        completed: updatedSets.every(s => s.completed),
      };
    });

    const targetSet = updatedLogs.find(e => e.exerciseId === exerciseId)?.sets[setIndex];
    const justCompleted = targetSet?.completed;
    let newPRsList = [...(activeSession.prsAchieved || [])];

    if (justCompleted && exerciseDef && targetSet) {
      haptic.success();

      const detectedPRs = checkSetForPR(
        exerciseDef,
        targetSet,
        sessions,
        activeSession.id,
        newPRsList,
        settings.units
      );

      if (detectedPRs.length > 0) {
        haptic.heavy();
        detectedPRs.forEach(pr => {
          newPRsList.push(pr);
          nativeStorage.addPR(pr);
        });
        setPrs(prev => [...detectedPRs, ...prev]);
        setActivePRCelebration(detectedPRs[0]);
      }

      startRestTimer(settings.defaultRestSeconds);
    } else {
      haptic.light();
    }

    const updatedSession: WorkoutSession = {
      ...activeSession,
      exerciseLogs: updatedLogs,
      prsAchieved: newPRsList,
      totalVolumeKg: calculateSessionVolume({ ...activeSession, exerciseLogs: updatedLogs }),
    };

    setActiveSession(updatedSession);
  };

  const updateSetValues = (
    exerciseId: string,
    setIndex: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => {
    if (!activeSession) return;

    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;
      const updatedSets = exLog.sets.map((set, idx) => {
        if (idx !== setIndex) return set;
        return {
          ...set,
          weightKg: Math.max(0, weightKg),
          reps: Math.max(0, reps),
          rpe: rpe && rpe > 0 ? Math.min(10, Math.max(1, rpe)) : undefined,
        };
      });
      return { ...exLog, sets: updatedSets };
    });

    setActiveSession({
      ...activeSession,
      exerciseLogs: updatedLogs,
      totalVolumeKg: calculateSessionVolume({ ...activeSession, exerciseLogs: updatedLogs }),
    });
  };

  const addSet = (exerciseId: string) => {
    if (!activeSession) return;
    haptic.light();
    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;
      const lastSet = exLog.sets[exLog.sets.length - 1];
      const newSet: SetLog = {
        id: `set-${Date.now()}-${exLog.sets.length + 1}`,
        setNumber: exLog.sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      };
      return {
        ...exLog,
        sets: [...exLog.sets, newSet],
        targetSets: exLog.targetSets + 1,
        completed: false,
      };
    });

    setActiveSession({ ...activeSession, exerciseLogs: updatedLogs });
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    if (!activeSession) return;
    haptic.light();
    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;
      if (exLog.sets.length <= 1) return exLog;
      const updatedSets = exLog.sets
        .filter((_, idx) => idx !== setIndex)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return {
        ...exLog,
        sets: updatedSets,
        targetSets: Math.max(1, exLog.targetSets - 1),
        completed: updatedSets.every(s => s.completed),
      };
    });

    setActiveSession({ ...activeSession, exerciseLogs: updatedLogs });
  };

  const updateExerciseNote = (exerciseId: string, note: string) => {
    if (!activeSession) return;
    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;
      return { ...exLog, note };
    });
    setActiveSession({ ...activeSession, exerciseLogs: updatedLogs });
  };

  const completeWorkout = async (notes?: string, overallRpe?: number, energyRating?: number) => {
    if (!activeSession) return;
    haptic.success();

    const completedTime = Date.now();
    const finalDuration = Math.max(60, Math.floor((completedTime - activeSession.startedAt) / 1000));
    const totalVolume = calculateSessionVolume(activeSession);
    const dayDef = WORKOUT_PROGRAM.find(
      d => d.id === activeSession.workoutDayId || d.weekday === activeSession.weekday || d.dayNumber === activeSession.dayNumber
    );

    let finalPRs = [...(activeSession.prsAchieved || [])];
    activeSession.exerciseLogs.forEach(exLog => {
      const exDef = dayDef?.exercises.find(e => e.id === exLog.exerciseId);
      if (exDef) {
        const volPR = checkExerciseVolumePR(
          exDef,
          exLog,
          sessions,
          activeSession.id,
          finalPRs,
          settings.units
        );
        if (volPR) {
          finalPRs.push(volPR);
          nativeStorage.addPR(volPR);
        }
      }
    });

    const totalSets = activeSession.exerciseLogs.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
    const totalReps = activeSession.exerciseLogs.reduce(
      (sum, e) => sum + e.sets.filter(s => s.completed).reduce((r, s) => r + s.reps, 0), 0
    );

    const completedSession: WorkoutSession = {
      ...activeSession,
      status: 'COMPLETED',
      completedAt: completedTime,
      durationSeconds: finalDuration,
      totalVolumeKg: totalVolume,
      totalSets,
      totalReps,
      notes,
      overallRpe: overallRpe || 8,
      energyRating: energyRating || 4,
      prsAchieved: finalPRs,
    };

    await nativeStorage.addSession(completedSession);
    const updated = await nativeStorage.getSessions();
    setSessions(updated);
    setPrs(await nativeStorage.getPRs());

    setActiveSession(null);
    await nativeStorage.saveActiveSession(null);
    skipRestTimer();

    setCompletedSummarySession(completedSession);
  };

  const dismissPRCelebration = () => setActivePRCelebration(null);
  const dismissCompletedSummary = () => setCompletedSummarySession(null);

  const addMeasurement = async (measData: Omit<BodyMeasurement, 'id' | 'timestamp'>) => {
    const newMeas: BodyMeasurement = {
      ...measData,
      id: `meas-${Date.now()}`,
      timestamp: Date.now(),
    };
    await nativeStorage.addMeasurement(newMeas);
    setMeasurements(await nativeStorage.getMeasurements());
  };

  const deleteMeasurement = async (id: string) => {
    const current = (await nativeStorage.getMeasurements()).filter(m => m.id !== id);
    await nativeStorage.saveMeasurements(current);
    setMeasurements(current);
  };

  const clearDemoData = async () => {
    await nativeStorage.clearDemoData();
    setSessions(await nativeStorage.getSessions());
    setPrs(await nativeStorage.getPRs());
    setSettings(await nativeStorage.getSettings());
  };

  const resetAllData = async () => {
    await nativeStorage.resetAll();
    setSessions([]);
    setPrs([]);
    setMeasurements([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setSettings(await nativeStorage.getSettings());
    setActiveSession(null);
    setWorkoutDuration(0);
  };

  const todaySplitDay = useMemo(() => {
    const currentWeekday = getCurrentWeekday();
    return WORKOUT_PROGRAM.find(d => d.weekday === currentWeekday) || WORKOUT_PROGRAM[0];
  }, []);

  return (
    <NativeWorkoutContext.Provider
      value={{
        program: WORKOUT_PROGRAM,
        sessions,
        prs,
        measurements,
        achievements,
        settings,
        updateSettings,
        activeSession,
        workoutDuration,
        startWorkout,
        discardWorkout,
        completeWorkout,
        toggleSetComplete,
        updateSetValues,
        addSet,
        removeSet,
        updateExerciseNote,
        restTimer,
        startRestTimer,
        pauseRestTimer,
        resumeRestTimer,
        skipRestTimer,
        addTimerSeconds,
        activePRCelebration,
        dismissPRCelebration,
        completedSummarySession,
        dismissCompletedSummary,
        addMeasurement,
        deleteMeasurement,
        clearDemoData,
        resetAllData,
        todaySplitDay,
        isLoaded,
      }}
    >
      {children}
    </NativeWorkoutContext.Provider>
  );
};

export const useNativeWorkout = () => {
  const ctx = useContext(NativeWorkoutContext);
  if (!ctx) throw new Error('useNativeWorkout must be used within NativeWorkoutProvider');
  return ctx;
};
