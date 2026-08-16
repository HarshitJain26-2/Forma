import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { formatDistanceOrTime, formatVolume } from '../../utils/units';
import { theme } from '../theme';
import { CheckCircle, Flame, Trophy } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

export const NativeCompletionModal: React.FC = () => {
  const { completedSummarySession, dismissCompletedSummary, settings, program } = useNativeWorkout();

  if (!completedSummarySession) return null;

  const totalExercises = completedSummarySession.exerciseLogs.length;
  const completedExercises = completedSummarySession.exerciseLogs.filter(e => e.completed).length;
  const totalSets = completedSummarySession.totalSets;
  const totalVolume = completedSummarySession.totalVolumeKg;
  const prsCount = completedSummarySession.prsAchieved?.length || 0;

  const dayDef = program.find(
    p => p.id === completedSummarySession.workoutDayId || p.weekday === completedSummarySession.weekday || p.dayNumber === completedSummarySession.dayNumber
  );

  const displayTitle = dayDef 
    ? `${dayDef.displayName.toUpperCase()} — ${dayDef.title}` 
    : completedSummarySession.title;

  return (
    <Modal
      visible={!!completedSummarySession}
      transparent
      animationType="slide"
      onRequestClose={dismissCompletedSummary}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Celebration Icon */}
            <View style={styles.iconContainer}>
              <CheckCircle size={32} color={theme.colors.primary} />
            </View>

            <Text style={styles.finishedLabel}>SESSION FINISHED</Text>
            <Text style={styles.completionHeading}>WORKOUT COMPLETE</Text>
            <Text style={styles.workoutTitle}>{displayTitle}</Text>

            {/* Duration Badge */}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                ⏱️ {formatDistanceOrTime(completedSummarySession.durationSeconds)}
              </Text>
            </View>

            {/* Statistics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>EXERCISES</Text>
                <Text style={styles.statValue}>
                  {completedExercises} / {totalExercises}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL SETS</Text>
                <Text style={styles.statValue}>{totalSets} SETS</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>VOLUME</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {formatVolume(totalVolume, settings.units)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>RECORDS</Text>
                <Text style={styles.statValue}>
                  {prsCount > 0 ? `🔥 ${prsCount} PRs` : '0 PRs'}
                </Text>
              </View>
            </View>

            {/* PRs Achieved if any */}
            {completedSummarySession.prsAchieved && completedSummarySession.prsAchieved.length > 0 && (
              <View style={styles.prsBox}>
                <View style={styles.prsHeader}>
                  <Trophy size={14} color={theme.colors.primary} />
                  <Text style={styles.prsTitle}>Personal Records Smashed</Text>
                </View>
                {completedSummarySession.prsAchieved.map(pr => (
                  <View key={pr.id} style={styles.prRow}>
                    <Text style={styles.prExName} numberOfLines={1}>
                      {pr.exerciseName}
                    </Text>
                    <Text style={styles.prDetails}>{pr.details}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* DONE CTA */}
            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                dismissCompletedSummary();
              }}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>DONE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    maxHeight: '90%',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 32,
    padding: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  finishedLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  completionHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  workoutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 14,
  },
  durationBadge: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  durationText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  prsBox: {
    width: '100%',
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  prsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  prsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  prExName: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  prDetails: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  doneButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
