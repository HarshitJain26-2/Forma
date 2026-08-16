import React from 'react';
import { Home, Dumbbell, TrendingUp, History, User } from 'lucide-react';

export type TabType = 'home' | 'workout' | 'progress' | 'history' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasActiveWorkout: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasActiveWorkout,
}) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-border/80 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isWorkoutTab = tab.id === 'workout';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 group ${
                isActive ? 'text-primary scale-105' : 'text-text-secondary hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {isWorkoutTab && hasActiveWorkout && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                )}
                {isWorkoutTab && hasActiveWorkout && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-black" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wider uppercase mt-1 transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-text-secondary'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-0.5 bg-primary rounded-full shadow-glow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
