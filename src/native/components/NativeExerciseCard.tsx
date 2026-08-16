import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { Exercise, ExerciseLog } from '../../types/workout';
import { generateProgressionRecommendation, getLastExercisePerformance } from '../../engine/progressionEngine';
import { displayWeightValue, parseInputWeight } from '../../utils/units';
import { theme } from '../theme';
import { Check, ChevronDown, ChevronUp, Plus, Trash2, Sparkles, MessageSquare, Info } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

interface NativeExerciseCardProps {
  exercise: Exercise;
  exerciseLog: ExerciseLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const NativeExerciseCard: React.FC<NativeExerciseCardProps> = ({
  exercise,
  exerciseLog,
  isExpanded,
  onToggleExpand,
}) => {
  const {
    sessions,
    settings,
    toggleSetComplete,
    updateSetValues,
    addSet,
    removeSet,
    updateExerciseNote,
  } = useNativeWorkout();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(exerciseLog.note || '');
  const [showRpe, setShowRpe] = useState(false);

  const previousPerformance = getLastExercisePerformance(sessions, exercise.id);
  const progression = generateProgressionRecommendation(exercise, previousPerformance, settings.units);

  const completedCount = exerciseLog.sets.filter(s => s.completed).length;
  const totalCount = exerciseLog.sets.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <View style={[styles.card, isAllDone && styles.cardCompleted, isExpanded && styles.cardExpanded]}>
      {/* HEADER */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          haptic.light();
          onToggleExpand();
        }}
        style={styles.cardHeader}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.orderBadge, isAllDone && styles.orderBadgeDone]}>
            {isAllDone ? (
              <Check size={14} color="#000000" strokeWidth={3} />
            ) : (
              <Text style={styles.orderText}>0{exercise.order}</Text>
            )}
          </View>

          <View style={styles.titleArea}>
            <View style={styles.titleRow}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.name}
              </Text>
              {exercise.isFailureBased && (
                <View style={styles.failureBadge}>
                  <Text style={styles.failureText}>FAILURE</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {exercise.targetSets} × {exercise.isFailureBased ? 'FAILURE' : `${exercise.targetRepMin}–${exercise.targetRepMax}`} • {exercise.equipment} • {exercise.primaryMuscle}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.counterBadge, isAllDone && styles.counterBadgeDone]}>
            <Text style={[styles.counterText, isAllDone && styles.counterTextDone]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color={theme.colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={theme.colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {/* EXPANDED SECTION */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* SPECIAL INSTRUCTION */}
          {exercise.specialInstruction && (
            <View style={styles.instructionBox}>
              <Info size={12} color={theme.colors.primary} />
              <Text style={styles.instructionText}>{exercise.specialInstruction}</Text>
            </View>
          )}

          {/* PROGRESSION TARGET BANNER */}
          <View style={styles.progressionBanner}>
            <View style={styles.progressionHeader}>
              <View style={styles.progressionTitleRow}>
                <Sparkles size={12} color={theme.colors.primary} />
                <Text style={styles.progressionLabel}>INTELLIGENT PROGRESSION</Text>
              </View>
              <View style={styles.progressionBadge}>
                <Text style={styles.progressionBadgeText}>{progression.badgeText}</Text>
              </View>
            </View>

            <View style={styles.targetsGrid}>
              <View style={styles.targetCell}>
                <Text style={styles.targetCellLabel}>LAST TIME</Text>
                <Text style={styles.targetCellValue} numberOfLines={1}>
                  {previousPerformance ? previousPerformance.summaryText : 'No history'}
                </Text>
              </View>

              <View style={styles.targetCell}>
                <Text style={styles.targetCellLabel}>TODAY'S TARGET</Text>
                <Text style={styles.targetCellValue} numberOfLines={1}>
                  {progression.todayTargetText}
                </Text>
              </View>

              <View style={[styles.targetCell, styles.targetCellNext]}>
                <Text style={[styles.targetCellLabel, { color: theme.colors.primary }]}>
                  NEXT TARGET
                </Text>
                <Text style={[styles.targetCellValue, { color: theme.colors.primary, fontWeight: 'bold' }]} numberOfLines={1}>
                  {progression.nextTargetText}
                </Text>
              </View>
            </View>
          </View>

          {/* SETS TABLE HEADER */}
          <View style={styles.tableHeader}>
            <View style={styles.tableHeaderLeft}>
              <Text style={[styles.columnLabel, { width: 30 }]}>SET</Text>
              <Text style={[styles.columnLabel, { width: 70, textAlign: 'center' }]}>
                {settings.units.toUpperCase()}
              </Text>
              <Text style={[styles.columnLabel, { width: 60, textAlign: 'center' }]}>REPS</Text>
              {showRpe && (
                <Text style={[styles.columnLabel, { width: 50, textAlign: 'center' }]}>RPE</Text>
              )}
            </View>

            <View style={styles.tableHeaderRight}>
              <TouchableOpacity onPress={() => setShowRpe(!showRpe)}>
                <Text style={styles.toggleRpeText}>{showRpe ? 'Hide RPE' : '+ RPE'}</Text>
              </TouchableOpacity>
              <Text style={[styles.columnLabel, { width: 44, textAlign: 'center' }]}>DONE</Text>
            </View>
          </View>

          {/* SET ROWS */}
          {exerciseLog.sets.map((set, setIdx) => {
            const displayWt = displayWeightValue(set.weightKg, settings.units);

            return (
              <View
                key={set.id || setIdx}
                style={[styles.setRow, set.completed && styles.setRowCompleted]}
              >
                <View style={styles.setInputsLeft}>
                  {/* Set Number */}
                  <Text style={styles.setNumberText}>{set.setNumber}</Text>

                  {/* Weight Input */}
                  <TextInput
                    keyboardType="decimal-pad"
                    placeholder={exercise.isFailureBased ? 'BW' : '0'}
                    placeholderTextColor="#555"
                    value={displayWt === 0 && exercise.isFailureBased ? '' : displayWt ? String(displayWt) : ''}
                    onChangeText={txt => {
                      const val = parseFloat(txt) || 0;
                      const kgVal = parseInputWeight(val, settings.units);
                      updateSetValues(exercise.id, setIdx, kgVal, set.reps, set.rpe);
                    }}
                    style={styles.inputBox}
                  />

                  {/* Reps Input */}
                  <TextInput
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#555"
                    value={set.reps ? String(set.reps) : ''}
                    onChangeText={txt => {
                      const repsVal = parseInt(txt, 10) || 0;
                      updateSetValues(exercise.id, setIdx, set.weightKg, repsVal, set.rpe);
                    }}
                    style={styles.inputBox}
                  />

                  {/* Optional RPE Input */}
                  {showRpe && (
                    <TextInput
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor="#555"
                      value={set.rpe ? String(set.rpe) : ''}
                      onChangeText={txt => {
                        const rpeVal = parseFloat(txt) || undefined;
                        updateSetValues(exercise.id, setIdx, set.weightKg, set.reps, rpeVal);
                      }}
                      style={[styles.inputBox, { width: 46 }]}
                    />
                  )}
                </View>

                {/* Right controls: Remove & Checkmark */}
                <View style={styles.setControlsRight}>
                  {exerciseLog.sets.length > 1 && !set.completed && (
                    <TouchableOpacity
                      onPress={() => removeSet(exercise.id, setIdx)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={13} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleSetComplete(exercise.id, setIdx)}
                    style={[styles.checkButton, set.completed && styles.checkButtonCompleted]}
                  >
                    {set.completed && <Check size={18} color="#000000" strokeWidth={3} />}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* ADD SET & NOTE ACTIONS */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              onPress={() => addSet(exercise.id)}
              style={styles.addSetButton}
            >
              <Plus size={14} color={theme.colors.primary} />
              <Text style={styles.addSetText}>ADD SET</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsEditingNote(!isEditingNote)}
              style={styles.noteButton}
            >
              <MessageSquare size={13} color={theme.colors.primary} />
              <Text style={styles.noteButtonText}>
                {exerciseLog.note ? 'EDIT NOTE' : '+ NOTE'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* NOTE EDITOR */}
          {isEditingNote && (
            <View style={styles.noteEditor}>
              <TextInput
                multiline
                numberOfLines={2}
                placeholder="e.g. Higher seat position, controlled eccentric."
                placeholderTextColor="#666"
                value={noteText}
                onChangeText={setNoteText}
                style={styles.noteInput}
              />
              <View style={styles.noteEditorButtons}>
                <TouchableOpacity onPress={() => setIsEditingNote(false)}>
                  <Text style={styles.cancelNoteText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    updateExerciseNote(exercise.id, noteText);
                    setIsEditingNote(false);
                  }}
                  style={styles.saveNoteButton}
                >
                  <Text style={styles.saveNoteText}>Save Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {exerciseLog.note && !isEditingNote && (
            <View style={styles.savedNoteBox}>
              <Text style={styles.savedNoteText}>"{exerciseLog.note}"</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardCompleted: {
    borderColor: 'rgba(204, 255, 0, 0.4)',
    backgroundColor: 'rgba(21, 21, 21, 0.6)',
  },
  cardExpanded: {
    borderColor: theme.colors.borderLight,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderBadgeDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  orderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  titleArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  failureBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  failureText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  counterBadgeDone: {
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
  },
  counterText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  counterTextDone: {
    color: theme.colors.primary,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  instructionText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  progressionBanner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  progressionBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressionBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  targetsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  targetCell: {
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 6,
  },
  targetCellNext: {
    borderColor: 'rgba(204, 255, 0, 0.4)',
  },
  targetCellLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  targetCellValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  tableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  toggleRpeText: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  setInputsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setNumberText: {
    width: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  inputBox: {
    width: 60,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  setControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButton: {
    padding: 6,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addSetText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteButtonText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  noteEditor: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  noteInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 11,
    padding: 8,
    minHeight: 50,
  },
  noteEditorButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  cancelNoteText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  saveNoteButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveNoteText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  savedNoteBox: {
    backgroundColor: 'rgba(21, 21, 21, 0.6)',
    padding: 8,
    borderRadius: 10,
  },
  savedNoteText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
