import { FileText, Music, Youtube } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UploadCard } from '@/components/dashboard/UploadCard';
import { FileList } from '@/components/dashboard/FileList';
import { useFileStore } from '@/stores/fileStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function Dashboard() {
  const addFile = useFileStore((state) => state.addFile);

  const handleUpload = (type: 'pdf' | 'audio' | 'youtube') => (fileOrUrl: File | string) => {
    const name = typeof fileOrUrl === 'string' 
      ? fileOrUrl 
      : fileOrUrl.name;

    addFile({
      id: uuidv4(),
      name,
      type,
      uploadedAt: new Date(),
      status: 'processing',
    });

    toast.success(`${type === 'youtube' ? 'Link' : 'File'} added successfully`, {
      description: 'Processing will begin shortly. Connect to Lovable Cloud to enable real processing.',
    });
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
