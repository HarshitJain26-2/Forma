import React, { forwardRef } from 'react';
import { WorkoutShareData } from '../../types/sharing';
import { FormaLogo } from '../brand/FormaLogo';
import { formatDistanceOrTime, formatVolume } from '../../utils/units';
import { Flame, Trophy, Clock, Dumbbell, Layers, TrendingUp, Sparkles, Award } from 'lucide-react';

export interface ShareCardCustomization {
  showPR: boolean;
  showTopLifts: boolean;
  showVolume: boolean;
  showStreak: boolean;
}

interface WorkoutShareCardProps {
  shareData: WorkoutShareData;
  customization?: Partial<ShareCardCustomization>;
  userName?: string;
  className?: string;
}

export const WorkoutShareCard = forwardRef<HTMLDivElement, WorkoutShareCardProps>(({
  shareData,
  customization = {},
  userName = 'ATHLETE',
  className = '',
}, ref) => {
  const {
    showPR = true,
    showTopLifts = true,
    showVolume = true,
    showStreak = true,
  } = customization;

  const dateFormatted = shareData.completedAt 
    ? new Date(shareData.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

  const hasPRs = showPR && shareData.personalRecords.length > 0;
  const hasTopLifts = showTopLifts && shareData.topExercises.length > 0;
  const hasStreak = showStreak && shareData.streak !== undefined && shareData.streak > 0;

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-[360px] aspect-[9/16] bg-black text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden border border-neutral-800 shadow-2xl select-none font-sans ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 0%, #151d08 0%, #000000 70%)',
      }}
    >
      {/* BACKGROUND AMBIENT GLOWS & GRID */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#CCFF00 1px, transparent 1px), linear-gradient(90deg, #CCFF00 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* 1. CARD TOP: BRAND HEADER & ATHLETE INFO */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <FormaLogo size="sm" variant="compact" withGlow={true} />
          
          {hasStreak && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-primary/10 border border-primary/40 rounded-full">
              <Flame className="w-3 h-3 text-primary fill-primary" />
              <span className="text-[10px] font-mono font-black text-primary tracking-wider uppercase">
                {shareData.streak} DAY STREAK
              </span>
            </div>
          )}
        </div>

        {/* WORKOUT TITLE & DATE */}
        <div className="pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-black tracking-widest text-primary uppercase">
              {shareData.weekday}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">•</span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              {dateFormatted}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white uppercase leading-tight mt-0.5">
            {shareData.workoutTitle}
          </h2>
        </div>
      </div>

      {/* 2. CARD CENTER: KEY PERFORMANCE METRICS MATRIX */}
      <div className="relative z-10 my-auto space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          {/* DURATION */}
          <div className="bg-[#0e0e0e]/90 border border-neutral-800/90 rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                TIME
              </span>
              <Clock className="w-3 h-3 text-primary" />
            </div>
            <div className="text-lg font-mono font-black text-white">
              {formatDistanceOrTime(shareData.durationSeconds)}
            </div>
          </div>

          {/* TOTAL VOLUME */}
          {showVolume ? (
            <div className="bg-[#0e0e0e]/90 border border-neutral-800/90 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                  VOLUME
                </span>
                <Dumbbell className="w-3 h-3 text-primary" />
              </div>
              <div className="text-lg font-mono font-black text-primary truncate">
                {formatVolume(shareData.totalVolumeKg, shareData.units)}
              </div>
            </div>
          ) : (
            <div className="bg-[#0e0e0e]/90 border border-neutral-800/90 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                  STATUS
                </span>
                <Award className="w-3 h-3 text-primary" />
              </div>
              <div className="text-base font-mono font-black text-primary">
                COMPLETED
              </div>
            </div>
          )}

          {/* SETS */}
          <div className="bg-[#0e0e0e]/90 border border-neutral-800/90 rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                SETS
              </span>
              <Layers className="w-3 h-3 text-primary" />
            </div>
            <div className="text-lg font-mono font-black text-white">
              {shareData.completedSets} <span className="text-xs text-neutral-400 font-normal">SETS</span>
            </div>
          </div>

          {/* EXERCISES */}
          <div className="bg-[#0e0e0e]/90 border border-neutral-800/90 rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                EXERCISES
              </span>
              <TrendingUp className="w-3 h-3 text-primary" />
            </div>
            <div className="text-lg font-mono font-black text-white">
              {shareData.exerciseCount} <span className="text-xs text-neutral-400 font-normal">EX</span>
            </div>
          </div>
        </div>

        {/* 3. PR HIGHLIGHT BANNER (IF ANY) */}
        {hasPRs && (
          <div className="bg-primary/10 border border-primary/50 rounded-2xl p-3 space-y-1.5 shadow-glow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
                <span className="text-[10px] font-mono font-black text-primary uppercase tracking-wider">
                  {shareData.personalRecords.length} NEW PERSONAL RECORD{shareData.personalRecords.length > 1 ? 'S' : ''}
                </span>
              </div>
              <Sparkles className="w-3 h-3 text-primary" />
            </div>

            <div className="space-y-1">
              {shareData.personalRecords.slice(0, 2).map((pr, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold truncate max-w-[170px]">
                    {pr.exerciseName}
                  </span>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-primary font-black">{pr.details}</span>
                    {pr.deltaText && (
                      <span className="text-[9px] text-black bg-primary px-1 rounded font-black">
                        {pr.deltaText}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. TOP LIFTS SECTION (IF NOT ALREADY DOMINATED BY PRS) */}
        {hasTopLifts && (
          <div className="bg-[#0e0e0e]/90 border border-neutral-800/90 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
              <span>TOP LIFTS</span>
              <Dumbbell className="w-3 h-3 text-primary" />
            </div>

            <div className="space-y-1.5">
              {shareData.topExercises.map((top, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-1.5 truncate max-w-[170px]">
                    <span className="text-neutral-500 text-[10px]">{idx + 1}.</span>
                    <span className="text-white font-medium truncate">{top.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-white font-bold">{top.bestSetSummary}</span>
                    {top.isPR && (
                      <span className="text-[8px] bg-primary text-black font-black px-1 rounded">
                        PR
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. CARD FOOTER: MOTTO & WATERMARK */}
      <div className="relative z-10 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono tracking-widest text-primary uppercase font-bold">
            TRACK • LIFT • EVOLVE
          </span>
          <span className="text-[9px] font-display font-black text-white uppercase tracking-wider">
            FORMA INTELLIGENCE
          </span>
        </div>

        <div className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-md text-[8px] font-mono text-neutral-400 uppercase">
          {userName}
        </div>
      </div>
    </div>
  );
});

WorkoutShareCard.displayName = 'WorkoutShareCard';
