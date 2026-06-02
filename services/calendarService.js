import { google } from 'googleapis';
import { getClient } from '../config/google.js';
import { loadTokens } from './tokenStore.js';

const CALENDAR_TIME_ZONE = process.env.CALENDAR_TIME_ZONE || 'Africa/Nairobi';

export const getCalendarService = async () => {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error('No tokens found. Please authenticate first.');
  }
  const oauth2Client = getClient();
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const listUpcomingEvents = async () => {
  const calendar = await getCalendarService();
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  return response.data.items.map(event => ({
    id: event.id,
    summary: event.summary,
    start: event.start,
    end: event.end,
    description: event.description,
    location: event.location,
  }));
};

export const buildTimeRange = (date, startTime, durationMinutes) => {
  const startDateTime = new Date(`${date}T${startTime}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  return { startDateTime, endDateTime };
};

export const checkAvailability = async (date, startTime, durationMinutes) => {
  const calendar = await getCalendarService();
  const { startDateTime, endDateTime } = buildTimeRange(date, startTime, durationMinutes);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDateTime.toISOString(),
    timeMax: endDateTime.toISOString(),
    singleEvents: true,
  });

  const conflicts = response.data.items || [];
  
  return {
    available: conflicts.length === 0,
    conflicts: conflicts.map(c => ({
      id: c.id,
      summary: c.summary,
      start: c.start,
      end: c.end,
    })),
  };
};

export const buildBookingEvent = (bookingData) => {
  const { customerName, phone, email, service, date, startTime, durationMinutes, notes } = bookingData;
  const { startDateTime, endDateTime } = buildTimeRange(date, startTime, durationMinutes);

  return {
    summary: `${service} - ${customerName}`,
    description: `Phone: ${phone}\nEmail: ${email || 'Not provided'}\nNotes: ${notes || ''}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: CALENDAR_TIME_ZONE,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: CALENDAR_TIME_ZONE,
    },
  };
};

export const createBooking = async (bookingData) => {
  const calendar = await getCalendarService();
  const event = buildBookingEvent(bookingData);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return response.data;
};
