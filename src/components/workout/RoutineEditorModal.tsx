import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Exercise, MuscleGroup, Weekday, WorkoutDay } from '../../types/workout';
import { ExercisePickerModal } from './ExercisePickerModal';
import { EditExerciseModal, ExerciseEditableData } from './EditExerciseModal';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Dumbbell, 
  Sparkles, 
  Clock, 
  Check, 
  Layers, 
  ChevronRight 
} from 'lucide-react';

interface RoutineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeekday?: Weekday;
}

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  isOpen,
  onClose,
  initialWeekday,
}) => {
  const { 
    program, 
    addExerciseToProgramDay, 
    removeExerciseFromProgramDay, 
    updateProgramExercise, 
    reorderProgramExercises, 
    resetProgramDay 
  } = useWorkout();

  const [selectedWeekday, setSelectedWeekday] = useState<Weekday>(() => initialWeekday || 'monday');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const currentDay = program.find(d => d.weekday === selectedWeekday) || program[0];
  const totalSets = currentDay.exercises.reduce((sum, e) => sum + e.targetSets, 0);

  const handleAddExerciseFromPicker = (template: any) => {
    addExerciseToProgramDay(currentDay.id, {
      name: template.name,
      primaryMuscle: template.primaryMuscle || 'chest',
      secondaryMuscles: template.secondaryMuscles || [],
      equipment: template.equipment || 'dumbbell',
      movementPattern: template.movementPattern || 'isolation',
      isCompound: template.isCompound ?? false,
      isIsolation: template.isIsolation ?? true,
      isFailureBased: template.isFailureBased ?? false,
      defaultWeightKg: template.defaultWeightKg || 20,
      weightIncrementKg: template.weightIncrementKg || 2.5,
      targetSets: template.targetSets || 3,
      targetRepMin: template.targetRepMin || 8,
      targetRepMax: template.targetRepMax || 12,
      specialInstruction: template.specialInstruction || '',
    });
  };

  const handleSaveExerciseEdit = (data: ExerciseEditableData) => {
    if (!editingExercise) return;
    updateProgramExercise(currentDay.id, editingExercise.id, {
      name: data.name,
      targetSets: data.targetSets,
      targetRepMin: data.targetRepMin,
      targetRepMax: data.targetRepMax,
      equipment: data.equipment,
      primaryMuscle: data.primaryMuscle,
      defaultWeightKg: data.defaultWeightKg,
      isFailureBased: data.isFailureBased,
      specialInstruction: data.specialInstruction,
    });
    setEditingExercise(null);
  };

  const handleDeleteExercise = (exId: string) => {
    removeExerciseFromProgramDay(currentDay.id, exId);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    reorderProgramExercises(currentDay.id, index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index >= currentDay.exercises.length - 1) return;
    reorderProgramExercises(currentDay.id, index, index + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-black tracking-widest text-primary uppercase">
              CUSTOMIZE WORKOUT SPLIT
            </span>
            <h2 className="text-xl font-display font-black text-white uppercase mt-0.5">
              ROUTINE BUILDER
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Add, remove, or customize exercises in your 7-day program
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-DAY WEEKDAY SWITCHER BAR */}
        <div className="p-2 bg-surface/40 border-b border-border">
          <div className="grid grid-cols-7 gap-1">
            {program.map(day => {
              const isSelected = day.weekday === selectedWeekday;
              return (
                <button
                  key={day.id}
                  onClick={() => {
                    setSelectedWeekday(day.weekday);
                    setShowResetConfirm(false);
                  }}
                  className={`py-2 flex flex-col items-center justify-center rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary text-black font-extrabold shadow-glow-sm scale-105'
                      : 'text-text-secondary hover:text-white bg-surface/30 border border-transparent hover:border-border'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">{day.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CURRENT DAY SUMMARY HERO */}
        <div className="px-4 py-3 bg-surface/20 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-primary uppercase">
              {currentDay.displayName.toUpperCase()} • {currentDay.category}
            </div>
            <h3 className="text-base font-display font-black text-white uppercase">
              {currentDay.title}
            </h3>
            <div className="text-[11px] font-mono text-text-secondary">
              {currentDay.exercises.length} Exercises • {totalSets} Total Sets
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Reset Day to Default"
                className="px-2.5 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-[10px] font-mono text-text-secondary hover:text-white uppercase flex items-center space-x-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Day</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 animate-scale-in">
                <button
                  onClick={() => {
                    resetProgramDay(currentDay.id);
                    setShowResetConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-[10px] font-mono font-bold text-white uppercase"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-1 bg-surface border border-border rounded-lg text-[10px] font-mono text-text-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EXERCISES LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[300px] max-h-[460px]">
          {currentDay.exercises.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-surface/20 border border-dashed border-border rounded-2xl p-6">
              <Dumbbell className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
              <p className="text-sm text-text-secondary font-sans">
                No exercises configured for {currentDay.displayName}.
              </p>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="px-4 py-2 bg-primary text-black text-xs font-display font-black uppercase tracking-wider rounded-xl shadow-glow-sm"
              >
                + ADD FIRST EXERCISE
              </button>
            </div>
          ) : (
            currentDay.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="p-3 bg-surface/60 hover:bg-surface border border-border hover:border-border-light rounded-2xl flex items-center justify-between space-x-3 transition-all group"
              >
                {/* Reorder Up/Down Handles */}
                <div className="flex flex-col space-y-0.5">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1 rounded text-text-secondary hover:text-white disabled:opacity-20 hover:bg-black/40"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === currentDay.exercises.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1 rounded text-text-secondary hover:text-white disabled:opacity-20 hover:bg-black/40"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Index / Order badge */}
                <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center font-mono font-bold text-xs text-primary flex-shrink-0">
                  {index + 1}
                </div>

                {/* Exercise Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-display font-bold text-white uppercase truncate">
                      {exercise.name}
                    </h4>
                    {exercise.isFailureBased && (
                      <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[9px] font-mono font-bold uppercase rounded">
                        FAIL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-text-secondary mt-0.5">
                    <span className="text-primary capitalize">{exercise.primaryMuscle}</span>
                    <span>•</span>
                    <span className="capitalize">{exercise.equipment}</span>
                    <span>•</span>
                    <span className="text-white font-semibold">
                      {exercise.targetSets} × {exercise.isFailureBased ? 'Failure' : `${exercise.targetRepMin}–${exercise.targetRepMax}`}
                    </span>
                    {!exercise.isFailureBased && exercise.defaultWeightKg > 0 && (
                      <>
                        <span>•</span>
                        <span>{exercise.defaultWeightKg} kg</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingExercise(exercise)}
                    title="Edit Exercise"
                    className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteExercise(exercise.id)}
                    title="Delete Exercise"
                    className="w-8 h-8 rounded-xl bg-surface hover:bg-red-500/20 border border-border hover:border-red-500/40 flex items-center justify-center text-text-secondary hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 border-t border-border bg-surface/60 flex items-center space-x-3">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-black font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-1.5 transition-transform active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ADD EXERCISE TO {currentDay.shortName}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-surface hover:bg-surface-hover border border-border rounded-2xl text-xs font-mono font-bold text-white uppercase transition-colors"
          >
            DONE
          </button>
        </div>
      </div>

      {/* EXERCISE PICKER MODAL (Add to day) */}
      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectExercise={handleAddExerciseFromPicker}
        title={`ADD TO ${currentDay.displayName.toUpperCase()}`}
        subtitle={`Select from exercise catalog to add into ${currentDay.title}`}
      />

      {/* EDIT EXERCISE MODAL */}
      {editingExercise && (
        <EditExerciseModal
          isOpen={!!editingExercise}
          onClose={() => setEditingExercise(null)}
          initialData={{
            id: editingExercise.id,
            name: editingExercise.name,
            targetSets: editingExercise.targetSets,
            targetRepMin: editingExercise.targetRepMin,
            targetRepMax: editingExercise.targetRepMax,
            equipment: editingExercise.equipment,
            primaryMuscle: editingExercise.primaryMuscle,
            defaultWeightKg: editingExercise.defaultWeightKg,
            isFailureBased: editingExercise.isFailureBased,
            specialInstruction: editingExercise.specialInstruction,
          }}
          onSave={handleSaveExerciseEdit}
          onDelete={() => handleDeleteExercise(editingExercise.id)}
          isRoutineMode={true}
        />
      )}
    </div>
  );
};
