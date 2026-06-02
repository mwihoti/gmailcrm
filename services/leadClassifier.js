const OPPORTUNITY_SIGNALS = [
  { keyword: 'booking', weight: 3, category: 'booking', service: 'booking' },
  { keyword: 'reservation', weight: 3, category: 'booking', service: 'reservation' },
  { keyword: 'appointment', weight: 3, category: 'booking', service: 'appointment' },
  { keyword: 'consultation', weight: 2, category: 'booking', service: 'consultation' },
  { keyword: 'quote', weight: 2, category: 'booking', service: 'quote request' },
  { keyword: 'safari', weight: 2, category: 'booking', service: 'safari consultation' },
  { keyword: 'cleaning', weight: 2, category: 'booking', service: 'cleaning service' },
  { keyword: 'service', weight: 1, category: 'booking', service: 'service request' },
  { keyword: 'meetup', weight: 1, category: 'booking', service: 'meetup' },
  { keyword: 'registration', weight: 2, category: 'booking', service: 'registration' },
  { keyword: 'event', weight: 1, category: 'booking', service: 'event' },
  { keyword: 'workshop', weight: 2, category: 'booking', service: 'workshop' },
  { keyword: 'job opportunity', weight: 4, category: 'job_opportunity', service: 'job opportunity' },
  { keyword: 'hiring', weight: 4, category: 'job_opportunity', service: 'job opportunity' },
  { keyword: 'we are hiring', weight: 4, category: 'job_opportunity', service: 'job opportunity' },
  { keyword: 'developer role', weight: 4, category: 'job_opportunity', service: 'developer role' },
  { keyword: 'software engineer', weight: 4, category: 'job_opportunity', service: 'software engineering role' },
  { keyword: 'engineer role', weight: 4, category: 'job_opportunity', service: 'engineering role' },
  { keyword: 'frontend', weight: 3, category: 'job_opportunity', service: 'frontend role' },
  { keyword: 'backend', weight: 3, category: 'job_opportunity', service: 'backend role' },
  { keyword: 'full-stack', weight: 3, category: 'job_opportunity', service: 'full-stack role' },
  { keyword: 'full stack', weight: 3, category: 'job_opportunity', service: 'full-stack role' },
  { keyword: 'remote role', weight: 3, category: 'job_opportunity', service: 'remote role' },
  { keyword: 'vacancy', weight: 3, category: 'job_opportunity', service: 'job vacancy' },
  { keyword: 'recruiter', weight: 3, category: 'job_opportunity', service: 'recruiter opportunity' },
  { keyword: 'interview', weight: 2, category: 'job_opportunity', service: 'interview' },
  { keyword: 'career', weight: 2, category: 'job_opportunity', service: 'career opportunity' },
  { keyword: 'tech opportunity', weight: 4, category: 'tech_opportunity', service: 'tech opportunity' },
  { keyword: 'startup', weight: 3, category: 'tech_opportunity', service: 'startup opportunity' },
  { keyword: 'hackathon', weight: 3, category: 'tech_opportunity', service: 'hackathon' },
  { keyword: 'developer community', weight: 3, category: 'tech_opportunity', service: 'developer community' },
  { keyword: 'api', weight: 2, category: 'tech_opportunity', service: 'API opportunity' },
  { keyword: 'ai', weight: 2, category: 'tech_opportunity', service: 'AI opportunity' },
  { keyword: 'software', weight: 2, category: 'tech_opportunity', service: 'software opportunity' },
  { keyword: 'cloud', weight: 2, category: 'tech_opportunity', service: 'cloud opportunity' },
  { keyword: 'open source', weight: 2, category: 'tech_opportunity', service: 'open source opportunity' },
  { keyword: 'engineering', weight: 2, category: 'tech_opportunity', service: 'engineering opportunity' },
  { keyword: 'due', weight: 3, category: 'due_work', service: 'due work' },
  { keyword: 'due date', weight: 4, category: 'due_work', service: 'due date' },
  { keyword: 'deadline', weight: 4, category: 'due_work', service: 'deadline' },
  { keyword: 'submit by', weight: 4, category: 'due_work', service: 'submission deadline' },
  { keyword: 'apply by', weight: 4, category: 'due_work', service: 'application deadline' },
  { keyword: 'expires', weight: 3, category: 'due_work', service: 'expiry' },
  { keyword: 'expiring', weight: 3, category: 'due_work', service: 'expiry' },
  { keyword: 'closes', weight: 3, category: 'due_work', service: 'closing date' },
  { keyword: 'assignment', weight: 3, category: 'due_work', service: 'assignment' },
  { keyword: 'task', weight: 2, category: 'due_work', service: 'task' },
  { keyword: 'upcoming', weight: 3, category: 'upcoming_item', service: 'upcoming item' },
  { keyword: 'webinar', weight: 3, category: 'upcoming_item', service: 'webinar' },
  { keyword: 'meeting', weight: 3, category: 'upcoming_item', service: 'meeting' },
  { keyword: 'starts', weight: 2, category: 'upcoming_item', service: 'start date' },
  { keyword: 'scheduled', weight: 2, category: 'upcoming_item', service: 'scheduled item' },
  { keyword: 'reminder', weight: 2, category: 'upcoming_item', service: 'reminder' },
  { keyword: 'launch', weight: 2, category: 'upcoming_item', service: 'launch' },
  { keyword: 'demo', weight: 2, category: 'upcoming_item', service: 'demo' },
];

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;
const ISO_DATE_PATTERN = /\b\d{4}-\d{2}-\d{2}\b/;
const SLASH_DATE_PATTERN = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/;
const MONTH_DATE_PATTERN = /\b(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?|(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(\d{4}))?)\b/i;
const RELATIVE_DATE_PATTERN = /\b(today|tomorrow)\b/i;
const TIME_PATTERN = /\b(?:(?:[01]?\d|2[0-3]):[0-5]\d\s?(?:am|pm)?|(?:[1-9]|1[0-2])\s?(?:am|pm))\b/i;
const DUE_CONTEXT_PATTERN = /\b(due|due date|deadline|submit by|apply by|expires|expiring|closes|closing|assignment|task)\b/i;
const UPCOMING_CONTEXT_PATTERN = /\b(upcoming|webinar|meeting|interview|event|workshop|starts|scheduled|reminder|launch|demo)\b/i;

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const normalizeTime = (value) => {
  if (!value) return '';
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s?(am|pm)?$/i);
  if (!match) return '';

  let hour = Number(match[1]);
  const minute = match[2] || '00';
  const period = match[3]?.toLowerCase();

  if (period === 'pm' && hour < 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  if (hour > 23) return '';

  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const includesSignal = (text, keyword) => {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(keyword)}([^a-z0-9]|$)`, 'i');
  return pattern.test(text);
};

const extractSenderName = (from = '') => {
  const withoutEmail = from.replace(/<[^>]+>/g, '').replace(/["']/g, '').trim();
  return withoutEmail || '';
};

const extractPhone = (text) => {
  const candidates = text.match(new RegExp(PHONE_PATTERN, 'g')) || [];
  const candidate = candidates.find((value) => {
    const digits = value.replace(/\D/g, '');
    const hasPlus = value.trim().startsWith('+');
    return hasPlus ? digits.length >= 9 : digits.length >= 10;
  });

  return candidate?.replace(/\s+/g, ' ').trim() || '';
};

const toIsoDate = (year, monthIndex, day) => {
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) {
    return '';
  }
  return date.toISOString().slice(0, 10);
};

const baseDateFromEmail = (emailDate) => {
  const parsed = new Date(emailDate || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const normalizeSlashDate = (match) => {
  let first = Number(match[1]);
  let second = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  const day = first > 12 ? first : second;
  const month = first > 12 ? second : first;
  return toIsoDate(year, month - 1, day);
};

const normalizeMonthDate = (match, baseDate) => {
  const monthName = (match[1] || match[5] || '').toLowerCase();
  const day = Number(match[2] || match[4]);
  let year = Number(match[3] || match[6] || baseDate.getUTCFullYear());
  const monthIndex = MONTHS[monthName];
  if (!Number.isInteger(monthIndex)) return '';

  let isoDate = toIsoDate(year, monthIndex, day);
  if (!match[3] && !match[6] && isoDate && isoDate < baseDate.toISOString().slice(0, 10)) {
    year += 1;
    isoDate = toIsoDate(year, monthIndex, day);
  }
  return isoDate;
};

const normalizeRelativeDate = (value, baseDate) => {
  const date = new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate()
  ));

  if (value.toLowerCase() === 'tomorrow') {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date.toISOString().slice(0, 10);
};

const extractTiming = (text, emailDate) => {
  const baseDate = baseDateFromEmail(emailDate);
  const isoMatch = text.match(ISO_DATE_PATTERN);
  const slashMatch = text.match(SLASH_DATE_PATTERN);
  const monthMatch = text.match(MONTH_DATE_PATTERN);
  const relativeMatch = text.match(RELATIVE_DATE_PATTERN);
  const timeMatch = text.match(TIME_PATTERN);
  const lowerText = text.toLowerCase();

  let detectedDate = '';
  let rawDate = '';

  if (isoMatch) {
    detectedDate = isoMatch[0];
    rawDate = isoMatch[0];
  } else if (slashMatch) {
    detectedDate = normalizeSlashDate(slashMatch);
    rawDate = slashMatch[0];
  } else if (monthMatch) {
    detectedDate = normalizeMonthDate(monthMatch, baseDate);
    rawDate = monthMatch[0];
  } else if (relativeMatch) {
    detectedDate = normalizeRelativeDate(relativeMatch[0], baseDate);
    rawDate = relativeMatch[0];
  }

  let context = '';
  if (DUE_CONTEXT_PATTERN.test(lowerText)) context = 'due';
  if (!context && UPCOMING_CONTEXT_PATTERN.test(lowerText)) context = 'upcoming';
  if (!context && detectedDate) context = 'mentioned';

  return {
    detectedDate,
    detectedTime: normalizeTime(timeMatch?.[0]),
    rawDate,
    context,
    dueDate: context === 'due' ? detectedDate : '',
    dueTime: context === 'due' ? normalizeTime(timeMatch?.[0]) : '',
    upcomingDate: context === 'upcoming' ? detectedDate : '',
    upcomingTime: context === 'upcoming' ? normalizeTime(timeMatch?.[0]) : '',
  };
};

export const extractLeadDetails = (email) => {
  const text = `${email.from || ''} ${email.subject || ''} ${email.snippet || ''}`;
  const emailMatch = text.match(EMAIL_PATTERN);
  const phone = extractPhone(text);
  const timing = extractTiming(text, email.date);
  const lowerText = text.toLowerCase();
  const serviceSignal = OPPORTUNITY_SIGNALS.find(({ keyword }) => includesSignal(lowerText, keyword));

  return {
    customerName: extractSenderName(email.from),
    email: emailMatch?.[0] || '',
    phone,
    requestedDate: timing.detectedDate || '',
    requestedTime: timing.detectedTime || '',
    ...timing,
    durationMinutes: 30,
    service: serviceSignal?.service || '',
  };
};

export const classifyLead = (email) => {
  const textToSearch = `${email.subject || ''} ${email.snippet || ''}`.toLowerCase();
  const matchedSignals = OPPORTUNITY_SIGNALS.filter(({ keyword }) => includesSignal(textToSearch, keyword));

  if (!matchedSignals.length) return null;

  const extracted = extractLeadDetails(email);
  const extractionBoost = [
    extracted.email,
    extracted.phone,
    extracted.requestedDate,
    extracted.requestedTime,
  ].filter(Boolean).length;
  const rawScore = matchedSignals.reduce((sum, signal) => sum + signal.weight, 0) + extractionBoost;
  const score = Math.min(rawScore, 10);
  const categoryScores = matchedSignals.reduce((scores, signal) => {
    scores[signal.category] = (scores[signal.category] || 0) + signal.weight;
    return scores;
  }, {});
  const category = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'booking';

  return {
    emailId: email.id,
    threadId: email.threadId,
    from: email.from,
    subject: email.subject,
    snippet: email.snippet,
    date: email.date,
    score,
    category,
    status: 'needs_review',
    matchedKeywords: matchedSignals.map(({ keyword }) => keyword),
    reasonMatched: `Matched ${matchedSignals.map(({ keyword }) => keyword).join(', ')}`,
    extracted,
  };
};

export const classifyLeads = (emails) => emails
  .map(classifyLead)
  .filter(Boolean)
  .sort((a, b) => b.score - a.score);
