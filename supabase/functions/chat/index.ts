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
      ? `You are a helpful AI assistant that answers questions based on the following document content. 
Answer any question as long as it is related to the document content.
Be concise but thorough in your responses.

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

    // Retry logic with exponential backoff for streaming
    const maxRetries = 3;
    let lastError: any = null;
    let response: Response | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?key=${GEMINI_API_KEY}`, {
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

    // Convert Gemini streaming format to OpenAI SSE format
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    let lastText = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === '') continue;

              try {
                const json = JSON.parse(line);
                const candidate = json.candidates?.[0];
                if (candidate) {
                  const currentText = candidate.content?.parts?.[0]?.text || '';
                  // Send only the new text (delta)
                  if (currentText.length > lastText.length) {
                    const delta = currentText.slice(lastText.length);
                    lastText = currentText;

                    const sseData = {
                      choices: [{
                        delta: { content: delta }
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
                  }
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
