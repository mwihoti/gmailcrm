import express from 'express';
import { fetchLatestEmails } from '../services/gmailService.js';

const router = express.Router();

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const renderEmailsPage = (emails, { customQuery, limit }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Latest Gmail Messages</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <header class="topbar">
      <div>
        <p class="eyebrow">Gmail Metadata</p>
        <h1>Latest Messages</h1>
      </div>
      <div class="topbar-actions">
        <a class="button" href="/">Dashboard</a>
        <a class="button primary" href="/gmail/latest?limit=150">Load 150</a>
      </div>
    </header>

    <main class="layout single-column">
      <section class="content">
        <div class="panel active">
          <div class="panel-header">
            <div>
              <h2>${emails.length} messages</h2>
              <p>Query: ${escapeHtml(customQuery || 'inbox unread default')} · Limit: ${escapeHtml(limit || '150')}</p>
            </div>
          </div>
          <div class="surface">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  ${emails.length ? emails.map((email) => `
                    <tr>
                      <td>${escapeHtml(email.from || 'Unknown')}</td>
                      <td><span class="cell-title">${escapeHtml(email.subject || 'No subject')}</span></td>
                      <td>${escapeHtml(email.date || 'Unknown')}</td>
                      <td class="snippet">${escapeHtml(email.snippet || '')}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="4" class="empty">No messages found.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  </body>
  </html>
`;

/**
 * GET /gmail/latest
 * Fetches latest unread emails (restricted query).
 * Optional query param ?q=custom_query
 */
router.get('/latest', async (req, res) => {
  try {
    const customQuery = req.query.q;
    const limit = req.query.limit;

    if (customQuery && customQuery.length > 120) {
      return res.status(400).json({ error: 'Search query is too long.' });
    }

    const emails = await fetchLatestEmails(customQuery, limit);
    if (req.accepts(['json', 'html']) === 'html') {
      return res.send(renderEmailsPage(emails, { customQuery, limit }));
    }

    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
