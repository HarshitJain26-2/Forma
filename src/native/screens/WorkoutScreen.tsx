import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { NativeExerciseCard } from '../components/NativeExerciseCard';
import { formatDistanceOrTime } from '../../utils/units';
import { theme } from '../theme';
import { Clock, CheckCircle, ChevronLeft, Play, AlertTriangle } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

interface WorkoutScreenProps {
  onBackToHome: () => void;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ onBackToHome }) => {
  const {
    activeSession,
    program,
    workoutDuration,
    completeWorkout,
    discardWorkout,
    startWorkout,
    todaySplitDay,
  } = useNativeWorkout();

  const [expandedId, setExpandedId] = useState<string | null>(() => {
    return activeSession?.exerciseLogs[0]?.exerciseId || null;
  });
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // If no active session, show the Select Workout Routine screen
  if (!activeSession) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.topLabel}>SELECT WORKOUT SESSION</Text>
        <Text style={styles.pageTitle}>START TRAINING</Text>

        {/* Recommended Today */}
        <View style={styles.recommendedCard}>
          <View style={styles.recommendedTop}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>
                RECOMMENDED TODAY ({todaySplitDay.displayName.toUpperCase()})
              </Text>
            </View>
            <Text style={styles.recommendedDuration}>{todaySplitDay.estimatedDurationMin}</Text>
          </View>

          <Text style={styles.recommendedTitle}>
            {todaySplitDay.displayName.toUpperCase()} — {todaySplitDay.title}
          </Text>
          <Text style={styles.recommendedFocus}>{todaySplitDay.focus}</Text>

          <TouchableOpacity
            onPress={() => {
              haptic.medium();
              startWorkout(todaySplitDay.weekday);
            }}
            style={styles.recommendedStartBtn}
          >
            <Play size={14} color="#000000" fill="#000000" />
            <Text style={styles.recommendedStartText}>
              START {todaySplitDay.displayName.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orChooseLabel}>Or Choose Another Weekday:</Text>

        <View style={styles.weekdaysList}>
          {program.map(day => (
            <TouchableOpacity
              key={day.id}
              activeOpacity={0.8}
              onPress={() => {
                haptic.light();
                startWorkout(day.weekday);
              }}
              style={styles.weekdayItem}
            >
              <View style={styles.weekdayItemLeft}>
                <View style={styles.weekdayShortBox}>
                  <Text style={styles.weekdayShortText}>{day.shortName}</Text>
                </View>
                <View>
                  <Text style={styles.weekdayItemTitle}>
                    {day.displayName} — {day.title}
                  </Text>
                  <Text style={styles.weekdayItemSub}>
                    {day.isRestDay ? 'Rest & Recovery' : `${day.exercises.length} exercises • ${day.estimatedDurationMin}`}
                  </Text>
                </View>
              </View>
              <Play size={14} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ACTIVE WORKOUT VIEW
  const dayDef = program.find(
    p => p.id === activeSession.workoutDayId || p.weekday === activeSession.weekday || p.dayNumber === activeSession.dayNumber
  ) || program[0];

  const totalExercises = activeSession.exerciseLogs.length;
  const completedExercises = activeSession.exerciseLogs.filter(e => e.completed).length;
  const percentComplete = totalExercises > 0
    ? Math.round((completedExercises / totalExercises) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* TOP HEADER */}
      <View style={styles.activeHeader}>
        <View style={styles.activeHeaderNav}>
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              onBackToHome();
            }}
            style={styles.backButton}
          >
            <ChevronLeft size={16} color={theme.colors.textSecondary} />
            <Text style={styles.backButtonText}>Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.timerPill}>
            <Clock size={12} color={theme.colors.primary} />
            <Text style={styles.timerPillText}>
              {formatDistanceOrTime(workoutDuration)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowDiscardConfirm(true)}
            style={styles.discardHeaderBtn}
          >
            <Text style={styles.discardHeaderText}>Discard</Text>
          </TouchableOpacity>
        </View>

        {/* WORKOUT TITLE */}
        <View style={styles.activeTitleRow}>
          <View>
            <Text style={styles.inProgressTag}>WORKOUT IN PROGRESS</Text>
            <Text style={styles.activeWorkoutMainTitle}>
              {dayDef.displayName.toUpperCase()} — {dayDef.title}
            </Text>
          </View>
          {dayDef.variation && (
            <View style={styles.variationBadge}>
              <Text style={styles.variationBadgeText}>{dayDef.variation}</Text>
            </View>
          )}
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressCountText}>
              {String(completedExercises).padStart(2, '0')} / {String(totalExercises).padStart(2, '0')} EXERCISES
            </Text>
            <Text style={styles.progressPercentText}>{percentComplete}% COMPLETE</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percentComplete}%` }]} />
          </View>
        </View>
      </View>

      {/* EXERCISES LIST */}
      <View style={styles.exercisesList}>
        {dayDef.exercises.map(exercise => {
          const exLog = activeSession.exerciseLogs.find(e => e.exerciseId === exercise.id);
          if (!exLog) return null;

          return (
            <NativeExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseLog={exLog}
              isExpanded={expandedId === exercise.id}
              onToggleExpand={() => {
                setExpandedId(expandedId === exercise.id ? null : exercise.id);
              }}
            />
          );
        })}
      </View>

      {/* FINISH WORKOUT CTA */}
      <TouchableOpacity
        onPress={() => {
          haptic.success();
          completeWorkout();
        }}
        style={styles.finishButton}
      >
        <CheckCircle size={18} color="#000000" strokeWidth={2.5} />
        <Text style={styles.finishButtonText}>FINISH WORKOUT</Text>
      </TouchableOpacity>

      {/* DISCARD CONFIRMATION MODAL */}
      {showDiscardConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <AlertTriangle size={32} color={theme.colors.danger} />
            <Text style={styles.confirmTitle}>Discard Workout?</Text>
            <Text style={styles.confirmSub}>
              All uncompleted set logs and active session timer will be cleared.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => setShowDiscardConfirm(false)}
                style={styles.cancelDiscardBtn}
              >
                <Text style={styles.cancelDiscardText}>KEEP LOGGING</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDiscardConfirm(false);
                  discardWorkout();
                  onBackToHome();
                }}
                style={styles.confirmDiscardBtn}
              >
                <Text style={styles.confirmDiscardText}>DISCARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingTop: 54,
    paddingBottom: 120,
    gap: 14,
  },
  topLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  recommendedCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.4)',
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  recommendedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  recommendedDuration: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  recommendedFocus: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  recommendedStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    marginTop: 4,
  },
  recommendedStartText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  orChooseLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  weekdaysList: {
    gap: 8,
  },
  weekdayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
  },
  weekdayItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  weekdayShortBox: {
    width: 36,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayShortText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  weekdayItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  weekdayItemSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  activeHeader: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  activeHeaderNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  timerPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  discardHeaderBtn: {
    padding: 4,
  },
  discardHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  activeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  inProgressTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  activeWorkoutMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  variationBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variationBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressBarWrapper: {
    gap: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCountText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  progressPercentText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  exercisesList: {
    gap: 4,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 50,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  confirmSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  cancelDiscardBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelDiscardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmDiscardBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDiscardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
});
