import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { StrengthProgressChart } from '../../components/charts/StrengthProgressChart';
import { WeeklyVolumeChart } from '../../components/charts/WeeklyVolumeChart';
import { MuscleVolumeChart } from '../../components/charts/MuscleVolumeChart';
import { WorkoutConsistencyHeatmap } from '../../components/charts/WorkoutConsistencyHeatmap';
import { BodyWeightChart } from '../../components/charts/BodyWeightChart';
import { 
  calculateTotalVolume, 
  calculateWeeklyVolume, 
  calculateWeeklyWorkouts 
} from '../../utils/calculations';
import { formatDistanceOrTime, formatVolume } from '../../utils/units';
import { 
  TrendingUp, 
  Dumbbell, 
  Clock, 
  Activity, 
  Flame, 
  Award, 
  BarChart2 
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { sessions, settings, prs } = useWorkout();

  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'COMPLETED');
  }, [sessions]);

  // Overall statistics
  const weeklyWorkouts = useMemo(() => calculateWeeklyWorkouts(sessions), [sessions]);
  const weeklyVolume = useMemo(() => calculateWeeklyVolume(sessions), [sessions]);
  const totalVolume = useMemo(() => calculateTotalVolume(sessions), [sessions]);

  const totalSets = useMemo(() => {
    return completedSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
  }, [completedSessions]);

  const avgDurationSec = useMemo(() => {
    if (completedSessions.length === 0) return 0;
    const totalSec = completedSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    return Math.round(totalSec / completedSessions.length);
  }, [completedSessions]);

  const avgRpe = useMemo(() => {
    if (completedSessions.length === 0) return 0;
    const rpeSessions = completedSessions.filter(s => s.overallRpe);
    if (rpeSessions.length === 0) return 8.0;
    const total = rpeSessions.reduce((sum, s) => sum + (s.overallRpe || 8), 0);
    return Math.round((total / rpeSessions.length) * 10) / 10;
  }, [completedSessions]);

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto space-y-6">
      {/* PAGE TITLE */}
      <div>
        <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
          <TrendingUp className="w-3.5 h-3.5 mr-1" /> INTELLIGENCE & ANALYTICS
        </span>
        <h1 className="text-2xl font-display font-black tracking-tight text-white uppercase mt-0.5">
          PROGRESS & METRICS
        </h1>
      </div>

      {completedSessions.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-card border border-dashed border-border rounded-3xl p-8 text-center space-y-4 my-8">
          <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center mx-auto text-primary">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-white uppercase">
            BUILD YOUR DATA
          </h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Complete a few workout sessions to start generating strength curves, weekly volume trends, and muscle distribution analytics.
          </p>
        </div>
      ) : (
        <>
          {/* WEEKLY OVERVIEW STATS */}
          <div className="bg-gradient-to-br from-card to-surface border border-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
                WEEKLY PERFORMANCE OVERVIEW
              </span>
              <span className="text-xs font-mono text-text-secondary font-bold">
                {weeklyWorkouts} / 6 Days
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-black/60 border border-border/80 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-mono uppercase text-text-secondary">THIS WEEK</span>
                <div className="text-base font-display font-black text-primary mt-0.5">
                  {formatVolume(weeklyVolume, settings.units)}
                </div>
              </div>

              <div className="bg-black/60 border border-border/80 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-mono uppercase text-text-secondary">TOTAL SETS</span>
                <div className="text-base font-display font-black text-white mt-0.5">
                  {totalSets}
                </div>
              </div>

              <div className="bg-black/60 border border-border/80 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-mono uppercase text-text-secondary">AVG DURATION</span>
                <div className="text-base font-display font-black text-white mt-0.5">
                  {formatDistanceOrTime(avgDurationSec)}
                </div>
              </div>

              <div className="bg-black/60 border border-border/80 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-mono uppercase text-text-secondary">AVG RPE</span>
                <div className="text-base font-display font-black text-primary mt-0.5">
                  {avgRpe}
                </div>
              </div>
            </div>
          </div>

          {/* 1. STRENGTH PROGRESSION LINE CHART */}
          <StrengthProgressChart />

          {/* 2. WEEKLY VOLUME BAR CHART */}
          <WeeklyVolumeChart />

          {/* 3. MUSCLE GROUP VOLUME BARS */}
          <MuscleVolumeChart />

          {/* 4. WORKOUT CONSISTENCY HEATMAP */}
          <WorkoutConsistencyHeatmap />

          {/* 5. BODY COMPOSITION LINE CHART */}
          <BodyWeightChart />
        </>
      )}
    </div>
  );
};
