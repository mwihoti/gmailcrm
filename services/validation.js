const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const clampInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

export const normalizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

export const normalizePayload = (payload) => Object.fromEntries(
  Object.entries(payload || {}).map(([key, value]) => [key, normalizeText(value)])
);

export const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

export const isValidTime = (value) => TIME_PATTERN.test(value || '');

export const isValidDuration = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 480;
};

export const isValidEmail = (value) => !value || EMAIL_PATTERN.test(value);

export const validateAvailabilityPayload = (payload) => {
  const data = normalizePayload(payload);
  const errors = [];

  if (!isValidDate(data.date)) errors.push('date must use YYYY-MM-DD.');
  if (!isValidTime(data.startTime)) errors.push('startTime must use HH:MM in 24-hour time.');
  if (!isValidDuration(Number(data.durationMinutes))) errors.push('durationMinutes must be an integer from 1 to 480.');

  return {
    ok: errors.length === 0,
    errors,
    data: {
      date: data.date,
      startTime: data.startTime,
      durationMinutes: Number(data.durationMinutes),
    },
  };
};

export const validateBookingPayload = (payload, options = {}) => {
  const data = normalizePayload(payload);
  const errors = [];
  const required = ['customerName', 'phone', 'service', 'date', 'startTime', 'durationMinutes'];

  if (options.requireEmailId) required.unshift('emailId');

  required.forEach((field) => {
    if (!data[field]) errors.push(`${field} is required.`);
  });

  if (data.email && !isValidEmail(data.email)) errors.push('email must be a valid email address.');
  if (data.date && !isValidDate(data.date)) errors.push('date must use YYYY-MM-DD.');
  if (data.startTime && !isValidTime(data.startTime)) errors.push('startTime must use HH:MM in 24-hour time.');
  if (data.durationMinutes && !isValidDuration(Number(data.durationMinutes))) {
    errors.push('durationMinutes must be an integer from 1 to 480.');
  }

  return {
    ok: errors.length === 0,
    errors,
    data: {
      emailId: data.emailId,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || '',
      service: data.service,
      date: data.date,
      startTime: data.startTime,
      durationMinutes: Number(data.durationMinutes),
      notes: data.notes || '',
    },
  };
};
