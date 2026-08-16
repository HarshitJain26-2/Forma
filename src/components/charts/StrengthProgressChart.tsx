import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import { WORKOUT_PROGRAM } from '../../data/workoutProgram';
import { calculateEstimated1RM } from '../../utils/calculations';
import { displayWeightValue, formatWeight } from '../../utils/units';
import { TrendingUp, Dumbbell } from 'lucide-react';

export const StrengthProgressChart: React.FC = () => {
  const { sessions, settings } = useWorkout();

  // Collect all unique exercises across the program
  const allExercises = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    WORKOUT_PROGRAM.forEach(day => {
      day.exercises.forEach(ex => {
        if (!list.some(e => e.id === ex.id) && !ex.isFailureBased) {
          list.push({ id: ex.id, name: ex.name });
        }
      });
    });
    return list;
  }, []);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    allExercises[0]?.id || 'd1-ex1'
  );

  // Extract historical strength data for the selected exercise
  const chartData = useMemo(() => {
    const completedSessions = sessions
      .filter(s => s.status === 'COMPLETED' && s.completedAt)
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    const points: { date: string; weight: number; e1rm: number; displayWeight: number; displayE1rm: number }[] = [];

    completedSessions.forEach(session => {
      const exLog = session.exerciseLogs.find(e => e.exerciseId === selectedExerciseId);
      if (exLog && exLog.sets && exLog.sets.length > 0) {
        const completedSets = exLog.sets.filter(s => s.completed && s.weightKg > 0);
        if (completedSets.length > 0) {
          const maxWeight = Math.max(...completedSets.map(s => s.weightKg));
          const max1RM = Math.max(...completedSets.map(s => calculateEstimated1RM(s.weightKg, s.reps)));
          
          const d = new Date(session.completedAt || session.startedAt);
          const dateStr = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;

          points.push({
            date: dateStr,
            weight: maxWeight,
            e1rm: max1RM,
            displayWeight: displayWeightValue(maxWeight, settings.units),
            displayE1rm: displayWeightValue(max1RM, settings.units),
          });
        }
      }
    });

    return points;
  }, [sessions, selectedExerciseId, settings.units]);

  const selectedExerciseName = allExercises.find(e => e.id === selectedExerciseId)?.name || 'Exercise';

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> STRENGTH PROGRESSION
          </span>
          <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
            Load & Est. 1RM Over Time
          </h3>
        </div>

        {/* Exercise Dropdown */}
        <div className="relative">
          <select
            value={selectedExerciseId}
            onChange={e => setSelectedExerciseId(e.target.value)}
            className="w-full sm:w-auto bg-surface border border-border focus:border-primary text-white text-xs font-mono font-bold rounded-xl py-2 px-3 outline-none cursor-pointer"
          >
            {allExercises.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-surface text-white">
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CHART CONTAINER */}
      {chartData.length > 1 ? (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#222222' }}
              />
              <YAxis 
                stroke="#666666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#222222' }}
                unit={` ${settings.units.toUpperCase()}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface/95 border border-primary/40 backdrop-blur-md rounded-xl p-3 shadow-xl text-xs font-mono">
                        <div className="text-text-secondary font-bold mb-1">{label}</div>
                        <div className="text-primary font-bold">
                          Weight: {payload[0]?.value} {settings.units.toUpperCase()}
                        </div>
                        {payload[1] && (
                          <div className="text-white font-semibold">
                            Est. 1RM: {payload[1]?.value} {settings.units.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="displayWeight"
                name="Top Weight"
                stroke="#CCFF00"
                strokeWidth={3}
                dot={{ fill: '#CCFF00', stroke: '#000000', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#FFFFFF', stroke: '#CCFF00', strokeWidth: 3, r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="displayE1rm"
                name="Est. 1RM"
                stroke="#888888"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={{ fill: '#888888', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-44 bg-surface/40 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-4">
          <Dumbbell className="w-8 h-8 text-text-secondary/40 mb-2" />
          <span className="text-xs font-mono text-text-secondary">
            Log at least 2 sessions with {selectedExerciseName} to render strength progression curves.
          </span>
        </div>
      )}

      {/* LEGEND */}
      <div className="flex items-center justify-center space-x-6 text-[11px] font-mono text-text-secondary pt-1">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-0.5 bg-primary" />
          <span className="text-white font-semibold">Max Weight Lifted</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-0.5 bg-neutral-500 border-b border-dashed" />
          <span>Estimated 1RM</span>
        </div>
      </div>
    </div>
  );
};
