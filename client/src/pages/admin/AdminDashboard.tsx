import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import {
  Users,
  ShieldAlert,
  History,
  Settings,
  ShieldCheck,
  Search,
  UserCog,
  ToggleLeft,
  ToggleRight,
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

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
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

  // Settings Mock States
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [emailVerification, setEmailVerification] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes, companiesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/logs'),
        api.get('/officer/companies'),
      ]);

      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setCompanies(companiesRes.data);
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

      // Update locally
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
      const logsRes = await api.get('/admin/logs');
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

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">System Control Panel</h1>
          <p className="text-sm text-zinc-400 mt-1">Review user accounts, check audit logging logs, and adjust security rules.</p>
        </div>

        {/* Tab switch */}
        <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val)}>
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-1" /> Accounts
            </TabsTrigger>
            <TabsTrigger value="audit">
              <ShieldAlert className="w-4 h-4 mr-1" /> Audit Trails
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-1" /> Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-zinc-400">Total Users</span>
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                <NumberCounter value={users.length} />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Registered system accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-zinc-400">Security Logs</span>
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-blue-400 group-hover:text-blue-300 transition-colors">
                <History className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                <NumberCounter value={logs.length} />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Modifications logged in DB</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-zinc-400">Admins & Officers</span>
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-emerald-400 group-hover:text-emerald-300 transition-colors">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                <NumberCounter value={users.filter((u) => u.role === 'admin' || u.role === 'placement_officer').length} />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Privileged core users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-zinc-400">Active Integrations</span>
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-amber-400 group-hover:text-amber-300 transition-colors">
                <Settings className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-zinc-100 tracking-tight">Healthy</span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Global configuration healthy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(val) => setActiveTab(val)} className="w-full">
        {/* Tab: Accounts */}
        <TabsContent value="users" className="space-y-6 animate-in fade-in duration-200">
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
        </TabsContent>

        {/* Tab: Audit Trails */}
        <TabsContent value="audit" className="bg-zinc-900/10 border border-zinc-805/85 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6 animate-in fade-in duration-200">
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
                  <p className="text-xs text-zinc-455 text-zinc-400 mt-1.5">{log.target}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Performer: {log.userName} • IP: {log.ipAddress || 'unknown'}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0 font-medium font-sans">
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
        </TabsContent>

        {/* Tab: Settings */}
        <TabsContent value="settings" className="bg-zinc-900/10 border border-zinc-805/85 rounded-3xl p-6 md:p-8 max-w-2xl backdrop-blur-md space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-zinc-850 pb-4">
            <h2 className="text-lg font-bold text-zinc-200">Global Configuration Parameters</h2>
            <p className="text-xs text-zinc-500 mt-1">Toggle platform registration rules and active maintenance controls.</p>
          </div>

          <div className="space-y-6">
            {/* Allow Registration */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Student Account Registration</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Toggle user registration forms on landing pages.</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowRegistration(!allowRegistration)}
                className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                {allowRegistration ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-650" />
                )}
              </button>
            </div>

            {/* Email Verification */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Enforce Email Activation</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Force student verification via one-time tokens.</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailVerification(!emailVerification)}
                className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                {emailVerification ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-650" />
                )}
              </button>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Enforce Maintenance Block</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Block student dashboards for server pipeline upgrades.</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                {maintenanceMode ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-650" />
                )}
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
  );
};
export default AdminDashboard;
