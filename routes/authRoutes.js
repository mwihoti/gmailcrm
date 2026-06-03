import express from 'express';
import { getAuthUrl, getClient, getGoogleOAuthConfigStatus } from '../config/google.js';
import { getTokenStoreInfo, loadTokens, saveTokens } from '../services/tokenStore.js';
import { getOllamaConfig } from '../services/ollamaService.js';

const router = express.Router();

router.get('/google', (req, res) => {
  try {
    const url = getAuthUrl();
    res.redirect(url);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google OAuth Not Configured</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <header class="topbar">
          <div>
            <p class="eyebrow">Google Agent MVP</p>
            <h1>Google OAuth is not configured</h1>
          </div>
          <div class="topbar-actions">
            <a class="button primary" href="/">Open Dashboard</a>
          </div>
        </header>

        <main class="layout single-column">
          <section class="content">
            <div class="panel active">
              <div class="panel-header">
                <div>
                  <h2>Missing production environment variables</h2>
                  <p>Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Production environment variables, then redeploy.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </body>
      </html>
    `);
  }
});

router.get('/status', async (req, res) => {
  const tokens = await loadTokens();
  const ollama = getOllamaConfig();
  const googleOAuth = getGoogleOAuthConfigStatus();
  const tokenStore = getTokenStoreInfo();
  res.json({
    connected: Boolean(tokens?.access_token || tokens?.refresh_token),
    redirectUri: googleOAuth.redirectUri,
    googleOAuth,
    tokenStore: {
      durable: tokenStore.durable,
      browserBacked: tokenStore.browserBacked,
      location: tokenStore.browserBacked ? 'encrypted HTTP-only cookie' : 'temporary function storage',
    },
    llm: {
      provider: 'ollama',
      configured: ollama.configured,
      model: ollama.model,
    },
  });
});

router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const oauth2Client = getClient();

  try {
    if (!code) {
      return res.status(400).send('Authentication failed: missing OAuth code.');
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await saveTokens(tokens);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Successful</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <header class="topbar">
          <div>
            <p class="eyebrow">Google Agent MVP</p>
            <h1>Authentication Successful</h1>
          </div>
          <div class="topbar-actions">
            <span class="status-pill connected">Google connected</span>
            <a class="button primary" href="/">Open Dashboard</a>
          </div>
        </header>

        <main class="layout single-column">
          <section class="content">
            <div class="panel active">
              <div class="panel-header">
                <div>
                  <h2>Tokens saved</h2>
                  <p>Your OAuth tokens have been saved in an HTTP-only browser cookie for this app. You can now review Gmail leads and create Calendar bookings from the dashboard.</p>
                </div>
              </div>

              <div class="settings-grid">
                <a class="surface action-card" href="/">
                  <span class="cell-title">Dashboard</span>
                  <span class="cell-subtitle">Use the styled lead, inbox, calendar, and booking workflows.</span>
                </a>
                <a class="surface action-card" href="/gmail/latest?limit=150">
                  <span class="cell-title">Latest Gmail Messages</span>
                  <span class="cell-subtitle">Open the styled Gmail metadata view with the 150-message limit.</span>
                </a>
              </div>
            </div>
          </section>
        </main>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error retrieving access token', error);
    if (error.response?.data?.error === 'invalid_grant') {
      return res.status(400).send('Authentication failed: this Google authorization code is expired or was already used. Start again from Connect Google.');
    }

    res.status(500).send('Authentication failed');
  }
});

export default router;
