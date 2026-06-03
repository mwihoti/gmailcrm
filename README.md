# Google Agent MVP Backend

A Node.js + Express app for connecting a Google account with OAuth, reviewing recent Gmail messages as bookings, job opportunities, tech opportunities, due work, and upcoming items, checking Google Calendar availability, and creating calendar bookings.

## What It Provides

- A static dashboard at `http://localhost:3000`.
- Google OAuth connection flow.
- Gmail metadata search with read-only Gmail access.
- Keyword and heuristic classification for LinkedIn leads, bookings, job opportunities, tech opportunities, due work, and upcoming items.
- Calendar availability checks.
- Conflict-safe booking creation.
- Optional Ollama Cloud enrichment for summaries, priorities, suggested actions, and better extraction.
- CRM grouping for organizations, contacts, latest activity, opportunity categories, and next-action analysis.
- A composite lead-to-booking agent workflow.
- Focused unit tests for lead classification, validation, and calendar event building.

## Safety First Principles

- **Restricted Gmail Access**: The default query reads unread inbox messages from the last `14` days.
- **Result Caps**: Gmail result counts are capped by `GMAIL_MAX_RESULTS`.
- **Minimal Metadata**: Gmail fetches headers (`From`, `Subject`, `Date`) and snippets, not full email bodies.
- **Read-Only Gmail**: Gmail uses the `gmail.readonly` scope.
- **Conflict Checks**: Booking endpoints check calendar availability before inserting events.
- **Local Storage**: OAuth tokens are stored locally in `tokens.json`.

## Setup

### 1. Google Cloud Configuration

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project.
3. Enable **Gmail API** and **Google Calendar API**.
4. Configure the OAuth consent screen.
   - User Type: External.
   - Add yourself as a test user.
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
5. Create an OAuth 2.0 Client ID.
   - Application Type: Web application.
   - Authorized redirect URI: `http://localhost:3000/oauth2callback`

### 2. Local Environment

Copy `.env.example` to `.env` and fill in:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
PORT=3000
GMAIL_MAX_RESULTS=150
GMAIL_LOOKBACK_DAYS=14
CALENDAR_TIME_ZONE=Africa/Nairobi
OLLAMA_API_KEY=
OLLAMA_BASE_URL=https://ollama.com/api
OLLAMA_MODEL=gpt-oss:20b
```

### 3. Install And Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, click **Connect Google**, and complete the OAuth flow.

## Vercel Deployment

This repository is an Express app, not a Next.js app. Vercel serves it through `api/index.js`, with `vercel.json` rewriting requests to the Express handler.

If production shows the default Next.js starter page, Vercel is deploying a different project, branch, or root directory. In the Vercel project settings, confirm:

- Git repository: `mwihoti/gmailcrm`
- Production branch: `main`
- Root directory: repository root, left blank unless this app is moved into a subdirectory
- Framework preset: Other

Set these Vercel environment variables:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://gmailcrm.vercel.app/oauth2callback
GMAIL_MAX_RESULTS=150
GMAIL_LOOKBACK_DAYS=14
CALENDAR_TIME_ZONE=Africa/Nairobi
OLLAMA_API_KEY=
OLLAMA_BASE_URL=https://ollama.com/api
OLLAMA_MODEL=gpt-oss:20b
```

Also add this production redirect URI to the Google OAuth client:

```text
https://gmailcrm.vercel.app/oauth2callback
```

OAuth tokens are stored in `tokens.json` locally. On Vercel, the OAuth callback also stores tokens in an encrypted HTTP-only browser cookie so later dashboard requests can authenticate across serverless function invocations. For stronger production storage, set `TOKEN_COOKIE_SECRET` and move tokens to a database or managed secret store.

## Dashboard

The UI lives in `public/` and is served by Express.

- **Leads**: scans restricted Gmail metadata, classifies likely LinkedIn leads, booking requests, job opportunities, tech opportunities, due work, and upcoming items, then shows received date plus detected due/upcoming timing.
- **Use Ollama**: enriches detected opportunities with LLM-generated priority, summary, suggested action, confidence, and better structured extraction.
- **CRM**: groups recent messages by organization/domain and shows contacts, activity, category counts, stage, summary, and suggested next action.
- **Inbox**: searches Gmail metadata with a backend-enforced safety base query and result cap.
- **Calendar**: lists upcoming events and checks open slots.
- **Booking**: validates input, checks for conflicts, and creates calendar events.
- **Settings**: shows connection status, redirect URI, safety defaults, and API paths.

## API

### Auth

- `GET /auth/google`: start OAuth.
- `GET /oauth2callback`: Google redirect target. Internally redirects to `/auth/oauth2callback`.
- `GET /auth/oauth2callback`: handle OAuth callback.
- `GET /auth/status`: return local token connection status.
- `GET /privacy`: public privacy policy for OAuth verification.
- `GET /terms`: public terms of service for OAuth verification.
- `GET /delete-data`: public data deletion instructions.

### Gmail

- `GET /gmail/latest`: fetch default unread inbox metadata.
- `GET /gmail/latest?q=service&limit=150`: search within the enforced inbox/lookback safety window.

### Calendar

- `GET /calendar/events`: get 10 upcoming events.
- `POST /calendar/check-availability`: check whether a slot is open.
- `POST /calendar/bookings`: create a booking after validating the payload and checking conflicts.

### Agent Workflow

- `GET /agent/booking-leads`: fetch and classify recent email metadata as bookings, job opportunities, tech opportunities, due work, and upcoming items.
- `GET /agent/linkedin-leads`: search recent Gmail metadata for LinkedIn messages and classify matching LinkedIn leads.
- `GET /agent/smart-opportunities?limit=20`: classify recent email metadata and enrich detected opportunities with Ollama Cloud.
- `POST /agent/create-booking-from-lead`: validate lead booking details, check availability, and create the booking.

### CRM

- `GET /crm/organizations?limit=150`: group recent Gmail metadata by organization and return CRM analysis.

## Test

```bash
npm test
```

## Security Warning

This application handles sensitive Google API tokens. Never commit `.env` or `tokens.json`. Both are ignored by `.gitignore`.
