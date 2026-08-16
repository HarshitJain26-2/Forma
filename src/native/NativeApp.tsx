import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeWorkoutProvider, useNativeWorkout } from './context/NativeWorkoutContext';
import { NativeBottomNav, NativeTabType } from './components/NativeBottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { NativeRestTimerDock } from './components/NativeRestTimerDock';
import { NativePRModal } from './components/NativePRModal';
import { NativeCompletionModal } from './components/NativeCompletionModal';
import { Weekday } from '../types/workout';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NativeTabType>('home');
  const { activeSession, startWorkout } = useNativeWorkout();

  const handleStartWorkout = (dayId: Weekday | string) => {
    startWorkout(dayId);
    setActiveTab('workout');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onStartWorkout={handleStartWorkout}
            onNavigateToWorkout={() => setActiveTab('workout')}
          />
        );
      case 'workout':
        return <WorkoutScreen onBackToHome={() => setActiveTab('home')} />;
      case 'progress':
        return <ProgressScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return (
          <HomeScreen
            onStartWorkout={handleStartWorkout}
            onNavigateToWorkout={() => setActiveTab('workout')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#000000" />
      <View style={styles.container}>
        {renderScreen()}

        {/* Persistent Floating Rest Timer Mini Dock */}
        <NativeRestTimerDock />

        {/* Global Celebration & Summary Modals */}
        <NativePRModal />
        <NativeCompletionModal />

        {/* Persistent Bottom Navigation */}
        <NativeBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasActiveWorkout={!!activeSession}
        />
      </View>
    </SafeAreaView>
  );
};

export default function NativeApp() {
  return (
    <NativeWorkoutProvider>
      <AppContent />
    </NativeWorkoutProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
});
