import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { formatDistanceOrTime } from '../../utils/units';
import { theme } from '../theme';
import { Play, Pause, FastForward, Plus, X, Volume2, VolumeX } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

export const NativeRestTimerDock: React.FC = () => {
  const {
    restTimer,
    pauseRestTimer,
    resumeRestTimer,
    skipRestTimer,
    addTimerSeconds,
    startRestTimer,
    settings,
    updateSettings,
  } = useNativeWorkout();

  const [isExpanded, setIsExpanded] = useState(false);

  if (restTimer.secondsRemaining <= 0 && !isExpanded) {
    return null;
  }

  const progress = restTimer.totalSeconds > 0
    ? Math.max(0, Math.min(1, restTimer.secondsRemaining / restTimer.totalSeconds))
    : 0;

  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <>
      {/* FLOATING MINI DOCK */}
      {restTimer.secondsRemaining > 0 && !isExpanded && (
        <View style={styles.miniDockWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsExpanded(true)}
            style={styles.miniDockContainer}
          >
            <View style={styles.miniDockLeft}>
              <View style={styles.miniProgressCircle}>
                <Text style={styles.miniSecondsText}>{restTimer.secondsRemaining}</Text>
              </View>
              <View>
                <Text style={styles.miniRestLabel}>REST TIMER</Text>
                <Text style={styles.miniTimeText}>
                  {formatDistanceOrTime(restTimer.secondsRemaining)}
                </Text>
              </View>
            </View>

            <View style={styles.miniDockControls}>
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  addTimerSeconds(30);
                }}
                style={styles.miniButton}
              >
                <Text style={styles.miniButtonText}>+30s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  skipRestTimer();
                }}
                style={styles.miniButton}
              >
                <Text style={styles.miniButtonText}>SKIP</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* EXPANDED FULL CIRCULAR TIMER MODAL */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                style={styles.headerIconButton}
              >
                {settings.soundEnabled ? (
                  <Volume2 size={18} color={theme.colors.primary} />
                ) : (
                  <VolumeX size={18} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>

              <Text style={styles.modalTitle}>REST TIMER</Text>

              <TouchableOpacity
                onPress={() => setIsExpanded(false)}
                style={styles.headerIconButton}
              >
                <X size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Circular Progress Ring */}
            <View style={styles.svgContainer}>
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#1A1A1A"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={theme.colors.primary}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>
              <View style={styles.timerTextOverlay}>
                <Text style={styles.timerLargeText}>
                  {formatDistanceOrTime(restTimer.secondsRemaining)}
                </Text>
                <Text style={styles.timerStatusText}>
                  {restTimer.isRunning ? 'COUNTING DOWN' : 'PAUSED'}
                </Text>
              </View>
            </View>

            {/* Presets (60s, 90s, 120s, 180s) */}
            <View style={styles.presetsRow}>
              {[60, 90, 120, 180].map(sec => (
                <TouchableOpacity
                  key={sec}
                  onPress={() => {
                    haptic.light();
                    startRestTimer(sec);
                  }}
                  style={[
                    styles.presetButton,
                    restTimer.totalSeconds === sec && restTimer.isRunning
                      ? styles.presetButtonActive
                      : styles.presetButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      restTimer.totalSeconds === sec && restTimer.isRunning
                        ? styles.presetTextActive
                        : styles.presetTextInactive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Primary Action Controls */}
            <View style={styles.actionControlsRow}>
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  addTimerSeconds(30);
                }}
                style={styles.actionButton}
              >
                <Plus size={16} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>30 SEC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  haptic.medium();
                  restTimer.isRunning ? pauseRestTimer : resumeRestTimer();
                }}
                style={styles.playPauseButton}
              >
                {restTimer.isRunning ? (
                  <Pause size={24} color="#000000" />
                ) : (
                  <Play size={24} color="#000000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  skipRestTimer();
                  setIsExpanded(false);
                }}
                style={styles.actionButton}
              >
                <FastForward size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                  SKIP
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  miniDockWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  miniDockContainer: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.4)',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  miniDockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniProgressCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  miniSecondsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  miniRestLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  miniTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  miniDockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniButton: {
    backgroundColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  miniButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIconButton: {
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  timerTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginVertical: 16,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetButtonInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  presetText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  presetTextActive: {
    color: '#000000',
  },
  presetTextInactive: {
    color: theme.colors.textSecondary,
  },
  actionControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playPauseButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
