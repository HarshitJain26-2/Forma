import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { WORKOUT_PROGRAM } from '../../data/workoutProgram';
import { formatDistanceOrTime, formatVolume, formatWeight } from '../../utils/units';
import { calculateEstimated1RM, calculateExerciseVolume } from '../../utils/calculations';
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Calendar, 
  Clock, 
  Dumbbell, 
  CheckCircle, 
  Filter, 
  Search, 
  Layers 
} from 'lucide-react';
import { WorkoutSession } from '../../types/workout';

export const HistoryPage: React.FC = () => {
  const { sessions, prs, settings } = useWorkout();

  const [viewMode, setViewMode] = useState<'workouts' | 'exercises'>('workouts');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Exercise history state
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('d1-ex1');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '3m' | '1y' | 'all'>('all');

  const completedSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'COMPLETED')
      .sort((a, b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt));
  }, [sessions]);

  // Exercise history aggregation
  const allExercises = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    WORKOUT_PROGRAM.forEach(day => {
      day.exercises.forEach(ex => {
        if (!list.some(e => e.id === ex.id)) {
          list.push({ id: ex.id, name: ex.name });
        }
      });
    });
    return list;
  }, []);

  const exerciseLogsHistory = useMemo(() => {
    const now = Date.now();
    const filterCutoffs = {
      '7d': now - 7 * 86400000,
      '30d': now - 30 * 86400000,
      '3m': now - 90 * 86400000,
      '1y': now - 365 * 86400000,
      'all': 0,
    };
    const cutoff = filterCutoffs[timeFilter];

    const logs: {
      date: string;
      rawDate: number;
      setsCount: number;
      maxWeightKg: number;
      maxReps: number;
      totalVolumeKg: number;
      setsSummary: string;
      e1rm: number;
    }[] = [];

    completedSessions.forEach(session => {
      const sessionDate = session.completedAt || session.startedAt;
      if (sessionDate < cutoff) return;

      const ex = session.exerciseLogs.find(e => e.exerciseId === selectedExerciseId);
      if (ex && ex.sets && ex.sets.length > 0) {
        const completed = ex.sets.filter(s => s.completed);
        if (completed.length > 0) {
          const maxWt = Math.max(...completed.map(s => s.weightKg));
          const maxReps = Math.max(...completed.map(s => s.reps));
          const vol = calculateExerciseVolume(ex);
          const top1RM = Math.max(...completed.map(s => calculateEstimated1RM(s.weightKg, s.reps)));

          const d = new Date(sessionDate);
          const dateStr = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`;

          const summary = completed.map(s => `${formatWeight(s.weightKg, settings.units, false)} × ${s.reps}`).join(' • ');

          logs.push({
            date: dateStr,
            rawDate: sessionDate,
            setsCount: completed.length,
            maxWeightKg: maxWt,
            maxReps,
            totalVolumeKg: vol,
            setsSummary: summary,
            e1rm: top1RM,
          });
        }
      }
    });

    return logs.sort((a, b) => b.rawDate - a.rawDate);
  }, [completedSessions, selectedExerciseId, timeFilter, settings.units]);

  // Selected exercise PR & Best Volume
  const selectedExPR = useMemo(() => {
    const matchingPrs = prs.filter(p => p.exerciseId === selectedExerciseId && p.recordType === 'weight');
    if (matchingPrs.length === 0) return null;
    return matchingPrs.sort((a, b) => b.value - a.value)[0];
  }, [prs, selectedExerciseId]);

  const selectedExBestVol = useMemo(() => {
    if (exerciseLogsHistory.length === 0) return 0;
    return Math.max(...exerciseLogsHistory.map(l => l.totalVolumeKg));
  }, [exerciseLogsHistory]);

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto space-y-6">
      {/* HEADER & VIEW TOGGLE */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
            <History className="w-3.5 h-3.5 mr-1" /> TRAINING LOGBOOK
          </span>
          <h1 className="text-2xl font-display font-black tracking-tight text-white uppercase mt-0.5">
            WORKOUT HISTORY
          </h1>
        </div>

        <div className="flex bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setViewMode('workouts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              viewMode === 'workouts'
                ? 'bg-primary text-black shadow-glow-sm'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setViewMode('exercises')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              viewMode === 'exercises'
                ? 'bg-primary text-black shadow-glow-sm'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Exercises
          </button>
        </div>
      </div>

      {completedSessions.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-card border border-dashed border-border rounded-3xl p-8 text-center space-y-4 my-8">
          <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center mx-auto text-primary">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-white uppercase">
            NO WORKOUTS YET
          </h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Your completed workout sessions will appear here with detailed set logs and PR badges.
          </p>
        </div>
      ) : viewMode === 'workouts' ? (
        /* WORKOUTS CHRONOLOGICAL SESSIONS LIST */
        <div className="space-y-3.5">
          {completedSessions.map(session => {
            const isExpanded = expandedSessionId === session.id;
            const d = new Date(session.completedAt || session.startedAt);
            const dateFormatted = `${d.toLocaleString('default', { month: 'short' }).toUpperCase()} ${d.getDate()}`;
            const prsInSession = session.prsAchieved?.length || 0;

            return (
              <div
                key={session.id}
                className={`bg-card border rounded-3xl transition-all overflow-hidden ${
                  isExpanded ? 'border-primary/40 bg-surface/30' : 'border-border hover:border-border-light'
                }`}
              >
                {/* Session summary header */}
                <div
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                  className="p-4 sm:p-5 cursor-pointer select-none"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-extrabold text-primary px-2.5 py-0.5 bg-primary/10 border border-primary/30 rounded-md">
                        {dateFormatted}
                      </span>
                      {session.variation && (
                        <span className="text-[10px] font-mono uppercase text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
                          {session.variation}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary font-bold flex items-center">
                      <CheckCircle className="w-3 h-3 text-primary mr-1" /> COMPLETED
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-display font-bold text-white uppercase">
                        {session.title}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs font-mono text-text-secondary mt-1">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatDistanceOrTime(session.durationSeconds)}
                        </span>
                        <span>•</span>
                        <span className="text-white font-bold">
                          {formatVolume(session.totalVolumeKg, settings.units)}
                        </span>
                        <span>•</span>
                        <span>{session.exerciseLogs.length} Exercises</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {prsInSession > 0 && (
                        <span className="px-2 py-1 bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono font-bold rounded-lg flex items-center">
                          <Flame className="w-3 h-3 mr-1 fill-primary" /> {prsInSession} PR{prsInSession > 1 ? 's' : ''}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-text-secondary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-text-secondary" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Session Set-by-Set Detail */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 sm:px-5 border-t border-border/60 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-text-secondary font-bold pt-2">
                      EXERCISE BREAKDOWN
                    </div>

                    <div className="space-y-2">
                      {session.exerciseLogs.map(ex => {
                        const completedSets = ex.sets.filter(s => s.completed);
                        return (
                          <div key={ex.exerciseId} className="bg-black/50 border border-border/80 rounded-2xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-white font-bold uppercase">{ex.exerciseName}</span>
                              <span className="text-primary font-bold">
                                {formatVolume(calculateExerciseVolume(ex), settings.units)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                              {completedSets.map((s, idx) => (
                                <span
                                  key={s.id || idx}
                                  className="px-2 py-0.5 bg-surface border border-border rounded-lg text-text-secondary"
                                >
                                  Set {s.setNumber}: {formatWeight(s.weightKg, settings.units, false)} × {s.reps}
                                  {s.rpe ? ` @${s.rpe}` : ''}
                                </span>
                              ))}
                            </div>

                            {ex.note && (
                              <div className="text-[11px] text-text-secondary italic pt-0.5">
                                Note: {ex.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {session.notes && (
                      <div className="bg-surface/50 border border-border rounded-xl p-3 text-xs text-text-secondary">
                        <span className="font-bold text-white uppercase font-mono block mb-1">Workout Notes:</span>
                        {session.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* EXERCISE DRILLDOWN VIEW */
        <div className="space-y-4">
          {/* Exercise Selector & Range Filter */}
          <div className="space-y-2">
            <select
              value={selectedExerciseId}
              onChange={e => setSelectedExerciseId(e.target.value)}
              className="w-full bg-card border border-border focus:border-primary text-white text-xs font-mono font-bold rounded-2xl py-3 px-3.5 outline-none cursor-pointer"
            >
              {allExercises.map(ex => (
                <option key={ex.id} value={ex.id} className="bg-surface text-white">
                  {ex.name}
                </option>
              ))}
            </select>

            {/* Time Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {(['7d', '30d', '3m', '1y', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold uppercase border transition-all ${
                    timeFilter === f
                      ? 'bg-primary text-black border-primary font-black shadow-glow-sm'
                      : 'bg-surface border-border text-text-secondary hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All Time' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise PR & Best Volume Highlights */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-card border border-border rounded-2xl p-3.5">
              <span className="text-[10px] font-mono uppercase text-text-secondary">CURRENT PR</span>
              <div className="text-lg font-display font-black text-primary mt-0.5">
                {selectedExPR ? selectedExPR.details : '—'}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-3.5">
              <span className="text-[10px] font-mono uppercase text-text-secondary">BEST SESSION VOLUME</span>
              <div className="text-lg font-display font-black text-white mt-0.5">
                {selectedExBestVol > 0 ? formatVolume(selectedExBestVol, settings.units) : '—'}
              </div>
            </div>
          </div>

          {/* Exercise History Table */}
          <div className="bg-card border border-border rounded-3xl p-4 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-text-secondary font-bold px-1 mb-2">
              HISTORICAL PERFORMANCES
            </div>

            {exerciseLogsHistory.length > 0 ? (
              <div className="space-y-2">
                {exerciseLogsHistory.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface/70 border border-border/80 rounded-2xl flex flex-col space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">{log.date}</span>
                      <span className="text-primary font-bold">
                        Vol: {formatVolume(log.totalVolumeKg, settings.units)}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-text-secondary">
                      {log.setsSummary}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-text-secondary">
                No logs recorded for this exercise in the selected timeframe.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
