import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { ChatbotView } from './ChatbotView';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ChatDockProps {
  fileId: string;
}

export function ChatDock({ fileId }: ChatDockProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Floating button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {/* Full screen drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 bg-card z-50 flex flex-col"
            >
              <div className="h-14 border-b border-border flex items-center justify-between px-4">
                <h2 className="font-display font-semibold text-foreground">Chat</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatbotView fileId={fileId} embedded />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside
      className={cn(
        'border-l border-border bg-card transition-all duration-300 flex flex-col shrink-0',
        isMinimized ? 'w-12' : 'w-80 lg:w-96'
      )}
    >
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        {!isMinimized && (
          <h2 className="font-display font-semibold text-foreground">Chat</h2>
        )}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <ChatbotView fileId={fileId} embedded />
        </div>
      )}

      {isMinimized && (
        <div className="flex-1 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </aside>
  );
}
