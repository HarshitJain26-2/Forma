import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useNativeWorkout } from '../context/NativeWorkoutContext';
import { theme } from '../theme';
import { Flame, X } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

export const NativePRModal: React.FC = () => {
  const { activePRCelebration, dismissPRCelebration } = useNativeWorkout();

  if (!activePRCelebration) return null;

  return (
    <Modal
      visible={!!activePRCelebration}
      transparent
      animationType="fade"
      onRequestClose={dismissPRCelebration}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              dismissPRCelebration();
            }}
            style={styles.closeButton}
          >
            <X size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Flame Icon */}
          <View style={styles.iconContainer}>
            <Flame size={32} color={theme.colors.primary} />
          </View>

          {/* PR Header */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW PERSONAL RECORD</Text>
          </View>

          <Text style={styles.exerciseTitle}>
            {activePRCelebration.exerciseName}
          </Text>

          {/* PR Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsText}>
              {activePRCelebration.details}
            </Text>
            <Text style={styles.detailsSubtext}>
              {activePRCelebration.recordType.toUpperCase()} MILESTONE ACHIEVED
            </Text>
          </View>

          <Text style={styles.motivationalText}>
            Your progressive overload intelligence logged this milestone in your all-time analytics.
          </Text>

          {/* Keep Crushing It Button */}
          <TouchableOpacity
            onPress={() => {
              haptic.medium();
              dismissPRCelebration();
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>KEEP CRUSHING IT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  detailsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  detailsSubtext: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  motivationalText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: 12,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
