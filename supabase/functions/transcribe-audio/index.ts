import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();
    
    if (!audioUrl) {
      throw new Error('No audio URL provided');
    }

    const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY is not configured');
    }

    console.log('Starting transcription for audio:', audioUrl);

    // Create transcription request
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true,
      }),
    });

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.text();
      console.error('AssemblyAI error:', error);
      throw new Error('Failed to start transcription');
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    console.log('Transcription started with ID:', transcriptId);

    // Poll for completion
    let transcript = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
      });

      const pollingData = await pollingResponse.json();
      
      if (pollingData.status === 'completed') {
        transcript = pollingData;
        break;
      } else if (pollingData.status === 'error') {
        throw new Error(`Transcription failed: ${pollingData.error}`);
      }

      attempts++;
      console.log('Transcription status:', pollingData.status, '- attempt', attempts);
    }

    if (!transcript) {
      throw new Error('Transcription timed out');
    }

    console.log('Transcription completed successfully');

    return new Response(JSON.stringify({ 
      transcript: transcript.text,
      words: transcript.words,
      duration: transcript.audio_duration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
