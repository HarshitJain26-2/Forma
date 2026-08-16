import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import { displayWeightValue, formatVolume } from '../../utils/units';
import { BarChart3 } from 'lucide-react';

export const WeeklyVolumeChart: React.FC = () => {
  const { sessions, settings } = useWorkout();

  const chartData = useMemo(() => {
    const completedSessions = sessions
      .filter(s => s.status === 'COMPLETED' && s.completedAt)
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    if (completedSessions.length === 0) return [];

    // Group sessions by Week
    const weekMap: { [key: string]: { label: string; volumeKg: number; workoutsCount: number } } = {};

    completedSessions.forEach(session => {
      const d = new Date(session.completedAt || session.startedAt);
      // Determine week start (Monday)
      const day = d.getDay();
      const diff = (day + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diff);
      monday.setHours(0, 0, 0, 0);

      const key = monday.toISOString().split('T')[0];
      const label = `${monday.toLocaleString('default', { month: 'short' })} ${monday.getDate()}`;

      if (!weekMap[key]) {
        weekMap[key] = { label, volumeKg: 0, workoutsCount: 0 };
      }
      weekMap[key].volumeKg += session.totalVolumeKg || 0;
      weekMap[key].workoutsCount += 1;
    });

    const sortedKeys = Object.keys(weekMap).sort();
    // Take the last 6 weeks
    const recentKeys = sortedKeys.slice(-6);

    return recentKeys.map(k => ({
      week: weekMap[k].label,
      volume: displayWeightValue(weekMap[k].volumeKg, settings.units),
      workouts: weekMap[k].workoutsCount,
    }));
  }, [sessions, settings.units]);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
      <div>
        <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
          <BarChart3 className="w-3.5 h-3.5 mr-1" /> WEEKLY VOLUME
        </span>
        <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
          Tonnage Lifted Over Time
        </h3>
      </div>

      {chartData.length > 0 ? (
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis 
                dataKey="week" 
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
                tickFormatter={val => `${Math.round(val / 1000)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface/95 border border-primary/40 backdrop-blur-md rounded-xl p-3 shadow-xl text-xs font-mono">
                        <div className="text-text-secondary font-bold mb-1">Week of {label}</div>
                        <div className="text-primary font-bold text-sm">
                          {formatVolume(data.volume, settings.units)}
                        </div>
                        <div className="text-text-secondary mt-0.5">
                          {data.workouts} workout{data.workouts > 1 ? 's' : ''} logged
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="volume" 
                fill="#CCFF00" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={42} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 bg-surface/40 border border-dashed border-border rounded-2xl flex items-center justify-center text-center p-4">
          <span className="text-xs font-mono text-text-secondary">
            No completed workouts to compute weekly volume.
          </span>
        </div>
      )}
    </div>
  );
};
