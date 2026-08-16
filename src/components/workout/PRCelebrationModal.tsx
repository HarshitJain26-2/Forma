import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Trophy, Flame, Zap, X } from 'lucide-react';

export const PRCelebrationModal: React.FC = () => {
  const { activePRCelebration, dismissPRCelebration } = useWorkout();

  if (!activePRCelebration) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-scale-in">
      <div className="bg-card border-2 border-primary w-full max-w-sm rounded-3xl p-6 relative flex flex-col items-center text-center shadow-[0_0_50px_rgba(204,255,0,0.3)]">
        {/* Close Button */}
        <button
          onClick={dismissPRCelebration}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-full bg-surface border border-border"
        >
          <X className="w-4 h-4" />
        </button>

        {/* PR Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary flex items-center justify-center mb-4 shadow-glow-md animate-bounce">
          <Flame className="w-8 h-8 text-primary fill-primary" />
        </div>

        {/* PR Header */}
        <span className="px-3 py-1 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-full mb-3 shadow-glow-sm">
          NEW PERSONAL RECORD
        </span>

        {/* Exercise Name */}
        <h3 className="text-xl font-display font-extrabold tracking-tight text-white mb-2 uppercase">
          {activePRCelebration.exerciseName}
        </h3>

        {/* PR Detail / Numbers */}
        <div className="bg-surface border border-primary/40 rounded-2xl p-4 w-full my-3">
          <div className="text-2xl font-mono font-extrabold text-primary tracking-tight">
            {activePRCelebration.details}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-secondary mt-1">
            {activePRCelebration.recordType.toUpperCase()} PR ACHIEVED
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-5">
          Your progressive overload engine logged this milestone in your all-time analytics.
        </p>

        {/* Dismiss CTA */}
        <button
          onClick={dismissPRCelebration}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover text-black font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-glow-md transition-transform active:scale-98"
        >
          KEEP CRUSHING IT
        </button>
      </div>
    </div>
  );
};
