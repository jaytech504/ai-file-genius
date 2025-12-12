import { FileText, Music, Youtube } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UploadCard } from '@/components/dashboard/UploadCard';
import { FileList } from '@/components/dashboard/FileList';
import { useFileStore } from '@/stores/fileStore';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { extractPdfText, transcribeYoutube, generateSummary, generateQuiz } from '@/lib/processingService';
import { supabase } from '@/integrations/supabase/client';
import { saveUploadedFile, updateFileData, saveChatMessage } from '@/lib/dataService';

export default function Dashboard() {
  const { user } = useAuth();
  const { isLoading } = useUserData();
  
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
      const summary = {
        id: `s-${fileId}`,
        fileId,
        content: summaryData.title,
        sections: summaryData.sections,
        generatedAt: new Date(),
      };
      setSummary(fileId, summary);

      // Generate quiz
      const quizQuestions = await generateQuiz(text);
      const quiz = {
        id: `q-${fileId}`,
        fileId,
        questions: quizQuestions,
        generatedAt: new Date(),
      };
      setQuiz(fileId, quiz);

      // Save summary and quiz to database
      await updateFileData(fileId, {
        summary: JSON.stringify({ title: summaryData.title, sections: summaryData.sections }),
        quiz: { questions: quizQuestions } as any,
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
    if (!user) return;
    
    const fileId = uuidv4();
    const uploadedFile = {
      id: fileId,
      name: file.name,
      type: 'pdf' as const,
      uploadedAt: new Date(),
      status: 'processing' as const,
    };
    
    addFile(uploadedFile);
    
    // Save to database
    try {
      await saveUploadedFile(uploadedFile, user.id);
    } catch (error) {
      console.error('Failed to save file to database:', error);
    }

    toast.info('Processing PDF...', {
      description: 'Extracting text and generating insights.',
    });

    try {
      const text = await extractPdfText(file);
      setExtractedText(fileId, text);
      
      // Save extracted text to database
      await updateFileData(fileId, { extracted_text: text });
      
      await processFile(fileId, text, 'pdf');
    } catch (error) {
      console.error('PDF extraction error:', error);
      updateFileStatus(fileId, 'error');
      toast.error('Failed to extract text from PDF');
    }
  };

  const handleAudioUpload = async (file: File) => {
    if (!user) return;
    
    const fileId = uuidv4();
    const uploadedFile = {
      id: fileId,
      name: file.name,
      type: 'audio' as const,
      uploadedAt: new Date(),
      status: 'processing' as const,
    };
    
    addFile(uploadedFile);

    // Save to database
    try {
      await saveUploadedFile(uploadedFile, user.id);
    } catch (error) {
      console.error('Failed to save file to database:', error);
    }

    toast.info('Processing Audio...', {
      description: 'Uploading and transcribing. This may take a few minutes.',
    });

    try {
      // Upload audio file to temp storage
      const filePath = `${fileId}/${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temp-audio')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('temp-audio')
        .getPublicUrl(filePath);

      console.log('Audio uploaded, transcribing from:', publicUrl);

      // Transcribe the audio
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: publicUrl }
      });

      if (transcriptError || transcriptData?.error) {
        throw new Error(transcriptData?.error || transcriptError?.message || 'Transcription failed');
      }

      const transcript = transcriptData.transcript;
      
      // Save extracted text and transcript
      setExtractedText(fileId, transcript);
      setTranscript(fileId, {
        id: `t-${fileId}`,
        fileId,
        content: transcript,
        generatedAt: new Date(),
      });

      // Save to database
      await updateFileData(fileId, { 
        extracted_text: transcript,
        transcript: transcript,
      });

      await processFile(fileId, transcript, 'audio');

      // Clean up: delete temp file after processing
      await supabase.storage.from('temp-audio').remove([filePath]);
    } catch (error) {
      console.error('Audio processing error:', error);
      updateFileStatus(fileId, 'error');
      toast.error('Failed to process audio file', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleYoutubeUpload = async (url: string) => {
    if (!user) return;
    
    const fileId = uuidv4();
    const uploadedFile = {
      id: fileId,
      name: url,
      type: 'youtube' as const,
      uploadedAt: new Date(),
      status: 'processing' as const,
    };
    
    addFile(uploadedFile);

    // Save to database
    try {
      await saveUploadedFile(uploadedFile, user.id);
    } catch (error) {
      console.error('Failed to save file to database:', error);
    }

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

      // Save to database
      await updateFileData(fileId, { 
        extracted_text: transcript,
        transcript: transcript,
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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">Loading your files...</div>
        </div>
      </Layout>
    );
  }

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
