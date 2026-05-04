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
