import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { useSocket } from '../contexts/SocketContext.js';
import AIChatbox from '../components/AIChatbox.js';
import { CommandPalette } from '../components/ui/CommandPalette.js';
import {
  LayoutDashboard,
  User as UserIcon,
  Briefcase,
  Building2,
  Users,
  History,
  LogOut,
  Moon,
  Sun,
  Bell,
  Menu,
  X,
  ChevronDown,
  Trash2,
  Calendar,
  Award,
  CheckCircle,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const DashboardLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium animate-pulse">Loading PlacePilot Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Verify URL role matches user role
  const urlParts = location.pathname.split('/');
  const roleInUrl = urlParts[2]; // /dashboard/:role/...
  if (roleInUrl && roleInUrl !== user.role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast('Logged out successfully', 'success');
      navigate('/auth/login');
    } catch (err) {
      toast('Failed to log out', 'error');
    }
  };

  // Define sidebar navigation items per role
  const sidebarItems: Record<string, SidebarItem[]> = {
    student: [
      { label: 'Dashboard', path: '/dashboard/student', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'My Profile', path: '/dashboard/student/profile', icon: <UserIcon className="w-5 h-5" /> },
      { label: 'Placement Drives', path: '/dashboard/student/drives', icon: <Briefcase className="w-5 h-5" /> },
    ],
    placement_officer: [
      { label: 'Overview', path: '/dashboard/placement_officer', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Companies', path: '/dashboard/placement_officer/companies', icon: <Building2 className="w-5 h-5" /> },
      { label: 'Placement Drives', path: '/dashboard/placement_officer/drives', icon: <Briefcase className="w-5 h-5" /> },
    ],
    recruiter: [
      { label: 'Overview', path: '/dashboard/recruiter', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Hiring Drives', path: '/dashboard/recruiter/drives', icon: <Briefcase className="w-5 h-5" /> },
      { label: 'Applicants', path: '/dashboard/recruiter/applicants', icon: <Users className="w-5 h-5" /> },
    ],
    admin: [
      { label: 'System Overview', path: '/dashboard/admin?tab=overview', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'User Accounts', path: '/dashboard/admin?tab=users', icon: <Users className="w-5 h-5" /> },
      { label: 'Audit Logs', path: '/dashboard/admin?tab=audit', icon: <History className="w-5 h-5" /> },
    ],
  };

  const currentRoleItems = sidebarItems[user.role] || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-250">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 w-64 bg-card border-r border-border transition-transform duration-300 transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col justify-between p-6">
          <div>
            {/* Header logo */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-purple-600/30">
                  P
                </div>
                <span className="font-semibold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  PlacePilot
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User identification badge */}
            <div className="bg-background/50 border border-border p-3 rounded-xl mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Links */}
            <nav className="space-y-1">
              {currentRoleItems.map((item) => {
                const currentFullUrl = location.pathname + (location.search || '');
                const isActive = currentFullUrl === item.path || (location.pathname === item.path && !location.search);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/15 border border-transparent hover:border-red-900/30 transition-all focus:outline-none cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace content */}
      <div className="flex-grow flex flex-col md:pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-background/75 border-b border-border/60 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-card/60 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors focus:outline-none md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb info */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium font-mono">
              <span>PlacePilot</span>
              <span>/</span>
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
              <span>/</span>
              <span className="text-foreground capitalize">{location.pathname.split('/').pop() || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-card/60 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2.5 bg-card/60 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors focus:outline-none relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-40 w-85 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center p-3 border-b border-border/40">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground/40 mb-2 stroke-[1.5]" />
                        <p className="text-xs font-semibold text-foreground/80">You're all caught up!</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        let iconEl = <Bell className="w-3.5 h-3.5 text-zinc-400" />;
                        let iconBg = 'bg-zinc-500/10 border-zinc-500/20';
                        if (n.type === 'drive_published') {
                          iconEl = <Briefcase className="w-3.5 h-3.5 text-purple-400" />;
                          iconBg = 'bg-purple-500/10 border-purple-500/20';
                        } else if (n.type === 'interview_scheduled') {
                          iconEl = <Calendar className="w-3.5 h-3.5 text-sky-400" />;
                          iconBg = 'bg-sky-500/10 border-sky-500/20';
                        } else if (n.type === 'offer_issued') {
                          iconEl = <Award className="w-3.5 h-3.5 text-amber-400" />;
                          iconBg = 'bg-amber-500/10 border-amber-500/20';
                        } else if (n.type === 'application_status') {
                          iconEl = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
                          iconBg = 'bg-emerald-500/10 border-emerald-500/20';
                        }

                        return (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && markAsRead(n._id)}
                            className={`p-3 text-left flex items-start gap-3 hover:bg-muted/30 transition-all cursor-pointer group relative ${
                              n.isRead ? 'opacity-65' : 'bg-purple-500/[0.03]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${iconBg}`}>
                              {iconEl}
                            </div>
                            <div className="flex-grow min-w-0 pr-6">
                              <p className="text-xs font-semibold text-foreground truncate group-hover:text-purple-400 transition-colors">
                                {n.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed break-words">
                                {n.message}
                              </p>
                              <span className="text-[8px] text-muted-foreground/60 font-mono mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n._id);
                              }}
                              className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-1.5 p-1 bg-card/60 border border-border rounded-xl hover:border-border/80 transition-all focus:outline-none cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-10 z-40 w-48 bg-card border border-border rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-950/15 hover:text-red-300 transition-colors mt-1 focus:outline-none cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet />
        </main>
        
        {/* Floating AI Chatbox */}
        <AIChatbox />

        {/* Global Keyboard Shortcut Command Palette */}
        <CommandPalette />
      </div>
    </div>
  );
};
export default DashboardLayout;
