import React, { useState, useRef } from 'react';
import { WorkoutShareData } from '../../types/sharing';
import { WorkoutShareCard, ShareCardCustomization } from './WorkoutShareCard';
import { generateWorkoutShareImage } from '../../services/shareImageGenerator';
import { shareWorkoutImageNative } from '../../services/nativeShareService';
import { X, Share2, EyeOff, Loader2, Sparkles, Check, AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface ShareWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: WorkoutShareData | null;
  onShare?: (customization: ShareCardCustomization, file?: File, dataUrl?: string) => Promise<void> | void;
  userName?: string;
}

export const ShareWorkoutSheet: React.FC<ShareWorkoutSheetProps> = ({
  isOpen,
  onClose,
  shareData,
  onShare,
  userName,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [customization, setCustomization] = useState<ShareCardCustomization>({
    showPR: true,
    showTopLifts: true,
    showVolume: true,
    showStreak: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<{ dataUrl: string; file: File } | null>(null);

  if (!isOpen || !shareData) return null;

  const toggleOption = (key: keyof ShareCardCustomization) => {
    setCustomization(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    // Reset previously generated image so it regenerates on next share
    setGeneratedImage(null);
  };

  const handleGenerateAndShare = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateWorkoutShareImage(shareData, customization, userName || 'ATHLETE');
      setGeneratedImage({ dataUrl: result.dataUrl, file: result.file });

      if (onShare) {
        await onShare(customization, result.file, result.dataUrl);
      } else {
        // Native Share attempt (automatically downloads on web fallback)
        await shareWorkoutImageNative({
          title: `Forma — ${shareData.workoutTitle}`,
          text: `Finished my ${shareData.workoutTitle} training session on Forma!`,
          file: result.file,
          dataUrl: result.dataUrl,
        });
      }
    } catch (err: any) {
      console.error('Share generation error:', err);
      setGenerationError(err?.message || "Couldn't create share card");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* SHEET HEADER */}
      <div className="w-full max-w-md flex items-center justify-between py-2 shrink-0">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
            <Sparkles className="w-3 h-3 mr-1" /> SHARE WORKOUT
          </span>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
            STORY & SOCIAL PREVIEW
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-2xl bg-surface border border-border text-neutral-400 hover:text-white transition-colors"
          title="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* CARD PREVIEW CONTAINER */}
      <div className="my-auto py-3 w-full flex items-center justify-center shrink-0">
        <div className="transform scale-[0.88] sm:scale-100 origin-center transition-transform">
          <WorkoutShareCard
            ref={cardRef}
            shareData={shareData}
            customization={customization}
            userName={userName}
          />
        </div>
      </div>

      {/* ERROR STATE MODAL */}
      {generationError && (
        <div className="w-full max-w-md bg-red-500/10 border border-red-500/40 rounded-2xl p-4 mb-2 flex items-center justify-between animate-shake">
          <div className="flex items-center space-x-2.5 text-xs text-red-400 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <div className="font-bold uppercase">COULDN'T CREATE SHARE CARD</div>
              <div className="text-[11px] text-neutral-400">Please try again.</div>
            </div>
          </div>
          <button
            onClick={handleGenerateAndShare}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-mono font-bold text-xs uppercase rounded-xl transition-colors shrink-0"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* CONTROLS & SHARE CTA */}
      <div className="w-full max-w-md space-y-4 pt-2 shrink-0 pb-safe">
        {/* CUSTOMIZATION TOGGLE CHIPS */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            CARD CUSTOMIZATION
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => toggleOption('showPR')}
              className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                customization.showPR
                  ? 'bg-primary/10 border-primary text-primary shadow-glow-sm'
                  : 'bg-surface border-border text-neutral-500'
              }`}
            >
              {customization.showPR ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>PRs</span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('showTopLifts')}
              className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                customization.showTopLifts
                  ? 'bg-primary/10 border-primary text-primary shadow-glow-sm'
                  : 'bg-surface border-border text-neutral-500'
              }`}
            >
              {customization.showTopLifts ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>TOP LIFTS</span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('showVolume')}
              className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                customization.showVolume
                  ? 'bg-primary/10 border-primary text-primary shadow-glow-sm'
                  : 'bg-surface border-border text-neutral-500'
              }`}
            >
              {customization.showVolume ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>VOLUME</span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('showStreak')}
              className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                customization.showStreak
                  ? 'bg-primary/10 border-primary text-primary shadow-glow-sm'
                  : 'bg-surface border-border text-neutral-500'
              }`}
            >
              {customization.showStreak ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>STREAK</span>
            </button>
          </div>
        </div>

        {/* PRIMARY SHARE / DOWNLOAD BUTTONS */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGenerateAndShare}
            disabled={isGenerating}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>GENERATING SHARE CARD...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-black stroke-[2.5]" />
                <span>SHARE WORKOUT (1080 × 1920)</span>
              </>
            )}
          </button>

          {generatedImage && (
            <button
              type="button"
              onClick={() => {
                const a = document.createElement('a');
                a.href = generatedImage.dataUrl;
                a.download = generatedImage.file.name;
                a.click();
              }}
              className="w-full py-3 bg-surface hover:bg-surface-hover border border-primary/40 text-primary font-mono font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>DOWNLOAD PNG (1080 × 1920)</span>
            </button>
          )}
        </div>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          disabled={isGenerating}
          className="w-full py-3 bg-surface hover:bg-surface-hover border border-border rounded-2xl text-xs font-mono font-bold text-neutral-400 hover:text-white transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

