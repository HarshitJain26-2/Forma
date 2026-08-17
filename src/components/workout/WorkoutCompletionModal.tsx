import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDistanceOrTime, formatVolume } from '../../utils/units';
import { FormaLogo } from '../brand/FormaLogo';
import { ShareWorkoutSheet } from '../sharing/ShareWorkoutSheet';
import { buildWorkoutShareData } from '../../utils/shareWorkoutData';
import { CheckCircle, Flame, Trophy, Star, Share2 } from 'lucide-react';

export const WorkoutCompletionModal: React.FC = () => {
  const { 
    completedSummarySession, 
    dismissCompletedSummary, 
    settings, 
    program,
    sessions 
  } = useWorkout();
  
  const [energyRating, setEnergyRating] = useState(5);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  const shareData = useMemo(() => {
    if (!completedSummarySession) return null;
    return buildWorkoutShareData(completedSummarySession, sessions, settings.units);
  }, [completedSummarySession, sessions, settings.units]);

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
    <>
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto p-4 flex items-center justify-center animate-scale-in">
        <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 relative flex flex-col items-center text-center shadow-2xl my-auto">
          
          {/* Brand Logo & Celebration Header */}
          <div className="mb-4">
            <FormaLogo size="md" variant="compact" withGlow={true} />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary flex items-center justify-center mb-3 shadow-glow-md">
            <CheckCircle className="w-7 h-7 text-primary" />
          </div>

          <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase mb-1">
            SESSION FINISHED
          </span>

          <h2 className="text-2xl font-display font-black tracking-tight text-white mb-1 uppercase">
            WORKOUT COMPLETE
          </h2>

          <div className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
            {displayTitle}
          </div>

          {/* Time Badge */}
          <div className="px-4 py-1.5 bg-surface border border-border rounded-xl text-lg font-mono font-extrabold text-white mb-6">
            ⏱️ {formatDistanceOrTime(completedSummarySession.durationSeconds)}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-surface border border-border/80 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                EXERCISES
              </span>
              <span className="text-xl font-display font-extrabold text-white">
                {completedExercises} / {totalExercises}
              </span>
            </div>

            <div className="bg-surface border border-border/80 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                TOTAL SETS
              </span>
              <span className="text-xl font-display font-extrabold text-white">
                {totalSets} SETS
              </span>
            </div>

            <div className="bg-surface border border-border/80 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                VOLUME
              </span>
              <span className="text-xl font-display font-extrabold text-primary">
                {formatVolume(totalVolume, settings.units)}
              </span>
            </div>

            <div className="bg-surface border border-border/80 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                RECORDS
              </span>
              <span className="text-xl font-display font-extrabold text-white flex items-center">
                {prsCount > 0 ? (
                  <span className="text-primary flex items-center">
                    <Flame className="w-4 h-4 mr-1 fill-primary" /> {prsCount} PR{prsCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  '0 PRs'
                )}
              </span>
            </div>
          </div>

          {/* PR Breakdown if any */}
          {completedSummarySession.prsAchieved && completedSummarySession.prsAchieved.length > 0 && (
            <div className="w-full bg-primary/10 border border-primary/40 rounded-2xl p-3.5 mb-6 text-left">
              <div className="flex items-center text-xs font-bold text-primary uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5 mr-1.5" />
                <span>Personal Records Smashed Today</span>
              </div>
              <div className="space-y-1.5">
                {completedSummarySession.prsAchieved.map(pr => (
                  <div key={pr.id} className="text-xs font-mono text-white flex items-center justify-between">
                    <span className="truncate max-w-[180px] font-medium">{pr.exerciseName}</span>
                    <span className="text-primary font-bold">{pr.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Energy & Feedback */}
          <div className="w-full bg-surface border border-border rounded-2xl p-4 mb-6 text-left space-y-3">
            <div className="text-xs uppercase font-bold tracking-wider text-text-secondary">
              HOW DID TODAY'S WORKOUT FEEL?
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Energy Level:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setEnergyRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= energyRating ? 'text-primary fill-primary' : 'text-text-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS: PRIMARY SHARE WORKOUT & DONE */}
          <div className="w-full space-y-2.5">
            <button
              onClick={() => setIsShareSheetOpen(true)}
              className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-display font-black text-base uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
            >
              <Share2 className="w-5 h-5 text-black stroke-[2.5]" />
              <span>SHARE WORKOUT</span>
            </button>

            <button
              onClick={dismissCompletedSummary}
              className="w-full py-3.5 bg-surface hover:bg-surface-hover border border-border text-neutral-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-colors"
            >
              DONE
            </button>
          </div>
        </div>
      </div>

      {/* SHARE PREVIEW SHEET */}
      <ShareWorkoutSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        shareData={shareData}
        userName={settings.userName}
        onShare={() => {}}
      />
    </>
  );
};

