import { Exercise, ExerciseLog, ProgressionRecommendation, SetLog, UnitType, WorkoutSession } from '../types/workout';
import { formatWeight } from '../utils/units';

export interface PreviousPerformanceSummary {
  lastSessionDate: number;
  lastWeightKg: number;
  lastMaxReps: number;
  lastSets: { weightKg: number; reps: number; rpe?: number }[];
  allCompleted: boolean;
  averageRpe?: number;
  maxRpe?: number;
  isFailureBased: boolean;
  totalVolumeKg: number;
  summaryText: string;
}

/**
 * Extracts the most recent completed performance for a specific exercise from past workout sessions.
 */
export function getLastExercisePerformance(
  sessions: WorkoutSession[],
  exerciseId: string
): PreviousPerformanceSummary | null {
  const completedSessions = sessions
    .filter(s => s.status === 'COMPLETED' && s.completedAt)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  for (const session of completedSessions) {
    const exLog = session.exerciseLogs.find(e => e.exerciseId === exerciseId);
    if (exLog && exLog.sets && exLog.sets.length > 0) {
      const completedSets = exLog.sets.filter(s => s.completed && s.reps > 0);
      if (completedSets.length > 0) {
        const rpes = completedSets.filter(s => s.rpe !== undefined).map(s => s.rpe as number);
        const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : undefined;
        const maxRpe = rpes.length > 0 ? Math.max(...rpes) : undefined;
        
        const weights = completedSets.map(s => s.weightKg);
        const maxWeight = Math.max(...weights);
        const maxReps = Math.max(...completedSets.map(s => s.reps));

        // Format summary string: e.g. "80 KG × 10, 80 KG × 9, 80 KG × 8"
        const summaryText = completedSets
          .map(s => `${s.weightKg} KG × ${s.reps}${s.rpe ? ` @RPE ${s.rpe}` : ''}`)
          .join(' • ');

        return {
          lastSessionDate: session.completedAt || session.startedAt,
          lastWeightKg: maxWeight,
          lastMaxReps: maxReps,
          lastSets: completedSets.map(s => ({ weightKg: s.weightKg, reps: s.reps, rpe: s.rpe })),
          allCompleted: completedSets.length >= exLog.targetSets,
          averageRpe: avgRpe,
          maxRpe: maxRpe,
          isFailureBased: exLog.isFailureBased || false,
          totalVolumeKg: completedSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
          summaryText,
        };
      }
    }
  }

  return null;
}

/**
 * Intelligent Progression Engine:
 * Generates recommendation and the core "LAST TIME -> TODAY -> NEXT TARGET" data.
 */
export function generateProgressionRecommendation(
  exercise: Exercise,
  previous: PreviousPerformanceSummary | null,
  unit: UnitType = 'kg'
): ProgressionRecommendation {
  // Case 1: Failure-Based Exercise (e.g. Close-Grip Push-Ups)
  if (exercise.isFailureBased) {
    const todayTargetText = `${exercise.targetSets} × MECHANICAL FAILURE`;
    if (!previous) {
      return {
        type: 'REP_PR',
        badgeText: 'BASELINE SESSION',
        recommendationText: 'Push to failure with strict form to set benchmark reps.',
        explanation: 'Establish baseline reps to track mechanical failure progress.',
        confidence: 'initial',
        todayTargetText,
        nextTargetText: 'Aim for max reps to failure',
      };
    }

    const prevMaxReps = previous.lastMaxReps;
    const targetReps = prevMaxReps + 1;
    return {
      type: 'REP_PR',
      badgeText: '🔥 REP OVERLOAD',
      recommendationText: `Beat previous record of ${prevMaxReps} reps`,
      suggestedReps: targetReps,
      explanation: `Previous best was ${prevMaxReps} reps. Aim to push beyond ${prevMaxReps} reps for a new failure PR.`,
      confidence: 'high',
      lastPerformanceText: `${prevMaxReps} REPS (Failure)`,
      todayTargetText,
      nextTargetText: `↑ AIM FOR ${targetReps}+ REPS`,
    };
  }

  // Baseline target string: e.g. "80 KG × 8–10" or "4 × 8–10"
  const defaultWt = exercise.defaultWeightKg;
  const todayTargetText = `${exercise.targetSets} × ${exercise.targetRepMin === exercise.targetRepMax ? exercise.targetRepMax : `${exercise.targetRepMin}–${exercise.targetRepMax}`}`;

  // Case 2: No previous workout history
  if (!previous || previous.lastSets.length === 0) {
    const targetWtFormatted = formatWeight(defaultWt, unit);
    return {
      type: 'MAINTAIN',
      badgeText: 'BASELINE SETUP',
      recommendationText: `Start with ${targetWtFormatted} for ${exercise.targetSets} sets of ${exercise.targetRepMin}–${exercise.targetRepMax} reps`,
      suggestedWeightKg: defaultWt,
      suggestedReps: exercise.targetRepMin,
      explanation: 'Establish your baseline weight. Focus on controlled execution and note your RPE.',
      confidence: 'initial',
      todayTargetText: `${targetWtFormatted} • ${todayTargetText}`,
      nextTargetText: `↑ CALIBRATE @ ${targetWtFormatted}`,
    };
  }

  const { lastSets, lastWeightKg, averageRpe, maxRpe } = previous;
  const targetMin = exercise.targetRepMin;
  const targetMax = exercise.targetRepMax;
  const prescribedSets = exercise.targetSets;
  const increment = exercise.weightIncrementKg || 2.5;

  const setsCount = lastSets.length;
  const allHitMaxReps = setsCount >= prescribedSets && lastSets.every(s => s.reps >= targetMax);
  const anyUnderMinReps = lastSets.some(s => s.reps < targetMin);
  const severeFailureCount = lastSets.filter(s => s.reps < targetMin - 2).length;

  const lastSummary = lastSets.map(s => `${formatWeight(s.weightKg, unit, false)} × ${s.reps}`).join(', ');

  // RULE 1: PROGRESSION AVAILABLE (Weight Increase)
  // All prescribed sets completed, all reached targetMax, RPE <= 8.5 (or not specified)
  if (allHitMaxReps && (!maxRpe || maxRpe <= 8.5) && !anyUnderMinReps) {
    const newWeight = Math.round((lastWeightKg + increment) * 10) / 10;
    const newWeightFormatted = formatWeight(newWeight, unit);
    const prevWeightFormatted = formatWeight(lastWeightKg, unit);

    return {
      type: 'INCREASE_WEIGHT',
      badgeText: '↑ PROGRESSION AVAILABLE',
      recommendationText: `Increase weight to ${newWeightFormatted} (+${formatWeight(increment, unit)})`,
      suggestedWeightKg: newWeight,
      suggestedReps: targetMin,
      explanation: `You completed all ${prescribedSets} sets at ${targetMax} reps with solid RPE. You are ready to step up load!`,
      confidence: 'high',
      lastPerformanceText: `${prevWeightFormatted} × ${targetMax} (${prescribedSets} sets)`,
      todayTargetText: `${newWeightFormatted} • ${exercise.targetSets} × ${targetMin}–${targetMax}`,
      nextTargetText: `↑ TRY ${newWeightFormatted}`,
    };
  }

  // RULE 4: REDUCE LOAD
  // Multiple sets fell below minimum reps OR RPE >= 9.5 with rep drops
  if (severeFailureCount >= 2 || (anyUnderMinReps && maxRpe && maxRpe >= 9.5)) {
    const reducedWeight = Math.max(
      Math.round((lastWeightKg * 0.9) / 2.5) * 2.5,
      exercise.equipment === 'dumbbell' ? 4 : 10
    );
    const reducedFormatted = formatWeight(reducedWeight, unit);
    const lastWtFormatted = formatWeight(lastWeightKg, unit);

    return {
      type: 'REDUCE_LOAD',
      badgeText: 'CONSIDER REDUCING LOAD',
      recommendationText: `Deload ~10% to ${reducedFormatted} to rebuild volume`,
      suggestedWeightKg: reducedWeight,
      suggestedReps: targetMin,
      explanation: `Previous performance fell below target reps or reached high failure. Resetting slightly will enhance hypertrophy and recovery.`,
      confidence: 'medium',
      lastPerformanceText: `${lastWtFormatted} • ${lastSummary}`,
      todayTargetText: `${reducedFormatted} • ${todayTargetText}`,
      nextTargetText: `↓ RESET TO ${reducedFormatted}`,
    };
  }

  // RULE 2: REP PROGRESSION (Add 1 Rep)
  // Has not hit top of rep range on all sets, but performance is solid (RPE <= 9 or not set)
  const minRepsInLast = Math.min(...lastSets.map(s => s.reps));
  if (minRepsInLast < targetMax && !anyUnderMinReps) {
    const targetReps = Math.min(targetMax, minRepsInLast + 1);
    const lastWtFormatted = formatWeight(lastWeightKg, unit);

    return {
      type: 'ADD_REP',
      badgeText: '↑ ADD 1 REP',
      recommendationText: `Hold ${lastWtFormatted} and aim for ${targetReps} reps on all sets`,
      suggestedWeightKg: lastWeightKg,
      suggestedReps: targetReps,
      explanation: `Progressively overload by adding reps until hitting ${targetMax} reps across all ${prescribedSets} sets.`,
      confidence: 'high',
      lastPerformanceText: `${lastWtFormatted} • ${lastSummary}`,
      todayTargetText: `${lastWtFormatted} • ${todayTargetText}`,
      nextTargetText: `↑ TRY ${lastWtFormatted} × ${targetReps}`,
    };
  }

  // RULE 3: MAINTAIN WEIGHT
  const lastWtFormatted = formatWeight(lastWeightKg, unit);
  return {
    type: 'MAINTAIN',
    badgeText: 'MAINTAIN WEIGHT',
    recommendationText: `Maintain ${lastWtFormatted} and focus on clean tempo & execution`,
    suggestedWeightKg: lastWeightKg,
    suggestedReps: targetMin,
    explanation: `Stable performance within target range. Solidify this load before increasing further.`,
    confidence: 'medium',
    lastPerformanceText: `${lastWtFormatted} • ${lastSummary}`,
    todayTargetText: `${lastWtFormatted} • ${todayTargetText}`,
    nextTargetText: `→ MAINTAIN ${lastWtFormatted}`,
  };
}
