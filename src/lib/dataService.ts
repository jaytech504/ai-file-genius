import { supabase } from '@/integrations/supabase/client';
import { UploadedFile, Summary, Transcript, Quiz, ChatMessage, QuizQuestion } from '@/types';
import type { Json } from '@/integrations/supabase/types';

export async function saveUploadedFile(file: UploadedFile, userId: string) {
  const { error } = await supabase
    .from('uploaded_files')
    .insert({
      id: file.id,
      name: file.name,
      type: file.type,
      user_id: userId,
    });
  
  if (error) throw error;
}

export async function updateFileData(
  fileId: string,
  data: {
    extracted_text?: string;
    summary?: string;
    transcript?: string;
    quiz?: Json;
  }
) {
  const { error } = await supabase
    .from('uploaded_files')
    .update(data)
    .eq('id', fileId);
  
  if (error) throw error;
}

export async function loadUserFiles(userId: string): Promise<{
  files: UploadedFile[];
  summaries: Record<string, Summary>;
  transcripts: Record<string, Transcript>;
  quizzes: Record<string, Quiz>;
  extractedTexts: Record<string, string>;
}> {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const files: UploadedFile[] = [];
  const summaries: Record<string, Summary> = {};
  const transcripts: Record<string, Transcript> = {};
  const quizzes: Record<string, Quiz> = {};
  const extractedTexts: Record<string, string> = {};

  for (const row of data || []) {
    files.push({
      id: row.id,
      name: row.name,
      type: row.type as UploadedFile['type'],
      uploadedAt: new Date(row.created_at),
      status: 'ready',
    });

    if (row.extracted_text) {
      extractedTexts[row.id] = row.extracted_text;
    }

    if (row.summary) {
      try {
        const summaryData = JSON.parse(row.summary);
        summaries[row.id] = {
          id: `s-${row.id}`,
          fileId: row.id,
          content: summaryData.title || summaryData.content,
          sections: summaryData.sections || [],
          generatedAt: new Date(row.updated_at),
        };
      } catch {
        summaries[row.id] = {
          id: `s-${row.id}`,
          fileId: row.id,
          content: row.summary,
          sections: [],
          generatedAt: new Date(row.updated_at),
        };
      }
    }

    if (row.transcript) {
      transcripts[row.id] = {
        id: `t-${row.id}`,
        fileId: row.id,
        content: row.transcript,
        generatedAt: new Date(row.updated_at),
      };
    }

    if (row.quiz) {
      const quizData = row.quiz as { questions?: QuizQuestion[] };
      quizzes[row.id] = {
        id: `q-${row.id}`,
        fileId: row.id,
        questions: quizData.questions || [],
        generatedAt: new Date(row.updated_at),
      };
    }
  }

  return { files, summaries, transcripts, quizzes, extractedTexts };
}

export async function loadChatMessages(userId: string): Promise<Record<string, ChatMessage[]>> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const chatMessages: Record<string, ChatMessage[]> = {};

  for (const row of data || []) {
    if (!chatMessages[row.file_id]) {
      chatMessages[row.file_id] = [];
    }
    chatMessages[row.file_id].push({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      timestamp: new Date(row.created_at),
    });
  }

  return chatMessages;
}

export async function saveChatMessage(
  fileId: string,
  userId: string,
  message: ChatMessage
) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      id: message.id,
      file_id: fileId,
      user_id: userId,
      content: message.content,
      role: message.role,
    });

  if (error) throw error;
}

export async function deleteUploadedFile(fileId: string) {
  // Delete chat messages first (foreign key constraint)
  await supabase
    .from('chat_messages')
    .delete()
    .eq('file_id', fileId);

  const { error } = await supabase
    .from('uploaded_files')
    .delete()
    .eq('id', fileId);

  if (error) throw error;
}
