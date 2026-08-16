import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { 
  calculateCurrentStreak, 
  calculateTotalVolume, 
  calculateWeeklyWorkouts 
} from '../../utils/calculations';
import { formatVolume } from '../../utils/units';
import { 
  Flame, 
  Dumbbell, 
  Trophy, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { Weekday, WorkoutDay } from '../../types/workout';

interface HomePageProps {
  onStartWorkout: (dayId: Weekday | string) => void;
  onNavigateToWorkout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartWorkout,
  onNavigateToWorkout,
}) => {
  const { 
    sessions, 
    prs, 
    settings, 
    program, 
    activeSession, 
    discardWorkout, 
    todaySplitDay 
  } = useWorkout();

  const [selectedPreviewDay, setSelectedPreviewDay] = useState<WorkoutDay>(todaySplitDay);

  // Dynamic statistics
  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const weeklyWorkouts = useMemo(() => calculateWeeklyWorkouts(sessions), [sessions]);
  const totalVolume = useMemo(() => calculateTotalVolume(sessions), [sessions]);
  const prsCount = useMemo(() => prs.length, [prs]);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }, []);

  const totalExercises = todaySplitDay.exercises.length;
  const totalSets = todaySplitDay.exercises.reduce((sum, e) => sum + e.targetSets, 0);

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase">
            {greeting}, {settings.userName.toUpperCase()}
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase mt-0.5">
            PROGRESSION DASHBOARD
          </h1>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary shadow-glow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* ACTIVE WORKOUT BANNER (REFRESH RECOVERY) */}
      {activeSession && (
        <div className="bg-gradient-to-r from-card to-surface border-2 border-primary rounded-3xl p-5 shadow-[0_0_30px_rgba(204,255,0,0.2)] animate-pulse-glow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-black tracking-widest text-primary uppercase flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping mr-1.5" />
              WORKOUT IN PROGRESS
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {activeSession.exerciseLogs.filter(e => e.completed).length} / {activeSession.exerciseLogs.length} EXERCISES
            </span>
          </div>

          <h3 className="text-lg font-display font-black text-white uppercase mb-1">
            {activeSession.title}
          </h3>

          <p className="text-xs text-text-secondary mb-4">
            Session state preserved automatically. Resume anytime without losing set progress.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToWorkout}
              className="flex-1 py-3 bg-primary hover:bg-primary-hover text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-glow-sm flex items-center justify-center space-x-1.5 transition-transform active:scale-98"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>RESUME WORKOUT</span>
            </button>

            <button
              onClick={discardWorkout}
              className="px-4 py-3 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold uppercase text-text-secondary hover:text-red-400 transition-colors"
            >
              DISCARD
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC STATISTICS CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="bg-card border border-border rounded-3xl p-4 flex flex-col justify-between hover:border-border-light transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">STREAK</span>
            <Flame className="w-4 h-4 text-primary fill-primary" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white tracking-tight">
              {streak} <span className="text-xs font-mono font-bold text-primary">DAYS</span>
            </div>
            <div className="text-[11px] font-mono text-text-secondary mt-0.5">
              Consistent Training
            </div>
          </div>
        </div>

        {/* Weekly Workouts */}
        <div className="bg-card border border-border rounded-3xl p-4 flex flex-col justify-between hover:border-border-light transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">THIS WEEK</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white tracking-tight">
              {weeklyWorkouts} <span className="text-xs font-mono font-bold text-text-secondary">/ 6</span>
            </div>
            <div className="text-[11px] font-mono text-text-secondary mt-0.5">
              Workouts Completed
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-card border border-border rounded-3xl p-4 flex flex-col justify-between hover:border-border-light transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">LIFETIME VOLUME</span>
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-primary tracking-tight">
              {formatVolume(totalVolume, settings.units, false)}
            </div>
            <div className="text-[11px] font-mono text-text-secondary mt-0.5">
              Total {settings.units.toUpperCase()} Tonnage
            </div>
          </div>
        </div>

        {/* Total PRs */}
        <div className="bg-card border border-border rounded-3xl p-4 flex flex-col justify-between hover:border-border-light transition-colors">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">ALL-TIME PRS</span>
            <Trophy className="w-4 h-4 text-primary fill-primary" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white tracking-tight">
              {prsCount} <span className="text-xs font-mono font-bold text-primary">RECORDS</span>
            </div>
            <div className="text-[11px] font-mono text-text-secondary mt-0.5">
              Limits Shattered
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S WORKOUT HERO CARD */}
      <div className="bg-gradient-to-b from-card to-surface border border-border rounded-3xl p-5 space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-primary text-black font-mono font-black text-[10px] uppercase tracking-widest rounded-full shadow-glow-sm">
            TODAY'S WORKOUT
          </span>

          <div className="flex items-center space-x-1 text-xs font-mono text-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            <span>{todaySplitDay.estimatedDurationMin}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-mono font-extrabold text-primary uppercase tracking-wider">
            {todaySplitDay.displayName.toUpperCase()}
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase mt-0.5">
            {todaySplitDay.title}
          </h2>
          {todaySplitDay.variation && (
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] font-bold uppercase rounded-md">
              {todaySplitDay.variation}
            </span>
          )}
          <div className="text-xs text-text-secondary mt-1">
            {todaySplitDay.focus}
          </div>
        </div>

        {/* Details Matrix */}
        {!todaySplitDay.isRestDay ? (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-black/60 border border-border rounded-xl p-2.5 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-white font-bold">{totalExercises} Exercises</span>
            </div>
            <div className="bg-black/60 border border-border rounded-xl p-2.5 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-white font-bold">{totalSets} Total Sets</span>
            </div>
          </div>
        ) : (
          <div className="bg-black/60 border border-border rounded-xl p-3 text-xs text-text-secondary">
            Sunday is your dedicated recovery day. Focus on hydration, mobility, and high-protein nutrition for CNS reset.
          </div>
        )}

        {/* PRIMARY CTA */}
        <button
          onClick={() => onStartWorkout(todaySplitDay.weekday)}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-display font-black text-base uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
        >
          <Play className="w-5 h-5 fill-black stroke-black" />
          <span>START WORKOUT</span>
        </button>
      </div>

      {/* 7-DAY WEEKLY SCHEDULE BAR / CAROUSEL (MON -> SUN) */}
      <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
              WEEKLY TRAINING SPLIT
            </span>
            <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
              Weekly Routine
            </h3>
          </div>
          <span className="text-[10px] font-mono text-text-secondary uppercase">
            Monday — Sunday
          </span>
        </div>

        {/* Weekday Selector Tabs (MON TUE WED THU FRI SAT SUN) */}
        <div className="grid grid-cols-7 gap-1 bg-surface p-1.5 rounded-2xl border border-border">
          {program.map(day => {
            const isToday = day.weekday === todaySplitDay.weekday;
            const isSelected = day.weekday === selectedPreviewDay.weekday;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedPreviewDay(day)}
                className={`py-2 flex flex-col items-center justify-center rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-black font-extrabold shadow-glow-sm scale-105'
                    : isToday
                      ? 'border border-primary/60 text-primary bg-black/40 font-bold'
                      : 'text-text-secondary hover:text-white'
                }`}
              >
                <span className="text-xs font-mono font-bold">{day.shortName}</span>
                {isToday && (
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-black' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Weekday Preview Card */}
        <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-primary uppercase">
                {selectedPreviewDay.displayName.toUpperCase()}
              </div>
              <h4 className="text-lg font-display font-black text-white uppercase">
                {selectedPreviewDay.title}
              </h4>
            </div>

            {selectedPreviewDay.variation && (
              <span className="px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary font-mono text-[9px] font-bold uppercase rounded">
                {selectedPreviewDay.variation}
              </span>
            )}
          </div>

          <p className="text-xs text-text-secondary">{selectedPreviewDay.focus}</p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono text-text-secondary">
              {selectedPreviewDay.isRestDay
                ? 'Active Recovery Day'
                : `${selectedPreviewDay.exercises.length} exercises • ${selectedPreviewDay.estimatedDurationMin}`}
            </span>

            <button
              onClick={() => onStartWorkout(selectedPreviewDay.weekday)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-glow-sm flex items-center space-x-1 transition-transform active:scale-95"
            >
              <span>START {selectedPreviewDay.shortName}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
