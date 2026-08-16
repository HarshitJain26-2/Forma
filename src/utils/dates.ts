import { Weekday } from '../types/workout';

export const WEEKDAYS_ORDER: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/**
 * Returns the current calendar weekday based on user's local timezone.
 */
export function getCurrentWeekday(): Weekday {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const mapping: { [key: number]: Weekday } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return mapping[day] || 'monday';
}

export function getWeekdayFromDayNumber(dayNumber?: number): Weekday {
  const mapping: { [key: number]: Weekday } = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
  };
  return (dayNumber && mapping[dayNumber]) || 'monday';
}

export function getDayNumberFromWeekday(weekday: Weekday): number {
  const mapping: { [key in Weekday]: number } = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };
  return mapping[weekday] || 1;
}

export function getWeekdayDisplayName(weekday: Weekday): string {
  const mapping: { [key in Weekday]: string } = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  return mapping[weekday] || 'Monday';
}

export function getWeekdayShortName(weekday: Weekday): string {
  const mapping: { [key in Weekday]: string } = {
    monday: 'MON',
    tuesday: 'TUE',
    wednesday: 'WED',
    thursday: 'THU',
    friday: 'FRI',
    saturday: 'SAT',
    sunday: 'SUN',
  };
  return mapping[weekday] || 'MON';
}
