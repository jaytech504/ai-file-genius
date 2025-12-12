import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/stores/fileStore';
import { generateSummary } from '@/lib/processingService';
import { updateFileData } from '@/lib/dataService';
import { toast } from 'sonner';

interface SummaryViewProps {
  fileId: string;
}

export function SummaryView({ fileId }: SummaryViewProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const summary = useFileStore((state) => state.getSummary(fileId));
  const extractedText = useFileStore((state) => state.getExtractedText(fileId));
  const transcript = useFileStore((state) => state.getTranscript(fileId));
  const setSummary = useFileStore((state) => state.setSummary);

  const handleRegenerate = async () => {
    const text = extractedText || transcript?.content;
    if (!text) {
      toast.error('No content available to regenerate summary');
      return;
    }

    setIsRegenerating(true);
    try {
      const summaryData = await generateSummary(text);
      const newSummary = {
        id: `s-${fileId}`,
        fileId,
        content: summaryData.title,
        sections: summaryData.sections,
        generatedAt: new Date(),
      };
      setSummary(fileId, newSummary);
      
      // Save to database
      await updateFileData(fileId, {
        summary: JSON.stringify({ title: summaryData.title, sections: summaryData.sections }),
      });
      
      toast.success('Summary regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate summary');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-2">
          No Summary Available
        </h3>
        <p className="text-muted-foreground max-w-sm">
          The summary for this file is being generated. Please check back shortly.
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
        <h1 className="font-display font-bold text-2xl text-foreground">Summary</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Regenerate
        </Button>
      </div>

      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          {summary.content}
        </p>

        <div className="space-y-6">
          {summary.sections.map((section, index) => (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-elevated p-6"
            >
              <h2 className="font-display font-semibold text-lg text-foreground mb-3">
                {section.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {section.content}
              </p>
              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <ul className="space-y-2">
                  {section.bulletPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
