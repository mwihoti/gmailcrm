import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

export const getGoogleOAuthConfigStatus = () => ({
  configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
  hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  redirectUri,
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

export const getAuthUrl = () => {
  const config = getGoogleOAuthConfigStatus();

  if (!config.configured) {
    const missing = [
      !config.hasClientId && 'GOOGLE_CLIENT_ID',
      !config.hasClientSecret && 'GOOGLE_CLIENT_SECRET',
    ].filter(Boolean).join(', ');

    throw new Error(`Google OAuth is not configured. Missing: ${missing}`);
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
};

export const getClient = () => oauth2Client;

export default oauth2Client;
