# Supabase Edge Functions Deployment Guide

## Prerequisites

1. **Install Supabase CLI** (if not already installed):
   ```bash
   # Windows (using Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # Or using npm
   npm install -g supabase
   ```

2. **Login to Supabase CLI**:
   ```bash
   supabase login
   ```
   This will open your browser to authenticate.

3. **Link your project**:
   ```bash
   supabase link --project-ref ggqyaesuatjqdxpnjnkt
   ```

## Deploy All Functions

To deploy all edge functions at once:

```bash
supabase functions deploy
```

## Deploy Individual Functions

You can also deploy functions individually:

```bash
# Deploy chat function
supabase functions deploy chat

# Deploy summarize function
supabase functions deploy summarize

# Deploy generate-quiz function
supabase functions deploy generate-quiz

# Deploy parse-pdf function
supabase functions deploy parse-pdf

# Deploy transcribe-audio function
supabase functions deploy transcribe-audio

# Deploy transcribe-youtube function
supabase functions deploy transcribe-youtube
```

## Set Environment Variables

Your functions require the `GEMINI_API_KEY` environment variable. Set it using:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

**To get your Gemini API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in and create an API key
3. Copy the key (starts with `AIza...`)

**To set it via Supabase Dashboard:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ggqyaesuatjqdxpnjnkt
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key
6. Click **Save**

**Note:** The following functions also require additional API keys:
- `transcribe-audio` requires `ASSEMBLYAI_API_KEY`
- `transcribe-youtube` requires `TRANSCRIPT_API_KEY`

## Verify Deployment

After deployment, you can verify your functions are working:

1. Go to **Edge Functions** in your Supabase Dashboard
2. You should see all 6 functions listed:
   - `chat`
   - `summarize`
   - `generate-quiz`
   - `parse-pdf`
   - `transcribe-audio`
   - `transcribe-youtube`

## Testing Functions Locally (Optional)

To test functions locally before deploying:

```bash
# Start local Supabase (requires Docker)
supabase start

# Serve functions locally
supabase functions serve

# Test a specific function
supabase functions serve chat
```

## Troubleshooting

### If deployment fails:
1. Make sure you're logged in: `supabase login`
2. Verify project link: `supabase projects list`
3. Check function code for syntax errors
4. Ensure environment variables are set

### If functions return errors:
1. Check function logs in Supabase Dashboard → Edge Functions → [Function Name] → Logs
2. Verify `LOVABLE_API_KEY` is set correctly
3. Check function code for any issues


