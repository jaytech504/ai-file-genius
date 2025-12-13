# Gemini API Setup Guide

## Changes Made

All edge functions have been updated to use the Gemini API directly instead of the Lovable gateway:

- ✅ `chat` - Now uses Gemini API with streaming support
- ✅ `summarize` - Now uses Gemini API
- ✅ `generate-quiz` - Now uses Gemini API
- ✅ `parse-pdf` - Now uses Gemini API

## Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Set the API Key in Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ggqyaesuatjqdxpnjnkt
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key (starts with `AIza...`)
6. Click **Save**

### Method 2: Using Supabase CLI

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

## Deploy Functions

After setting the secret, deploy your functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy chat
supabase functions deploy summarize
supabase functions deploy generate-quiz
supabase functions deploy parse-pdf
```

## Verify Deployment

1. Go to **Edge Functions** in your Supabase Dashboard
2. Check that all functions are deployed
3. Test a function to ensure it's working with your Gemini API key

## API Usage

The functions now use:
- **Model**: `gemini-2.0-flash-exp`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp`
- **Authentication**: API key passed as query parameter

## Notes

- The `transcribe-audio` function still uses AssemblyAI (requires `ASSEMBLYAI_API_KEY`)
- The `transcribe-youtube` function still uses TranscriptAPI (requires `TRANSCRIPT_API_KEY`)
- Only the 4 functions listed above now use Gemini API

