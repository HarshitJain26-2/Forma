import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDistanceOrTime } from '../../utils/units';
import { Volume2, VolumeX, Play, Pause, FastForward, Plus, Maximize2, X } from 'lucide-react';

export const RestTimerDock: React.FC = () => {
  const { 
    restTimer, 
    pauseRestTimer, 
    resumeRestTimer, 
    skipRestTimer, 
    addTimerSeconds,
    startRestTimer,
    settings,
    updateSettings 
  } = useWorkout();

  const [isExpanded, setIsExpanded] = useState(false);

  if (restTimer.secondsRemaining <= 0 && !isExpanded) {
    return null;
  }

  const progress = restTimer.totalSeconds > 0 
    ? Math.max(0, Math.min(1, restTimer.secondsRemaining / restTimer.totalSeconds)) 
    : 0;

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <>
      {/* FLOATING MINI DOCK (Visible when timer is active and not expanded) */}
      {restTimer.secondsRemaining > 0 && !isExpanded && (
        <div className="fixed bottom-20 left-4 right-4 z-30 max-w-md mx-auto animate-slide-up">
          <div className="bg-surface/95 border border-primary/40 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-center justify-between">
            <div 
              onClick={() => setIsExpanded(true)}
              className="flex items-center space-x-3 cursor-pointer group flex-1"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#222222"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#CCFF00"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - progress)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold text-white">
                  {restTimer.secondsRemaining}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">REST</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="text-sm font-mono font-bold text-white group-hover:text-primary transition-colors">
                  {formatDistanceOrTime(restTimer.secondsRemaining)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => addTimerSeconds(30)}
                className="px-2.5 py-1.5 bg-surface-hover hover:bg-neutral-800 border border-border rounded-xl text-xs font-mono font-bold text-white transition-colors"
                title="Add 30 seconds"
              >
                +30s
              </button>
              <button
                onClick={skipRestTimer}
                className="px-2.5 py-1.5 bg-surface-hover hover:bg-neutral-800 border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-colors"
              >
                SKIP
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="p-1.5 text-text-secondary hover:text-white transition-colors"
                title="Expand Timer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL CIRCULAR EXPANDED MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-scale-in">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 relative flex flex-col items-center shadow-2xl">
            {/* Header / Close & Audio */}
            <div className="w-full flex items-center justify-between mb-6">
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-white transition-colors"
                title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              >
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <span className="text-xs uppercase font-bold tracking-widest text-text-secondary">REST TIMER</span>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-52 h-52 flex items-center justify-center my-4">
              <svg className="w-52 h-52 transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="80"
                  stroke="#1a1a1a"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="80"
                  stroke="#CCFF00"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(204,255,0,0.4)]"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-mono font-extrabold tracking-tight text-white">
                  {formatDistanceOrTime(restTimer.secondsRemaining)}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-text-secondary mt-1">
                  {restTimer.isRunning ? 'COUNTING DOWN' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 w-full my-4">
              {[60, 90, 120, 180].map(seconds => (
                <button
                  key={seconds}
                  onClick={() => startRestTimer(seconds)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    restTimer.totalSeconds === seconds && restTimer.isRunning
                      ? 'bg-primary text-black border-primary font-extrabold shadow-glow-sm'
                      : 'bg-surface border-border text-text-secondary hover:text-white hover:border-text-secondary'
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>

            {/* Primary Action Controls */}
            <div className="flex items-center justify-center space-x-3 w-full mt-2">
              <button
                onClick={() => addTimerSeconds(30)}
                className="flex-1 py-3 bg-surface hover:bg-surface-hover border border-border rounded-2xl text-xs font-mono font-bold text-white flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>30 SEC</span>
              </button>

              <button
                onClick={restTimer.isRunning ? pauseRestTimer : resumeRestTimer}
                className="w-14 h-14 rounded-2xl bg-primary hover:bg-primary-hover text-black flex items-center justify-center shadow-glow-md transition-transform active:scale-95"
              >
                {restTimer.isRunning ? (
                  <Pause className="w-6 h-6 fill-black stroke-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black stroke-black ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  skipRestTimer();
                  setIsExpanded(false);
                }}
                className="flex-1 py-3 bg-surface hover:bg-surface-hover border border-border rounded-2xl text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white flex items-center justify-center space-x-1 transition-colors"
              >
                <FastForward className="w-4 h-4" />
                <span>SKIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
