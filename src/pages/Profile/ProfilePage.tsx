import React, { useState, useRef, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { 
  calculateCurrentStreak, 
  calculateTotalVolume 
} from '../../utils/calculations';
import { formatVolume, formatWeight, displayWeightValue, parseInputWeight } from '../../utils/units';
import { saveProgressPhoto, getProgressPhoto } from '../../storage/indexedDB';
import { 
  User, 
  Settings, 
  Scale, 
  Camera, 
  Download, 
  Upload, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Clock, 
  ShieldAlert, 
  Check, 
  Trophy, 
  Flame, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { BodyMeasurement } from '../../types/workout';

export const ProfilePage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    sessions, 
    prs, 
    measurements, 
    addMeasurement, 
    deleteMeasurement, 
    achievements, 
    clearDemoData, 
    exportBackup, 
    importBackup, 
    resetAllData 
  } = useWorkout();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // New Measurement Form State
  const [newWeight, setNewWeight] = useState('');
  const [newBf, setNewBf] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newShoulders, setNewShoulders] = useState('');
  const [newThighs, setNewThighs] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedPhotoDataUrl, setSelectedPhotoDataUrl] = useState<string | null>(null);

  // Dynamic statistics
  const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const totalVolume = useMemo(() => calculateTotalVolume(sessions), [sessions]);
  const totalWorkouts = useMemo(() => sessions.filter(s => s.status === 'COMPLETED').length, [sessions]);

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMeasurement = async () => {
    const wtNum = parseFloat(newWeight) || 0;
    if (wtNum <= 0) return;

    const kgVal = parseInputWeight(wtNum, settings.units);
    const dateStr = new Date().toISOString().split('T')[0];
    const photoId = selectedPhotoDataUrl ? `photo-${Date.now()}` : undefined;

    if (photoId && selectedPhotoDataUrl) {
      await saveProgressPhoto(photoId, selectedPhotoDataUrl, dateStr);
    }

    addMeasurement({
      date: dateStr,
      bodyWeightKg: kgVal,
      bodyFatPercent: newBf ? parseFloat(newBf) : undefined,
      chestCm: newChest ? parseFloat(newChest) : undefined,
      waistCm: newWaist ? parseFloat(newWaist) : undefined,
      armsCm: newArms ? parseFloat(newArms) : undefined,
      shouldersCm: newShoulders ? parseFloat(newShoulders) : undefined,
      thighsCm: newThighs ? parseFloat(newThighs) : undefined,
      photoId,
      photoDataUrl: selectedPhotoDataUrl || undefined,
      notes: newNotes || undefined,
    });

    setShowAddMeasurement(false);
    setNewWeight('');
    setNewBf('');
    setNewChest('');
    setNewWaist('');
    setNewArms('');
    setNewShoulders('');
    setNewThighs('');
    setNewNotes('');
    setSelectedPhotoDataUrl(null);
  };

  // Handle Backup Export
  const handleExport = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forma-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Backup Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const res = importBackup(content);
        if (res.success) {
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus(`Import error: ${res.error}`);
          setTimeout(() => setImportStatus(null), 5000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto space-y-6">
      {/* HEADER & ATHLETE IDENTITY */}
      <div className="bg-card border border-border rounded-3xl p-5 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-black font-display font-black text-2xl flex items-center justify-center shadow-glow-md">
            {settings.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-black text-white uppercase">
                {settings.userName}
              </h1>
              <span className="px-2 py-0.5 bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono font-bold uppercase rounded-md">
                PRO ATHLETE
              </span>
            </div>
            <div className="text-xs font-mono text-text-secondary mt-1">
              Active Split: 6-Day Structured Hypertrophy
            </div>
          </div>
        </div>

        {/* STATS OVERVIEW MATRIX */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-border/80 text-center font-mono">
          <div>
            <div className="text-lg font-display font-black text-white">{totalWorkouts}</div>
            <div className="text-[10px] text-text-secondary uppercase">Workouts</div>
          </div>
          <div>
            <div className="text-lg font-display font-black text-primary">{streak} Days</div>
            <div className="text-[10px] text-text-secondary uppercase">Streak</div>
          </div>
          <div>
            <div className="text-lg font-display font-black text-white">{prs.length}</div>
            <div className="text-[10px] text-text-secondary uppercase">Total PRs</div>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS & TROPHIES SHOWCASE */}
      <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
            <Trophy className="w-3.5 h-3.5 mr-1" /> ACHIEVEMENTS & MILESTONES
          </span>
          <span className="text-xs font-mono text-text-secondary font-bold">
            {achievements.filter(a => a.unlockedAt).length} / {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {achievements.map(ach => {
            const isUnlocked = !!ach.unlockedAt;
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border flex items-start space-x-2.5 transition-colors ${
                  isUnlocked
                    ? 'bg-surface/80 border-primary/40'
                    : 'bg-surface/30 border-border/60 opacity-60'
                }`}
              >
                <div className="text-xl">{ach.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-display font-bold text-white uppercase truncate">
                    {ach.title}
                  </div>
                  <div className="text-[10px] text-text-secondary line-clamp-2 mt-0.5">
                    {ach.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BODY METRICS & MEASUREMENTS SECTION */}
      <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
              <Scale className="w-3.5 h-3.5 mr-1" /> BODY COMPOSITION
            </span>
            <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
              Weight & Physique Log
            </h3>
          </div>

          <button
            onClick={() => setShowAddMeasurement(true)}
            className="px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-mono font-bold text-white flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>LOG METRIC</span>
          </button>
        </div>

        {/* Measurements List */}
        {measurements.length > 0 ? (
          <div className="space-y-2">
            {measurements.slice(-4).reverse().map(m => (
              <div
                key={m.id}
                className="bg-surface/60 border border-border/80 rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {m.photoDataUrl && (
                    <img
                      src={m.photoDataUrl}
                      alt="Progress"
                      className="w-10 h-10 rounded-xl object-cover border border-border"
                    />
                  )}
                  <div>
                    <div className="text-xs font-mono font-bold text-white">
                      {formatWeight(m.bodyWeightKg, settings.units)}
                      {m.bodyFatPercent ? ` • ${m.bodyFatPercent}% BF` : ''}
                    </div>
                    <div className="text-[10px] font-mono text-text-secondary">
                      {m.date} {m.chestCm ? `• Chest: ${m.chestCm}cm` : ''} {m.armsCm ? `• Arms: ${m.armsCm}cm` : ''}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteMeasurement(m.id)}
                  className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-mono text-text-secondary border border-dashed border-border rounded-2xl">
            No body measurements logged yet.
          </div>
        )}
      </div>

      {/* APP SETTINGS */}
      <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
        <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
          <Settings className="w-3.5 h-3.5 mr-1" /> SYSTEM SETTINGS
        </span>

        {/* 1. UNITS TOGGLE (KG <-> LB) */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <div className="text-xs font-display font-bold text-white uppercase">Weight Units</div>
            <div className="text-[11px] font-mono text-text-secondary">
              Stored in KG, converted dynamically
            </div>
          </div>
          <div className="flex bg-surface border border-border rounded-xl p-1 font-mono text-xs font-bold">
            <button
              onClick={() => updateSettings({ units: 'kg' })}
              className={`px-3 py-1 rounded-lg transition-all ${
                settings.units === 'kg' ? 'bg-primary text-black font-extrabold shadow-glow-sm' : 'text-text-secondary'
              }`}
            >
              KG
            </button>
            <button
              onClick={() => updateSettings({ units: 'lb' })}
              className={`px-3 py-1 rounded-lg transition-all ${
                settings.units === 'lb' ? 'bg-primary text-black font-extrabold shadow-glow-sm' : 'text-text-secondary'
              }`}
            >
              LB
            </button>
          </div>
        </div>

        {/* 2. DEFAULT REST TIMER */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <div className="text-xs font-display font-bold text-white uppercase">Default Rest Timer</div>
            <div className="text-[11px] font-mono text-text-secondary">Auto-starts after logging a set</div>
          </div>
          <select
            value={settings.defaultRestSeconds}
            onChange={e => updateSettings({ defaultRestSeconds: parseInt(e.target.value, 10) })}
            className="bg-surface border border-border focus:border-primary text-white text-xs font-mono font-bold rounded-xl py-1.5 px-3 outline-none"
          >
            <option value={60}>60s</option>
            <option value={90}>90s</option>
            <option value={120}>120s</option>
            <option value={180}>180s</option>
          </select>
        </div>

        {/* 3. SOUND EFFECTS TOGGLE */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <div className="text-xs font-display font-bold text-white uppercase">Audio Cues & Synthesizer</div>
            <div className="text-[11px] font-mono text-text-secondary">Warning ticks and timer chime</div>
          </div>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-xl border transition-colors ${
              settings.soundEnabled
                ? 'bg-primary/10 border-primary text-primary shadow-glow-sm'
                : 'bg-surface border-border text-text-secondary'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* 4. DEMO DATA CONTROL (Section 10 requirement) */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div>
            <div className="text-xs font-display font-bold text-white uppercase">Demo Workout History</div>
            <div className="text-[11px] font-mono text-text-secondary">
              Status: {settings.demoDataActive ? 'Active (4 Weeks)' : 'Cleared'}
            </div>
          </div>
          <button
            onClick={clearDemoData}
            className="px-3 py-1.5 bg-surface hover:bg-neutral-800 border border-border text-xs font-mono font-bold text-text-secondary hover:text-white rounded-xl transition-colors"
          >
            CLEAR DEMO DATA
          </button>
        </div>

        {/* 5. BACKUP EXPORT & IMPORT */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-display font-bold text-white uppercase">Data Management</div>
          {importStatus && (
            <div className="p-2.5 bg-primary/10 border border-primary text-primary text-xs font-mono rounded-xl">
              {importStatus}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-mono font-bold text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>EXPORT JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-mono font-bold text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>IMPORT JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* 6. FACTORY RESET */}
        <div className="pt-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase rounded-xl transition-colors"
          >
            RESET ALL LOCAL DATA
          </button>
        </div>
      </div>

      {/* LOG MEASUREMENT MODAL */}
      {showAddMeasurement && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 space-y-4 my-auto">
            <h3 className="text-lg font-display font-black text-white uppercase">
              Log Body Composition
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-text-secondary uppercase block mb-1">
                  Body Weight ({settings.units.toUpperCase()}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 78.5"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  className="w-full bg-black border border-border focus:border-primary rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-secondary uppercase block mb-1">Body Fat (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 14.5"
                    value={newBf}
                    onChange={e => setNewBf(e.target.value)}
                    className="w-full bg-black border border-border focus:border-primary rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-text-secondary uppercase block mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 105"
                    value={newChest}
                    onChange={e => setNewChest(e.target.value)}
                    className="w-full bg-black border border-border focus:border-primary rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-secondary uppercase block mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 82"
                    value={newWaist}
                    onChange={e => setNewWaist(e.target.value)}
                    className="w-full bg-black border border-border focus:border-primary rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-text-secondary uppercase block mb-1">Arms (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 39"
                    value={newArms}
                    onChange={e => setNewArms(e.target.value)}
                    className="w-full bg-black border border-border focus:border-primary rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              {/* Photo Upload via IndexedDB */}
              <div>
                <label className="text-text-secondary uppercase block mb-1">Progress Photo</label>
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-20 border border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors bg-surface/40 overflow-hidden"
                >
                  {selectedPhotoDataUrl ? (
                    <img src={selectedPhotoDataUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <Camera className="w-4 h-4 text-primary" />
                      <span>Upload Photo (IndexedDB)</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowAddMeasurement(false)}
                className="py-3 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveMeasurement}
                disabled={!newWeight}
                className="py-3 bg-primary hover:bg-primary-hover text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-glow-sm disabled:opacity-50"
              >
                SAVE ENTRY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FACTORY RESET CONFIRM MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-display font-bold text-white uppercase">
              Reset All Data?
            </h3>
            <p className="text-xs text-text-secondary">
              This will permanently delete all workout history, PRs, measurements, and custom settings stored in your browser.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-3 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-white"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase rounded-xl"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
