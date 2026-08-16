export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'calves';

export type MovementPattern = 
  | 'horizontal_press' 
  | 'vertical_press' 
  | 'incline_press'
  | 'horizontal_pull' 
  | 'vertical_pull' 
  | 'isolation' 
  | 'squat' 
  | 'hinge' 
  | 'lunge' 
  | 'calves'
  | 'bodyweight';

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'ez_bar';

export type UnitType = 'kg' | 'lb';

export type WorkoutStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Exercise {
  id: string;
  workoutDayId: number | string;
  name: string;
  order: number;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  specialInstruction?: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  movementPattern: MovementPattern;
  isCompound: boolean;
  isIsolation: boolean;
  isFailureBased: boolean;
  defaultWeightKg: number;
  weightIncrementKg: number;
}

export interface WorkoutDay {
  id: number | Weekday;
  weekday: Weekday;
  displayName: string; // e.g. "Monday"
  shortName: string;   // e.g. "MON"
  title: string;       // e.g. "CHEST + TRICEPS"
  subtitle?: string;   // e.g. "Upper Body Push"
  category: string;
  variation?: string;  // 'VOLUME FOCUSED' | 'PUMP / GROWTH FOCUSED' | 'LIGHT LOAD + PUMP'
  focus: string;
  estimatedDurationMin: string;
  isRestDay: boolean;
  exercises: Exercise[];
  recoveryActivities?: string[];
  dayNumber?: number;  // 1 to 7 for backwards compatibility
}

export interface SetLog {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number; // Optional RPE (1-10)
  completed: boolean;
  isPR?: boolean;
  timestamp?: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  sets: SetLog[];
  note?: string;
  completed: boolean;
  isFailureBased?: boolean;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: 'weight' | 'reps' | '1rm' | 'volume';
  value: number;
  previousValue: number;
  unit: string;
  details: string; // e.g. "82.5 KG × 9 (+2.5 KG from previous best)"
  achievedAt: number;
  workoutSessionId: string;
}

export interface WorkoutSession {
  id: string;
  workoutDayId: number | string;
  weekday?: Weekday;
  dayNumber?: number;
  title: string;
  variation?: string;
  status: WorkoutStatus;
  startedAt: number;
  completedAt?: number;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  exerciseLogs: ExerciseLog[];
  notes?: string;
  overallRpe?: number;
  energyRating?: number; // 1-5
  prsAchieved?: PersonalRecord[];
  isDemo?: boolean;
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  bodyWeightKg: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  shouldersCm?: number;
  thighsCm?: number;
  bodyFatPercent?: number;
  photoId?: string;
  photoDataUrl?: string;
  notes?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'volume' | 'prs' | 'workouts' | 'special';
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface UserSettings {
  units: UnitType;
  defaultRestSeconds: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  userName: string;
  hasSeenOnboarding: boolean;
  demoDataActive: boolean;
}

export interface ProgressionRecommendation {
  type: 'INCREASE_WEIGHT' | 'ADD_REP' | 'MAINTAIN' | 'REDUCE_LOAD' | 'REP_PR';
  badgeText: string;
  recommendationText: string;
  suggestedWeightKg?: number;
  suggestedReps?: number;
  explanation: string;
  confidence: 'high' | 'medium' | 'initial';
  lastPerformanceText?: string;
  todayTargetText: string;
  nextTargetText: string;
}
