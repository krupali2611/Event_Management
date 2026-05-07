import { AppError } from './response';

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function toDateStart(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (!isValidDate(date)) {
    throw new AppError('Invalid date provided', 400);
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function toDateEnd(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (!isValidDate(date)) {
    throw new AppError('Invalid date provided', 400);
  }

  date.setHours(23, 59, 59, 999);
  return date;
}

export function validateBookingDateRange(startDateInput: string | Date, endDateInput: string | Date): { startDate: Date; endDate: Date } {
  const startDate = toDateStart(startDateInput);
  const endDate = toDateEnd(endDateInput);

  if (startDate.getTime() > endDate.getTime()) {
    throw new AppError('startDate must be less than or equal to endDate', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate.getTime() < today.getTime()) {
    throw new AppError('Cannot create bookings in the past', 400);
  }

  return { startDate, endDate };
}

export function datesOverlap(existingStartDate: Date, existingEndDate: Date, newStartDate: Date, newEndDate: Date): boolean {
  return existingStartDate.getTime() <= newEndDate.getTime() && existingEndDate.getTime() >= newStartDate.getTime();
}

export function resolveDateTimeBoundary(date: Date, time: string | null | undefined, endOfDay: boolean): Date {
  const boundary = new Date(date);

  if (!time) {
    boundary.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return boundary;
  }

  const [hoursPart, minutesPart] = time.split(':');
  const hours = Number.parseInt(hoursPart ?? '0', 10);
  const minutes = Number.parseInt(minutesPart ?? '0', 10);
  boundary.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return boundary;
}

export function dateTimeRangesOverlap(startAtA: Date, endAtA: Date, startAtB: Date, endAtB: Date): boolean {
  return startAtA.getTime() <= endAtB.getTime() && endAtA.getTime() >= startAtB.getTime();
}
