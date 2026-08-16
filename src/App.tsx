import React, { useState } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { BottomNav, TabType } from './components/navigation/BottomNav';
import { HomePage } from './pages/Home/HomePage';
import { ProgressPage } from './pages/Progress/ProgressPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { ActiveWorkoutView } from './components/workout/ActiveWorkoutView';
import { RestTimerDock } from './components/workout/RestTimerDock';
import { PRCelebrationModal } from './components/workout/PRCelebrationModal';
import { WorkoutCompletionModal } from './components/workout/WorkoutCompletionModal';
import { Dumbbell, Play, Layers } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { activeSession, startWorkout, program, todaySplitDay } = useWorkout();

  const handleStartWorkout = (dayNumber: number) => {
    startWorkout(dayNumber);
    setActiveTab('workout');
  };

  const renderContent = () => {
    // If user is on the workout tab
    if (activeTab === 'workout') {
      if (activeSession) {
        return <ActiveWorkoutView onBackToHome={() => setActiveTab('home')} />;
      }

      // No active workout selected: Show quick start selection screen
      return (
        <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto space-y-6 animate-scale-in">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase">
              SELECT WORKOUT SESSION
            </span>
            <h1 className="text-2xl font-display font-black tracking-tight text-white uppercase mt-0.5">
              START TRAINING
            </h1>
          </div>

          <div className="bg-gradient-to-r from-card to-surface border border-primary/40 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-primary text-black font-mono font-black text-[10px] uppercase rounded-md">
                RECOMMENDED TODAY
              </span>
              <span className="text-xs font-mono text-text-secondary">
                {todaySplitDay.estimatedDurationMin}
              </span>
            </div>
            <h3 className="text-xl font-display font-black text-white uppercase">
              {todaySplitDay.title} — {todaySplitDay.subtitle}
            </h3>
            <p className="text-xs text-text-secondary">{todaySplitDay.focus}</p>

            <button
              onClick={() => handleStartWorkout(todaySplitDay.dayNumber)}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-black font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>START {todaySplitDay.title}</span>
            </button>
          </div>

          {/* All Split Days List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              Or Choose Another Split Day:
            </h3>
            <div className="space-y-2">
              {program.map(day => (
                <div
                  key={day.id}
                  onClick={() => handleStartWorkout(day.dayNumber)}
                  className="p-3.5 bg-card hover:bg-surface border border-border hover:border-primary/50 rounded-2xl cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center font-mono font-bold text-xs text-text-secondary">
                      0{day.dayNumber}
                    </div>
                    <div>
                      <div className="text-sm font-display font-bold text-white uppercase">
                        {day.subtitle}
                      </div>
                      <div className="text-[11px] font-mono text-text-secondary">
                        {day.isRestDay ? 'Rest & Recovery' : `${day.exercises.length} exercises`}
                      </div>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            onStartWorkout={handleStartWorkout}
            onNavigateToWorkout={() => setActiveTab('workout')}
          />
        );
      case 'progress':
        return <ProgressPage />;
      case 'history':
        return <HistoryPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onStartWorkout={handleStartWorkout} onNavigateToWorkout={() => setActiveTab('workout')} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Dynamic Main View */}
      {renderContent()}

      {/* Persistent Floating Rest Timer Dock */}
      <RestTimerDock />

      {/* Global Modals */}
      <PRCelebrationModal />
      <WorkoutCompletionModal />

      {/* Persistent Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveWorkout={!!activeSession}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
};

export default App;
