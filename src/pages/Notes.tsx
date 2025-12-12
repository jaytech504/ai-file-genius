import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Music, Youtube, Clock, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/stores/fileStore';
import { useUserData } from '@/hooks/useUserData';
import { deleteUploadedFile } from '@/lib/dataService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

const fileIcons = {
  pdf: FileText,
  audio: Music,
  youtube: Youtube,
};

const fileColors = {
  pdf: 'text-pdf-accent bg-pdf-accent/10',
  audio: 'text-audio-accent bg-audio-accent/10',
  youtube: 'text-youtube-accent bg-youtube-accent/10',
};

export default function Notes() {
  const { files, removeFile } = useFileStore();
  const { isLoading } = useUserData();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (deletingId) return;
    
    setDeletingId(fileId);
    try {
      await deleteUploadedFile(fileId);
      removeFile(fileId);
      toast.success('File deleted');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading your files...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <header className="mb-8 animate-in">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Your Notes
          </h1>
          <p className="text-muted-foreground">
            All your uploaded files and generated content in one place.
          </p>
        </header>

        {files.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">
              No files yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Upload your first file from the dashboard to get started.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file, index) => {
              const Icon = fileIcons[file.type];
              const colorClass = fileColors[file.type];
              const isDeleting = deletingId === file.id;

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "card-interactive p-5 flex items-center gap-4",
                    isDeleting && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => navigate(`/workspace/${file.id}`)}
                >
                  <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', colorClass)}>
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{file.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                      </span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {file.type === 'youtube' ? 'YouTube' : file.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => handleDelete(file.id, e)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>

                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
