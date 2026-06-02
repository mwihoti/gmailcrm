import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBookingEvent, buildTimeRange } from '../services/calendarService.js';

test('builds a calendar time range from date, time, and duration', () => {
  const { startDateTime, endDateTime } = buildTimeRange('2026-06-02', '14:00', 30);

  assert.equal(endDateTime.getTime() - startDateTime.getTime(), 30 * 60 * 1000);
});

test('builds booking event metadata', () => {
  const event = buildBookingEvent({
    customerName: 'Jane Smith',
    phone: '+254700000000',
    email: 'jane@example.com',
    service: 'Consultation',
    date: '2026-06-02',
    startTime: '14:00',
    durationMinutes: 30,
    notes: 'Asked for afternoon slot.',
  });

  assert.equal(event.summary, 'Consultation - Jane Smith');
  assert.equal(event.start.timeZone, 'Africa/Nairobi');
  assert.match(event.description, /Phone: \+254700000000/);
});
