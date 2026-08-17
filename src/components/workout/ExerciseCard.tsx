import React, { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Exercise, ExerciseLog, SetLog } from '../../types/workout';
import { generateProgressionRecommendation, getLastExercisePerformance } from '../../engine/progressionEngine';
import { displayWeightValue, formatWeight, parseInputWeight } from '../../utils/units';
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Flame, 
  MessageSquare, 
  Info, 
  TrendingUp, 
  Sparkles,
  Timer,
  Play,
  Square,
  Clock
} from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseLog: ExerciseLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditExercise?: () => void;
  onDeleteExercise?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  exerciseLog,
  isExpanded,
  onToggleExpand,
  onEditExercise,
  onDeleteExercise,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const { 
    sessions, 
    settings, 
    toggleSetComplete, 
    updateSetValues,
    updateSetDuration, 
    addSet, 
    removeSet, 
    updateExerciseNote,
    startRestTimer
  } = useWorkout();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(exerciseLog.note || '');
  const [showRpeColumn, setShowRpeColumn] = useState(false);

  // Live stopwatch state for tracking time-under-tension / timed hold per set
  const [activeTimingSetIdx, setActiveTimingSetIdx] = useState<number | null>(null);
  const [elapsedSetSeconds, setElapsedSetSeconds] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (activeTimingSetIdx !== null) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSetSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimingSetIdx]);

  const handleStartSetTimer = (setIdx: number) => {
    if (activeTimingSetIdx === setIdx) {
      // Stop timer and record
      updateSetDuration(exercise.id, setIdx, elapsedSetSeconds);
      setActiveTimingSetIdx(null);
    } else {
      // Start timer for this set
      setActiveTimingSetIdx(setIdx);
      setElapsedSetSeconds(0);
    }
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Compute previous performance & progressive overload recommendations
  const previousPerformance = getLastExercisePerformance(sessions, exercise.id);
  const progression = generateProgressionRecommendation(exercise, previousPerformance, settings.units);

  const completedSetsCount = exerciseLog.sets.filter(s => s.completed).length;
  const totalSetsCount = exerciseLog.sets.length;
  const isFullyCompleted = totalSetsCount > 0 && completedSetsCount === totalSetsCount;

  const handleSaveNote = () => {
    updateExerciseNote(exercise.id, noteText);
    setIsEditingNote(false);
  };

  return (
    <div className={`bg-card border rounded-3xl transition-all duration-200 overflow-hidden mb-4 ${
      isFullyCompleted 
        ? 'border-primary/40 bg-surface/30' 
        : isExpanded 
          ? 'border-border-light shadow-lg' 
          : 'border-border'
    }`}>
      {/* HEADER BAR */}
      <div 
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-surface/40 transition-colors"
      >
        <div 
          onClick={onToggleExpand}
          className="flex items-center space-x-3.5 flex-1 min-w-0"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-extrabold text-xs transition-colors ${
            isFullyCompleted 
              ? 'bg-primary text-black shadow-glow-sm' 
              : 'bg-surface border border-border text-text-secondary'
          }`}>
            {isFullyCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : `0${exercise.order}`}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-display font-bold tracking-tight text-white uppercase truncate">
                {exercise.name}
              </h3>
              {exercise.isFailureBased && (
                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold uppercase rounded-md">
                  FAILURE
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-text-secondary mt-0.5">
              <span className="font-mono">{exercise.targetSets} × {exercise.isFailureBased ? 'FAILURE' : `${exercise.targetRepMin}–${exercise.targetRepMax}`}</span>
              <span>•</span>
              <span className="capitalize">{exercise.equipment}</span>
              <span>•</span>
              <span className="capitalize">{exercise.primaryMuscle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-2">
          {/* Quick Action Icons when expanded */}
          {isExpanded && onEditExercise && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditExercise();
              }}
              title="Edit Exercise"
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-primary transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {isExpanded && onDeleteExercise && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteExercise();
              }}
              title="Delete Exercise"
              className="p-1.5 rounded-lg bg-surface hover:bg-red-500/20 border border-border hover:border-red-500/40 text-text-secondary hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div 
            onClick={onToggleExpand}
            className="flex items-center space-x-2"
          >
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
              isFullyCompleted ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary'
            }`}>
              {completedSetsCount}/{totalSetsCount}
            </span>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="px-4 pb-5 pt-1 sm:px-5 space-y-4 border-t border-border/50">
          {/* SPECIAL INSTRUCTIONS IF ANY */}
          {exercise.specialInstruction && (
            <div className="flex items-start space-x-2 text-xs text-text-secondary bg-surface/60 border border-border/60 p-2.5 rounded-xl">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{exercise.specialInstruction}</span>
            </div>
          )}

          {/* THE CORE UX: LAST TIME → TODAY → NEXT TARGET BANNER */}
          <div className="bg-surface border border-border/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary font-bold flex items-center">
                <Sparkles className="w-3 h-3 text-primary mr-1" /> INTELLIGENT PROGRESSION
              </span>
              <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                progression.type === 'INCREASE_WEIGHT'
                  ? 'bg-primary text-black shadow-glow-sm'
                  : progression.type === 'ADD_REP'
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : progression.type === 'REDUCE_LOAD'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      : 'bg-neutral-800 text-text-secondary'
              }`}>
                {progression.badgeText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-black/60 p-2 rounded-xl border border-border/60">
                <div className="text-[9px] uppercase tracking-wider text-text-secondary font-bold mb-0.5">
                  LAST TIME
                </div>
                <div className="text-white font-semibold truncate">
                  {previousPerformance ? previousPerformance.summaryText : 'No previous log'}
                </div>
              </div>

              <div className="bg-black/60 p-2 rounded-xl border border-border/60">
                <div className="text-[9px] uppercase tracking-wider text-text-secondary font-bold mb-0.5">
                  TODAY'S TARGET
                </div>
                <div className="text-white font-semibold truncate">
                  {progression.todayTargetText}
                </div>
              </div>

              <div className="bg-black/60 p-2 rounded-xl border border-primary/30">
                <div className="text-[9px] uppercase tracking-wider text-primary font-bold mb-0.5">
                  NEXT TARGET
                </div>
                <div className="text-primary font-bold truncate">
                  {progression.nextTargetText}
                </div>
              </div>
            </div>
          </div>

          {/* SETS TABLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-text-secondary px-2">
              <div className="flex items-center space-x-6">
                <span className="w-6">SET</span>
                <span className="w-20 text-center">WEIGHT ({settings.units.toUpperCase()})</span>
                <span className="w-16 text-center">REPS</span>
                {showRpeColumn && <span className="w-14 text-center">RPE</span>}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => startRestTimer(exercise.restSeconds || exerciseLog.restSeconds || settings.defaultRestSeconds)}
                  className="text-[10px] font-mono text-primary/80 hover:text-primary transition-colors flex items-center space-x-1"
                  title="Start Rest Timer"
                >
                  <Timer className="w-3 h-3" />
                  <span>{exercise.restSeconds || exerciseLog.restSeconds || settings.defaultRestSeconds}s REST</span>
                </button>
                <span className="text-neutral-600">•</span>
                <button
                  type="button"
                  onClick={() => setShowRpeColumn(!showRpeColumn)}
                  className="text-[10px] text-text-secondary hover:text-primary transition-colors underline"
                >
                  {showRpeColumn ? 'Hide RPE' : '+ RPE'}
                </button>
                <span className="w-8 text-right">DONE</span>
              </div>
            </div>

            {/* SET ROWS */}
            {exerciseLog.sets.map((set, setIdx) => {
              const displayWt = displayWeightValue(set.weightKg, settings.units);

              return (
                <div 
                  key={set.id || setIdx}
                  className={`flex items-center justify-between p-2 rounded-2xl border transition-all ${
                    set.completed 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'bg-surface border-border hover:border-border-light'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* SET NUMBER */}
                    <span className="w-6 text-center font-mono font-bold text-sm text-text-secondary">
                      {set.setNumber}
                    </span>

                    {/* WEIGHT INPUT */}
                    <div className="w-20 relative">
                      <input
                        type="number"
                        step={settings.units === 'lb' ? '1' : '0.5'}
                        min="0"
                        value={displayWt === 0 && exercise.isFailureBased ? '' : displayWt || ''}
                        placeholder={exercise.isFailureBased ? 'BW' : '0'}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const kgVal = parseInputWeight(val, settings.units);
                          updateSetValues(exercise.id, setIdx, kgVal, set.reps, set.rpe);
                        }}
                        className="w-full bg-black border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-2 text-center text-sm font-mono font-bold text-white outline-none transition-colors"
                      />
                    </div>

                    {/* REPS INPUT */}
                    <div className="w-16 relative">
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={set.reps || ''}
                        placeholder="0"
                        onChange={e => {
                          const repsVal = parseInt(e.target.value, 10) || 0;
                          updateSetValues(exercise.id, setIdx, set.weightKg, repsVal, set.rpe);
                        }}
                        className="w-full bg-black border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-2 text-center text-sm font-mono font-bold text-white outline-none transition-colors"
                      />
                    </div>

                    {/* OPTIONAL RPE INPUT */}
                    {showRpeColumn && (
                      <div className="w-14 relative">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          value={set.rpe || ''}
                          placeholder="—"
                          onChange={e => {
                            const rpeVal = parseFloat(e.target.value) || undefined;
                            updateSetValues(exercise.id, setIdx, set.weightKg, set.reps, rpeVal);
                          }}
                          className="w-full bg-black border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-1 text-center text-xs font-mono font-bold text-white outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS: SET TIMER, REMOVE & COMPLETE CHECKBOX */}
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    {/* LIVE SET STOPWATCH / DURATION TIMER BUTTON */}
                    {activeTimingSetIdx === setIdx ? (
                      <button
                        type="button"
                        onClick={() => handleStartSetTimer(setIdx)}
                        className="px-2 py-1 bg-primary text-black font-mono font-black text-xs rounded-xl flex items-center space-x-1 animate-pulse shadow-glow-sm"
                        title="Stop & Save Set Duration"
                      >
                        <Square className="w-3 h-3 fill-black" />
                        <span>{formatSecs(elapsedSetSeconds)}</span>
                      </button>
                    ) : set.durationSeconds ? (
                      <button
                        type="button"
                        onClick={() => handleStartSetTimer(setIdx)}
                        className="px-2 py-1 bg-surface border border-primary/40 text-primary font-mono text-[11px] font-bold rounded-xl flex items-center space-x-1 hover:border-primary transition-colors"
                        title="Recorded set duration. Click to re-time."
                      >
                        <Clock className="w-3 h-3" />
                        <span>{set.durationSeconds}s</span>
                      </button>
                    ) : !set.completed ? (
                      <button
                        type="button"
                        onClick={() => handleStartSetTimer(setIdx)}
                        className="p-1.5 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface"
                        title="Start live set execution timer (Stopwatch / Hold duration)"
                      >
                        <Timer className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRestTimer(exercise.restSeconds || exerciseLog.restSeconds || settings.defaultRestSeconds)}
                        className="p-1.5 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface"
                        title="Restart rest timer for this set"
                      >
                        <Timer className="w-4 h-4 text-primary/70" />
                      </button>
                    )}

                    {exerciseLog.sets.length > 1 && !set.completed && (
                      <button
                        type="button"
                        onClick={() => removeSet(exercise.id, setIdx)}
                        className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
                        title="Remove set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (activeTimingSetIdx === setIdx) {
                          updateSetDuration(exercise.id, setIdx, elapsedSetSeconds);
                          setActiveTimingSetIdx(null);
                        }
                        toggleSetComplete(exercise.id, setIdx);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        set.completed
                          ? 'bg-primary text-black shadow-glow-sm scale-105'
                          : 'bg-black border border-border hover:border-primary/60 text-transparent'
                      }`}
                    >
                      <Check className={`w-5 h-5 stroke-[3] transition-opacity ${set.completed ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ADD SET & ADD NOTE CONTROLS */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => addSet(exercise.id)}
              className="px-3 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-mono font-bold text-white flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>ADD SET</span>
            </button>

            <button
              onClick={() => setIsEditingNote(!isEditingNote)}
              className="text-xs text-text-secondary hover:text-white flex items-center space-x-1 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>{exerciseLog.note ? 'EDIT NOTE' : '+ ADD NOTE'}</span>
            </button>
          </div>

          {/* EXERCISE NOTE INPUT OR DISPLAY */}
          {isEditingNote ? (
            <div className="bg-surface border border-border rounded-2xl p-3 space-y-2">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="e.g. Use slightly higher seat position. Right side felt weaker."
                rows={2}
                className="w-full bg-black border border-border rounded-xl p-2.5 text-xs text-white placeholder-text-secondary/50 focus:border-primary outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="px-3 py-1 text-xs text-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1 bg-primary text-black font-bold text-xs rounded-lg"
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : (
            exerciseLog.note && (
              <div className="bg-surface/50 border border-border/60 rounded-xl p-2.5 text-xs text-text-secondary flex items-start space-x-2">
                <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="italic">{exerciseLog.note}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
