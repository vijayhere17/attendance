import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  Settings,
  UserCircle,
  History,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/NotificationCenter';
import '@/styles/Layout.css';
import logo from '@/assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const employeeLinks = [
    { href: '/employee', label: 'Check In/Out', icon: MapPin },
    { href: '/employee/history', label: 'My History', icon: History },
    { href: '/employee/profile', label: 'Profile', icon: UserCircle },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border/50">
            <img src={logo} alt="Exotic Infotech" className="h-8 w-auto" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-sidebar-foreground/60 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'hover:bg-sidebar-accent hover:text-white text-sidebar-foreground/60'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase">
                {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{user?.full_name || 'User'}</p>
                <p className="text-[11px] text-sidebar-foreground/40 font-medium uppercase tracking-wider">{isAdmin ? 'Administrator' : 'Team Member'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 h-10 px-2 rounded-lg"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4 lg:gap-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {links.find(l => l.href === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}