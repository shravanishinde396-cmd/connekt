import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  Users, ShieldAlert, History, Settings, ShieldCheck, Search, UserCog,
  Activity, Database, Server, RefreshCw, ToggleLeft, ToggleRight,
  Cpu, Terminal, ArrowUpRight
} from 'lucide-react';

interface Company {
  _id: string;
  name: string;
}

interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'placement_officer' | 'recruiter' | 'admin';
  companyId?: Company;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Chart color palettes
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const [loading, setLoading] = useState(true);

  // Data States
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Role modification modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newRole, setNewRole] = useState<'student' | 'placement_officer' | 'recruiter' | 'admin'>('student');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Feature Flags Mock
  const [flags, setFlags] = useState({
    aiResumeAnalysis: true,
    aiInterviewQuestions: true,
    realtimeSocketNotifications: true,
    bulkCsvImport: true,
  });

  // Mock Performance & Health Data
  const [healthData] = useState({
    cpu: 32,
    memoryUsed: 5.4,
    memoryTotal: 8.0,
    serverUptime: '4d 18h 12m',
    databasePing: 4,
    apiPing: 12,
    dbBackups: [
      { id: '1', name: 'daily_prod_backup_0712.tar.gz', size: '124 MB', date: '2026-07-12 04:00 AM', status: 'Healthy' },
      { id: '2', name: 'daily_prod_backup_0711.tar.gz', size: '121 MB', date: '2026-07-11 04:00 AM', status: 'Healthy' },
      { id: '3', name: 'weekly_prod_backup_0707.tar.gz', size: '840 MB', date: '2026-07-07 04:00 AM', status: 'Healthy' },
    ]
  });

  // Mock Analytics Dashboard data
  const growthTrends = [
    { name: 'Jan', signups: 45, activeSessions: 120 },
    { name: 'Feb', signups: 80, activeSessions: 190 },
    { name: 'Mar', signups: 150, activeSessions: 310 },
    { name: 'Apr', signups: 220, activeSessions: 450 },
    { name: 'May', signups: 340, activeSessions: 620 },
    { name: 'Jun', signups: 510, activeSessions: 890 },
  ];

  const packageDistribution = [
    { range: 'Under 6 LPA', count: 120 },
    { range: '6 - 10 LPA', count: 240 },
    { range: '10 - 15 LPA', count: 160 },
    { range: '15 - 25 LPA', count: 75 },
    { range: '25+ LPA', count: 25 },
  ];

  const branchComparison = [
    { branch: 'CSE', placed: 94, total: 100 },
    { branch: 'ECE', placed: 82, total: 95 },
    { branch: 'EEE', placed: 71, total: 85 },
    { branch: 'MECH', placed: 58, total: 80 },
    { branch: 'CIVIL', placed: 45, total: 70 },
  ];

  const apiMonitoringLogs = [
    { method: 'POST', path: '/api/auth/login', status: 200, latency: '35ms', timestamp: '13:14:02' },
    { method: 'GET', path: '/api/student/drives', status: 200, latency: '120ms', timestamp: '13:14:05' },
    { method: 'POST', path: '/api/ai/chat', status: 200, latency: '845ms', timestamp: '13:14:10' },
    { method: 'PUT', path: '/api/student/profile', status: 400, latency: '42ms', timestamp: '13:14:22' },
    { method: 'GET', path: '/api/admin/logs', status: 200, latency: '95ms', timestamp: '13:14:35' },
  ];

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes, companiesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/logs').catch(() => ({ data: [] })),
        api.get('/officer/companies').catch(() => ({ data: [] })),
      ]);

      setUsers(usersRes.data || []);
      setLogs(logsRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load administrative logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const openRoleModal = (user: UserAccount) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setSelectedCompanyId(user.companyId?._id || '');
    setRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const res = await api.put(`/admin/users/${selectedUser._id}/role`, {
        role: newRole,
        companyId: newRole === 'recruiter' ? selectedCompanyId : null,
      });

      const updatedUser = res.data.user;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? {
                ...u,
                role: updatedUser.role,
                companyId: companies.find((c) => c._id === updatedUser.companyId),
              }
            : u
        )
      );

      // Re-fetch logs to show the new audit log immediately
      const logsRes = await api.get('/admin/logs').catch(() => ({ data: [] }));
      setLogs(logsRes.data);

      toast('User privileges modified successfully!', 'success');
      setRoleModalOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to alter user role credentials', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  // Permissions settings per role
  const permissionsList = [
    { module: 'User Accounts Management', student: 'None', recruiter: 'None', officer: 'Read', admin: 'Full Control' },
    { module: 'Placement Drives Creation', student: 'None', recruiter: 'Create (Internal)', officer: 'Full Control', admin: 'Full Control' },
    { module: 'Audit Logging & System Config', student: 'None', recruiter: 'None', officer: 'None', admin: 'Full Control' },
    { module: 'Student Profile Editing', student: 'Self Only', recruiter: 'Read', officer: 'Full Control', admin: 'Full Control' },
    { module: 'Offer Management & Scheduling', student: 'Read', recruiter: 'Full Control', officer: 'Approve/Audit', admin: 'Full Control' },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-purple-500" />
              PlacePilot Admin Panel
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Configure global permissions, track server status, check database health, and view analytics.</p>
          </div>

          <Button
            onClick={fetchAdminData}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Dashboard
          </Button>
        </div>

        {/* Dynamic Tabs Navigation */}
        <div className="flex flex-wrap border-b border-zinc-800 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Activity className="w-4 h-4" /> Analytics & Reports
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Permissions Matrix
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <History className="w-4 h-4" /> Audit & API Logs
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'health'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Server className="w-4 h-4" /> Server Health & Backups
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Settings className="w-4 h-4" /> Feature Flags
          </button>
        </div>

        {/* Tab 1: System Analytics Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Total Signups</span>
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                      <NumberCounter value={users.length} />
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <ArrowUpRight className="w-3 h-3" /> +12% increase this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Active Session Rate</span>
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                      89%
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">Avg 420 active daily users</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Server Health</span>
                    <Server className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight">
                      100%
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">All systems operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Database Backup</span>
                    <Database className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight">
                      Synced
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">Last backup: 9 hours ago</p>
                </CardContent>
              </Card>
            </div>

            {/* Recharts Data Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Signup Trends (Area Chart) */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-zinc-200 mb-4">User Signup Growth & Sessions</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="signups" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSignups)" name="New Signups" />
                      <Area type="monotone" dataKey="activeSessions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSessions)" name="Active Sessions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Package Distribution (Bar Chart) */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-zinc-200 mb-4">Package Distribution (LPA)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={packageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="range" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                        {packageDistribution.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Branch Placed comparison (Line Chart) */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-zinc-200 mb-4">Placement Rates by Branch (%)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={branchComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="branch" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="placed" stroke="#10b981" strokeWidth={3} name="Placed Students" />
                      <Line type="monotone" dataKey="total" stroke="#6b7280" strokeWidth={2} name="Total Registered" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Overall Placement Status (Pie Chart) */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-zinc-200 mb-4">Active Placement Demographics</h3>
                <div className="h-80 w-full flex flex-col md:flex-row justify-around items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Computer Science', value: 340 },
                            { name: 'Electronics', value: 180 },
                            { name: 'Electrical', value: 110 },
                            { name: 'Mechanical', value: 85 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4 md:mt-0">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> <span className="text-xs text-zinc-400">CS Department (340)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> <span className="text-xs text-zinc-400">Electronics (180)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> <span className="text-xs text-zinc-400">Electrical (110)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> <span className="text-xs text-zinc-400">Mechanical (85)</span></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
              />
            </div>

            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Details</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Organization Mapping</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <div>
                          <p className="font-bold text-zinc-100">{u.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'destructive'
                              : u.role === 'placement_officer'
                              ? 'info'
                              : u.role === 'recruiter'
                              ? 'warning'
                              : 'outline'
                          }
                        >
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-zinc-400">
                        {u.companyId ? u.companyId.name : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => openRoleModal(u)}
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                        >
                          <UserCog className="w-3.5 h-3.5 mr-1" /> Adjust Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tab 3: Permissions Matrix */}
        {activeTab === 'permissions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-zinc-200 mb-2">Granular Role System Permissions</h3>
              <p className="text-xs text-zinc-500 mb-6">Review current API security and module visibility privileges mapped across student, recruiter, placement officer, and administrator credentials.</p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System Modules</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Placement Officer</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionsList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-zinc-200 text-sm">{item.module}</TableCell>
                      <TableCell><Badge variant="outline">{item.student}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{item.recruiter}</Badge></TableCell>
                      <TableCell><Badge variant="info">{item.officer}</Badge></TableCell>
                      <TableCell><Badge variant="destructive">{item.admin}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Trails & API Monitoring */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Left 2/3: Activity Logs */}
            <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-805/85 rounded-3xl p-6 backdrop-blur-md space-y-6">
              <div className="border-b border-zinc-850 pb-4">
                <h2 className="text-lg font-bold text-zinc-200">System Activity Stream</h2>
                <p className="text-xs text-zinc-500 mt-1">Audit security logs for privilege changes, updates, and creation workflows.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div
                    key={log._id}
                    className="bg-zinc-950/60 border border-zinc-850/60 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-800 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-zinc-200">{log.action}</span>
                        <Badge variant="secondary">
                          {log.userRole}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1.5">{log.target}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        Performer: {log.userName} • IP: {log.ipAddress || 'unknown'}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="text-center py-10 text-zinc-500 text-xs">
                    No system activity events recorded in audit log yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right 1/3: API Monitoring */}
            <div className="bg-zinc-900/10 border border-zinc-805/85 rounded-3xl p-6 backdrop-blur-md space-y-6">
              <div className="border-b border-zinc-850 pb-4">
                <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  API Traffic Monitor
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Real-time HTTP requests, endpoint latencies, and response codes.</p>
              </div>

              <div className="space-y-3">
                {apiMonitoringLogs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        log.method === 'POST' ? 'bg-purple-500/20 text-purple-400' :
                        log.method === 'PUT' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>{log.method}</span>
                      <span className="font-mono text-zinc-300 select-all">{log.path}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-zinc-500 font-mono text-[10px]">{log.latency}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${log.status === 200 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Server Health & Backups */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Server Status Indicators */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  Hardware & Node System Health
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CPU indicator */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                    <span className="text-xs text-zinc-400">CPU Usage</span>
                    <h4 className="text-2xl font-extrabold font-mono text-zinc-100 mt-2">{healthData.cpu}%</h4>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${healthData.cpu}%` }}></div>
                    </div>
                  </div>

                  {/* RAM indicator */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                    <span className="text-xs text-zinc-400">RAM Allocated</span>
                    <h4 className="text-2xl font-extrabold font-mono text-zinc-100 mt-2">{healthData.memoryUsed} / {healthData.memoryTotal} GB</h4>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${(healthData.memoryUsed / healthData.memoryTotal) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Latency indicators */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                    <span className="text-xs text-zinc-400">Socket Latency</span>
                    <h4 className="text-2xl font-extrabold font-mono text-emerald-400 mt-2">Active</h4>
                    <p className="text-[10px] text-zinc-500 mt-2">Ping time: {healthData.apiPing}ms</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4 border-t border-zinc-850 pt-6 justify-between text-xs text-zinc-400">
                  <div><strong>Server Uptime:</strong> {healthData.serverUptime}</div>
                  <div><strong>Node.js Version:</strong> v20.11.0</div>
                  <div><strong>Database Adapter:</strong> Mongoose v9.7.4</div>
                </div>
              </div>
            </div>

            {/* Database Backup Status */}
            <div className="bg-zinc-900/10 border border-zinc-805/85 rounded-3xl p-6 backdrop-blur-md space-y-6">
              <div className="border-b border-zinc-850 pb-4">
                <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Database Backups
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Automatic cron snapshots saved to secure offline storage.</p>
              </div>

              <div className="space-y-4">
                {healthData.dbBackups.map((bk) => (
                  <div key={bk.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs text-zinc-300 truncate max-w-[150px]">{bk.name}</span>
                      <Badge variant="success" className="text-[9px] px-1.5 py-0.5">{bk.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span>Size: {bk.size}</span>
                      <span>{bk.date}</span>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" className="w-full cursor-pointer">
                  Create Backup Snapshot Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Settings & Feature Flags */}
        {activeTab === 'settings' && (
          <div className="bg-zinc-900/10 border border-zinc-805/85 rounded-3xl p-6 md:p-8 max-w-2xl backdrop-blur-md space-y-8 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-zinc-200">Global Feature Flags & Access</h2>
              <p className="text-xs text-zinc-500 mt-1">Enable or disable specific features dynamically across the platform for beta testing.</p>
            </div>

            <div className="space-y-6">
              {/* Feature Flag 1 */}
              <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Gemini AI Resume Analysis</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle student ATS auditing and resume scoring features.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFlags({ ...flags, aiResumeAnalysis: !flags.aiResumeAnalysis })}
                  className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {flags.aiResumeAnalysis ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-700" />}
                </button>
              </div>

              {/* Feature Flag 2 */}
              <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">AI Mock Interview Prep</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle role-based questions and AI feedback generator.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFlags({ ...flags, aiInterviewQuestions: !flags.aiInterviewQuestions })}
                  className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {flags.aiInterviewQuestions ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-700" />}
                </button>
              </div>

              {/* Feature Flag 3 */}
              <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Real-time Socket.io Sync</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle dashboard notification bells and chat widget.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFlags({ ...flags, realtimeSocketNotifications: !flags.realtimeSocketNotifications })}
                  className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {flags.realtimeSocketNotifications ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-700" />}
                </button>
              </div>

              {/* Feature Flag 4 */}
              <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Bulk CSV Student Import</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Allow placement officers to bulk register student profiles.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFlags({ ...flags, bulkCsvImport: !flags.bulkCsvImport })}
                  className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {flags.bulkCsvImport ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-700" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role modification modal */}
        <Modal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          title="Modify Privileges"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                loading={updating}
                onClick={handleUpdateRole}
              >
                Apply Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4 pt-1">
            {selectedUser && (
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850/60 mb-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Account</p>
                <p className="text-sm font-bold text-zinc-200 mt-0.5">{selectedUser.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedUser.email}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select System Role</label>
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="placement_officer">Placement Officer</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {newRole === 'recruiter' && (
              <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-1.5 duration-150">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Associated Employer Company</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
                >
                  <option value="">-- Choose Company Profile --</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
