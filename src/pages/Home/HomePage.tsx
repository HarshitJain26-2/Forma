import React, { useMemo } from 'react';
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
  RotateCcw 
} from 'lucide-react';
import { WorkoutDay } from '../../types/workout';

interface HomePageProps {
  onStartWorkout: (dayNumber: number) => void;
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

  // Dynamic statistics
  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const weeklyWorkouts = useMemo(() => calculateWeeklyWorkouts(sessions), [sessions]);
  const totalVolume = useMemo(() => calculateTotalVolume(sessions), [sessions]);
  const prsCount = useMemo(() => prs.length, [prs]);

  // Greeting
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

      {/* ACTIVE WORKOUT BANNER (CRITICAL REFRESH RECOVERY REQUIREMENT) */}
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

      {/* TODAY'S WORKOUT CARD */}
      <div className="bg-gradient-to-b from-card to-surface border border-border rounded-3xl p-5 space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-primary text-black font-mono font-black text-[10px] uppercase tracking-widest rounded-full shadow-glow-sm">
            TODAY'S SCHEDULE
          </span>

          <div className="flex items-center space-x-1 text-xs font-mono text-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            <span>{todaySplitDay.estimatedDurationMin}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-mono font-bold text-primary uppercase">
            {todaySplitDay.title}
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight text-white uppercase mt-0.5">
            {todaySplitDay.subtitle}
          </h2>
          <div className="text-xs text-text-secondary mt-1">
            {todaySplitDay.focus}
          </div>
        </div>

        {/* Workout Details Pill Matrix */}
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
            Take time to stretch, hydrate, and allow muscles and CNS to fully repair.
          </div>
        )}

        {/* PRIMARY CTA */}
        <button
          onClick={() => onStartWorkout(todaySplitDay.dayNumber)}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-display font-black text-base uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
        >
          <Play className="w-5 h-5 fill-black stroke-black" />
          <span>START WORKOUT</span>
        </button>
      </div>

      {/* 6-DAY SPLIT CYCLE CAROUSEL / PROGRAM OVERVIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
            6-Day Structured Split
          </h3>
          <span className="text-[10px] font-mono text-text-secondary uppercase">
            Cycle 4
          </span>
        </div>

        <div className="space-y-2.5">
          {program.map(day => {
            const isToday = day.dayNumber === todaySplitDay.dayNumber;
            const exCount = day.exercises.length;

            return (
              <div
                key={day.id}
                onClick={() => onStartWorkout(day.dayNumber)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isToday
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-card border-border hover:border-border-light'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    isToday ? 'bg-primary text-black font-black' : 'bg-surface text-text-secondary'
                  }`}>
                    0{day.dayNumber}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-display font-bold text-white uppercase group-hover:text-primary transition-colors">
                        {day.subtitle}
                      </span>
                      {day.variation && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface text-primary border border-primary/30 rounded uppercase">
                          {day.variation}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-text-secondary">
                      {day.isRestDay ? 'Rest / Active Recovery' : `${exCount} exercises • ${day.estimatedDurationMin}`}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
