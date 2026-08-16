import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Calendar, Flame } from 'lucide-react';
import { calculateCurrentStreak } from '../../utils/calculations';

export const WorkoutConsistencyHeatmap: React.FC = () => {
  const { sessions } = useWorkout();

  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);

  // Build a grid of the last 14 weeks (98 days)
  const heatmapWeeks = useMemo(() => {
    const sessionDateMap = new Map<string, { title: string; volumeKg: number }>();
    sessions.filter(s => s.status === 'COMPLETED' && s.completedAt).forEach(s => {
      const d = new Date(s.completedAt || s.startedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      sessionDateMap.set(dateStr, {
        title: s.title,
        volumeKg: s.totalVolumeKg,
      });
    });

    const now = new Date();
    // End on upcoming Saturday to align full weeks
    const currentDay = now.getDay();
    const daysUntilEndOfWeek = (6 - currentDay + 7) % 7;
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + daysUntilEndOfWeek);

    const totalDays = 14 * 7; // 14 weeks
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const weeks: { days: { dateStr: string; dayOfMonth: number; monthName: string; isCompleted: boolean; isToday: boolean; title?: string }[] }[] = [];

    let currentWeek: { dateStr: string; dayOfMonth: number; monthName: string; isCompleted: boolean; isToday: boolean; title?: string }[] = [];
    let iter = new Date(startDate);

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    while (iter <= endDate) {
      const dateStr = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}-${String(iter.getDate()).padStart(2, '0')}`;
      const sessionInfo = sessionDateMap.get(dateStr);

      currentWeek.push({
        dateStr,
        dayOfMonth: iter.getDate(),
        monthName: iter.toLocaleString('default', { month: 'short' }),
        isCompleted: !!sessionInfo,
        isToday: dateStr === todayStr,
        title: sessionInfo?.title,
      });

      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }

      iter.setDate(iter.getDate() + 1);
    }

    return weeks;
  }, [sessions]);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" /> TRAINING CONSISTENCY
          </span>
          <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
            Workout Frequency Heatmap
          </h3>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 bg-primary/10 border border-primary/40 rounded-xl font-mono text-xs font-bold text-primary shadow-glow-sm">
          <Flame className="w-3.5 h-3.5 fill-primary" />
          <span>{streak} DAY STREAK</span>
        </div>
      </div>

      {/* HEATMAP GRID */}
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-1.5 min-w-[320px] justify-between">
          {heatmapWeeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col space-y-1.5 flex-1">
              {week.days.map(day => (
                <div
                  key={day.dateStr}
                  title={`${day.dateStr}${day.title ? ` • ${day.title}` : ''}`}
                  className={`w-full aspect-square rounded-md transition-all ${
                    day.isCompleted
                      ? 'bg-primary shadow-[0_0_8px_rgba(204,255,0,0.35)] scale-105'
                      : day.isToday
                        ? 'border border-primary bg-surface'
                        : 'bg-surface/80 border border-border/40 hover:border-neutral-600'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary pt-1">
        <span>14-Week Activity</span>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded bg-surface border border-border" />
            <span>Rest</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded bg-primary" />
            <span className="text-white font-bold">Trained</span>
          </div>
        </div>
      </div>
    </div>
  );
};
