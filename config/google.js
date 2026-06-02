import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

export const getAuthUrl = () => {
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
