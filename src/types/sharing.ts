import { UnitType } from './workout';

export interface TopExerciseShareItem {
  exerciseId: string;
  name: string;
  bestSetSummary: string; // e.g. "82.5 KG × 9"
  totalVolumeKg: number;
  estimated1RM: number;
  isPR: boolean;
}

export interface SharePRItem {
  exerciseId: string;
  exerciseName: string;
  details: string; // e.g. "82.5 KG × 9"
  recordType: 'weight' | 'reps' | 'volume' | 'e1rm' | string;
  deltaText?: string; // e.g. "+2.5 KG"
  value: number;
  previousValue?: number;
}

export interface WorkoutShareData {
  weekday: string;
  workoutTitle: string;
  durationSeconds: number;
  exerciseCount: number;
  completedSets: number;
  totalVolumeKg: number;
  prCount: number;
  volumeChangePercent?: number;
  topExercises: TopExerciseShareItem[];
  personalRecords: SharePRItem[];
  streak?: number;
  units: UnitType;
  completedAt?: number;
}
