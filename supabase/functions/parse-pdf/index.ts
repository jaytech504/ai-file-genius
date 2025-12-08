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

    // Decode base64 to binary
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Basic PDF text extraction - look for text streams
    const pdfString = new TextDecoder('latin1').decode(bytes);
    
    // Extract text between stream and endstream markers
    const textParts: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const content = match[1];
      // Look for text operators (Tj, TJ, ')
      const textMatches = content.match(/\((.*?)\)\s*Tj|\[(.*?)\]\s*TJ/g);
      if (textMatches) {
        for (const tm of textMatches) {
          // Extract text from parentheses
          const textInParens = tm.match(/\((.*?)\)/g);
          if (textInParens) {
            for (const t of textInParens) {
              const text = t.slice(1, -1);
              if (text && !/^[\x00-\x1F]+$/.test(text)) {
                textParts.push(text);
              }
            }
          }
        }
      }
    }

    let extractedText = textParts.join(' ').trim();
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!extractedText) {
      extractedText = 'Unable to extract text from this PDF. The PDF may contain images or use encoding that requires advanced parsing.';
    }

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
