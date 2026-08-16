import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { 
  calculateCurrentStreak, 
  calculateTotalVolume, 
  calculateWeeklyWorkouts 
} from '../../utils/calculations';
import { formatVolume } from '../../utils/units';
import { theme } from '../theme';
import { 
  Flame, 
  Dumbbell, 
  Trophy, 
  Play, 
  Calendar, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react-native';
import { Weekday, WorkoutDay } from '../../types/workout';
import { haptic } from '../utils/haptics';

interface HomeScreenProps {
  onStartWorkout: (dayId: Weekday | string) => void;
  onNavigateToWorkout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartWorkout,
  onNavigateToWorkout,
}) => {
  const {
    sessions,
    prs,
    settings,
    program,
    activeSession,
    discardWorkout,
    todaySplitDay,
  } = useNativeWorkout();

  const [selectedPreviewDay, setSelectedPreviewDay] = useState<WorkoutDay>(todaySplitDay);

  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const weeklyWorkouts = useMemo(() => calculateWeeklyWorkouts(sessions), [sessions]);
  const totalVolume = useMemo(() => calculateTotalVolume(sessions), [sessions]);
  const prsCount = useMemo(() => prs.length, [prs]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }, []);

  const totalExercises = todaySplitDay.exercises.length;
  const totalSets = todaySplitDay.exercises.reduce((sum, e) => sum + e.targetSets, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* GREETING HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>
            {greeting}, {settings.userName.toUpperCase()}
          </Text>
          <Text style={styles.dashboardTitle}>PROGRESSION DASHBOARD</Text>
        </View>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ACTIVE WORKOUT BANNER IF ANY */}
      {activeSession && (
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerTop}>
            <Text style={styles.activeWorkoutTag}>WORKOUT IN PROGRESS</Text>
            <Text style={styles.activeExCount}>
              {activeSession.exerciseLogs.filter(e => e.completed).length} / {activeSession.exerciseLogs.length} EXERCISES
            </Text>
          </View>

          <Text style={styles.activeTitle}>{activeSession.title}</Text>
          <Text style={styles.activeSubtext}>
            State preserved automatically in AsyncStorage. Resume anytime.
          </Text>

          <View style={styles.activeBannerActions}>
            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                onNavigateToWorkout();
              }}
              style={styles.resumeButton}
            >
              <Play size={14} color="#000000" fill="#000000" />
              <Text style={styles.resumeButtonText}>RESUME WORKOUT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.warning();
                discardWorkout();
              }}
              style={styles.discardButton}
            >
              <Text style={styles.discardButtonText}>DISCARD</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* DYNAMIC STATISTICS CARDS */}
      <View style={styles.statsGrid}>
        {/* Streak */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <Text style={styles.statCardLabel}>STREAK</Text>
            <Flame size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.statCardNumber}>
            {streak} <Text style={styles.statCardUnit}>DAYS</Text>
          </Text>
          <Text style={styles.statCardSub}>Consistent Training</Text>
        </View>

        {/* Weekly */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <Text style={styles.statCardLabel}>THIS WEEK</Text>
            <Calendar size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.statCardNumber}>
            {weeklyWorkouts} <Text style={[styles.statCardUnit, { color: theme.colors.textSecondary }]}>/ 6</Text>
          </Text>
          <Text style={styles.statCardSub}>Workouts Done</Text>
        </View>

        {/* Volume */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <Text style={styles.statCardLabel}>LIFETIME VOLUME</Text>
            <Dumbbell size={16} color={theme.colors.primary} />
          </View>
          <Text style={[styles.statCardNumber, { color: theme.colors.primary }]}>
            {formatVolume(totalVolume, settings.units, false)}
          </Text>
          <Text style={styles.statCardSub}>Total {settings.units.toUpperCase()} Tonnage</Text>
        </View>

        {/* PRs */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <Text style={styles.statCardLabel}>ALL-TIME PRS</Text>
            <Trophy size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.statCardNumber}>
            {prsCount} <Text style={styles.statCardUnit}>RECORDS</Text>
          </Text>
          <Text style={styles.statCardSub}>Limits Shattered</Text>
        </View>
      </View>

      {/* TODAY'S WORKOUT HERO CARD */}
      <View style={styles.heroCard}>
        <View style={styles.heroCardTop}>
          <View style={styles.todayPill}>
            <Text style={styles.todayPillText}>TODAY'S WORKOUT</Text>
          </View>
          <View style={styles.durationRow}>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text style={styles.durationText}>{todaySplitDay.estimatedDurationMin}</Text>
          </View>
        </View>

        <Text style={styles.heroWeekday}>
          {todaySplitDay.displayName.toUpperCase()}
        </Text>
        <Text style={styles.heroTitle}>{todaySplitDay.title}</Text>

        {todaySplitDay.variation && (
          <View style={styles.variationTag}>
            <Text style={styles.variationTagText}>{todaySplitDay.variation}</Text>
          </View>
        )}

        <Text style={styles.heroFocus}>{todaySplitDay.focus}</Text>

        {!todaySplitDay.isRestDay ? (
          <View style={styles.heroMatrixRow}>
            <View style={styles.heroMatrixItem}>
              <Layers size={14} color={theme.colors.primary} />
              <Text style={styles.heroMatrixText}>{totalExercises} Exercises</Text>
            </View>
            <View style={styles.heroMatrixItem}>
              <CheckCircle2 size={14} color={theme.colors.primary} />
              <Text style={styles.heroMatrixText}>{totalSets} Total Sets</Text>
            </View>
          </View>
        ) : (
          <View style={styles.restDayBox}>
            <Text style={styles.restDayText}>
              Sunday is your dedicated recovery day for CNS reset and tissue repair.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            haptic.medium();
            onStartWorkout(todaySplitDay.weekday);
          }}
          style={styles.heroStartButton}
        >
          <Play size={16} color="#000000" fill="#000000" />
          <Text style={styles.heroStartButtonText}>START WORKOUT</Text>
        </TouchableOpacity>
      </View>

      {/* 7-DAY WEEKLY SCHEDULE BAR */}
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleLabel}>WEEKLY TRAINING SPLIT</Text>
          <Text style={styles.scheduleSublabel}>Monday — Sunday</Text>
        </View>

        {/* Days Pill Bar (MON, TUE, WED, THU, FRI, SAT, SUN) */}
        <View style={styles.daysBar}>
          {program.map(day => {
            const isToday = day.weekday === todaySplitDay.weekday;
            const isSelected = day.weekday === selectedPreviewDay.weekday;

            return (
              <TouchableOpacity
                key={day.id}
                onPress={() => {
                  haptic.light();
                  setSelectedPreviewDay(day);
                }}
                style={[
                  styles.dayBarButton,
                  isSelected && styles.dayBarButtonSelected,
                  isToday && !isSelected && styles.dayBarButtonToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayBarText,
                    isSelected && styles.dayBarTextSelected,
                    isToday && !isSelected && styles.dayBarTextToday,
                  ]}
                >
                  {day.shortName}
                </Text>
                {isToday && (
                  <View
                    style={[
                      styles.todayIndicatorDot,
                      isSelected && { backgroundColor: '#000000' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewTop}>
            <View>
              <Text style={styles.previewWeekday}>
                {selectedPreviewDay.displayName.toUpperCase()}
              </Text>
              <Text style={styles.previewTitle}>{selectedPreviewDay.title}</Text>
            </View>
            {selectedPreviewDay.variation && (
              <View style={styles.previewVariation}>
                <Text style={styles.previewVariationText}>
                  {selectedPreviewDay.variation}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.previewFocus}>{selectedPreviewDay.focus}</Text>

          <View style={styles.previewBottom}>
            <Text style={styles.previewInfo}>
              {selectedPreviewDay.isRestDay
                ? 'Active Recovery Day'
                : `${selectedPreviewDay.exercises.length} exercises • ${selectedPreviewDay.estimatedDurationMin}`}
            </Text>

            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                onStartWorkout(selectedPreviewDay.weekday);
              }}
              style={styles.previewStartBtn}
            >
              <Text style={styles.previewStartText}>START {selectedPreviewDay.shortName}</Text>
              <ChevronRight size={12} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerLogoImage: {
    width: 40,
    height: 40,
  },
  activeBanner: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  activeBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeWorkoutTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  activeExCount: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  activeSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  activeBannerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  resumeButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  discardButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  discardButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statCardLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  statCardNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statCardUnit: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statCardSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 28,
    padding: 18,
    gap: 8,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  todayPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  heroWeekday: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  variationTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 2,
  },
  variationTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  heroFocus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  heroMatrixRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  heroMatrixItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    borderRadius: 14,
    gap: 6,
  },
  heroMatrixText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  restDayBox: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    borderRadius: 14,
    marginVertical: 4,
  },
  restDayText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  heroStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 6,
    marginTop: 4,
  },
  heroStartButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  scheduleSection: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  scheduleSublabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  daysBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 4,
    gap: 2,
  },
  dayBarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayBarButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayBarButtonToday: {
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.6)',
  },
  dayBarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  dayBarTextSelected: {
    color: '#000000',
    fontWeight: '900',
  },
  dayBarTextToday: {
    color: theme.colors.primary,
  },
  todayIndicatorDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.primary,
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: 'rgba(21, 21, 21, 0.8)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewWeekday: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  previewVariation: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewVariationText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  previewFocus: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  previewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  previewInfo: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  previewStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  previewStartText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
});
