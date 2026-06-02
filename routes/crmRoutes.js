import express from 'express';
import { fetchLatestEmails } from '../services/gmailService.js';
import { buildCrmSummary, buildOrganizationsFromMessages } from '../services/crmService.js';
import { clampInteger } from '../services/validation.js';

const router = express.Router();

router.get('/organizations', async (req, res) => {
  try {
    const limit = clampInteger(req.query.limit, 150, 1, 150);
    const query = req.query.q || null;
    const messages = await fetchLatestEmails(query, limit);
    const organizations = buildOrganizationsFromMessages(messages);

    res.json({
      summary: buildCrmSummary(organizations),
      organizations,
    });
  } catch (error) {
    console.error('Error building CRM organizations:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
