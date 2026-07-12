import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useToast } from '../contexts/ToastContext.js';
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
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Mock notifications for now (Phase 8 will bind with Socket.io)
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Interview Scheduled', message: 'Technical round with Google scheduled for July 12.', isRead: false },
    { id: '2', title: 'Drive Published', message: 'Microsoft has published their software intern drive.', isRead: false },
    { id: '3', title: 'Offer Issued', message: 'Congratulations! You have received an offer from Stripe.', isRead: true },
  ]);

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
      { label: 'System Overview', path: '/dashboard/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'User Accounts', path: '/dashboard/admin/users', icon: <Users className="w-5 h-5" /> },
      { label: 'Audit Logs', path: '/dashboard/admin/logs', icon: <History className="w-5 h-5" /> },
    ],
  };

  const currentRoleItems = sidebarItems[user.role] || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast('All notifications marked as read', 'success');
  };

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
                const isActive = location.pathname === item.path;
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
                <div className="absolute right-0 top-12 z-40 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center p-3 border-b border-border/40">
                    <span className="text-xs font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] text-purple-400 hover:underline cursor-pointer">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-border/40">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 text-left ${n.isRead ? 'opacity-65' : 'bg-purple-955/5'}`}>
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.message}</p>
                      </div>
                    ))}
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
      </div>
    </div>
  );
};
export default DashboardLayout;
