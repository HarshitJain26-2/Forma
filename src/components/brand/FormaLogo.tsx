import React from 'react';

interface FormaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full' | 'compact' | 'badge';
  className?: string;
  withGlow?: boolean;
}

export const FormaLogo: React.FC<FormaLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  withGlow = true,
}) => {
  const sizeMap = {
    xs: {
      img: 'w-6 h-6',
      text: 'text-sm',
      badge: 'text-[8px] px-1 py-0.2',
      container: 'space-x-1.5',
    },
    sm: {
      img: 'w-8 h-8',
      text: 'text-base',
      badge: 'text-[9px] px-1.5 py-0.5',
      container: 'space-x-2',
    },
    md: {
      img: 'w-10 h-10',
      text: 'text-xl',
      badge: 'text-[10px] px-2 py-0.5',
      container: 'space-x-2.5',
    },
    lg: {
      img: 'w-14 h-14',
      text: 'text-2xl sm:text-3xl',
      badge: 'text-xs px-2.5 py-1',
      container: 'space-x-3',
    },
    xl: {
      img: 'w-20 h-20',
      text: 'text-4xl',
      badge: 'text-sm px-3 py-1',
      container: 'space-x-4',
    },
  };

  const currentSize = sizeMap[size];

  const logoImage = (
    <div
      className={`relative ${currentSize.img} rounded-2xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0 ${
        withGlow ? 'shadow-glow-sm hover:shadow-glow-md' : ''
      } transition-shadow`}
    >
      <img
        src="/assets/logo.png"
        alt="Forma Logo"
        className="w-full h-full object-contain p-1 transform group-hover:scale-105 transition-transform"
        onError={(e) => {
          // Fallback SVG if image not yet loaded
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
      {/* Background neon ambient highlight */}
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {logoImage}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 bg-surface/90 border border-primary/40 rounded-full shadow-glow-sm ${className}`}>
        <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-black">
          <img src="/assets/logo.png" alt="Forma" className="w-full h-full object-contain p-0.5" />
        </div>
        <span className="font-display font-black text-xs text-white tracking-wider uppercase">
          FORMA
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${currentSize.container} select-none ${className}`}>
      {logoImage}

      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5">
          <span className={`font-display font-black tracking-tight text-white uppercase ${currentSize.text}`}>
            FORMA
          </span>
          <span className="w-2 h-2 rounded-full bg-primary shadow-glow-sm" />
        </div>

        {variant === 'full' && (
          <span className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase -mt-0.5">
            STRENGTH INTELLIGENCE
          </span>
        )}
      </div>
    </div>
  );
};
