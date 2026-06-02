import express from 'express';
import { listUpcomingEvents, checkAvailability, createBooking } from '../services/calendarService.js';
import { validateAvailabilityPayload, validateBookingPayload } from '../services/validation.js';

const router = express.Router();

router.get('/events', async (req, res) => {
  try {
    const events = await listUpcomingEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-availability', async (req, res) => {
  try {
    const validation = validateAvailabilityPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const { date, startTime, durationMinutes } = validation.data;
    const result = await checkAvailability(date, startTime, durationMinutes);
    res.json(result);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const validation = validateBookingPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const availability = await checkAvailability(
      validation.data.date,
      validation.data.startTime,
      validation.data.durationMinutes
    );

    if (!availability.available) {
      return res.status(409).json({
        message: 'Calendar conflict detected. Booking aborted.',
        conflicts: availability.conflicts,
      });
    }

    const result = await createBooking(validation.data);
    res.json(result);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
