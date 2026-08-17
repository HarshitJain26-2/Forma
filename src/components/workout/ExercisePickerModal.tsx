import React, { useState, useMemo } from 'react';
import { Exercise, Equipment, MuscleGroup, MovementPattern } from '../../types/workout';
import { MASTER_EXERCISE_LIBRARY, ExerciseTemplate, searchExercises } from '../../data/exerciseLibrary';
import { Search, Plus, X, Sparkles, Dumbbell, Filter, Check } from 'lucide-react';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Partial<Exercise> & { name: string; primaryMuscle: MuscleGroup }) => void;
  title?: string;
  subtitle?: string;
}

const MUSCLE_GROUPS: { key: MuscleGroup | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
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

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
  title = "ADD EXERCISE",
  subtitle = "Choose from the master exercise library or build a custom movement",
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');

  // Custom Exercise Form State
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<Equipment>('dumbbell');
  const [customSets, setCustomSets] = useState<number>(3);
  const [customRepMin, setCustomRepMin] = useState<number>(8);
  const [customRepMax, setCustomRepMax] = useState<number>(12);
  const [customWeight, setCustomWeight] = useState<number>(20);
  const [isFailureBased, setIsFailureBased] = useState<boolean>(false);
  const [specialInstruction, setSpecialInstruction] = useState<string>('');

  const filteredExercises = useMemo(() => {
    return searchExercises(searchQuery, selectedMuscle);
  }, [searchQuery, selectedMuscle]);

  if (!isOpen) return null;

  const handlePickTemplate = (template: ExerciseTemplate) => {
    onSelectExercise({
      name: template.name,
      primaryMuscle: template.primaryMuscle,
      secondaryMuscles: template.secondaryMuscles,
      equipment: template.equipment,
      movementPattern: template.movementPattern,
      isCompound: template.isCompound,
      isIsolation: template.isIsolation,
      isFailureBased: template.isFailureBased,
      defaultWeightKg: template.defaultWeightKg,
      weightIncrementKg: template.weightIncrementKg,
      targetSets: template.targetSets,
      targetRepMin: template.targetRepMin,
      targetRepMax: template.targetRepMax,
      specialInstruction: template.specialInstruction || '',
    });
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onSelectExercise({
      name: customName.trim(),
      primaryMuscle: customMuscle,
      secondaryMuscles: [],
      equipment: customEquipment,
      movementPattern: customMuscle === 'core' || customMuscle === 'calves' ? 'isolation' : 'horizontal_press',
      isCompound: !isFailureBased && (customMuscle === 'chest' || customMuscle === 'back' || customMuscle === 'legs'),
      isIsolation: customMuscle === 'biceps' || customMuscle === 'triceps' || customMuscle === 'calves' || customMuscle === 'core',
      isFailureBased,
      defaultWeightKg: isFailureBased ? 0 : customWeight,
      weightIncrementKg: 2.5,
      targetSets: Math.max(1, customSets),
      targetRepMin: Math.max(1, customRepMin),
      targetRepMax: Math.max(customRepMin, customRepMax),
      specialInstruction: specialInstruction.trim(),
    });

    // Reset custom form
    setCustomName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-card border border-border w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface/60 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black tracking-widest text-primary uppercase">
                EXERCISE MANAGEMENT
              </span>
            </div>
            <h2 className="text-xl font-display font-black tracking-tight text-white uppercase mt-0.5">
              {title}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS (Library vs Custom) */}
        <div className="grid grid-cols-2 p-2 bg-surface/30 border-b border-border">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all ${
              activeTab === 'library'
                ? 'bg-primary text-black shadow-glow-sm'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Exercise Library ({MASTER_EXERCISE_LIBRARY.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all ${
              activeTab === 'custom'
                ? 'bg-primary text-black shadow-glow-sm'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            + Create Custom
          </button>
        </div>

        {/* TAB CONTENT: LIBRARY */}
        {activeTab === 'library' ? (
          <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, muscle, or equipment..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans text-white placeholder-text-secondary focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white text-xs font-mono"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Muscle Category Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {MUSCLE_GROUPS.map(muscle => {
                const isSelected = selectedMuscle === muscle.key;
                return (
                  <button
                    key={muscle.key}
                    onClick={() => setSelectedMuscle(muscle.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-primary/20 border border-primary text-primary font-bold shadow-glow-sm'
                        : 'bg-surface border border-border text-text-secondary hover:text-white'
                    }`}
                  >
                    {muscle.label}
                  </button>
                );
              })}
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[420px]">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-surface/30 border border-dashed border-border rounded-2xl p-6">
                  <Dumbbell className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                  <p className="text-sm text-text-secondary font-sans">
                    No exercises found matching "{searchQuery}".
                  </p>
                  <button
                    onClick={() => {
                      setCustomName(searchQuery);
                      setActiveTab('custom');
                    }}
                    className="px-4 py-2 bg-primary/20 border border-primary/50 text-primary text-xs font-mono font-bold uppercase rounded-xl hover:bg-primary hover:text-black transition-all"
                  >
                    Create "{searchQuery}" as Custom
                  </button>
                </div>
              ) : (
                filteredExercises.map(template => (
                  <div
                    key={template.name}
                    className="p-3.5 bg-surface/70 hover:bg-surface border border-border hover:border-primary/50 rounded-2xl flex items-center justify-between transition-all group"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-display font-bold text-white uppercase truncate">
                          {template.name}
                        </h4>
                        {template.isFailureBased && (
                          <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[9px] font-mono font-bold uppercase rounded">
                            FAIL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-text-secondary mt-0.5">
                        <span className="text-primary capitalize">{template.primaryMuscle}</span>
                        <span>•</span>
                        <span className="capitalize">{template.equipment}</span>
                        <span>•</span>
                        <span>{template.targetSets} × {template.isFailureBased ? 'Failure' : `${template.targetRepMin}–${template.targetRepMax}`}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePickTemplate(template)}
                      className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-glow-sm flex items-center space-x-1 transition-transform active:scale-95 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>ADD</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* TAB CONTENT: CUSTOM EXERCISE FORM */
          <form onSubmit={handleCreateCustom} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-text-secondary mb-1">
                Exercise Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bulgarian Split Squat, Dragon Flags"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-white placeholder-text-secondary focus:outline-none focus:border-primary"
              />
            </div>

            {/* Muscle Group & Equipment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-text-secondary mb-1">
                  Primary Muscle *
                </label>
                <select
                  value={customMuscle}
                  onChange={e => setCustomMuscle(e.target.value as MuscleGroup)}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary capitalize"
                >
                  {MUSCLE_GROUPS.filter(m => m.key !== 'all').map(m => (
                    <option key={m.key} value={m.key} className="bg-card text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-text-secondary mb-1">
                  Equipment *
                </label>
                <select
                  value={customEquipment}
                  onChange={e => setCustomEquipment(e.target.value as Equipment)}
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

            {/* Sets & Rep Range */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                  Sets
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customSets}
                  onChange={e => setCustomSets(parseInt(e.target.value) || 3)}
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
                  value={customRepMin}
                  onChange={e => setCustomRepMin(parseInt(e.target.value) || 8)}
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
                  value={customRepMax}
                  onChange={e => setCustomRepMax(parseInt(e.target.value) || 12)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary text-center disabled:opacity-40"
                />
              </div>
            </div>

            {/* Default Weight & Failure Mode */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                  Default Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  disabled={isFailureBased}
                  value={customWeight}
                  onChange={e => setCustomWeight(parseFloat(e.target.value) || 0)}
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
                    Bodyweight / Failure
                  </span>
                </label>
              </div>
            </div>

            {/* Instruction */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-text-secondary mb-1">
                Form Cue or Special Instruction (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Pause 2s at bottom stretch, squeeze hard at top"
                value={specialInstruction}
                onChange={e => setSpecialInstruction(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-white placeholder-text-secondary focus:outline-none focus:border-primary"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!customName.trim()}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-all mt-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>ADD CUSTOM EXERCISE</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
