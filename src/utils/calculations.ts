import { Exercise, ExerciseLog, SetLog, WorkoutSession } from '../types/workout';

/**
 * Calculates Estimated 1RM using Epley Formula:
 * 1RM = Weight * (1 + Reps / 30)
 * Note: Capped to reps <= 15 for accuracy to avoid distorting strength rankings with high-rep endurance sets.
 */
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  // Cap effective reps for 1RM estimation formula at 15
  const effectiveReps = Math.min(reps, 15);
  const e1rm = weightKg * (1 + effectiveReps / 30);
  return Math.round(e1rm * 10) / 10;
}

export function calculateSetVolume(set: SetLog): number {
  if (!set.completed || !set.weightKg || !set.reps || set.weightKg < 0 || set.reps < 0) return 0;
  return set.weightKg * set.reps;
}

export function calculateExerciseVolume(exerciseLog: ExerciseLog): number {
  if (!exerciseLog || !exerciseLog.sets) return 0;
  return exerciseLog.sets.reduce((sum, s) => sum + calculateSetVolume(s), 0);
}

export function calculateSessionVolume(session: WorkoutSession): number {
  if (!session || !session.exerciseLogs) return 0;
  return session.exerciseLogs.reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);
}

export function calculateSessionTotalSets(session: WorkoutSession): number {
  if (!session || !session.exerciseLogs) return 0;
  return session.exerciseLogs.reduce((sum, ex) => {
    return sum + ex.sets.filter(s => s.completed).length;
  }, 0);
}

export function calculateSessionTotalReps(session: WorkoutSession): number {
  if (!session || !session.exerciseLogs) return 0;
  return session.exerciseLogs.reduce((sum, ex) => {
    return sum + ex.sets.filter(s => s.completed).reduce((rSum, s) => rSum + (s.reps || 0), 0);
  }, 0);
}

/**
 * Calculate dynamic streak of workout days based on completed sessions
 */
export function calculateCurrentStreak(sessions: WorkoutSession[]): number {
  const completedSessions = sessions
    .filter(s => s.status === 'COMPLETED' && s.completedAt)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  if (completedSessions.length === 0) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Group workouts by day string YYYY-MM-DD
  const workoutDays = new Set<string>();
  completedSessions.forEach(s => {
    const d = new Date(s.completedAt || s.startedAt);
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    workoutDays.add(dayStr);
  });

  const sortedDays = Array.from(workoutDays).sort().reverse();
  if (sortedDays.length === 0) return 0;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // If latest workout is neither today nor yesterday, streak is broken
  if (sortedDays[0] !== todayStr && sortedDays[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = sortedDays[0] === todayStr ? new Date(now) : new Date(yesterday);

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (workoutDays.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate workouts completed in current calendar week (Monday to Sunday)
 */
export function calculateWeeklyWorkouts(sessions: WorkoutSession[]): number {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday
  const diffToMonday = (currentDay + 6) % 7;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  return sessions.filter(s => {
    if (s.status !== 'COMPLETED' || !s.completedAt) return false;
    const sessionDate = new Date(s.completedAt);
    return sessionDate >= monday;
  }).length;
}

/**
 * Calculate total volume across all completed sessions
 */
export function calculateTotalVolume(sessions: WorkoutSession[]): number {
  return sessions
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + (s.totalVolumeKg || calculateSessionVolume(s)), 0);
}

/**
 * Calculate weekly volume for the current week
 */
export function calculateWeeklyVolume(sessions: WorkoutSession[]): number {
  const now = new Date();
  const currentDay = now.getDay();
  const diffToMonday = (currentDay + 6) % 7;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  return sessions
    .filter(s => s.status === 'COMPLETED' && s.completedAt && new Date(s.completedAt) >= monday)
    .reduce((sum, s) => sum + (s.totalVolumeKg || calculateSessionVolume(s)), 0);
}
