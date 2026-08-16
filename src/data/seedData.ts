import { Achievement, BodyMeasurement, PersonalRecord, WorkoutSession, Weekday } from '../types/workout';
import { WORKOUT_PROGRAM } from './workoutProgram';
import { calculateExerciseVolume } from '../utils/calculations';
import { WEEKDAYS_ORDER } from '../utils/dates';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_workout',
    title: 'FIRST BLOOD',
    description: 'Complete your first workout session in Forma.',
    icon: '⚔️',
    category: 'workouts',
    unlockedAt: Date.now() - 28 * 86400000,
    progress: 1,
    maxProgress: 1,
  },
  {
    id: 'streak_7',
    title: 'IRON DISCIPLINE',
    description: 'Maintain a 7-day consistent workout streak.',
    icon: '🔥',
    category: 'streak',
    unlockedAt: Date.now() - 14 * 86400000,
    progress: 7,
    maxProgress: 7,
  },
  {
    id: 'first_pr',
    title: 'LIMIT BREAKER',
    description: 'Smash your first Personal Record.',
    icon: '⚡',
    category: 'prs',
    unlockedAt: Date.now() - 21 * 86400000,
    progress: 1,
    maxProgress: 1,
  },
  {
    id: 'volume_100k',
    title: 'TITAN OF VOLUME',
    description: 'Accumulate over 100,000 KG in total recorded tonnage.',
    icon: '🏆',
    category: 'volume',
    unlockedAt: Date.now() - 3 * 86400000,
    progress: 114500,
    maxProgress: 100000,
  },
  {
    id: 'workouts_25',
    title: 'CENTURY CLUB IN TRAINING',
    description: 'Log 20 completed workout sessions.',
    icon: '🛡️',
    category: 'workouts',
    unlockedAt: Date.now() - 2 * 86400000,
    progress: 20,
    maxProgress: 20,
  },
  {
    id: 'heavy_hitter',
    title: '100 KG MILESTONE',
    description: 'Press or pull over 100 KG on any compound lift.',
    icon: '💥',
    category: 'special',
    progress: 95,
    maxProgress: 100,
  }
];

export function generateSeedData(): {
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  measurements: BodyMeasurement[];
} {
  const sessions: WorkoutSession[] = [];
  const prs: PersonalRecord[] = [];
  const measurements: BodyMeasurement[] = [];

  const now = Date.now();
  const dayMs = 86400000;

  // Generate 4 weeks of workout sessions (Monday to Saturday)
  const weeks = [
    { daysAgo: 24, mult: 0.90, desc: 'Week 1' },
    { daysAgo: 17, mult: 0.94, desc: 'Week 2' },
    { daysAgo: 10, mult: 0.97, desc: 'Week 3' },
    { daysAgo: 3,  mult: 1.00, desc: 'Week 4' },
  ];

  let sessionIdCounter = 1;

  weeks.forEach((w, wIdx) => {
    // Generate Monday through Saturday (skip Sunday rest day for completed logs)
    const trainingDays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    trainingDays.forEach((weekday, dayIdx) => {
      const dayDef = WORKOUT_PROGRAM.find(p => p.weekday === weekday);
      if (!dayDef || dayDef.isRestDay) return;

      const sessionOffsetDays = w.daysAgo - dayIdx;
      const sessionDate = now - sessionOffsetDays * dayMs;
      const durationSec = 3400 + Math.floor(Math.random() * 800); // ~56-70 mins

      const exerciseLogs = dayDef.exercises.map(ex => {
        const baseWeight = ex.defaultWeightKg * w.mult;
        const roundedWeight = ex.isFailureBased ? 0 : Math.round(baseWeight / 2.5) * 2.5;

        const sets = Array.from({ length: ex.targetSets }).map((_, sIdx) => {
          let reps = ex.targetRepMax;
          if (ex.isFailureBased) {
            reps = 18 + wIdx * 2 + (sIdx === 0 ? 2 : 0);
          } else if (sIdx >= 2) {
            reps = Math.max(ex.targetRepMin, ex.targetRepMax - 1);
          }

          return {
            id: `seed-set-${sessionIdCounter}-${ex.id}-${sIdx + 1}`,
            setNumber: sIdx + 1,
            weightKg: roundedWeight,
            reps: reps,
            rpe: 7.5 + (sIdx * 0.5),
            completed: true,
            timestamp: sessionDate + sIdx * 180000,
          };
        });

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          targetSets: ex.targetSets,
          targetRepMin: ex.targetRepMin,
          targetRepMax: ex.targetRepMax,
          sets: sets,
          completed: true,
          isFailureBased: ex.isFailureBased,
          note: (ex.id === 'd1-ex1' || ex.id === 'd2-ex1' || ex.id === 'd3-ex1') ? 'Clean tempo, good bar speed.' : undefined,
        };
      });

      const totalVol = exerciseLogs.reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);
      const totalSets = exerciseLogs.reduce((sum, ex) => sum + ex.sets.length, 0);
      const totalReps = exerciseLogs.reduce((sum, ex) => sum + ex.sets.reduce((r, s) => r + s.reps, 0), 0);

      const session: WorkoutSession = {
        id: `seed-session-${sessionIdCounter++}`,
        workoutDayId: dayDef.id,
        weekday: dayDef.weekday,
        dayNumber: dayDef.dayNumber,
        title: `${dayDef.displayName.toUpperCase()} — ${dayDef.title}`,
        variation: dayDef.variation,
        status: 'COMPLETED',
        startedAt: sessionDate,
        completedAt: sessionDate + durationSec * 1000,
        durationSeconds: durationSec,
        totalVolumeKg: totalVol,
        totalSets: totalSets,
        totalReps: totalReps,
        exerciseLogs: exerciseLogs,
        overallRpe: 8,
        energyRating: 4,
        isDemo: true,
        notes: weekday === 'monday' ? 'Solid chest pump and tricep lockouts.' : undefined,
      };

      sessions.push(session);
    });
  });

  // Seed PRs from Week 4 workouts
  prs.push(
    {
      id: 'pr-seed-1',
      exerciseId: 'd1-ex1',
      exerciseName: 'Incline Barbell Press',
      recordType: 'weight',
      value: 80,
      previousValue: 77.5,
      unit: 'kg',
      details: '80 KG × 9 (+2.5 KG from previous best)',
      achievedAt: now - 3 * dayMs,
      workoutSessionId: sessions[sessions.length - 6]?.id || 'seed-session-19',
    },
    {
      id: 'pr-seed-2',
      exerciseId: 'd1-ex1',
      exerciseName: 'Incline Barbell Press',
      recordType: '1rm',
      value: 104,
      previousValue: 98,
      unit: 'kg',
      details: 'Est 1RM: 104 KG (+6.0 KG)',
      achievedAt: now - 3 * dayMs,
      workoutSessionId: sessions[sessions.length - 6]?.id || 'seed-session-19',
    },
    {
      id: 'pr-seed-3',
      exerciseId: 'd2-ex1',
      exerciseName: 'Barbell Rows',
      recordType: 'weight',
      value: 85,
      previousValue: 80,
      unit: 'kg',
      details: '85 KG × 8 (+5.0 KG from previous best)',
      achievedAt: now - 2 * dayMs,
      workoutSessionId: sessions[sessions.length - 5]?.id || 'seed-session-20',
    },
    {
      id: 'pr-seed-4',
      exerciseId: 'd3-ex1',
      exerciseName: 'Dumbbell Shoulder Press',
      recordType: 'weight',
      value: 26,
      previousValue: 24,
      unit: 'kg',
      details: '26 KG × 10 (+2.0 KG from previous best)',
      achievedAt: now - 1 * dayMs,
      workoutSessionId: sessions[sessions.length - 4]?.id || 'seed-session-21',
    },
    {
      id: 'pr-seed-5',
      exerciseId: 'd4-ex5',
      exerciseName: 'Close-Grip Push-Ups',
      recordType: 'reps',
      value: 24,
      previousValue: 20,
      unit: 'reps',
      details: '24 Reps to Failure (+4 Reps)',
      achievedAt: now - 4 * dayMs,
      workoutSessionId: sessions[sessions.length - 3]?.id || 'seed-session-22',
    },
    {
      id: 'pr-seed-6',
      exerciseId: 'd2-ex2',
      exerciseName: 'Lat Pulldown',
      recordType: 'volume',
      value: 2880,
      previousValue: 2640,
      unit: 'kg',
      details: 'Total Volume: 2,880 KG (+240 KG)',
      achievedAt: now - 2 * dayMs,
      workoutSessionId: sessions[sessions.length - 5]?.id || 'seed-session-20',
    },
    {
      id: 'pr-seed-7',
      exerciseId: 'd3-ex4',
      exerciseName: 'Leg Extensions',
      recordType: 'weight',
      value: 70,
      previousValue: 65,
      unit: 'kg',
      details: '70 KG × 12 (+5.0 KG from previous best)',
      achievedAt: now - 1 * dayMs,
      workoutSessionId: sessions[sessions.length - 4]?.id || 'seed-session-21',
    }
  );

  // Seed Body Measurements
  const bodyDates = [
    { daysAgo: 28, wt: 79.4, bf: 15.8, chest: 104, waist: 84, arms: 38.0 },
    { daysAgo: 21, wt: 79.0, bf: 15.4, chest: 104.5, waist: 83.5, arms: 38.2 },
    { daysAgo: 14, wt: 78.4, bf: 15.0, chest: 105.0, waist: 83.0, arms: 38.5 },
    { daysAgo: 7,  wt: 77.9, bf: 14.6, chest: 105.5, waist: 82.5, arms: 38.8 },
    { daysAgo: 1,  wt: 77.4, bf: 14.2, chest: 106.0, waist: 82.0, arms: 39.0 },
  ];

  bodyDates.forEach((b, idx) => {
    const d = new Date(now - b.daysAgo * dayMs);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    measurements.push({
      id: `meas-${idx + 1}`,
      date: dateStr,
      timestamp: d.getTime(),
      bodyWeightKg: b.wt,
      bodyFatPercent: b.bf,
      chestCm: b.chest,
      waistCm: b.waist,
      armsCm: b.arms,
      shouldersCm: 118 + idx * 0.5,
      thighsCm: 59 + idx * 0.3,
      notes: idx === 4 ? 'Woke up lean, vascularity showing on delts.' : undefined,
    });
  });

  return { sessions, prs, measurements };
}
