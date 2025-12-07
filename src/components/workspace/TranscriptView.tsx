import { motion } from 'framer-motion';
import { AlignLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/stores/fileStore';
import { useState } from 'react';
import { toast } from 'sonner';

interface TranscriptViewProps {
  fileId: string;
}

export function TranscriptView({ fileId }: TranscriptViewProps) {
  const transcript = useFileStore((state) => state.getTranscript(fileId));
  const file = useFileStore((state) => state.files.find((f) => f.id === fileId));
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (transcript) {
      await navigator.clipboard.writeText(transcript.content);
      setCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <AlignLeft className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-2">
          No Transcript Available
        </h3>
        <p className="text-muted-foreground max-w-sm">
          The transcript for this file is being generated. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-8 max-w-3xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Transcript</h1>
          {file && (
            <p className="text-sm text-muted-foreground mt-1">{file.name}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div className="card-elevated p-6 lg:p-8">
        <div className="prose prose-slate max-w-none">
          {transcript.content.split('\n\n').map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="text-foreground leading-relaxed mb-4 last:mb-0"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
