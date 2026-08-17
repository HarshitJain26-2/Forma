import { WorkoutSession, UnitType } from '../types/workout';
import { WorkoutShareData, TopExerciseShareItem, SharePRItem } from '../types/sharing';
import { 
  calculateExerciseVolume, 
  calculateEstimated1RM, 
  calculateCurrentStreak 
} from './calculations';
import { formatWeight } from './units';

/**
 * Builds reusable workout share data from a completed or historical workout session.
 * Reuses existing calculation logic and avoids duplicated formulas.
 */
export function buildWorkoutShareData(
  session: WorkoutSession,
  allSessions: WorkoutSession[] = [],
  units: UnitType = 'kg',
  currentStreak?: number
): WorkoutShareData {
  const completedExercises = session.exerciseLogs.filter(e => 
    e.sets && e.sets.some(s => s.completed)
  );

  const completedSets = session.exerciseLogs.reduce((sum, e) => {
    return sum + (e.sets ? e.sets.filter(s => s.completed).length : 0);
  }, 0);

  const totalVolumeKg = session.totalVolumeKg || session.exerciseLogs.reduce((sum, e) => {
    return sum + calculateExerciseVolume(e);
  }, 0);

  // Compute Volume Change vs Previous session
  let volumeChangePercent: number | undefined = undefined;
  const previousSessions = allSessions
    .filter(s => s.status === 'COMPLETED' && s.id !== session.id && (s.completedAt || 0) < (session.completedAt || Date.now()))
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const prevSameSplit = previousSessions.find(s => 
    s.workoutDayId === session.workoutDayId || s.weekday === session.weekday
  ) || previousSessions[0];

  if (prevSameSplit && prevSameSplit.totalVolumeKg > 0 && totalVolumeKg > 0) {
    const diff = totalVolumeKg - prevSameSplit.totalVolumeKg;
    volumeChangePercent = Math.round((diff / prevSameSplit.totalVolumeKg) * 100);
  }

  // Format PRs
  const sessionPRs = session.prsAchieved || [];
  const personalRecords: SharePRItem[] = sessionPRs.map(pr => {
    let deltaStr = '';
    if (pr.previousValue && pr.value > pr.previousValue) {
      if (pr.recordType === 'weight') {
        deltaStr = `+${formatWeight(pr.value - pr.previousValue, units)}`;
      } else if (pr.recordType === 'reps') {
        deltaStr = `+${pr.value - pr.previousValue} REPS`;
      } else if (pr.recordType === 'volume') {
        deltaStr = `+${formatWeight(pr.value - pr.previousValue, units)}`;
      }
    }

    return {
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      details: pr.details,
      recordType: pr.recordType,
      deltaText: deltaStr || undefined,
      value: pr.value,
      previousValue: pr.previousValue,
    };
  });

  // Calculate Top Exercises (Rank by: 1. PR exercise, 2. Highest Estimated 1RM, 3. Highest Volume)
  const prExerciseIds = new Set(sessionPRs.map(p => p.exerciseId));

  const rankedExercises: TopExerciseShareItem[] = completedExercises.map(exLog => {
    const completedSetsList = exLog.sets.filter(s => s.completed);
    
    // Find best set (highest weight, then highest reps)
    let bestSet = completedSetsList[0];
    let top1RM = 0;

    completedSetsList.forEach(s => {
      const e1rm = calculateEstimated1RM(s.weightKg, s.reps);
      if (e1rm > top1RM) {
        top1RM = e1rm;
        bestSet = s;
      }
    });

    const vol = calculateExerciseVolume(exLog);
    const isPR = prExerciseIds.has(exLog.exerciseId);

    const bestSetSummary = bestSet 
      ? (bestSet.weightKg > 0 
          ? `${formatWeight(bestSet.weightKg, units, false)} × ${bestSet.reps}`
          : `BW × ${bestSet.reps}`)
      : 'Completed';

    return {
      exerciseId: exLog.exerciseId,
      name: exLog.exerciseName,
      bestSetSummary,
      totalVolumeKg: vol,
      estimated1RM: top1RM,
      isPR,
    };
  });

  // Sort top exercises: PRs first, then highest 1RM, then highest volume
  rankedExercises.sort((a, b) => {
    if (a.isPR && !b.isPR) return -1;
    if (!a.isPR && b.isPR) return 1;
    if (b.estimated1RM !== a.estimated1RM) return b.estimated1RM - a.estimated1RM;
    return b.totalVolumeKg - a.totalVolumeKg;
  });

  const topExercises = rankedExercises.slice(0, 3);

  // Compute Streak
  const streak = currentStreak !== undefined 
    ? currentStreak 
    : calculateCurrentStreak(allSessions.length > 0 ? allSessions : [session]);

  const weekdayStr = (typeof session.weekday === 'string' ? session.weekday : 'Workout').toUpperCase();

  return {
    weekday: weekdayStr,
    workoutTitle: session.title || 'WORKOUT SESSION',
    durationSeconds: session.durationSeconds || 0,
    exerciseCount: completedExercises.length,
    completedSets,
    totalVolumeKg,
    prCount: personalRecords.length,
    volumeChangePercent,
    topExercises,
    personalRecords,
    streak,
    units,
    completedAt: session.completedAt || session.startedAt,
  };
}
