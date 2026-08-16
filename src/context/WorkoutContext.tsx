import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Achievement, 
  BodyMeasurement, 
  Exercise, 
  ExerciseLog, 
  PersonalRecord, 
  SetLog, 
  UserSettings, 
  WorkoutDay, 
  WorkoutSession, 
  WorkoutStatus 
} from '../types/workout';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { generateSeedData, INITIAL_ACHIEVEMENTS } from '../data/seedData';
import { DEFAULT_SETTINGS, storage } from '../storage/localStorage';
import { migrateStorageIfNeeded } from '../storage/storageVersion';
import { checkExerciseVolumePR, checkSetForPR } from '../engine/prEngine';
import { calculateSessionVolume } from '../utils/calculations';
import { sound } from '../utils/audio';

interface RestTimerState {
  isRunning: boolean;
  secondsRemaining: number;
  totalSeconds: number;
}

interface WorkoutContextType {
  // Data
  program: WorkoutDay[];
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  measurements: BodyMeasurement[];
  achievements: Achievement[];
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Active workout
  activeSession: WorkoutSession | null;
  workoutDuration: number;
  startWorkout: (dayNumber: number) => void;
  discardWorkout: () => void;
  completeWorkout: (notes?: string, overallRpe?: number, energyRating?: number) => void;
  toggleSetComplete: (exerciseId: string, setIndex: number) => void;
  updateSetValues: (exerciseId: string, setIndex: number, weightKg: number, reps: number, rpe?: number) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateExerciseNote: (exerciseId: string, note: string) => void;

  // Rest timer
  restTimer: RestTimerState;
  startRestTimer: (seconds?: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  skipRestTimer: () => void;
  addTimerSeconds: (seconds: number) => void;

  // PR Celebration Modal
  activePRCelebration: PersonalRecord | null;
  dismissPRCelebration: () => void;

  // Workout Completion Summary Modal
  completedSummarySession: WorkoutSession | null;
  dismissCompletedSummary: () => void;

  // Body Measurements
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id' | 'timestamp'>) => void;
  deleteMeasurement: (id: string) => void;

  // Data management
  clearDemoData: () => void;
  exportBackup: () => string;
  importBackup: (json: string) => { success: boolean; error?: string };
  resetAllData: () => void;

  // Current cycle day helper
  todaySplitDay: WorkoutDay;
  nextSplitDay: WorkoutDay;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Run storage migration on initialization
  useEffect(() => {
    migrateStorageIfNeeded();
  }, []);

  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    const stored = storage.getSessions();
    if (stored.length === 0 && settings.demoDataActive) {
      const seed = generateSeedData();
      storage.saveSessions(seed.sessions);
      storage.savePRs(seed.prs);
      storage.saveMeasurements(seed.measurements);
      storage.saveAchievements(INITIAL_ACHIEVEMENTS);
      return seed.sessions;
    }
    return stored;
  });

  const [prs, setPrs] = useState<PersonalRecord[]>(() => storage.getPRs());
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() => storage.getMeasurements());
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const stored = storage.getAchievements();
    return stored.length > 0 ? stored : INITIAL_ACHIEVEMENTS;
  });

  // Active workout session (saved in localStorage for seamless refresh persistence)
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => storage.getActiveSession());
  const [workoutDuration, setWorkoutDuration] = useState<number>(() => {
    const active = storage.getActiveSession();
    if (!active) return 0;
    return Math.floor((Date.now() - active.startedAt) / 1000);
  });

  // Rest Timer State
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isRunning: false,
    secondsRemaining: 0,
    totalSeconds: 90,
  });

  // Modals
  const [activePRCelebration, setActivePRCelebration] = useState<PersonalRecord | null>(null);
  const [completedSummarySession, setCompletedSummarySession] = useState<WorkoutSession | null>(null);

  // Sync sound settings to sound manager
  useEffect(() => {
    sound.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Save active session changes to storage
  useEffect(() => {
    storage.saveActiveSession(activeSession);
  }, [activeSession]);

  // Workout duration timer ticker
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'IN_PROGRESS') return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - activeSession.startedAt) / 1000);
      setWorkoutDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Rest Timer ticker with Web Audio warning and chime
  useEffect(() => {
    if (!restTimer.isRunning || restTimer.secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setRestTimer(prev => {
        if (!prev.isRunning || prev.secondsRemaining <= 0) return prev;

        const next = prev.secondsRemaining - 1;

        // 10s warning beep
        if (next === 10) {
          sound.playWarningTick();
        }

        // Finished chime
        if (next === 0) {
          sound.playTimerComplete();
          if (navigator.vibrate && settings.hapticsEnabled) {
            try { navigator.vibrate([200, 100, 200]); } catch (e) {}
          }
          return { ...prev, isRunning: false, secondsRemaining: 0 };
        }

        return { ...prev, secondsRemaining: next };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restTimer.isRunning, restTimer.secondsRemaining, settings.hapticsEnabled]);

  // Settings update
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      storage.saveSettings(updated);
      return updated;
    });
  };

  // Rest Timer Controls
  const startRestTimer = (seconds?: number) => {
    const dur = seconds || settings.defaultRestSeconds || 90;
    setRestTimer({
      isRunning: true,
      secondsRemaining: dur,
      totalSeconds: dur,
    });
  };

  const pauseRestTimer = () => {
    setRestTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resumeRestTimer = () => {
    if (restTimer.secondsRemaining > 0) {
      setRestTimer(prev => ({ ...prev, isRunning: true }));
    }
  };

  const skipRestTimer = () => {
    setRestTimer(prev => ({ ...prev, isRunning: false, secondsRemaining: 0 }));
  };

  const addTimerSeconds = (sec: number) => {
    setRestTimer(prev => ({
      ...prev,
      secondsRemaining: Math.max(0, prev.secondsRemaining + sec),
      totalSeconds: Math.max(prev.totalSeconds, prev.secondsRemaining + sec),
    }));
  };

  // Start a new workout session
  const startWorkout = (dayNumber: number) => {
    const dayDef = WORKOUT_PROGRAM.find(d => d.dayNumber === dayNumber) || WORKOUT_PROGRAM[0];
    if (dayDef.isRestDay) return;

    // Build initial exercise logs with pre-filled baseline weights
    const exerciseLogs: ExerciseLog[] = dayDef.exercises.map(ex => {
      // Find previous workout's last weight or default
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
      dayNumber: dayDef.dayNumber,
      title: `${dayDef.title} — ${dayDef.subtitle}`,
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
    setActiveSession(null);
    storage.saveActiveSession(null);
    setWorkoutDuration(0);
    skipRestTimer();
  };

  // Toggle Set Complete & Trigger PR Engine & Rest Timer
  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    if (!activeSession) return;

    const dayDef = WORKOUT_PROGRAM.find(d => d.id === activeSession.workoutDayId);
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

      const allSetsDone = updatedSets.every(s => s.completed);
      return {
        ...exLog,
        sets: updatedSets,
        completed: allSetsDone,
      };
    });

    const targetSet = updatedLogs.find(e => e.exerciseId === exerciseId)?.sets[setIndex];
    const justCompleted = targetSet?.completed;

    let newPRsList: PersonalRecord[] = [...(activeSession.prsAchieved || [])];

    if (justCompleted && exerciseDef && targetSet) {
      sound.playSetComplete();

      // Check for PR
      const detectedPRs = checkSetForPR(
        exerciseDef,
        targetSet,
        sessions,
        activeSession.id,
        newPRsList,
        settings.units
      );

      if (detectedPRs.length > 0) {
        detectedPRs.forEach(pr => {
          newPRsList.push(pr);
          storage.addPR(pr);
        });
        setPrs(storage.getPRs());
        setActivePRCelebration(detectedPRs[0]);
        sound.playPRFanfare();

        // Confetti explosion
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#CCFF00', '#FFFFFF', '#88FF00', '#444444'],
          });
        } catch (e) {}
      }

      // Automatically launch rest timer if not already running
      startRestTimer(settings.defaultRestSeconds);
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
    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;
      if (exLog.sets.length <= 1) return exLog; // Keep at least 1 set
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

  const completeWorkout = (notes?: string, overallRpe?: number, energyRating?: number) => {
    if (!activeSession) return;

    const completedTime = Date.now();
    const finalDuration = Math.max(60, Math.floor((completedTime - activeSession.startedAt) / 1000));
    const totalVolume = calculateSessionVolume(activeSession);
    
    // Check for Exercise-level Volume PRs
    const dayDef = WORKOUT_PROGRAM.find(d => d.id === activeSession.workoutDayId);
    let finalPRs: PersonalRecord[] = [...(activeSession.prsAchieved || [])];

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
          storage.addPR(volPR);
        }
      }
    });

    const totalSets = activeSession.exerciseLogs.reduce(
      (sum, e) => sum + e.sets.filter(s => s.completed).length, 0
    );
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

    // Save to storage
    storage.addSession(completedSession);
    const updatedSessions = storage.getSessions();
    setSessions(updatedSessions);
    setPrs(storage.getPRs());

    // Clean up active session
    setActiveSession(null);
    storage.saveActiveSession(null);
    skipRestTimer();

    // Show summary modal
    setCompletedSummarySession(completedSession);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#CCFF00', '#FFFFFF', '#00E5FF', '#222222'],
      });
    } catch (e) {}
  };

  const dismissPRCelebration = () => {
    setActivePRCelebration(null);
  };

  const dismissCompletedSummary = () => {
    setCompletedSummarySession(null);
  };

  // Body Measurements
  const addMeasurement = (measData: Omit<BodyMeasurement, 'id' | 'timestamp'>) => {
    const newMeas: BodyMeasurement = {
      ...measData,
      id: `meas-${Date.now()}`,
      timestamp: Date.now(),
    };
    storage.addMeasurement(newMeas);
    setMeasurements(storage.getMeasurements());
  };

  const deleteMeasurement = (id: string) => {
    const current = storage.getMeasurements().filter(m => m.id !== id);
    storage.saveMeasurements(current);
    setMeasurements(current);
  };

  // Data management
  const clearDemoData = () => {
    storage.clearDemoData();
    setSessions(storage.getSessions());
    setPrs(storage.getPRs());
    setSettings(storage.getSettings());
  };

  const exportBackup = () => {
    return storage.exportBackup();
  };

  const importBackup = (json: string) => {
    const res = storage.importBackup(json);
    if (res.success) {
      setSessions(storage.getSessions());
      setPrs(storage.getPRs());
      setMeasurements(storage.getMeasurements());
      setSettings(storage.getSettings());
      setAchievements(storage.getAchievements());
    }
    return res;
  };

  const resetAllData = () => {
    storage.resetAll();
    setSessions([]);
    setPrs([]);
    setMeasurements([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setSettings(storage.getSettings());
    setActiveSession(null);
    setWorkoutDuration(0);
  };

  // Helpers for Today and Next Split Day
  const todaySplitDay = useMemo(() => {
    // If sessions exist, determine next scheduled day based on the last completed session
    const lastSession = sessions
      .filter(s => s.status === 'COMPLETED')
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];

    if (!lastSession) return WORKOUT_PROGRAM[2]; // Default to Day 3 for demo showcase

    let nextDayNum = (lastSession.dayNumber % 7) + 1;
    return WORKOUT_PROGRAM.find(d => d.dayNumber === nextDayNum) || WORKOUT_PROGRAM[0];
  }, [sessions]);

  const nextSplitDay = useMemo(() => {
    let nextNextDay = (todaySplitDay.dayNumber % 7) + 1;
    return WORKOUT_PROGRAM.find(d => d.dayNumber === nextNextDay) || WORKOUT_PROGRAM[0];
  }, [todaySplitDay]);

  return (
    <WorkoutContext.Provider
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
        exportBackup,
        importBackup,
        resetAllData,
        todaySplitDay,
        nextSplitDay,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
