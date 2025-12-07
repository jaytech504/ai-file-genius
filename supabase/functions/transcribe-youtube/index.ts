import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl } = await req.json();
    
    if (!youtubeUrl) {
      throw new Error('No YouTube URL provided');
    }

    const TRANSCRIPT_API_KEY = Deno.env.get('TRANSCRIPT_API_KEY');
    if (!TRANSCRIPT_API_KEY) {
      throw new Error('TRANSCRIPT_API_KEY is not configured');
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('Fetching transcript for video:', videoId);

    // Call TranscriptAPI
    const response = await fetch(`https://api.transcriptapi.io/v1/transcript?video_id=${videoId}`, {
      headers: {
        'Authorization': `Bearer ${TRANSCRIPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('TranscriptAPI error:', response.status, error);
      
      if (response.status === 404) {
        throw new Error('No transcript available for this video');
      }
      throw new Error('Failed to fetch transcript');
    }

    const data = await response.json();
    
    console.log('Transcript fetched successfully');

    // Format the transcript
    let fullTranscript = '';
    if (data.transcript && Array.isArray(data.transcript)) {
      fullTranscript = data.transcript.map((item: any) => item.text).join(' ');
    } else if (data.text) {
      fullTranscript = data.text;
    }

    return new Response(JSON.stringify({ 
      transcript: fullTranscript,
      videoId,
      segments: data.transcript || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in transcribe-youtube function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
