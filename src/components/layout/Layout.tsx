import { ReactNode } from 'react';
import { MainSidebar } from './MainSidebar';
import { MobileNav } from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      <MobileNav />
      <main
        className={
          isMobile
            ? 'pt-14 pb-16 px-4'
            : 'ml-64 min-h-screen'
        }
      >
        {children}
      </main>
    </div>
  );
}
