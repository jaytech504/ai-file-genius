import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Music, Youtube, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { UploadedFile } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

export function FileList() {
  const { files } = useFileStore();
  const navigate = useNavigate();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 animate-in">
      <h2 className="font-display font-semibold text-xl text-foreground mb-4">Recent Files</h2>
      <div className="space-y-2">
        {files.map((file, index) => (
          <FileListItem
            key={file.id}
            file={file}
            index={index}
            onClick={() => navigate(`/workspace/${file.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function FileListItem({
  file,
  index,
  onClick,
}: {
  file: UploadedFile;
  index: number;
  onClick: () => void;
}) {
  const Icon = fileIcons[file.type];
  const colorClass = fileColors[file.type];

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="w-full card-interactive p-4 flex items-center gap-4 text-left"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClass)}>
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{file.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDistanceToNow(file.uploadedAt, { addSuffix: true })}</span>
          {file.status === 'processing' && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-primary">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing
              </span>
            </>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </motion.button>
  );
}
