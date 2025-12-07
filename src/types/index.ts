export type FileType = 'pdf' | 'audio' | 'youtube';

export type WorkspaceSection = 'summary' | 'transcript' | 'quiz' | 'chatbot';

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  uploadedAt: Date;
  status: 'processing' | 'ready' | 'error';
  thumbnail?: string;
}

export interface Summary {
  id: string;
  fileId: string;
  content: string;
  sections: SummarySection[];
  generatedAt: Date;
}

export interface SummarySection {
  title: string;
  content: string;
  bulletPoints?: string[];
}

export interface Transcript {
  id: string;
  fileId: string;
  content: string;
  generatedAt: Date;
}

export interface Quiz {
  id: string;
  fileId: string;
  questions: QuizQuestion[];
  generatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
