import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { WORKOUT_PROGRAM } from '../../data/workoutProgram';
import { calculateExerciseVolume } from '../../utils/calculations';
import { formatVolume } from '../../utils/units';
import { Activity } from 'lucide-react';
import { MuscleGroup } from '../../types/workout';

export const MuscleVolumeChart: React.FC = () => {
  const { sessions, settings } = useWorkout();

  const muscleData = useMemo(() => {
    // Map exerciseId to primaryMuscle
    const exerciseMuscleMap: { [id: string]: MuscleGroup } = {};
    WORKOUT_PROGRAM.forEach(day => {
      day.exercises.forEach(ex => {
        exerciseMuscleMap[ex.id] = ex.primaryMuscle;
      });
    });

    const muscleVolumes: { [key in MuscleGroup]?: number } = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      legs: 0,
      calves: 0,
    };

    // Calculate volume per primary muscle group over the last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recentSessions = sessions.filter(
      s => s.status === 'COMPLETED' && s.completedAt && s.completedAt >= thirtyDaysAgo
    );

    recentSessions.forEach(session => {
      session.exerciseLogs.forEach(exLog => {
        const muscle = exerciseMuscleMap[exLog.exerciseId];
        if (muscle && muscleVolumes[muscle] !== undefined) {
          muscleVolumes[muscle] = (muscleVolumes[muscle] || 0) + calculateExerciseVolume(exLog);
        }
      });
    });

    const list = [
      { name: 'Chest', key: 'chest', volume: muscleVolumes.chest || 0 },
      { name: 'Back', key: 'back', volume: muscleVolumes.back || 0 },
      { name: 'Shoulders', key: 'shoulders', volume: muscleVolumes.shoulders || 0 },
      { name: 'Biceps', key: 'biceps', volume: muscleVolumes.biceps || 0 },
      { name: 'Triceps', key: 'triceps', volume: muscleVolumes.triceps || 0 },
      { name: 'Legs', key: 'legs', volume: (muscleVolumes.legs || 0) + (muscleVolumes.calves || 0) },
    ];

    const maxVol = Math.max(...list.map(m => m.volume), 1);
    const totalVol = list.reduce((sum, m) => sum + m.volume, 0);

    return list.map(m => ({
      ...m,
      percentage: totalVol > 0 ? Math.round((m.volume / totalVol) * 100) : 0,
      barWidth: Math.round((m.volume / maxVol) * 100),
    }));
  }, [sessions]);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
      <div>
        <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
          <Activity className="w-3.5 h-3.5 mr-1" /> MUSCLE GROUP DISTRIBUTION
        </span>
        <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
          30-Day Training Volume Split
        </h3>
      </div>

      <div className="space-y-3.5 pt-1">
        {muscleData.map(item => (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold tracking-tight">{item.name}</span>
                <span className="text-text-secondary text-[11px]">({item.percentage}%)</span>
              </div>
              <span className="text-primary font-bold">
                {formatVolume(item.volume, settings.units)}
              </span>
            </div>

            <div className="h-2.5 w-full bg-surface rounded-full overflow-hidden p-0.5 border border-border/50">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 shadow-glow-sm"
                style={{ width: `${Math.max(item.barWidth, item.volume > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
