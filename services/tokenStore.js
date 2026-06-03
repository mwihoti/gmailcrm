import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

const TOKEN_COOKIE_NAME = 'gmail_crm_tokens';
const TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const requestStore = new AsyncLocalStorage();

const TOKEN_PATH = process.env.TOKEN_STORE_PATH
  || path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), 'tokens.json');

const getCookieSecret = () => (
  process.env.TOKEN_COOKIE_SECRET
  || process.env.GOOGLE_CLIENT_SECRET
  || process.env.GOOGLE_CLIENT_ID
  || 'local-dev-token-cookie-secret'
);

const getCookieKey = () => crypto
  .createHash('sha256')
  .update(getCookieSecret())
  .digest();

const encodeBase64Url = (value) => Buffer.from(value).toString('base64url');
const decodeBase64Url = (value) => Buffer.from(value, 'base64url');

const encryptTokens = (tokens) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getCookieKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(tokens), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `v1.${encodeBase64Url(iv)}.${encodeBase64Url(tag)}.${encodeBase64Url(encrypted)}`;
};

const decryptTokens = (value) => {
  try {
    const [version, iv, tag, encrypted] = String(value || '').split('.');
    if (version !== 'v1' || !iv || !tag || !encrypted) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', getCookieKey(), decodeBase64Url(iv));
    decipher.setAuthTag(decodeBase64Url(tag));
    const decrypted = Buffer.concat([
      decipher.update(decodeBase64Url(encrypted)),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
};

const parseCookies = (cookieHeader = '') => Object.fromEntries(
  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const index = cookie.indexOf('=');
      if (index === -1) return [cookie, ''];
      return [
        decodeURIComponent(cookie.slice(0, index)),
        decodeURIComponent(cookie.slice(index + 1)),
      ];
    })
);

const getCookieOptions = () => [
  'Path=/',
  'HttpOnly',
  'SameSite=Lax',
  `Max-Age=${TOKEN_COOKIE_MAX_AGE_SECONDS}`,
  ...(process.env.VERCEL || process.env.NODE_ENV === 'production' ? ['Secure'] : []),
].join('; ');

export const tokenRequestContext = (req, res, next) => {
  requestStore.run({ req, res }, next);
};

export const getTokenStoreInfo = () => ({
  path: TOKEN_PATH,
  durable: !process.env.VERCEL && !TOKEN_PATH.startsWith(os.tmpdir()),
  browserBacked: Boolean(requestStore.getStore()?.req?.headers?.cookie),
});

export const saveTokens = async (tokens) => {
  try {
    const context = requestStore.getStore();
    if (context?.res) {
      context.res.setHeader(
        'Set-Cookie',
        `${TOKEN_COOKIE_NAME}=${encodeURIComponent(encryptTokens(tokens))}; ${getCookieOptions()}`
      );
    }

    await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`Tokens saved to ${TOKEN_PATH}`);
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

export const loadTokens = async () => {
  const context = requestStore.getStore();
  const cookies = parseCookies(context?.req?.headers?.cookie);
  const cookieTokens = decryptTokens(cookies[TOKEN_COOKIE_NAME]);

  if (cookieTokens) {
    return cookieTokens;
  }

  try {
    const data = await fs.readFile(TOKEN_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    console.error('Error loading tokens:', error);
    throw error;
  }
};
