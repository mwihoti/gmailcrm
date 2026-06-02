import fs from 'fs/promises';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');

export const saveTokens = async (tokens) => {
  try {
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('Tokens saved to tokens.json');
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
