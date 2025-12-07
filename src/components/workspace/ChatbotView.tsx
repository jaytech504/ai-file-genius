import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/stores/fileStore';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

interface ChatbotViewProps {
  fileId: string;
  embedded?: boolean;
}

export function ChatbotView({ fileId, embedded = false }: ChatbotViewProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = useFileStore((state) => state.getChatMessages(fileId));
  const addChatMessage = useFileStore((state) => state.addChatMessage);
  const file = useFileStore((state) => state.files.find((f) => f.id === fileId));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    addChatMessage(fileId, userMessage);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on the content of "${file?.name}", I can help answer your question. This is a demo response - connect to Lovable Cloud to enable real AI responses using the file's content.`,
        timestamp: new Date(),
      };
      addChatMessage(fileId, aiMessage);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn(
      'flex flex-col h-full',
      !embedded && 'p-6 lg:p-8 max-w-3xl'
    )}>
      {!embedded && (
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-foreground">Chat with Document</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about {file?.name}
          </p>
        </div>
      )}

      <div className={cn(
        'flex-1 overflow-y-auto scrollbar-thin',
        embedded ? 'px-4' : 'card-elevated p-4'
      )}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask me anything about this document. I'll help you understand its content.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="chat-bubble-ai flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={cn('pt-4', embedded && 'px-4 pb-4')}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
