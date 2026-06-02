import express from 'express';
import { fetchLatestEmails } from '../services/gmailService.js';
import { classifyLeads } from '../services/leadClassifier.js';
import { checkAvailability, createBooking } from '../services/calendarService.js';
import { enrichLeadsWithOllama } from '../services/ollamaService.js';
import { validateBookingPayload } from '../services/validation.js';

const router = express.Router();

router.get('/booking-leads', async (req, res) => {
  try {
    const emails = await fetchLatestEmails();
    const leads = classifyLeads(emails);
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/smart-opportunities', async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit || '20', 10), 50);
    const emails = await fetchLatestEmails(null, limit);
    const leads = classifyLeads(emails);
    const enriched = await enrichLeadsWithOllama(leads, limit);
    res.json(enriched);
  } catch (error) {
    console.error('Error enriching opportunities:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-booking-from-lead', async (req, res) => {
  try {
    const validation = validateBookingPayload(req.body, { requireEmailId: true });
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const { emailId, date, startTime, durationMinutes } = validation.data;

    const availability = await checkAvailability(date, startTime, durationMinutes);
    
    if (!availability.available) {
      return res.status(409).json({
        message: 'Calendar conflict detected. Booking aborted.',
        conflicts: availability.conflicts
      });
    }

    const booking = await createBooking({
      ...validation.data,
      notes: `${validation.data.notes || ''}\n(Created from lead: ${emailId})`.trim()
    });

    res.json({
      message: 'Booking successfully created!',
      booking
    });
  } catch (error) {
    console.error('Error in agent workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
