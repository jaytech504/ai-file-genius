import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Your Notes', path: '/notes' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function MainSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      navigate('/');
    }
  };

  if (isMobile) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">KnowBite</h1>
            <p className="text-xs text-muted-foreground">AI-powered study assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="sidebar-item w-full text-left hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
