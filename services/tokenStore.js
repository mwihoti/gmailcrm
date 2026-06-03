import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const TOKEN_PATH = process.env.TOKEN_STORE_PATH
  || path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), 'tokens.json');

export const getTokenStoreInfo = () => ({
  path: TOKEN_PATH,
  durable: !process.env.VERCEL && !TOKEN_PATH.startsWith(os.tmpdir()),
});

export const saveTokens = async (tokens) => {
  try {
    await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`Tokens saved to ${TOKEN_PATH}`);
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

export const loadTokens = async () => {
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
