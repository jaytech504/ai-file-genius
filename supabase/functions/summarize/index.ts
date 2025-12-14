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
    const { text } = await req.json();

    if (!text) {
      throw new Error('No text provided');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Generating summary for text of length:', text.length);

    const systemInstruction = `You are an expert educational summarizer. Create a well-structured summary with multiple sections. 
            - Use short paragraphs, lots of white space, and clear visual separation between sections.
- Use modern, attractive formatting and layout throughout, like top-tier blogs (Medium, Notion, Substack).
- Use css styled <table> for comparisons or data, <blockquote> and <div class='pro-tip'> for callouts, and <mark>, <b>, <i>, <u>, <code>, <span class='highlight'> for emphasis..
- Use $...$ for inline math and formulas (LaTeX style).
- Make the total summary length at least a 700 - 2000 words based on the text length
- Make it elaborate and verbose.
Return your response as a JSON object with this structure:
{
  "title": "Main title of the summary",
  "sections": [
    {
      "title": "Section Title",
      "content": "Section content as a paragraph",
      "bulletPoints": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}

Create 3-5 sections based on the length of the text covering key themes, main points, and conclusions. Each section should have 3-4 bullet points.`;

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

      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `Please summarize the following content:\n\n${text.substring(0, 50000)}` }]
          }],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        }),
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

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('AI response received');

    // Parse the JSON response
    let summary;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse summary JSON:', parseError);
      // Fallback to a simple structure
      summary = {
        title: 'Content Summary',
        sections: [
          {
            title: 'Overview',
            content: content,
            bulletPoints: []
          }
        ]
      };
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
