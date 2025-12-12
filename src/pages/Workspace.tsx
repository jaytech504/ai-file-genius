import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { SummaryView } from '@/components/workspace/SummaryView';
import { TranscriptView } from '@/components/workspace/TranscriptView';
import { QuizView } from '@/components/workspace/QuizView';
import { ChatbotView } from '@/components/workspace/ChatbotView';
import { ChatDock } from '@/components/workspace/ChatDock';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useFileStore } from '@/stores/fileStore';
import { useUserData } from '@/hooks/useUserData';
import { WorkspaceSection } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Workspace() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('summary');
  const { isLoading } = useUserData();

  const file = useFileStore((state) => state.files.find((f) => f.id === fileId));
  const setActiveFile = useFileStore((state) => state.setActiveFile);

  useEffect(() => {
    if (fileId) {
      setActiveFile(fileId);
    }
    return () => setActiveFile(null);
  }, [fileId, setActiveFile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">File not found</h2>
          <p className="text-muted-foreground mb-4">The requested file could not be found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'summary':
        return <SummaryView fileId={file.id} />;
      case 'transcript':
        return <TranscriptView fileId={file.id} />;
      case 'quiz':
        return <QuizView fileId={file.id} />;
      case 'chatbot':
        return <ChatbotView fileId={file.id} />;
      default:
        return <SummaryView fileId={file.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      <MobileNav />

      <div className={isMobile ? 'pt-14 pb-16' : 'ml-64'}>
        {/* Mobile header with back button */}
        {isMobile && (
          <div className="p-4 border-b border-border bg-card">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="font-display font-semibold text-lg text-foreground truncate">
              {file.name}
            </h1>
          </div>
        )}

        {/* Mobile section navigation */}
        {isMobile && (
          <div className="p-4 bg-background border-b border-border">
            <WorkspaceSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              file={file}
            />
          </div>
        )}

        <div className="flex h-[calc(100vh-theme(spacing.16))] lg:h-screen">
          {/* Desktop workspace sidebar */}
          {!isMobile && (
            <WorkspaceSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              file={file}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Desktop file header */}
            {!isMobile && (
              <div className="h-14 border-b border-border flex items-center px-6 bg-card">
                <h1 className="font-display font-semibold text-foreground truncate">
                  {file.name}
                </h1>
              </div>
            )}

            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </main>

          {/* Chat dock (hidden when chatbot section is active on desktop) */}
          {activeSection !== 'chatbot' && <ChatDock fileId={file.id} />}
        </div>
      </div>
    </div>
  );
}
