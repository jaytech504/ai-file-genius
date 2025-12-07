import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ProcessingResult {
  extractedText: string;
  transcript?: string;
}

export interface SummarySection {
  title: string;
  content: string;
  bulletPoints: string[];
}

export interface Summary {
  title: string;
  sections: SummarySection[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
}

// Extract text from PDF file
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

// Generate summary from text
export async function generateSummary(text: string): Promise<Summary> {
  const { data, error } = await supabase.functions.invoke('summarize', {
    body: { text }
  });

  if (error) {
    console.error('Summary error:', error);
    throw new Error(error.message || 'Failed to generate summary');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.summary;
}

// Generate quiz from text
export async function generateQuiz(text: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase.functions.invoke('generate-quiz', {
    body: { text }
  });

  if (error) {
    console.error('Quiz error:', error);
    throw new Error(error.message || 'Failed to generate quiz');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.questions;
}

// Chat with AI about document content
export async function streamChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
  onDelta: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Chat request failed');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  onDone();
}

// Transcribe audio file using AssemblyAI
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('transcribe-audio', {
    body: { audioUrl }
  });

  if (error) {
    console.error('Audio transcription error:', error);
    throw new Error(error.message || 'Failed to transcribe audio');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.transcript;
}

// Transcribe YouTube video
export async function transcribeYoutube(youtubeUrl: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('transcribe-youtube', {
    body: { youtubeUrl }
  });

  if (error) {
    console.error('YouTube transcription error:', error);
    throw new Error(error.message || 'Failed to transcribe YouTube video');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.transcript;
}
