import { create } from 'zustand';
import { UploadedFile, ChatMessage, Summary, Transcript, Quiz, QuizQuestion } from '@/types';

interface FileStore {
  files: UploadedFile[];
  activeFileId: string | null;
  chatMessages: Record<string, ChatMessage[]>;
  summaries: Record<string, Summary>;
  transcripts: Record<string, Transcript>;
  quizzes: Record<string, Quiz>;
  extractedTexts: Record<string, string>;
  
  addFile: (file: UploadedFile) => void;
  updateFileStatus: (id: string, status: UploadedFile['status']) => void;
  setActiveFile: (id: string | null) => void;
  getActiveFile: () => UploadedFile | undefined;
  
  addChatMessage: (fileId: string, message: ChatMessage) => void;
  updateLastAssistantMessage: (fileId: string, content: string) => void;
  getChatMessages: (fileId: string) => ChatMessage[];
  
  setSummary: (fileId: string, summary: Summary) => void;
  getSummary: (fileId: string) => Summary | undefined;
  
  setTranscript: (fileId: string, transcript: Transcript) => void;
  getTranscript: (fileId: string) => Transcript | undefined;
  
  setQuiz: (fileId: string, quiz: Quiz) => void;
  getQuiz: (fileId: string) => Quiz | undefined;
  updateQuizAnswer: (fileId: string, questionId: string, answer: string) => void;
  
  setExtractedText: (fileId: string, text: string) => void;
  getExtractedText: (fileId: string) => string | undefined;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  activeFileId: null,
  chatMessages: {},
  summaries: {},
  transcripts: {},
  quizzes: {},
  extractedTexts: {},

  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  
  updateFileStatus: (id, status) => set((state) => ({
    files: state.files.map((f) => f.id === id ? { ...f, status } : f)
  })),
  
  setActiveFile: (id) => set({ activeFileId: id }),
  
  getActiveFile: () => {
    const state = get();
    return state.files.find((f) => f.id === state.activeFileId);
  },

  addChatMessage: (fileId, message) =>
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [fileId]: [...(state.chatMessages[fileId] || []), message].slice(-10),
      },
    })),

  updateLastAssistantMessage: (fileId, content) =>
    set((state) => {
      const messages = state.chatMessages[fileId] || [];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        return {
          chatMessages: {
            ...state.chatMessages,
            [fileId]: messages.map((m, i) => 
              i === messages.length - 1 ? { ...m, content } : m
            ),
          },
        };
      }
      return state;
    }),

  getChatMessages: (fileId) => get().chatMessages[fileId] || [],

  setSummary: (fileId, summary) =>
    set((state) => ({
      summaries: { ...state.summaries, [fileId]: summary },
    })),

  getSummary: (fileId) => get().summaries[fileId],

  setTranscript: (fileId, transcript) =>
    set((state) => ({
      transcripts: { ...state.transcripts, [fileId]: transcript },
    })),

  getTranscript: (fileId) => get().transcripts[fileId],

  setQuiz: (fileId, quiz) =>
    set((state) => ({
      quizzes: { ...state.quizzes, [fileId]: quiz },
    })),

  getQuiz: (fileId) => get().quizzes[fileId],

  updateQuizAnswer: (fileId, questionId, answer) =>
    set((state) => {
      const quiz = state.quizzes[fileId];
      if (!quiz) return state;
      return {
        quizzes: {
          ...state.quizzes,
          [fileId]: {
            ...quiz,
            questions: quiz.questions.map((q) =>
              q.id === questionId ? { ...q, userAnswer: answer } : q
            ),
          },
        },
      };
    }),

  setExtractedText: (fileId, text) =>
    set((state) => ({
      extractedTexts: { ...state.extractedTexts, [fileId]: text },
    })),

  getExtractedText: (fileId) => get().extractedTexts[fileId],
}));
