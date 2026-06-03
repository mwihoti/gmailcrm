import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import gmailRoutes from './routes/gmailRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import { tokenRequestContext } from './services/tokenStore.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(tokenRequestContext);
app.use(express.static(publicDir, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  },
}));

app.use('/auth', authRoutes);
app.use('/gmail', gmailRoutes);
app.use('/calendar', calendarRoutes);
app.use('/agent', agentRoutes);
app.use('/crm', crmRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(publicDir, 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(publicDir, 'terms.html'));
});

app.get('/delete-data', (req, res) => {
  res.sendFile(path.join(publicDir, 'delete-data.html'));
});

app.get('/oauth2callback', (req, res) => {
  res.redirect('/auth/oauth2callback?' + new URLSearchParams(req.query).toString());
});

export default app;
