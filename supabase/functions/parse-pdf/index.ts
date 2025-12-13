const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'PDF base64 data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Sending PDF to Gemini API for text extraction...');

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

      // Use Gemini API to extract text from PDF
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                text: 'Extract all text from this PDF document. Return only the extracted text content.'
              },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64
                }
              }
            ]
          }],
          systemInstruction: {
            parts: [{
              text: 'You are a document text extractor. Extract ALL text content from the provided PDF document. Preserve the structure, headings, paragraphs, and any lists. Return ONLY the extracted text without any commentary or explanation.'
            }]
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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few moments.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 400) {
        return new Response(
          JSON.stringify({ error: 'Invalid request. Please check your API key and request format.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Gemini API extraction failed: ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!extractedText) {
      return new Response(
        JSON.stringify({ error: 'No text could be extracted from the PDF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted text, length:', extractedText.length);

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PDF parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `Failed to parse PDF: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
