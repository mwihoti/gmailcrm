import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampInteger,
  validateAvailabilityPayload,
  validateBookingPayload,
} from '../services/validation.js';

test('clamps integer values to configured bounds', () => {
  assert.equal(clampInteger('100', 10, 1, 25), 25);
  assert.equal(clampInteger('-1', 10, 1, 25), 1);
  assert.equal(clampInteger('abc', 10, 1, 25), 10);
});

test('validates availability payloads', () => {
  const result = validateAvailabilityPayload({
    date: '2026-06-02',
    startTime: '14:00',
    durationMinutes: '30',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    date: '2026-06-02',
    startTime: '14:00',
    durationMinutes: 30,
  });
});

test('rejects invalid availability payloads', () => {
  const result = validateAvailabilityPayload({
    date: '2026-02-31',
    startTime: '25:00',
    durationMinutes: '0',
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 3);
});

test('validates booking payloads and trims text', () => {
  const result = validateBookingPayload({
    customerName: ' Jane ',
    phone: ' +254700000000 ',
    email: 'jane@example.com',
    service: ' Consultation ',
    date: '2026-06-02',
    startTime: '09:30',
    durationMinutes: '60',
    notes: 'Follow up',
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.customerName, 'Jane');
  assert.equal(result.data.durationMinutes, 60);
});

test('requires lead id for agent lead bookings', () => {
  const result = validateBookingPayload({
    customerName: 'Jane',
    phone: '+254700000000',
    service: 'Consultation',
    date: '2026-06-02',
    startTime: '09:30',
    durationMinutes: 60,
  }, { requireEmailId: true });

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('emailId is required.'));
});
