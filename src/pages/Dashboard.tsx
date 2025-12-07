import { FileText, Music, Youtube } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UploadCard } from '@/components/dashboard/UploadCard';
import { FileList } from '@/components/dashboard/FileList';
import { useFileStore } from '@/stores/fileStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { extractPdfText, transcribeYoutube, generateSummary, generateQuiz } from '@/lib/processingService';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const addFile = useFileStore((state) => state.addFile);
  const updateFileStatus = useFileStore((state) => state.updateFileStatus);
  const setExtractedText = useFileStore((state) => state.setExtractedText);
  const setTranscript = useFileStore((state) => state.setTranscript);
  const setSummary = useFileStore((state) => state.setSummary);
  const setQuiz = useFileStore((state) => state.setQuiz);

  const processFile = async (fileId: string, text: string, fileType: 'pdf' | 'audio' | 'youtube') => {
    try {
      // Generate summary
      const summaryData = await generateSummary(text);
      setSummary(fileId, {
        id: `s-${fileId}`,
        fileId,
        content: summaryData.title,
        sections: summaryData.sections,
        generatedAt: new Date(),
      });

      // Generate quiz
      const quizQuestions = await generateQuiz(text);
      setQuiz(fileId, {
        id: `q-${fileId}`,
        fileId,
        questions: quizQuestions,
        generatedAt: new Date(),
      });

      updateFileStatus(fileId, 'ready');
      toast.success('Processing complete!', {
        description: 'Summary and quiz have been generated.',
      });
    } catch (error) {
      console.error('Processing error:', error);
      updateFileStatus(fileId, 'error');
      toast.error('Processing failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handlePdfUpload = async (file: File) => {
    const fileId = uuidv4();
    
    addFile({
      id: fileId,
      name: file.name,
      type: 'pdf',
      uploadedAt: new Date(),
      status: 'processing',
    });

    toast.info('Processing PDF...', {
      description: 'Extracting text and generating insights.',
    });

    try {
      const text = await extractPdfText(file);
      setExtractedText(fileId, text);
      await processFile(fileId, text, 'pdf');
    } catch (error) {
      console.error('PDF extraction error:', error);
      updateFileStatus(fileId, 'error');
      toast.error('Failed to extract text from PDF');
    }
  };

  const handleAudioUpload = async (file: File) => {
    const fileId = uuidv4();
    
    addFile({
      id: fileId,
      name: file.name,
      type: 'audio',
      uploadedAt: new Date(),
      status: 'processing',
    });

    toast.info('Processing Audio...', {
      description: 'This may take a few minutes for transcription.',
    });

    try {
      // For audio, we need to upload to storage first to get a URL
      // For now, show a message about the requirement
      toast.warning('Audio upload requires file storage', {
        description: 'Please set up storage bucket to enable audio transcription.',
      });
      updateFileStatus(fileId, 'error');
    } catch (error) {
      console.error('Audio processing error:', error);
      updateFileStatus(fileId, 'error');
      toast.error('Failed to process audio file');
    }
  };

  const handleYoutubeUpload = async (url: string) => {
    const fileId = uuidv4();
    
    addFile({
      id: fileId,
      name: url,
      type: 'youtube',
      uploadedAt: new Date(),
      status: 'processing',
    });

    toast.info('Processing YouTube video...', {
      description: 'Fetching transcript and generating insights.',
    });

    try {
      const transcript = await transcribeYoutube(url);
      setExtractedText(fileId, transcript);
      setTranscript(fileId, {
        id: `t-${fileId}`,
        fileId,
        content: transcript,
        generatedAt: new Date(),
      });
      await processFile(fileId, transcript, 'youtube');
    } catch (error) {
      console.error('YouTube transcription error:', error);
      updateFileStatus(fileId, 'error');
      toast.error('Failed to transcribe YouTube video', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleUpload = (type: 'pdf' | 'audio' | 'youtube') => (fileOrUrl: File | string) => {
    if (type === 'pdf' && fileOrUrl instanceof File) {
      handlePdfUpload(fileOrUrl);
    } else if (type === 'audio' && fileOrUrl instanceof File) {
      handleAudioUpload(fileOrUrl);
    } else if (type === 'youtube' && typeof fileOrUrl === 'string') {
      handleYoutubeUpload(fileOrUrl);
    }
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-in">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your documents to get started with AI-powered insights.
          </p>
        </header>

        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UploadCard
            type="pdf"
            icon={<FileText className="w-8 h-8" />}
            title="Upload PDF"
            description="Extract text, summaries, and generate quizzes from PDF documents"
            onUpload={handleUpload('pdf')}
          />
          <UploadCard
            type="audio"
            icon={<Music className="w-8 h-8" />}
            title="Upload Audio"
            description="Transcribe audio files and generate insights from spoken content"
            onUpload={handleUpload('audio')}
          />
          <UploadCard
            type="youtube"
            icon={<Youtube className="w-8 h-8" />}
            title="Add YouTube Link"
            description="Transcribe and analyze YouTube videos for key insights"
            onUpload={handleUpload('youtube')}
          />
        </div>

        {/* File List */}
        <FileList />
      </div>
    </Layout>
  );
}
