import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { theme } from '../theme';
import { Settings, Volume2, VolumeX, ShieldAlert, Trash2, Award } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

export const ProfileScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    sessions,
    prs,
    achievements,
    clearDemoData,
    resetAllData,
  } = useNativeWorkout();

  const totalWorkouts = sessions.filter(s => s.status === 'COMPLETED').length;

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data?',
      'This will permanently remove all workout history and custom settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            haptic.warning();
            await resetAllData();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.topLabel}>ATHLETE PROFILE</Text>
      <Text style={styles.pageTitle}>PROFILE & SETTINGS</Text>

      {/* ATHLETE IDENTITY CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{settings.userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{settings.userName}</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO ATHLETE</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{totalWorkouts}</Text>
            <Text style={styles.statSub}>WORKOUTS</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.primary }]}>{prs.length}</Text>
            <Text style={styles.statSub}>PRS BROKEN</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>6 DAYS</Text>
            <Text style={styles.statSub}>SPLIT ROUTINE</Text>
          </View>
        </View>
      </View>

      {/* ACHIEVEMENTS */}
      <View style={styles.settingsSection}>
        <View style={styles.sectionHeaderRow}>
          <Award size={14} color={theme.colors.primary} />
          <Text style={styles.sectionHeader}>ACHIEVEMENTS</Text>
        </View>

        <View style={styles.achievementsGrid}>
          {achievements.map(ach => {
            const isUnlocked = !!ach.unlockedAt;
            return (
              <View
                key={ach.id}
                style={[
                  styles.achievementItem,
                  isUnlocked && styles.achievementItemUnlocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{ach.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementTitle} numberOfLines={1}>
                    {ach.title}
                  </Text>
                  <Text style={styles.achievementDesc} numberOfLines={2}>
                    {ach.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* APP SETTINGS */}
      <View style={styles.settingsSection}>
        <View style={styles.sectionHeaderRow}>
          <Settings size={14} color={theme.colors.primary} />
          <Text style={styles.sectionHeader}>SYSTEM PREFERENCES</Text>
        </View>

        {/* Units Toggle */}
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Weight Units</Text>
            <Text style={styles.settingSub}>Stored in KG, dynamic display</Text>
          </View>
          <View style={styles.unitsPillBox}>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                updateSettings({ units: 'kg' });
              }}
              style={[
                styles.unitBtn,
                settings.units === 'kg' && styles.unitBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  settings.units === 'kg' && styles.unitBtnTextActive,
                ]}
              >
                KG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                updateSettings({ units: 'lb' });
              }}
              style={[
                styles.unitBtn,
                settings.units === 'lb' && styles.unitBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  settings.units === 'lb' && styles.unitBtnTextActive,
                ]}
              >
                LB
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rest Timer Default */}
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Default Rest Timer</Text>
            <Text style={styles.settingSub}>Auto-starts after set completion</Text>
          </View>
          <View style={styles.unitsPillBox}>
            {[60, 90, 120].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  haptic.light();
                  updateSettings({ defaultRestSeconds: s });
                }}
                style={[
                  styles.unitBtn,
                  settings.defaultRestSeconds === s && styles.unitBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.unitBtnText,
                    settings.defaultRestSeconds === s && styles.unitBtnTextActive,
                  ]}
                >
                  {s}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clear Demo Data */}
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Demo Workout History</Text>
            <Text style={styles.settingSub}>
              {settings.demoDataActive ? 'Active (4 Weeks)' : 'Cleared'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              haptic.light();
              await clearDemoData();
              Alert.alert('Demo Data Cleared', 'You now have a clean slate.');
            }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>CLEAR DEMO</Text>
          </TouchableOpacity>
        </View>

        {/* Reset All */}
        <TouchableOpacity
          onPress={handleResetData}
          style={styles.resetButton}
        >
          <ShieldAlert size={14} color={theme.colors.danger} />
          <Text style={styles.resetButtonText}>RESET ALL DATA</Text>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statSub: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingsSection: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  achievementsGrid: {
    gap: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    opacity: 0.5,
  },
  achievementItemUnlocked: {
    borderColor: 'rgba(204, 255, 0, 0.4)',
    opacity: 1,
  },
  achievementIcon: {
    fontSize: 20,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  achievementDesc: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  unitsPillBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  unitBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  unitBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  clearBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    marginTop: 6,
  },
  resetButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.danger,
    textTransform: 'uppercase',
  },
});
