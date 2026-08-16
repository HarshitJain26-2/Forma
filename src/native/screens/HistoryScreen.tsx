import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { formatDistanceOrTime, formatVolume, formatWeight } from '../../utils/units';
import { calculateExerciseVolume } from '../../utils/calculations';
import { theme } from '../theme';
import { History, ChevronDown, ChevronUp, Flame, CheckCircle, Clock } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

export const HistoryScreen: React.FC = () => {
  const { sessions, settings, program } = useNativeWorkout();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'COMPLETED')
      .sort((a, b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt));
  }, [sessions]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.topLabel}>TRAINING LOGBOOK</Text>
      <Text style={styles.pageTitle}>WORKOUT HISTORY</Text>

      {completedSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <History size={32} color={theme.colors.primary} />
          <Text style={styles.emptyTitle}>NO WORKOUTS YET</Text>
          <Text style={styles.emptySub}>
            Your completed workout sessions will appear here with detailed set logs and PR badges.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {completedSessions.map(session => {
            const isExpanded = expandedId === session.id;
            const d = new Date(session.completedAt || session.startedAt);
            const dateFormatted = `${d.toLocaleString('default', { month: 'short' }).toUpperCase()} ${d.getDate()}, ${d.getFullYear()}`;
            const prsCount = session.prsAchieved?.length || 0;

            const dayDef = program.find(
              p => p.id === session.workoutDayId || p.weekday === session.weekday || p.dayNumber === session.dayNumber
            );

            const displayTitle = dayDef
              ? `${dayDef.displayName.toUpperCase()} — ${dayDef.title}`
              : session.title;

            return (
              <View
                key={session.id}
                style={[styles.sessionCard, isExpanded && styles.sessionCardExpanded]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    haptic.light();
                    setExpandedId(isExpanded ? null : session.id);
                  }}
                  style={styles.sessionHeader}
                >
                  <View style={styles.sessionTopRow}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{dateFormatted}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <CheckCircle size={10} color={theme.colors.primary} />
                      <Text style={styles.statusText}>COMPLETED</Text>
                    </View>
                  </View>

                  <View style={styles.sessionTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionTitleText} numberOfLines={1}>
                        {displayTitle}
                      </Text>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Clock size={10} color={theme.colors.textSecondary} />
                          <Text style={styles.metaText}>
                            {formatDistanceOrTime(session.durationSeconds)}
                          </Text>
                        </View>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={[styles.metaText, { color: '#FFFFFF', fontWeight: 'bold' }]}>
                          {formatVolume(session.totalVolumeKg, settings.units)}
                        </Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{session.exerciseLogs.length} Ex</Text>
                      </View>
                    </View>

                    <View style={styles.sessionRight}>
                      {prsCount > 0 && (
                        <View style={styles.prBadge}>
                          <Flame size={10} color={theme.colors.primary} />
                          <Text style={styles.prBadgeText}>{prsCount} PR</Text>
                        </View>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={16} color={theme.colors.textSecondary} />
                      ) : (
                        <ChevronDown size={16} color={theme.colors.textSecondary} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.detailsArea}>
                    <Text style={styles.breakdownLabel}>EXERCISES COMPLETED</Text>
                    {session.exerciseLogs.map(ex => {
                      const completedSets = ex.sets.filter(s => s.completed);
                      return (
                        <View key={ex.exerciseId} style={styles.exBox}>
                          <View style={styles.exBoxHeader}>
                            <Text style={styles.exBoxName}>{ex.exerciseName}</Text>
                            <Text style={styles.exBoxVol}>
                              {formatVolume(calculateExerciseVolume(ex), settings.units)}
                            </Text>
                          </View>
                          <View style={styles.setsListPills}>
                            {completedSets.map((s, idx) => (
                              <View key={s.id || idx} style={styles.setPill}>
                                <Text style={styles.setPillText}>
                                  Set {s.setNumber}: {formatWeight(s.weightKg, settings.units, false)} × {s.reps}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
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
  list: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sessionCardExpanded: {
    borderColor: 'rgba(204, 255, 0, 0.4)',
  },
  sessionHeader: {
    padding: 16,
    gap: 8,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  metaDot: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  prBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  detailsArea: {
    padding: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  exBox: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  exBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exBoxName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  exBoxVol: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  setsListPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  setPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  setPillText: {
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
});
