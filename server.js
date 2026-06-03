import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`OAuth Redirect URI: ${process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/oauth2callback`}`);
});
