import { UnitType } from '../types/workout';

export const KG_TO_LB = 2.20462262;

export function kgToLb(kg: number): number {
  if (isNaN(kg) || kg <= 0) return 0;
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

export function lbToKg(lb: number): number {
  if (isNaN(lb) || lb <= 0) return 0;
  return Math.round((lb / KG_TO_LB) * 10) / 10;
}

export function displayWeightValue(kg: number, unit: UnitType): number {
  if (isNaN(kg) || kg <= 0) return 0;
  return unit === 'lb' ? kgToLb(kg) : Math.round(kg * 10) / 10;
}

export function parseInputWeight(value: number, unit: UnitType): number {
  if (isNaN(value) || value <= 0) return 0;
  return unit === 'lb' ? lbToKg(value) : value;
}

export function formatWeight(kg: number, unit: UnitType, includeUnit = true): string {
  if (isNaN(kg) || kg <= 0) return includeUnit ? `0 ${unit.toUpperCase()}` : '0';
  const val = unit === 'lb' ? kgToLb(kg) : Math.round(kg * 10) / 10;
  const formatted = val.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return includeUnit ? `${formatted} ${unit.toUpperCase()}` : formatted;
}

export function formatVolume(kg: number, unit: UnitType, includeUnit = true): string {
  if (isNaN(kg) || kg <= 0) return includeUnit ? `0 ${unit.toUpperCase()}` : '0';
  const val = unit === 'lb' ? kgToLb(kg) : Math.round(kg);
  const formatted = Math.round(val).toLocaleString('en-US');
  return includeUnit ? `${formatted} ${unit.toUpperCase()}` : formatted;
}

export function formatDistanceOrTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
