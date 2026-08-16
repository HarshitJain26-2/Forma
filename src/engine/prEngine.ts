import { Exercise, ExerciseLog, PersonalRecord, SetLog, UnitType, WorkoutSession } from '../types/workout';
import { calculateEstimated1RM, calculateExerciseVolume } from '../utils/calculations';
import { formatWeight } from '../utils/units';

export interface PRDetectionResult {
  isPR: boolean;
  newPRs: PersonalRecord[];
}

/**
 * Checks a completed set against all previous PRs for that exercise.
 */
export function checkSetForPR(
  exercise: Exercise,
  completedSet: SetLog,
  allSessions: WorkoutSession[],
  currentSessionId: string,
  existingSessionPRs: PersonalRecord[] = [],
  unit: UnitType = 'kg'
): PersonalRecord[] {
  if (!completedSet.completed || !completedSet.reps || completedSet.reps <= 0) {
    return [];
  }

  const weightKg = completedSet.weightKg || 0;
  const reps = completedSet.reps;
  const newPRs: PersonalRecord[] = [];

  // Filter completed past sessions
  const pastSessions = allSessions.filter(s => s.status === 'COMPLETED' && s.id !== currentSessionId);

  // 1. Max Weight PR (for non-failure bodyweight)
  if (!exercise.isFailureBased && weightKg > 0) {
    let prevMaxWeight = 0;
    pastSessions.forEach(s => {
      const ex = s.exerciseLogs.find(e => e.exerciseId === exercise.id);
      if (ex) {
        ex.sets.filter(st => st.completed).forEach(st => {
          if (st.weightKg > prevMaxWeight) {
            prevMaxWeight = st.weightKg;
          }
        });
      }
    });

    // Check if current weight exceeds prev max and not already logged this session
    if (weightKg > prevMaxWeight && prevMaxWeight > 0) {
      const alreadyHasWeightPR = existingSessionPRs.some(
        p => p.exerciseId === exercise.id && p.recordType === 'weight' && p.value >= weightKg
      );
      if (!alreadyHasWeightPR) {
        const delta = Math.round((weightKg - prevMaxWeight) * 10) / 10;
        newPRs.push({
          id: `pr-wt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          recordType: 'weight',
          value: weightKg,
          previousValue: prevMaxWeight,
          unit: 'kg',
          details: `${formatWeight(weightKg, unit)} × ${reps} (+${formatWeight(delta, unit)} from previous best)`,
          achievedAt: Date.now(),
          workoutSessionId: currentSessionId,
        });
      }
    }
  }

  // 2. Estimated 1RM PR (for compound and major strength exercises with <= 15 reps)
  if (!exercise.isFailureBased && weightKg > 0 && reps <= 15) {
    const current1RM = calculateEstimated1RM(weightKg, reps);
    let prevMax1RM = 0;

    pastSessions.forEach(s => {
      const ex = s.exerciseLogs.find(e => e.exerciseId === exercise.id);
      if (ex) {
        ex.sets.filter(st => st.completed && st.reps <= 15).forEach(st => {
          const e1rm = calculateEstimated1RM(st.weightKg, st.reps);
          if (e1rm > prevMax1RM) {
            prevMax1RM = e1rm;
          }
        });
      }
    });

    if (current1RM > prevMax1RM && prevMax1RM > 0) {
      const alreadyHas1RMPR = existingSessionPRs.some(
        p => p.exerciseId === exercise.id && p.recordType === '1rm' && p.value >= current1RM
      );
      if (!alreadyHas1RMPR) {
        const delta = Math.round((current1RM - prevMax1RM) * 10) / 10;
        newPRs.push({
          id: `pr-1rm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          recordType: '1rm',
          value: current1RM,
          previousValue: prevMax1RM,
          unit: 'kg',
          details: `Est 1RM: ${formatWeight(current1RM, unit)} (+${formatWeight(delta, unit)})`,
          achievedAt: Date.now(),
          workoutSessionId: currentSessionId,
        });
      }
    }
  }

  // 3. Rep PR (for failure exercises or max reps at specific load)
  if (exercise.isFailureBased) {
    let prevMaxReps = 0;
    pastSessions.forEach(s => {
      const ex = s.exerciseLogs.find(e => e.exerciseId === exercise.id);
      if (ex) {
        ex.sets.filter(st => st.completed).forEach(st => {
          if (st.reps > prevMaxReps) {
            prevMaxReps = st.reps;
          }
        });
      }
    });

    if (reps > prevMaxReps && prevMaxReps > 0) {
      const deltaReps = reps - prevMaxReps;
      const alreadyHasRepPR = existingSessionPRs.some(
        p => p.exerciseId === exercise.id && p.recordType === 'reps' && p.value >= reps
      );
      if (!alreadyHasRepPR) {
        newPRs.push({
          id: `pr-rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          recordType: 'reps',
          value: reps,
          previousValue: prevMaxReps,
          unit: 'reps',
          details: `${reps} Reps to Failure (+${deltaReps} Reps)`,
          achievedAt: Date.now(),
          workoutSessionId: currentSessionId,
        });
      }
    }
  }

  return newPRs;
}

/**
 * Checks if the completed exercise broke an all-time total volume PR.
 */
export function checkExerciseVolumePR(
  exercise: Exercise,
  exerciseLog: ExerciseLog,
  allSessions: WorkoutSession[],
  currentSessionId: string,
  existingSessionPRs: PersonalRecord[] = [],
  unit: UnitType = 'kg'
): PersonalRecord | null {
  const currentVolume = calculateExerciseVolume(exerciseLog);
  if (currentVolume <= 0) return null;

  const pastSessions = allSessions.filter(s => s.status === 'COMPLETED' && s.id !== currentSessionId);
  let prevMaxVolume = 0;

  pastSessions.forEach(s => {
    const ex = s.exerciseLogs.find(e => e.exerciseId === exercise.id);
    if (ex) {
      const v = calculateExerciseVolume(ex);
      if (v > prevMaxVolume) {
        prevMaxVolume = v;
      }
    }
  });

  if (currentVolume > prevMaxVolume && prevMaxVolume > 0) {
    const alreadyHasVolPR = existingSessionPRs.some(
      p => p.exerciseId === exercise.id && p.recordType === 'volume' && p.value >= currentVolume
    );
    if (!alreadyHasVolPR) {
      const delta = Math.round(currentVolume - prevMaxVolume);
      return {
        id: `pr-vol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        recordType: 'volume',
        value: currentVolume,
        previousValue: prevMaxVolume,
        unit: 'kg',
        details: `Total Volume: ${formatWeight(currentVolume, unit)} (+${formatWeight(delta, unit)})`,
        achievedAt: Date.now(),
        workoutSessionId: currentSessionId,
      };
    }
  }

  return null;
}
