import React, { useState, useRef } from 'react';
import { WorkoutShareData } from '../../types/sharing';
import { WorkoutShareCard, ShareCardCustomization } from './WorkoutShareCard';
import { generateWorkoutShareImage } from '../../services/shareImageGenerator';
import { 
  shareWorkoutImageNative, 
  shareDirectToInstagram, 
  shareDirectToWhatsApp, 
  shareDirectToTwitter, 
  shareDirectToTelegram,
  copyImageToClipboard,
  copyTextToClipboard,
  downloadShareImage
} from '../../services/nativeShareService';
import { formatVolume, formatDistanceOrTime } from '../../utils/units';
import { 
  X, 
  Share2, 
  EyeOff, 
  Loader2, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Download, 
  Copy, 
  MessageCircle, 
  Send, 
  CheckCircle2
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TwitterXIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !shareData) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleOption = (key: keyof ShareCardCustomization) => {
    setCustomization(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper to ensure image is generated
  const getGeneratedResult = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const result = await generateWorkoutShareImage(shareData, customization, userName || 'ATHLETE');
      return result;
    } catch (err: any) {
      console.error('Image generation error:', err);
      setGenerationError(err?.message || "Couldn't create share card");
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. Native / System OS Share
  const handleNativeShare = async () => {
    try {
      const result = await getGeneratedResult();
      if (onShare) {
        await onShare(customization, result.file, result.dataUrl);
      } else {
        await shareWorkoutImageNative({
          title: `Forma — ${shareData.workoutTitle}`,
          text: `Crushed my ${shareData.workoutTitle} session on Forma! ${shareData.totalVolumeKg ? formatVolume(shareData.totalVolumeKg, shareData.units) : ''} volume logged.`,
          file: result.file,
          dataUrl: result.dataUrl,
        });
      }
    } catch (e) {}
  };

  // 2. Direct Instagram Stories
  const handleInstagramShare = async () => {
    try {
      const result = await getGeneratedResult();
      const res = await shareDirectToInstagram({
        file: result.file,
        blob: result.blob,
        dataUrl: result.dataUrl,
      });
      showToast(res.message);
    } catch (e) {}
  };

  // 3. Direct WhatsApp Share
  const handleWhatsAppShare = async () => {
    try {
      const result = await getGeneratedResult();
      const prText = shareData.personalRecords.length > 0
        ? `🔥 ${shareData.personalRecords.length} PRs: ${shareData.personalRecords.map(p => `${p.exerciseName} (${p.details})`).join(', ')}`
        : '';
      const text = `⚡ FORMA WORKOUT COMPLETE ⚡\n\n🏋️ ${shareData.workoutTitle}\n⏱️ Time: ${formatDistanceOrTime(shareData.durationSeconds)}\n📊 Volume: ${formatVolume(shareData.totalVolumeKg, shareData.units)}\n🔢 Sets: ${shareData.completedSets}\n${prText}\n\nTracked with Forma — Progressive Gym Intelligence.`;
      
      await shareDirectToWhatsApp(text, result.file, result.dataUrl);
      showToast('Opening WhatsApp & saving card...');
    } catch (e) {}
  };

  // 4. Direct Twitter / X Share
  const handleTwitterShare = async () => {
    try {
      const prText = shareData.personalRecords.length > 0
        ? `🔥 Smashed ${shareData.personalRecords.length} PRs (${shareData.personalRecords[0].exerciseName}: ${shareData.personalRecords[0].details})`
        : '';
      const tweetText = `Just crushed ${shareData.workoutTitle} on @FormaApp!\n\n⏱️ ${formatDistanceOrTime(shareData.durationSeconds)}\n📊 ${formatVolume(shareData.totalVolumeKg, shareData.units)} Total Volume\n${prText}\n\n#Forma #GymProgress #Fitness`;
      shareDirectToTwitter(tweetText);
    } catch (e) {}
  };

  // 5. Direct Telegram Share
  const handleTelegramShare = async () => {
    try {
      const text = `💪 Finished ${shareData.workoutTitle} on Forma! Logged ${formatVolume(shareData.totalVolumeKg, shareData.units)} across ${shareData.completedSets} sets.`;
      shareDirectToTelegram(text);
    } catch (e) {}
  };

  // 6. Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const result = await getGeneratedResult();
      const copied = await copyImageToClipboard(result.blob);
      if (copied) {
        showToast('Story Image copied to clipboard! Paste directly into Instagram / WhatsApp / Messages.');
      } else {
        downloadShareImage(result.dataUrl, result.file.name);
        showToast('Image downloaded to device!');
      }
    } catch (e) {}
  };

  // 7. Direct Download PNG
  const handleDownload = async () => {
    try {
      const result = await getGeneratedResult();
      downloadShareImage(result.dataUrl, result.file.name);
      showToast('1080 × 1920 PNG downloaded!');
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* TOAST ALERT BANNER */}
      {toastMessage && (
        <div className="fixed top-6 z-50 px-4 py-3 bg-primary text-black font-display font-black text-xs uppercase rounded-2xl shadow-glow-md flex items-center space-x-2 animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        <div className="transform scale-[0.85] sm:scale-100 origin-center transition-transform">
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
            onClick={handleNativeShare}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-mono font-bold text-xs uppercase rounded-xl transition-colors shrink-0"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* CONTROLS & SHARE ACTIONS */}
      <div className="w-full max-w-md space-y-3.5 pt-2 shrink-0 pb-safe">
        {/* 1. CUSTOMIZATION TOGGLE CHIPS */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            CARD CUSTOMIZATION
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => toggleOption('showPR')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
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
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
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
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
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
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center space-x-1.5 ${
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

        {/* 2. DIRECT SOCIAL APPS SHARING GRID */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            DIRECT SHARE TO APPS
          </div>
          <div className="grid grid-cols-4 gap-2">
            {/* INSTAGRAM */}
            <button
              type="button"
              onClick={handleInstagramShare}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 text-white rounded-xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              title="Share to Instagram Stories"
            >
              <InstagramIcon className="w-5 h-5 mb-0.5 stroke-[2.5]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Stories</span>
            </button>

            {/* WHATSAPP */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-[#25D366] hover:bg-[#20ba59] text-black rounded-xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              title="Share to WhatsApp"
            >
              <MessageCircle className="w-5 h-5 mb-0.5 fill-black stroke-black" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">WhatsApp</span>
            </button>

            {/* X / TWITTER */}
            <button
              type="button"
              onClick={handleTwitterShare}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              title="Post to X / Twitter"
            >
              <TwitterXIcon className="w-5 h-5 mb-0.5 fill-white stroke-white" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">X / Tweet</span>
            </button>

            {/* TELEGRAM */}
            <button
              type="button"
              onClick={handleTelegramShare}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-[#229ED9] hover:bg-[#1e8ec3] text-white rounded-xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              title="Share to Telegram"
            >
              <Send className="w-5 h-5 mb-0.5 stroke-[2.5]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Telegram</span>
            </button>
          </div>
        </div>

        {/* 3. PRIMARY NATIVE SHARE & COPY BUTTONS */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isGenerating}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-black font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-glow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>GENERATING SHARE CARD...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-black stroke-[2.5]" />
                <span>OPEN SHARE MENU (ALL APPS)</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="py-2.5 bg-surface hover:bg-surface-hover border border-border text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-primary" />
              <span>Copy Image</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="py-2.5 bg-surface hover:bg-surface-hover border border-border text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          disabled={isGenerating}
          className="w-full py-2.5 bg-surface/60 hover:bg-surface border border-border rounded-xl text-xs font-mono font-bold text-neutral-400 hover:text-white transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
