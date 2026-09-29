# HubSpot Job Finder

A small personal Next.js application that finds remote HubSpot jobs with Brave
Search, stores them in Supabase, and provides a dashboard for reviewing them.

## Requirements

- Node.js 20.9 or newer
- A Brave Search API key
- A Supabase project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Open the Supabase SQL Editor and run
   [`supabase/schema.sql`](./supabase/schema.sql).

3. Add these values to your local `.env` file:

   ```dotenv
   BRAVE_SEARCH_API_KEY=your_brave_search_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   `.env` is ignored by Git. `.env.example` contains names only and is safe to
   commit.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and select **Search now**.

## Commands

- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm start` serves the production build.

## How job discovery works

The app runs the configured HubSpot job queries through Brave Web Search using
the last-month freshness filter. Results are deduplicated by URL before being
written to Supabase. A new URL creates a job with `new` status; an existing URL
only gets a refreshed `last_seen_at` timestamp.

## Security note

This first version has no user authentication. The included SQL gives the
Supabase `anon` role read, insert, and update access so the private dashboard can
work with the requested anon key. Keep the app local or behind private access.
Add Supabase Auth and user-scoped RLS policies before deploying it publicly.
