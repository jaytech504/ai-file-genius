import { ReactNode, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UploadCardProps {
  type: 'pdf' | 'audio' | 'youtube';
  icon: ReactNode;
  title: string;
  description: string;
  onUpload: (file: File | string) => void;
}

export function UploadCard({ type, icon, title, description, onUpload }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const cardClass = cn(
    'upload-card relative overflow-hidden group',
    type === 'pdf' && 'upload-card-pdf',
    type === 'audio' && 'upload-card-audio',
    type === 'youtube' && 'upload-card-youtube',
    isDragging && 'ring-2 ring-primary ring-offset-2'
  );

  const iconClass = cn(
    'w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110',
    type === 'pdf' && 'bg-pdf-accent/10 text-pdf-accent',
    type === 'audio' && 'bg-audio-accent/10 text-audio-accent',
    type === 'youtube' && 'bg-youtube-accent/10 text-youtube-accent'
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleClick = () => {
    if (type !== 'youtube') {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      onUpload(youtubeUrl.trim());
      setYoutubeUrl('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cardClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={type !== 'youtube' ? handleClick : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={type === 'pdf' ? '.pdf' : type === 'audio' ? 'audio/*' : undefined}
        onChange={handleFileChange}
      />

      <div className={iconClass}>{icon}</div>

      <h3 className="font-display font-semibold text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-[200px]">{description}</p>

      {type === 'youtube' && (
        <form onSubmit={handleYoutubeSubmit} className="mt-4 w-full px-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-youtube-accent text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {type !== 'youtube' && (
        <p className="text-xs text-muted-foreground mt-4">
          Click or drag & drop
        </p>
      )}

      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
