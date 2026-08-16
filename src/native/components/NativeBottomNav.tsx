import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Dumbbell, TrendingUp, History, User } from 'lucide-react-native';
import { theme } from '../theme';
import { haptic } from '../utils/haptics';

export type NativeTabType = 'home' | 'workout' | 'progress' | 'history' | 'profile';

interface NativeBottomNavProps {
  activeTab: NativeTabType;
  setActiveTab: (tab: NativeTabType) => void;
  hasActiveWorkout: boolean;
}

export const NativeBottomNav: React.FC<NativeBottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasActiveWorkout,
}) => {
  const tabs: { id: NativeTabType; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isWorkoutTab = tab.id === 'workout';

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => {
                haptic.light();
                setActiveTab(tab.id);
              }}
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Icon
                  size={20}
                  color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isWorkoutTab && hasActiveWorkout && (
                  <View style={styles.activeWorkoutDot} />
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 20,
  },
  navBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
  activeWorkoutDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  tabLabelInactive: {
    color: theme.colors.textSecondary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.primary,
  },
});
