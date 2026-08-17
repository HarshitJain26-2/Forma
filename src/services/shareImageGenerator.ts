import { WorkoutShareData } from '../types/sharing';
import { ShareCardCustomization } from '../components/sharing/WorkoutShareCard';
import { formatDistanceOrTime, formatVolume } from '../utils/units';

/**
 * High-Resolution 1080 x 1920 (9:16) Workout Share Card Canvas Generator.
 * Generates clean, pixel-perfect PNG images offline locally without external network dependencies.
 */
export async function generateWorkoutShareImage(
  shareData: WorkoutShareData,
  customization: ShareCardCustomization,
  userName: string = 'ATHLETE'
): Promise<{ blob: Blob; dataUrl: string; file: File }> {
  const WIDTH = 1080;
  const HEIGHT = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. BACKGROUND: Deep Dark Gradient + Ambient Neon Glows
  const bgGradient = ctx.createRadialGradient(
    WIDTH / 2, 200, 50,
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.8
  );
  bgGradient.addColorStop(0, '#131b05');
  bgGradient.addColorStop(0.5, '#080808');
  bgGradient.addColorStop(1, '#000000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle Geometric Grid
  ctx.strokeStyle = 'rgba(204, 255, 0, 0.03)';
  ctx.lineWidth = 2;
  const gridSize = 48;
  for (let x = 0; x < WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Outer Border
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);

  const PADDING_X = 90;
  let currentY = 130;

  // 2. HEADER: Brand Logo & Streak
  // Brand Badge
  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  roundRect(ctx, PADDING_X, currentY, 260, 76, 20, true, true);

  // Neon dot
  ctx.fillStyle = '#CCFF00';
  ctx.beginPath();
  ctx.arc(PADDING_X + 38, currentY + 38, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px "Outfit", "Inter", sans-serif';
  ctx.fillText('FORMA', PADDING_X + 65, currentY + 50);

  // Streak Badge (if enabled & available)
  if (customization.showStreak && shareData.streak && shareData.streak > 0) {
    const streakText = `🔥 ${shareData.streak} DAY STREAK`;
    ctx.fillStyle = 'rgba(204, 255, 0, 0.12)';
    ctx.strokeStyle = 'rgba(204, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    roundRect(ctx, WIDTH - PADDING_X - 320, currentY, 320, 76, 38, true, true);

    ctx.fillStyle = '#CCFF00';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(streakText, WIDTH - PADDING_X - 160, currentY + 48);
    ctx.textAlign = 'left';
  }

  currentY += 150;

  // 3. WORKOUT TITLE & DATE
  const dateFormatted = shareData.completedAt
    ? new Date(shareData.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  ctx.fillStyle = '#CCFF00';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText(`${shareData.weekday} • ${dateFormatted.toUpperCase()}`, PADDING_X, currentY);

  currentY += 60;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 68px "Outfit", "Inter", sans-serif';
  const titleText = shareData.workoutTitle.toUpperCase();
  ctx.fillText(titleText, PADDING_X, currentY, WIDTH - PADDING_X * 2);

  currentY += 90;

  // Divider Line
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, currentY);
  ctx.lineTo(WIDTH - PADDING_X, currentY);
  ctx.stroke();

  currentY += 60;

  // 4. STATS MATRIX (2x2 Grid)
  const cardWidth = (WIDTH - PADDING_X * 2 - 30) / 2;
  const cardHeight = 190;

  const stats = [
    {
      label: 'WORKOUT TIME',
      value: formatDistanceOrTime(shareData.durationSeconds),
      color: '#FFFFFF',
    },
    {
      label: 'TOTAL VOLUME',
      value: customization.showVolume ? formatVolume(shareData.totalVolumeKg, shareData.units) : 'COMPLETED',
      color: '#CCFF00',
    },
    {
      label: 'COMPLETED SETS',
      value: `${shareData.completedSets} SETS`,
      color: '#FFFFFF',
    },
    {
      label: 'EXERCISES',
      value: `${shareData.exerciseCount} MOVEMENTS`,
      color: '#FFFFFF',
    },
  ];

  stats.forEach((st, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = PADDING_X + col * (cardWidth + 30);
    const y = currentY + row * (cardHeight + 30);

    ctx.fillStyle = '#0c0c0c';
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, cardWidth, cardHeight, 28, true, true);

    // Label
    ctx.fillStyle = '#8A8A8A';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(st.label, x + 35, y + 60);

    // Value
    ctx.fillStyle = st.color;
    ctx.font = '900 48px "Outfit", "Inter", sans-serif';
    ctx.fillText(st.value, x + 35, y + 135, cardWidth - 70);
  });

  currentY += cardHeight * 2 + 80;

  // 5. PR HIGHLIGHTS (if any & enabled)
  const hasPRs = customization.showPR && shareData.personalRecords && shareData.personalRecords.length > 0;
  if (hasPRs) {
    const prCount = shareData.personalRecords.length;
    const prBoxHeight = prCount === 1 ? 210 : 280;

    ctx.fillStyle = 'rgba(204, 255, 0, 0.08)';
    ctx.strokeStyle = 'rgba(204, 255, 0, 0.45)';
    ctx.lineWidth = 3;
    roundRect(ctx, PADDING_X, currentY, WIDTH - PADDING_X * 2, prBoxHeight, 30, true, true);

    // PR Header
    ctx.fillStyle = '#CCFF00';
    ctx.font = '900 28px "JetBrains Mono", monospace';
    ctx.fillText(`🔥 ${prCount} NEW PERSONAL RECORD${prCount > 1 ? 'S' : ''}`, PADDING_X + 40, currentY + 60);

    // List top 2 PRs
    shareData.personalRecords.slice(0, 2).forEach((pr, i) => {
      const prY = currentY + 120 + i * 65;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px "Outfit", sans-serif';
      ctx.fillText(pr.exerciseName, PADDING_X + 40, prY, 520);

      ctx.fillStyle = '#CCFF00';
      ctx.font = '900 32px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(pr.details, WIDTH - PADDING_X - 40, prY);
      ctx.textAlign = 'left';
    });

    currentY += prBoxHeight + 50;
  }

  // 6. TOP LIFTS (if enabled & available)
  const hasTopLifts = customization.showTopLifts && shareData.topExercises && shareData.topExercises.length > 0;
  if (hasTopLifts) {
    const topLiftsList = shareData.topExercises.slice(0, 3);
    const topLiftsHeight = 80 + topLiftsList.length * 68;

    ctx.fillStyle = '#0c0c0c';
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 3;
    roundRect(ctx, PADDING_X, currentY, WIDTH - PADDING_X * 2, topLiftsHeight, 30, true, true);

    ctx.fillStyle = '#8A8A8A';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('TOP LIFTS OF THE DAY', PADDING_X + 40, currentY + 52);

    topLiftsList.forEach((top, i) => {
      const liftY = currentY + 110 + i * 68;
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText(`${i + 1}.`, PADDING_X + 40, liftY);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px "Outfit", sans-serif';
      ctx.fillText(top.name, PADDING_X + 85, liftY, 480);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 30px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(top.bestSetSummary, WIDTH - PADDING_X - 40, liftY);
      ctx.textAlign = 'left';
    });

    currentY += topLiftsHeight + 40;
  }

  // 7. FOOTER: Branding & Tagline
  const footerY = HEIGHT - 130;
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, footerY - 40);
  ctx.lineTo(WIDTH - PADDING_X, footerY - 40);
  ctx.stroke();

  ctx.fillStyle = '#CCFF00';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText('TRACK • LIFT • EVOLVE', PADDING_X, footerY + 10);

  ctx.fillStyle = '#8A8A8A';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText('FORMA PROGRESSIVE INTELLIGENCE', PADDING_X, footerY + 45);

  ctx.fillStyle = '#333333';
  roundRect(ctx, WIDTH - PADDING_X - 220, footerY - 10, 220, 56, 16, true, false);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(userName.toUpperCase(), WIDTH - PADDING_X - 110, footerY + 26);
  ctx.textAlign = 'left';

  // 8. EXPORT AS BLOB & DATAURL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate canvas image blob'));
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `forma-workout-${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      resolve({ blob, dataUrl, file });
    }, 'image/png', 1.0);
  });
}

/**
 * Helper to draw rounded rectangle on Canvas 2D
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = false,
  stroke = true
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
