import { google } from 'googleapis';
import { getClient } from '../config/google.js';
import { loadTokens } from './tokenStore.js';
import { clampInteger } from './validation.js';

const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_MAX_RESULTS = 150;
const ABSOLUTE_MAX_RESULTS = 150;

export const getGmailConfig = () => ({
  lookbackDays: clampInteger(process.env.GMAIL_LOOKBACK_DAYS, DEFAULT_LOOKBACK_DAYS, 1, 90),
  maxResults: clampInteger(process.env.GMAIL_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, ABSOLUTE_MAX_RESULTS),
});

export const getGmailService = async () => {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error('No tokens found. Please authenticate first.');
  }
  const oauth2Client = getClient();
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Safety-first Gmail fetching. 
 * Defaults to unread messages from the last configured lookback window.
 * Results are capped and only minimal metadata is fetched.
 */
export const fetchLatestEmails = async (customQuery = null, requestedLimit = null) => {
  const gmail = await getGmailService();
  const config = getGmailConfig();
  const maxResults = clampInteger(requestedLimit, config.maxResults, 1, config.maxResults);
  
  const baseQuery = `in:inbox newer_than:${config.lookbackDays}d`;
  const query = customQuery
    ? `${baseQuery} ${customQuery}`
    : `${baseQuery} is:unread`;
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  });

  const messages = response.data.messages || [];
  
  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      
      const headers = detail.data.payload.headers;
      return {
        id: msg.id,
        threadId: msg.threadId,
        from: headers.find(h => h.name === 'From')?.value,
        subject: headers.find(h => h.name === 'Subject')?.value,
        date: headers.find(h => h.name === 'Date')?.value,
        snippet: detail.data.snippet,
      };
    })
  );

  return detailedMessages;
};
