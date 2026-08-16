import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { WORKOUT_PROGRAM } from '../../data/workoutProgram';
import { calculateExerciseVolume, calculateTotalVolume, calculateWeeklyVolume, calculateWeeklyWorkouts, calculateCurrentStreak } from '../../utils/calculations';
import { formatDistanceOrTime, formatVolume } from '../../utils/units';
import { theme } from '../theme';
import { TrendingUp, Activity, Calendar, Flame, BarChart2 } from 'lucide-react-native';
import { MuscleGroup } from '../../types/workout';

export const ProgressScreen: React.FC = () => {
  const { sessions, settings } = useNativeWorkout();

  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'COMPLETED');
  }, [sessions]);

  const weeklyWorkouts = useMemo(() => calculateWeeklyWorkouts(sessions), [sessions]);
  const weeklyVolume = useMemo(() => calculateWeeklyVolume(sessions), [sessions]);
  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);

  const totalSets = useMemo(() => {
    return completedSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
  }, [completedSessions]);

  const avgDurationSec = useMemo(() => {
    if (completedSessions.length === 0) return 0;
    const totalSec = completedSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    return Math.round(totalSec / completedSessions.length);
  }, [completedSessions]);

  // Muscle group distribution
  const muscleData = useMemo(() => {
    const map: { [id: string]: MuscleGroup } = {};
    WORKOUT_PROGRAM.forEach(day => {
      day.exercises.forEach(ex => {
        map[ex.id] = ex.primaryMuscle;
      });
    });

    const volumes: { [key in MuscleGroup]?: number } = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      legs: 0,
      calves: 0,
    };

    completedSessions.forEach(session => {
      session.exerciseLogs.forEach(exLog => {
        const muscle = map[exLog.exerciseId];
        if (muscle && volumes[muscle] !== undefined) {
          volumes[muscle] = (volumes[muscle] || 0) + calculateExerciseVolume(exLog);
        }
      });
    });

    const list = [
      { name: 'Chest', key: 'chest', volume: volumes.chest || 0 },
      { name: 'Back', key: 'back', volume: volumes.back || 0 },
      { name: 'Shoulders', key: 'shoulders', volume: volumes.shoulders || 0 },
      { name: 'Biceps', key: 'biceps', volume: volumes.biceps || 0 },
      { name: 'Triceps', key: 'triceps', volume: volumes.triceps || 0 },
      { name: 'Legs', key: 'legs', volume: (volumes.legs || 0) + (volumes.calves || 0) },
    ];

    const maxVol = Math.max(...list.map(m => m.volume), 1);
    const totalVol = list.reduce((sum, m) => sum + m.volume, 0);

    return list.map(m => ({
      ...m,
      percentage: totalVol > 0 ? Math.round((m.volume / totalVol) * 100) : 0,
      barWidth: Math.round((m.volume / maxVol) * 100),
    }));
  }, [completedSessions]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.topLabel}>INTELLIGENCE & ANALYTICS</Text>
      <Text style={styles.pageTitle}>PROGRESS & METRICS</Text>

      {completedSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <BarChart2 size={32} color={theme.colors.primary} />
          <Text style={styles.emptyTitle}>BUILD YOUR DATA</Text>
          <Text style={styles.emptySub}>
            Complete a few workout sessions to start seeing volume trends and muscle distribution analytics.
          </Text>
        </View>
      ) : (
        <>
          {/* WEEKLY OVERVIEW */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewLabel}>WEEKLY PERFORMANCE</Text>
              <Text style={styles.overviewDays}>{weeklyWorkouts} / 6 Days</Text>
            </View>

            <View style={styles.overviewGrid}>
              <View style={styles.overviewGridItem}>
                <Text style={styles.gridItemLabel}>THIS WEEK</Text>
                <Text style={[styles.gridItemValue, { color: theme.colors.primary }]}>
                  {formatVolume(weeklyVolume, settings.units)}
                </Text>
              </View>

              <View style={styles.overviewGridItem}>
                <Text style={styles.gridItemLabel}>TOTAL SETS</Text>
                <Text style={styles.gridItemValue}>{totalSets}</Text>
              </View>

              <View style={styles.overviewGridItem}>
                <Text style={styles.gridItemLabel}>AVG DURATION</Text>
                <Text style={styles.gridItemValue}>{formatDistanceOrTime(avgDurationSec)}</Text>
              </View>

              <View style={styles.overviewGridItem}>
                <Text style={styles.gridItemLabel}>STREAK</Text>
                <Text style={[styles.gridItemValue, { color: theme.colors.primary }]}>
                  {streak} Days
                </Text>
              </View>
            </View>
          </View>

          {/* MUSCLE GROUP DISTRIBUTION BARS */}
          <View style={styles.muscleCard}>
            <View style={styles.muscleHeader}>
              <Activity size={14} color={theme.colors.primary} />
              <Text style={styles.muscleTitle}>MUSCLE GROUP DISTRIBUTION</Text>
            </View>

            <View style={styles.muscleList}>
              {muscleData.map(item => (
                <View key={item.key} style={styles.muscleRow}>
                  <View style={styles.muscleLabelRow}>
                    <Text style={styles.muscleName}>
                      {item.name} <Text style={styles.musclePercent}>({item.percentage}%)</Text>
                    </Text>
                    <Text style={styles.muscleVolText}>
                      {formatVolume(item.volume, settings.units)}
                    </Text>
                  </View>

                  <View style={styles.muscleBarTrack}>
                    <View
                      style={[
                        styles.muscleBarFill,
                        { width: `${Math.max(item.barWidth, item.volume > 0 ? 4 : 0)}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
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
    paddingBottom: 110,
    gap: 16,
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
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  overviewCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  overviewDays: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewGridItem: {
    width: '48.5%',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  gridItemLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  gridItemValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  muscleCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  muscleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muscleTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  muscleList: {
    gap: 12,
  },
  muscleRow: {
    gap: 4,
  },
  muscleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  musclePercent: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  muscleVolText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  muscleBarTrack: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  muscleBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});
