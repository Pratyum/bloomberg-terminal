# Supabase Setup Guide

This document describes how to configure Supabase for the Bloomberg Terminal application.

## Overview

The application uses Supabase for:
- **Market Data Storage**: Storing and retrieving market data snapshots
- **Rate Limiting**: Tracking API usage per client/IP

## Obtaining Supabase Credentials

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: `bloomberg-terminal` (or your preferred name)
   - **Database Password**: Set a strong password (save this!)
   - **Region**: Choose a region near your users
4. Wait for the project to be provisioned (may take a few minutes)

### 2. Get Your API Credentials

1. In your Supabase dashboard, go to **Project Settings** (gear icon) → **API**
2. Find the following values:

| Environment Variable | Location in Supabase Dashboard |
|---------------------|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** key in "Project API keys" section |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key in "Project API keys" section (secret!) |

> **Important**: The `SUPABASE_SERVICE_ROLE_KEY` has full database access and should NEVER be exposed to the client. It should only be used in server-side code.

## Local Development Setup

### Step 1: Copy the Example Environment File

```bash
cp .env.local.example .env.local
```

### Step 2: Fill in Your Supabase Credentials

Edit `.env.local` and replace the placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

### Step 3: Run the Database Migration

1. Open the Supabase Dashboard for your project
2. Go to **SQL Editor** in the sidebar
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor and run

This creates:
- `market_data` table for storing market information
- `rate_limits` table for API rate limiting
- Row Level Security (RLS) policies
- Performance indexes
- Cleanup function for expired rate limits

### Step 4: Start Development Server

```bash
npm run dev
```

## Production / Deployment Setup

### Vercel (Recommended)

1. Import your project to Vercel
2. In project settings, add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark as secret)
3. Redeploy

### Other Hosting Providers

Add the environment variables to your hosting provider's environment configuration:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **AWS/Heroku**: Use their respective env var configuration

## Environment Variable Reference

| Variable | Required | Description | Public? |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anonymous key for client-side operations | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role for server-side operations | No (secret) |

## Troubleshooting

### "Failed to fetch" or Network Errors

1. **Check URL format**: Must start with `https://` (not `http://`)
2. **Verify RLS policies**: Ensure the SQL migration ran successfully
3. **Confirm API keys**: Make sure you're using the anon key, not service_role

### Rate Limiting Not Working

1. Verify the `rate_limits` table exists
2. Check that the `increment_rate_limit` RPC function was created
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured in server-side code

### Permission Denied Errors

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly (not the anon key)
2. Check that RLS policies allow the required operations
3. For client-side issues, ensure you're using the public (anon) client

### RLS Policy Errors

If you see "row-level security" errors:
- Ensure the SQL migration has been run in your Supabase SQL Editor
- Check that policies are not blocking authenticated users
- For server-side operations, ensure the service role client is being used
