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

    console.log('Generating quiz for text of length:', text.length);

    const systemInstruction = `You are an expert quiz generator. Create educational quizzes based on content.

Return your response as a JSON array of questions with this structure:
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  },
  {
    "id": "q2", 
    "type": "true-false",
    "question": "Is this statement true?",
    "correctAnswer": "true"
  },
  {
    "id": "q3",
    "type": "short-answer",
    "question": "Explain briefly...",
    "correctAnswer": "Expected answer or key points"
  }
]

Generate exactly 10 questions:
- 5 multiple-choice questions (4 options each)
- 3 true-false questions
- 2 short-answer questions

Questions should test comprehension of key concepts from the content.`;

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
            parts: [{ text: `Generate a quiz based on the following content:\n\n${text.substring(0, 50000)}` }]
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
    let questions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError);
      throw new Error('Failed to parse quiz questions');
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
