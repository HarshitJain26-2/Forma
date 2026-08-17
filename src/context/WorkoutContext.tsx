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
  WorkoutStatus, 
  Weekday 
} from '../types/workout';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { generateSeedData, INITIAL_ACHIEVEMENTS } from '../data/seedData';
import { DEFAULT_SETTINGS, storage } from '../storage/localStorage';
import { migrateStorageIfNeeded } from '../storage/storageVersion';
import { checkExerciseVolumePR, checkSetForPR } from '../engine/prEngine';
import { calculateSessionVolume } from '../utils/calculations';
import { sound } from '../utils/audio';
import { getCurrentWeekday, getWeekdayFromDayNumber } from '../utils/dates';

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
  startWorkout: (dayId: Weekday | number | string) => void;
  discardWorkout: () => void;
  completeWorkout: (notes?: string, overallRpe?: number, energyRating?: number) => void;
  toggleSetComplete: (exerciseId: string, setIndex: number) => void;
  updateSetValues: (exerciseId: string, setIndex: number, weightKg: number, reps: number, rpe?: number) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateExerciseNote: (exerciseId: string, note: string) => void;

  // Active workout exercise management
  addExerciseToActiveWorkout: (exercise: Exercise | Omit<Exercise, 'id' | 'workoutDayId' | 'order'>, initialSets?: number) => void;
  removeExerciseFromActiveWorkout: (exerciseId: string) => void;
  updateActiveWorkoutExercise: (exerciseId: string, updates: Partial<ExerciseLog>) => void;
  reorderActiveWorkoutExercises: (startIndex: number, endIndex: number) => void;

  // Program / Routine customization
  updateProgramDay: (dayId: Weekday | string | number, updates: Partial<WorkoutDay>) => void;
  addExerciseToProgramDay: (dayId: Weekday | string | number, exercise: Omit<Exercise, 'id' | 'workoutDayId' | 'order'>) => void;
  removeExerciseFromProgramDay: (dayId: Weekday | string | number, exerciseId: string) => void;
  updateProgramExercise: (dayId: Weekday | string | number, exerciseId: string, updates: Partial<Exercise>) => void;
  reorderProgramExercises: (dayId: Weekday | string | number, startIndex: number, endIndex: number) => void;
  resetProgramDay: (dayId: Weekday | string | number) => void;
  resetEntireProgram: () => void;

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

  // Calendar weekday helpers
  todaySplitDay: WorkoutDay;
  nextSplitDay: WorkoutDay;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Run storage migration on initialization
  useEffect(() => {
    migrateStorageIfNeeded();
  }, []);

  const [program, setProgram] = useState<WorkoutDay[]>(() => storage.getProgram());
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

  // Start a new workout session by Weekday or Day number
  const startWorkout = (dayId: Weekday | number | string) => {
    let dayDef: WorkoutDay | undefined;
    if (typeof dayId === 'string') {
      dayDef = program.find(d => d.weekday === dayId || d.id === dayId);
    } else if (typeof dayId === 'number') {
      dayDef = program.find(d => d.dayNumber === dayId);
    }
    if (!dayDef) {
      dayDef = program[0];
    }
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
    setActiveSession(null);
    storage.saveActiveSession(null);
    setWorkoutDuration(0);
    skipRestTimer();
  };

  // Toggle Set Complete & Trigger PR Engine & Rest Timer
  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    if (!activeSession) return;

    const dayDef = program.find(
      d => d.id === activeSession.workoutDayId || d.weekday === activeSession.weekday || d.dayNumber === activeSession.dayNumber
    );
    const targetExLog = activeSession.exerciseLogs.find(e => e.exerciseId === exerciseId);
    
    // Exercise definition fallback for custom or dynamic exercises
    const exerciseDef: Exercise = dayDef?.exercises.find(e => e.id === exerciseId) || {
      id: exerciseId,
      workoutDayId: activeSession.workoutDayId,
      name: targetExLog?.exerciseName || 'Exercise',
      order: 1,
      targetSets: targetExLog?.targetSets || 3,
      targetRepMin: targetExLog?.targetRepMin || 8,
      targetRepMax: targetExLog?.targetRepMax || 12,
      primaryMuscle: 'chest',
      secondaryMuscles: [],
      equipment: 'dumbbell',
      movementPattern: 'isolation',
      isCompound: false,
      isIsolation: true,
      isFailureBased: targetExLog?.isFailureBased || false,
      defaultWeightKg: 20,
      weightIncrementKg: 2.5,
    };

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

  // ACTIVE WORKOUT: ADD EXERCISE
  const addExerciseToActiveWorkout = (
    exercise: Exercise | Omit<Exercise, 'id' | 'workoutDayId' | 'order'>,
    initialSetsCount: number = 3
  ) => {
    if (!activeSession) return;

    const exId = ('id' in exercise && exercise.id) ? exercise.id : `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const numSets = exercise.targetSets || initialSetsCount;

    // Check if previous sessions have logged this exercise to grab last used weight
    const prevSession = sessions
      .filter(s => s.status === 'COMPLETED')
      .find(s => s.exerciseLogs.some(e => e.exerciseId === exId || e.exerciseName.toLowerCase() === exercise.name.toLowerCase()));

    let defaultWt = exercise.defaultWeightKg || 20;
    if (prevSession) {
      const prevEx = prevSession.exerciseLogs.find(e => e.exerciseId === exId || e.exerciseName.toLowerCase() === exercise.name.toLowerCase());
      const completedSets = prevEx?.sets.filter(s => s.completed);
      if (completedSets && completedSets.length > 0) {
        defaultWt = completedSets[completedSets.length - 1].weightKg;
      }
    }

    const sets: SetLog[] = Array.from({ length: numSets }).map((_, idx) => ({
      id: `set-${Date.now()}-${exId}-${idx + 1}`,
      setNumber: idx + 1,
      weightKg: exercise.isFailureBased ? 0 : defaultWt,
      reps: exercise.isFailureBased ? 0 : (exercise.targetRepMax || 10),
      completed: false,
    }));

    const newExLog: ExerciseLog = {
      exerciseId: exId,
      exerciseName: exercise.name,
      targetSets: numSets,
      targetRepMin: exercise.targetRepMin || 8,
      targetRepMax: exercise.targetRepMax || 12,
      sets,
      completed: false,
      isFailureBased: exercise.isFailureBased || false,
    };

    const updatedLogs = [...activeSession.exerciseLogs, newExLog];

    setActiveSession({
      ...activeSession,
      exerciseLogs: updatedLogs,
      totalVolumeKg: calculateSessionVolume({ ...activeSession, exerciseLogs: updatedLogs }),
    });
  };

  // ACTIVE WORKOUT: REMOVE EXERCISE
  const removeExerciseFromActiveWorkout = (exerciseId: string) => {
    if (!activeSession) return;
    const updatedLogs = activeSession.exerciseLogs.filter(e => e.exerciseId !== exerciseId);
    setActiveSession({
      ...activeSession,
      exerciseLogs: updatedLogs,
      totalVolumeKg: calculateSessionVolume({ ...activeSession, exerciseLogs: updatedLogs }),
    });
  };

  // ACTIVE WORKOUT: UPDATE EXERCISE (Sets, Reps, Name, Note)
  const updateActiveWorkoutExercise = (exerciseId: string, updates: Partial<ExerciseLog>) => {
    if (!activeSession) return;
    const updatedLogs = activeSession.exerciseLogs.map(exLog => {
      if (exLog.exerciseId !== exerciseId) return exLog;

      let sets = exLog.sets;
      if (updates.targetSets && updates.targetSets !== exLog.sets.length) {
        const diff = updates.targetSets - exLog.sets.length;
        if (diff > 0) {
          const lastSet = exLog.sets[exLog.sets.length - 1];
          const newSets: SetLog[] = Array.from({ length: diff }).map((_, i) => ({
            id: `set-${Date.now()}-${exLog.sets.length + i + 1}`,
            setNumber: exLog.sets.length + i + 1,
            weightKg: lastSet ? lastSet.weightKg : 20,
            reps: lastSet ? lastSet.reps : 10,
            completed: false,
          }));
          sets = [...exLog.sets, ...newSets];
        } else if (diff < 0) {
          sets = exLog.sets.slice(0, updates.targetSets);
        }
      }

      return {
        ...exLog,
        ...updates,
        sets,
        completed: sets.every(s => s.completed),
      };
    });

    setActiveSession({
      ...activeSession,
      exerciseLogs: updatedLogs,
      totalVolumeKg: calculateSessionVolume({ ...activeSession, exerciseLogs: updatedLogs }),
    });
  };

  // ACTIVE WORKOUT: REORDER EXERCISES
  const reorderActiveWorkoutExercises = (startIndex: number, endIndex: number) => {
    if (!activeSession) return;
    const result = Array.from(activeSession.exerciseLogs);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setActiveSession({ ...activeSession, exerciseLogs: result });
  };

  // PROGRAM ROUTINE MANAGEMENT
  const updateProgramDay = (dayId: Weekday | string | number, updates: Partial<WorkoutDay>) => {
    setProgram(prev => {
      const next = prev.map(d => (d.id === dayId || d.weekday === dayId || d.dayNumber === dayId ? { ...d, ...updates } : d));
      storage.saveProgram(next);
      return next;
    });
  };

  const addExerciseToProgramDay = (
    dayId: Weekday | string | number,
    exerciseData: Omit<Exercise, 'id' | 'workoutDayId' | 'order'>
  ) => {
    setProgram(prev => {
      const next = prev.map(day => {
        if (day.id === dayId || day.weekday === dayId || day.dayNumber === dayId) {
          const newId = `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const newEx: Exercise = {
            ...exerciseData,
            id: newId,
            workoutDayId: day.id,
            order: day.exercises.length + 1,
          };
          return {
            ...day,
            exercises: [...day.exercises, newEx],
          };
        }
        return day;
      });
      storage.saveProgram(next);
      return next;
    });
  };

  const removeExerciseFromProgramDay = (dayId: Weekday | string | number, exerciseId: string) => {
    setProgram(prev => {
      const next = prev.map(day => {
        if (day.id === dayId || day.weekday === dayId || day.dayNumber === dayId) {
          const filtered = day.exercises
            .filter(e => e.id !== exerciseId)
            .map((e, idx) => ({ ...e, order: idx + 1 }));
          return {
            ...day,
            exercises: filtered,
          };
        }
        return day;
      });
      storage.saveProgram(next);
      return next;
    });
  };

  const updateProgramExercise = (
    dayId: Weekday | string | number,
    exerciseId: string,
    updates: Partial<Exercise>
  ) => {
    setProgram(prev => {
      const next = prev.map(day => {
        if (day.id === dayId || day.weekday === dayId || day.dayNumber === dayId) {
          const updatedExercises = day.exercises.map(e => (e.id === exerciseId ? { ...e, ...updates } : e));
          return {
            ...day,
            exercises: updatedExercises,
          };
        }
        return day;
      });
      storage.saveProgram(next);
      return next;
    });
  };

  const reorderProgramExercises = (
    dayId: Weekday | string | number,
    startIndex: number,
    endIndex: number
  ) => {
    setProgram(prev => {
      const next = prev.map(day => {
        if (day.id === dayId || day.weekday === dayId || day.dayNumber === dayId) {
          const list = Array.from(day.exercises);
          const [moved] = list.splice(startIndex, 1);
          list.splice(endIndex, 0, moved);
          const reordered = list.map((e, idx) => ({ ...e, order: idx + 1 }));
          return { ...day, exercises: reordered };
        }
        return day;
      });
      storage.saveProgram(next);
      return next;
    });
  };

  const resetProgramDay = (dayId: Weekday | string | number) => {
    const defaultDay = WORKOUT_PROGRAM.find(d => d.id === dayId || d.weekday === dayId || d.dayNumber === dayId);
    if (!defaultDay) return;
    setProgram(prev => {
      const next = prev.map(day => {
        if (day.id === dayId || day.weekday === dayId || day.dayNumber === dayId) {
          return JSON.parse(JSON.stringify(defaultDay));
        }
        return day;
      });
      storage.saveProgram(next);
      return next;
    });
  };

  const resetEntireProgram = () => {
    const fresh = storage.resetProgram();
    setProgram(fresh);
  };

  const completeWorkout = (notes?: string, overallRpe?: number, energyRating?: number) => {
    if (!activeSession) return;

    const completedTime = Date.now();
    const finalDuration = Math.max(60, Math.floor((completedTime - activeSession.startedAt) / 1000));
    const totalVolume = calculateSessionVolume(activeSession);
    
    // Check for Exercise-level Volume PRs
    const dayDef = program.find(
      d => d.id === activeSession.workoutDayId || d.weekday === activeSession.weekday || d.dayNumber === activeSession.dayNumber
    );
    let finalPRs: PersonalRecord[] = [...(activeSession.prsAchieved || [])];

    activeSession.exerciseLogs.forEach(exLog => {
      const exDef: Exercise = dayDef?.exercises.find(e => e.id === exLog.exerciseId) || {
        id: exLog.exerciseId,
        workoutDayId: activeSession.workoutDayId,
        name: exLog.exerciseName,
        order: 1,
        targetSets: exLog.targetSets,
        targetRepMin: exLog.targetRepMin,
        targetRepMax: exLog.targetRepMax,
        primaryMuscle: 'chest',
        secondaryMuscles: [],
        equipment: 'dumbbell',
        movementPattern: 'isolation',
        isCompound: false,
        isIsolation: true,
        isFailureBased: exLog.isFailureBased || false,
        defaultWeightKg: 20,
        weightIncrementKg: 2.5,
      };

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
      setProgram(storage.getProgram());
    }
    return res;
  };

  const resetAllData = () => {
    storage.resetAll();
    setSessions([]);
    setPrs([]);
    setMeasurements([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setProgram(WORKOUT_PROGRAM);
    setSettings(storage.getSettings());
    setActiveSession(null);
    setWorkoutDuration(0);
  };

  // CALENDAR-AWARE AUTOMATIC DETERMINATION OF TODAY'S WORKOUT
  const todaySplitDay = useMemo(() => {
    const currentWeekday = getCurrentWeekday();
    return program.find(d => d.weekday === currentWeekday) || program[0];
  }, [program]);

  const nextSplitDay = useMemo(() => {
    const day = new Date().getDay();
    const tomorrowDay = (day + 1) % 7;
    const mapping: { [key: number]: Weekday } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    const tomorrowWeekday = mapping[tomorrowDay] || 'monday';
    return program.find(d => d.weekday === tomorrowWeekday) || program[0];
  }, [program]);

  return (
    <WorkoutContext.Provider
      value={{
        program,
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
        addExerciseToActiveWorkout,
        removeExerciseFromActiveWorkout,
        updateActiveWorkoutExercise,
        reorderActiveWorkoutExercises,
        updateProgramDay,
        addExerciseToProgramDay,
        removeExerciseFromProgramDay,
        updateProgramExercise,
        reorderProgramExercises,
        resetProgramDay,
        resetEntireProgram,
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
