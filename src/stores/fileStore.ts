import { create } from 'zustand';
import { UploadedFile, ChatMessage, Summary, Transcript, Quiz, QuizQuestion } from '@/types';

interface FileStore {
  files: UploadedFile[];
  activeFileId: string | null;
  chatMessages: Record<string, ChatMessage[]>;
  summaries: Record<string, Summary>;
  transcripts: Record<string, Transcript>;
  quizzes: Record<string, Quiz>;
  
  addFile: (file: UploadedFile) => void;
  setActiveFile: (id: string | null) => void;
  getActiveFile: () => UploadedFile | undefined;
  
  addChatMessage: (fileId: string, message: ChatMessage) => void;
  getChatMessages: (fileId: string) => ChatMessage[];
  
  setSummary: (fileId: string, summary: Summary) => void;
  getSummary: (fileId: string) => Summary | undefined;
  
  setTranscript: (fileId: string, transcript: Transcript) => void;
  getTranscript: (fileId: string) => Transcript | undefined;
  
  setQuiz: (fileId: string, quiz: Quiz) => void;
  getQuiz: (fileId: string) => Quiz | undefined;
  updateQuizAnswer: (fileId: string, questionId: string, answer: string) => void;
}

// Demo data
const demoFiles: UploadedFile[] = [
  {
    id: '1',
    name: 'Introduction to Machine Learning.pdf',
    type: 'pdf',
    uploadedAt: new Date('2024-01-15'),
    status: 'ready',
  },
  {
    id: '2',
    name: 'Podcast Episode 42 - The Future of AI.mp3',
    type: 'audio',
    uploadedAt: new Date('2024-01-18'),
    status: 'ready',
  },
  {
    id: '3',
    name: 'TED Talk: How to Build a Better Future',
    type: 'youtube',
    uploadedAt: new Date('2024-01-20'),
    status: 'ready',
  },
];

const demoSummaries: Record<string, Summary> = {
  '1': {
    id: 's1',
    fileId: '1',
    content: 'This document provides a comprehensive introduction to machine learning concepts.',
    sections: [
      {
        title: 'What is Machine Learning?',
        content: 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.',
        bulletPoints: [
          'Supervised learning uses labeled data',
          'Unsupervised learning finds patterns in unlabeled data',
          'Reinforcement learning learns through trial and error',
        ],
      },
      {
        title: 'Key Algorithms',
        content: 'The document covers several fundamental algorithms used in machine learning applications.',
        bulletPoints: [
          'Linear and logistic regression for prediction',
          'Decision trees and random forests for classification',
          'Neural networks for complex pattern recognition',
        ],
      },
      {
        title: 'Practical Applications',
        content: 'Machine learning has numerous real-world applications across industries.',
        bulletPoints: [
          'Healthcare: Disease diagnosis and drug discovery',
          'Finance: Fraud detection and algorithmic trading',
          'Technology: Recommendation systems and voice assistants',
        ],
      },
    ],
    generatedAt: new Date(),
  },
  '2': {
    id: 's2',
    fileId: '2',
    content: 'A deep dive into how artificial intelligence will shape our future.',
    sections: [
      {
        title: 'Current State of AI',
        content: 'The podcast discusses the rapid advancement of AI technologies in recent years.',
        bulletPoints: [
          'GPT models have revolutionized natural language processing',
          'Computer vision has achieved human-level accuracy',
          'AI is being integrated into everyday applications',
        ],
      },
      {
        title: 'Future Predictions',
        content: 'Experts share their predictions for AI development in the next decade.',
        bulletPoints: [
          'AGI may be achieved within 10-20 years',
          'AI will transform the job market significantly',
          'Ethical considerations will become paramount',
        ],
      },
    ],
    generatedAt: new Date(),
  },
  '3': {
    id: 's3',
    fileId: '3',
    content: 'An inspiring talk about building a sustainable and equitable future.',
    sections: [
      {
        title: 'Vision for Tomorrow',
        content: 'The speaker outlines a compelling vision for what our future could look like.',
        bulletPoints: [
          'Sustainable cities powered by renewable energy',
          'Universal access to education and healthcare',
          'Technology that enhances human connection',
        ],
      },
    ],
    generatedAt: new Date(),
  },
};

const demoTranscripts: Record<string, Transcript> = {
  '2': {
    id: 't2',
    fileId: '2',
    content: `Welcome to Episode 42 of our podcast series on technology and innovation. Today, we're diving deep into the future of artificial intelligence.

Host: Thanks for joining us. Today's topic is one that affects everyone - the future of AI. We have two incredible guests with us.

Guest 1: Thanks for having me. I've been working in AI research for over 15 years, and I've never seen such rapid progress as we're witnessing now.

Host: Let's start with the basics. Where do you see AI heading in the next five years?

Guest 1: Well, I think we're going to see AI become much more integrated into our daily lives. We're already seeing this with virtual assistants and recommendation systems, but it's going to go much further.

Guest 2: I agree. The key development I'm watching is the emergence of more sophisticated reasoning capabilities. Current AI systems are great at pattern recognition, but true reasoning is the next frontier.

Host: That's fascinating. What about the concerns around AI safety and ethics?

Guest 1: This is crucial. As AI systems become more powerful, we need robust frameworks for ensuring they're aligned with human values. This isn't just a technical challenge - it requires collaboration across disciplines.

Guest 2: Absolutely. We need philosophers, ethicists, policymakers, and technologists all working together. The decisions we make now will shape the trajectory of this technology for decades.

Host: Let's talk about practical applications. What excites you most?

Guest 1: Healthcare is incredibly promising. AI can analyze medical images with superhuman accuracy, help discover new drugs, and personalize treatment plans. We're just scratching the surface.

Guest 2: For me, it's education. Imagine AI tutors that can adapt to each student's learning style and pace. This could democratize access to high-quality education globally.

Host: These are exciting possibilities. Any final thoughts for our listeners?

Guest 1: Stay curious and engaged. This technology will affect everyone, and informed citizens can help shape its development in positive ways.

Guest 2: And don't be afraid. AI is a tool, and like all tools, its impact depends on how we choose to use it.

Host: Thank you both for this insightful conversation. Until next time!`,
    generatedAt: new Date(),
  },
  '3': {
    id: 't3',
    fileId: '3',
    content: `Good morning everyone. Thank you for being here today. I want to talk about something that I believe is the most important conversation of our time: how we build a better future.

Now, when I say "better future," I'm not talking about flying cars or colonies on Mars - although those could be pretty cool too. I'm talking about a future where every person has the opportunity to thrive.

Let me share a story. Ten years ago, I visited a small village in rural India. There was no electricity, no clean water, and the nearest school was 20 kilometers away. The children there had dreams just as big as any child anywhere in the world, but the obstacles they faced seemed insurmountable.

Fast forward to today, and that same village has solar panels on every roof, clean water pumped from underground aquifers, and a state-of-the-art learning center connected to the internet. The transformation didn't happen by accident. It happened because people believed change was possible and took action.

This is the key insight I want to share with you: the future is not something that happens to us. The future is something we create.

So how do we create a better future? I believe it comes down to three principles.

First, we must think long-term. Too often, our decisions are driven by short-term gains. But the challenges we face - climate change, inequality, technological disruption - require us to think in decades, not quarters.

Second, we must embrace collaboration. No single company, government, or individual can solve these challenges alone. We need unprecedented cooperation across borders and sectors.

Third, and perhaps most importantly, we must include everyone. The solutions we develop must work for all of humanity, not just the privileged few.

I believe we're at a pivotal moment in history. The choices we make in the next decade will determine the trajectory of civilization for centuries to come.

So I leave you with a question: What will you do to build a better future?

Thank you.`,
    generatedAt: new Date(),
  },
};

const demoQuizzes: Record<string, Quiz> = {
  '1': {
    id: 'q1',
    fileId: '1',
    questions: [
      {
        id: 'q1-1',
        type: 'multiple-choice',
        question: 'Which of the following is NOT a type of machine learning?',
        options: ['Supervised learning', 'Unsupervised learning', 'Reinforcement learning', 'Programmatic learning'],
        correctAnswer: 'Programmatic learning',
      },
      {
        id: 'q1-2',
        type: 'true-false',
        question: 'Neural networks are inspired by the structure of the human brain.',
        options: ['True', 'False'],
        correctAnswer: 'True',
      },
      {
        id: 'q1-3',
        type: 'multiple-choice',
        question: 'What is supervised learning primarily used for?',
        options: ['Finding hidden patterns', 'Learning from labeled data', 'Game playing', 'Data compression'],
        correctAnswer: 'Learning from labeled data',
      },
      {
        id: 'q1-4',
        type: 'short-answer',
        question: 'Name one practical application of machine learning in healthcare.',
        correctAnswer: 'Disease diagnosis',
      },
    ],
    generatedAt: new Date(),
  },
  '2': {
    id: 'q2',
    fileId: '2',
    questions: [
      {
        id: 'q2-1',
        type: 'multiple-choice',
        question: 'According to the podcast, what is described as the "next frontier" in AI?',
        options: ['Pattern recognition', 'True reasoning capabilities', 'Image generation', 'Voice synthesis'],
        correctAnswer: 'True reasoning capabilities',
      },
      {
        id: 'q2-2',
        type: 'true-false',
        question: 'The guests believe AI development should only involve technologists.',
        options: ['True', 'False'],
        correctAnswer: 'False',
      },
    ],
    generatedAt: new Date(),
  },
  '3': {
    id: 'q3',
    fileId: '3',
    questions: [
      {
        id: 'q3-1',
        type: 'multiple-choice',
        question: 'What are the three principles for building a better future mentioned in the talk?',
        options: [
          'Speed, efficiency, profit',
          'Long-term thinking, collaboration, inclusion',
          'Innovation, disruption, scale',
          'Technology, money, power',
        ],
        correctAnswer: 'Long-term thinking, collaboration, inclusion',
      },
      {
        id: 'q3-2',
        type: 'true-false',
        question: 'The speaker believes the future is something that happens to us rather than something we create.',
        options: ['True', 'False'],
        correctAnswer: 'False',
      },
    ],
    generatedAt: new Date(),
  },
};

const demoChatMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: 'c1-1',
      role: 'user',
      content: 'What is the main topic of this document?',
      timestamp: new Date('2024-01-15T10:00:00'),
    },
    {
      id: 'c1-2',
      role: 'assistant',
      content: 'This document is an introduction to machine learning. It covers the fundamental concepts of ML, including different types of learning (supervised, unsupervised, and reinforcement learning), key algorithms like linear regression and neural networks, and practical applications in healthcare, finance, and technology.',
      timestamp: new Date('2024-01-15T10:00:05'),
    },
  ],
};

export const useFileStore = create<FileStore>((set, get) => ({
  files: demoFiles,
  activeFileId: null,
  chatMessages: demoChatMessages,
  summaries: demoSummaries,
  transcripts: demoTranscripts,
  quizzes: demoQuizzes,

  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  
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
}));
