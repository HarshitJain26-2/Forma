import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseCard } from './ExerciseCard';
import { formatDistanceOrTime } from '../../utils/units';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';

interface ActiveWorkoutViewProps {
  onBackToHome: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({ onBackToHome }) => {
  const { 
    activeSession, 
    program, 
    workoutDuration, 
    completeWorkout, 
    discardWorkout 
  } = useWorkout();

  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(() => {
    return activeSession?.exerciseLogs[0]?.exerciseId || null;
  });
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  if (!activeSession) {
    return null;
  }

  const dayDef = program.find(p => p.id === activeSession.workoutDayId) || program[0];
  const totalExercises = activeSession.exerciseLogs.length;
  const completedExercises = activeSession.exerciseLogs.filter(e => e.completed).length;
  const percentComplete = totalExercises > 0 
    ? Math.round((completedExercises / totalExercises) * 100) 
    : 0;

  const handleFinish = () => {
    completeWorkout();
  };

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 max-w-lg mx-auto">
      {/* TOP HEADER */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl pt-2 pb-4 -mx-4 px-4 border-b border-border/80 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBackToHome}
            className="flex items-center space-x-1 text-text-secondary hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center space-x-1.5 px-3 py-1 bg-surface border border-border rounded-full font-mono text-xs font-bold text-primary shadow-glow-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDistanceOrTime(workoutDuration)}</span>
          </div>

          <button
            onClick={() => setShowDiscardConfirm(true)}
            className="text-xs text-text-secondary hover:text-red-400 uppercase font-semibold transition-colors"
          >
            Discard
          </button>
        </div>

        {/* WORKOUT TITLE & BADGES */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
              WORKOUT IN PROGRESS
            </span>
            <h1 className="text-xl font-display font-black tracking-tight text-white uppercase">
              {activeSession.title}
            </h1>
          </div>
          {dayDef.variation && (
            <span className="px-2.5 py-1 bg-primary/10 border border-primary/40 text-primary font-mono text-[10px] font-bold uppercase rounded-lg">
              {dayDef.variation}
            </span>
          )}
        </div>

        {/* PROGRESS BAR & STATS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-secondary font-semibold">
              {String(completedExercises).padStart(2, '0')} / {String(totalExercises).padStart(2, '0')} EXERCISES
            </span>
            <span className="text-primary font-bold">{percentComplete}% COMPLETE</span>
          </div>
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 shadow-glow-sm"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* EXERCISES LIST */}
      <div className="space-y-3">
        {dayDef.exercises.map(exercise => {
          const exLog = activeSession.exerciseLogs.find(e => e.exerciseId === exercise.id);
          if (!exLog) return null;

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseLog={exLog}
              isExpanded={expandedExerciseId === exercise.id}
              onToggleExpand={() => {
                setExpandedExerciseId(expandedExerciseId === exercise.id ? null : exercise.id);
              }}
            />
          );
        })}
      </div>

      {/* FINISH WORKOUT CTA */}
      <div className="mt-8 space-y-3">
        <button
          onClick={handleFinish}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-display font-black text-base uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
        >
          <CheckCircle className="w-5 h-5 stroke-[2.5]" />
          <span>FINISH WORKOUT</span>
        </button>

        <p className="text-center text-[11px] font-mono text-text-secondary">
          Completed sets and personal records will be recorded in your history.
        </p>
      </div>

      {/* DISCARD CONFIRMATION MODAL */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-white uppercase">
              Discard Active Workout?
            </h3>
            <p className="text-xs text-text-secondary">
              All uncompleted set logs and active session timer for today will be cleared.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="py-3 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-white"
              >
                KEEP LOGGING
              </button>
              <button
                onClick={() => {
                  setShowDiscardConfirm(false);
                  discardWorkout();
                  onBackToHome();
                }}
                className="py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-bold text-red-400"
              >
                DISCARD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
