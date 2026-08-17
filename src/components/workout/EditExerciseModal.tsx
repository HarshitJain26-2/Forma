import React, { useState, useEffect } from 'react';
import { Equipment, MuscleGroup } from '../../types/workout';
import { X, Check, Trash2, Edit3, AlertTriangle } from 'lucide-react';

export interface ExerciseEditableData {
  id?: string;
  name: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  equipment?: Equipment;
  primaryMuscle?: MuscleGroup;
  defaultWeightKg?: number;
  isFailureBased?: boolean;
  specialInstruction?: string;
  note?: string;
}

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ExerciseEditableData | null;
  onSave: (data: ExerciseEditableData) => void;
  onDelete?: () => void;
  isRoutineMode?: boolean;
}

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'legs', label: 'Legs' },
  { key: 'calves', label: 'Calves' },
  { key: 'core', label: 'Core / Abs' },
];

const EQUIPMENT_OPTIONS: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'ez_bar'];

export const EditExerciseModal: React.FC<EditExerciseModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  onDelete,
  isRoutineMode = false,
}) => {
  const [name, setName] = useState('');
  const [targetSets, setTargetSets] = useState(3);
  const [targetRepMin, setTargetRepMin] = useState(8);
  const [targetRepMax, setTargetRepMax] = useState(12);
  const [equipment, setEquipment] = useState<Equipment>('dumbbell');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>('chest');
  const [defaultWeightKg, setDefaultWeightKg] = useState(20);
  const [isFailureBased, setIsFailureBased] = useState(false);
  const [note, setNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setTargetSets(initialData.targetSets || 3);
      setTargetRepMin(initialData.targetRepMin || 8);
      setTargetRepMax(initialData.targetRepMax || 12);
      setEquipment(initialData.equipment || 'dumbbell');
      setPrimaryMuscle(initialData.primaryMuscle || 'chest');
      setDefaultWeightKg(initialData.defaultWeightKg || 20);
      setIsFailureBased(initialData.isFailureBased || false);
      setNote(initialData.note || initialData.specialInstruction || '');
      setShowDeleteConfirm(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen || !initialData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialData.id,
      name: name.trim(),
      targetSets: Math.max(1, targetSets),
      targetRepMin: Math.max(1, targetRepMin),
      targetRepMax: Math.max(targetRepMin, targetRepMax),
      equipment,
      primaryMuscle,
      defaultWeightKg: isFailureBased ? 0 : defaultWeightKg,
      isFailureBased,
      specialInstruction: note.trim(),
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-card border border-border w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black tracking-widest text-primary uppercase">
                {isRoutineMode ? 'EDIT ROUTINE EXERCISE' : 'EDIT ACTIVE EXERCISE'}
              </span>
              <h2 className="text-lg font-display font-black text-white uppercase truncate">
                {name || 'Exercise'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Exercise Name */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-text-secondary mb-1">
              Exercise Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-white placeholder-text-secondary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Muscle & Equipment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-text-secondary mb-1">
                Primary Muscle
              </label>
              <select
                value={primaryMuscle}
                onChange={e => setPrimaryMuscle(e.target.value as MuscleGroup)}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary capitalize"
              >
                {MUSCLE_GROUPS.map(m => (
                  <option key={m.key} value={m.key} className="bg-card text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-text-secondary mb-1">
                Equipment
              </label>
              <select
                value={equipment}
                onChange={e => setEquipment(e.target.value as Equipment)}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary capitalize"
              >
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq} value={eq} className="bg-card text-white">
                    {eq.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Sets & Reps */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                Target Sets
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={targetSets}
                onChange={e => setTargetSets(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                Min Reps
              </label>
              <input
                type="number"
                min="1"
                max="100"
                disabled={isFailureBased}
                value={targetRepMin}
                onChange={e => setTargetRepMin(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary text-center disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                Max Reps
              </label>
              <input
                type="number"
                min="1"
                max="100"
                disabled={isFailureBased}
                value={targetRepMax}
                onChange={e => setTargetRepMax(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary text-center disabled:opacity-40"
              />
            </div>
          </div>

          {/* Default Weight / Failure Mode */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                Base Weight (KG)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                disabled={isFailureBased}
                value={defaultWeightKg}
                onChange={e => setDefaultWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary disabled:opacity-40"
              />
            </div>

            <div className="pt-4">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFailureBased}
                  onChange={e => setIsFailureBased(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Failure-Based
                </span>
              </label>
            </div>
          </div>

          {/* Special Notes / Form Cue */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
              Notes & Cue Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Set bench angle at 30 degrees, squeeze chest at top."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-white placeholder-text-secondary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-black font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>SAVE CHANGES</span>
            </button>

            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-mono font-bold text-red-400 uppercase flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE THIS EXERCISE</span>
              </button>
            )}

            {showDeleteConfirm && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 space-y-2 text-center animate-scale-in">
                <div className="flex items-center justify-center space-x-1.5 text-red-400 font-mono text-xs font-bold uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Exercise Deletion?</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  {isRoutineMode
                    ? 'This will remove the exercise from this day’s training routine.'
                    : 'This will remove this exercise and its logged sets from the active session.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="py-2 bg-surface border border-border rounded-xl text-xs font-mono text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.();
                      onClose();
                    }}
                    className="py-2 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-mono font-bold text-white uppercase"
                  >
                    YES, DELETE
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
