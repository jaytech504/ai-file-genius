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
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('No messages provided');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Processing chat with', messages.length, 'messages');

    const systemPrompt = context
      ? `You are a helpful teacher assisting students. Follow these rules:
1. Answer using document summary and chat history as context but also add necessary related information if needed.
2. Explain concepts in easy to understand terms and use relevant extra knowledge when helpful
3. Keep some answers under 150 words unless necessary then up to 500 words.
4. Be friendly and use occasional emojis
5. If question is unrelated, politely decline
Document content:
${context.substring(0, 30000)}`
      : `You are a helpful AI assistant. Be concise but thorough in your responses.`;

    // Convert OpenAI-style messages to Gemini format
    const geminiContents: any[] = [];
    const recentMessages = messages.slice(-10);

    for (const msg of recentMessages) {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const requestBody: any = {
      contents: geminiContents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    };

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: any = null;
    let response: Response | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Use non-streaming API
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        break; // Success, exit retry loop
      }

      const errorText = await response.text();
      lastError = { status: response.status, text: errorText };
      console.error(`Gemini API error (attempt ${attempt + 1}/${maxRetries + 1}):`, response.status, errorText);

      // Don't retry on 400 (bad request) or 401 (unauthorized)
      if (response.status === 400 || response.status === 401) {
        break;
      }

      // Only retry on 429 (rate limit) or 500+ (server errors)
      if (response.status !== 429 && response.status < 500) {
        break;
      }
    }

    if (!response || !response.ok) {
      const status = lastError?.status || 500;
      const errorText = lastError?.text || 'Unknown error';

      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few moments.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 400) {
        return new Response(JSON.stringify({ error: 'Invalid request. Please check your API key and request format.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Gemini API error: ${status}`);
    }

    // Parse the response
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content) {
      console.error('No content in Gemini response:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return simple JSON response
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
