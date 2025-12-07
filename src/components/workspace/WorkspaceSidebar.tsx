import { FileText, AlignLeft, HelpCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceSection, UploadedFile } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface WorkspaceSidebarProps {
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
  file: UploadedFile;
}

const sections: { id: WorkspaceSection; icon: typeof FileText; label: string; audioOnly?: boolean }[] = [
  { id: 'summary', icon: FileText, label: 'Summary' },
  { id: 'transcript', icon: AlignLeft, label: 'Transcript', audioOnly: true },
  { id: 'quiz', icon: HelpCircle, label: 'Quiz' },
  { id: 'chatbot', icon: MessageSquare, label: 'Chatbot' },
];

export function WorkspaceSidebar({ activeSection, onSectionChange, file }: WorkspaceSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const visibleSections = sections.filter(
    (s) => !s.audioOnly || file.type === 'audio' || file.type === 'youtube'
  );

  if (isMobile) {
    return (
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
        {visibleSections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="w-16 bg-sidebar border-r border-border flex flex-col items-center py-4 shrink-0">
      <button
        onClick={() => navigate('/')}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-hover transition-colors mb-6"
        title="Back to Dashboard"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <nav className="flex-1 space-y-2">
        {visibleSections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-hover'
              )}
              title={section.label}
            >
              <section.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{section.label.slice(0, 4)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
